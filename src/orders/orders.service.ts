import exportOrderJson from '../db/order-export.json';
import orderFilesJson from '../db/order-files.json';
import orderInvoiceJson from '../db/order-invoice.json';
import orderStatusJson from '../db/order-statuses.json';
import ordersJson from '../db/orders.json';
import paymentGatewayJson from '../db/payment-gateway.json';
import paymentIntentJson from '../db/payment-intent.json';
import setting from '../db/settings.json';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import Fuse from 'fuse.js';
import { AuthService } from '../auth/auth.service';
import { paginate } from '../common/pagination/paginate';
import { PaymentIntent } from '../payment-intent/entries/payment-intent.entity';
import { PaymentGateWay } from '../payment-method/entities/payment-gateway.entity';
// import { PaypalPaymentService } from '../payment/paypal-payment.service';
import { StripePaymentService } from '../payment/stripe-payment.service';
import { Setting } from '../settings/entities/setting.entity';
import {
  CreateOrderStatusDto,
  UpdateOrderStatusDto,
} from './dto/create-order-status.dto';
import { ConnectProductOrderPivot, CreateOrderDto } from './dto/create-order.dto';
import { GetOrderFilesDto } from './dto/get-downloads.dto';
import {
  GetOrderStatusesDto,
  OrderStatusPaginator,
} from './dto/get-order-statuses.dto';
import { GetOrdersDto, OrderPaginator } from './dto/get-orders.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import {
  CheckoutVerificationDto,
  VerifiedCheckoutData,
} from './dto/verify-checkout.dto';
import { OrderStatus } from './entities/order-status.entity';
import {
  Order,
  OrderFiles,
  OrderStatusType,
  PaymentGatewayType,
  PaymentStatusType,
} from './entities/order.entity';
import { FirebaseService } from '../firebase/firebase.service';
import { OrderProductPivot, Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import * as admin from 'firebase-admin';
import { applyOrderTranslations, getSearchParam } from '../utils/utils';
import { ShippingsService } from '../shippings/shippings.service';
import { TaxesService } from '../taxes/taxes.service';
import { Shipping } from '../shippings/entities/shipping.entity';
import { Tax } from '../taxes/entities/tax.entity';

const orders = plainToClass(Order, ordersJson);
const paymentIntents = plainToClass(PaymentIntent, paymentIntentJson);
const paymentGateways = plainToClass(PaymentGateWay, paymentGatewayJson);
const orderStatus = plainToClass(OrderStatus, orderStatusJson);
// const shipping_charge = 20
const options = {
  keys: ['name'],
  threshold: 0.3,
};
const fuse = new Fuse(orderStatus, options);

const orderFiles = plainToClass(OrderFiles, orderFilesJson);
// const settings = plainToClass(Setting, setting);

@Injectable()
export class OrdersService {
  private orders: Order[] = orders;
  private orderStatus: OrderStatus[] = orderStatus;
  private orderFiles: OrderFiles[] = orderFiles;
  // private setting: Setting = { ...settings };

  constructor(
    // private readonly authService: AuthService,
    private readonly stripeService: StripePaymentService,
    // private readonly paypalService: PaypalPaymentService,
    private readonly firebaseService: FirebaseService,
    private readonly shippingsService: ShippingsService,
    private readonly taxesService: TaxesService,
  ) {}
  async create(createOrderInput: CreateOrderDto, user: User,environment: string): Promise<Order> {
    this.stripeService.setEnvironment(environment);
    // Step 1: Fetch all products from the database
    const allProducts: Product[] = await this.firebaseService.getCollection('products')
  
    // Step 2: Filter products that match the product IDs in the order
    const products = createOrderInput.products.map((productInput) => {
      const productData = allProducts.find((product) => product.id === productInput.product_id);
  
      if (!productData) {
        throw new Error(`Product with ID ${productInput.product_id} not found`);
      }
      if (productData.quantity < productInput.order_quantity) {
        throw new Error(`Insufficient quantity for product ID ${productInput.product_id}`);
      }
      return {
        ...productData, // Include all fields from the full product data
        pivot: {
          // variation_option_id: productInput.variation_option_id,
          order_quantity: productInput.order_quantity,
          unit_price: productInput.unit_price, // Price from the database
          subtotal: productInput.subtotal, // Calculated subtotal
        } as OrderProductPivot, // Pivot object for each product
      };
    });
  
    // Step 3: Calculate total amount and verify with checkout
    const subtotal = products.reduce((sum, product) => sum + product.pivot.subtotal, 0);
    const verifiedCheckout = await this.verifyCheckout({
      amount: subtotal, // Use the calculated subtotal from the fetched products
      products: createOrderInput.products, // Pass the original products for verification
      shipping_address: createOrderInput.shipping_address,
      customer_id: createOrderInput.customer_contact,
    });
  
    // Compare the verified total with the provided total in createOrderInput
    if (verifiedCheckout.total !== createOrderInput.total) {
      throw new Error('Price mismatch! The total calculated during checkout is different from the provided total.');
    }
  
    // Step 4: Set the order details using the fetched full `Product` data with pivot
    let order: Partial<Order> = {
      tracking_number: this.generateTrackingNumber(),
      customer_id: user.id,
      customer: user,
      name: user.name,
      customer_contact: createOrderInput.customer_contact,
      order_status: OrderStatusType.PENDING,
      payment_status: null,
      amount: createOrderInput.amount,
      sales_tax: verifiedCheckout.total_tax,
      total: verifiedCheckout.total,
      paid_total: createOrderInput.paid_total ?? 0,
      payment_id: null,
      payment_gateway: createOrderInput.payment_gateway ?? PaymentGatewayType.CASH_ON_DELIVERY,
      discount: createOrderInput.discount ?? 0,
      delivery_fee: createOrderInput.delivery_fee ?? 0,
      delivery_time: createOrderInput.delivery_time,
      products: products, // Here, products include the full product data with the pivot
      // billing_address: createOrderInput.billing_address,
      shipping_address: createOrderInput.shipping_address,
      language: createOrderInput.language ?? 'en',
      translated_languages: ["en"],
      children: [],
      payment_intent: createOrderInput.payment_intent,
      is_seen: false
    };
  
    // Step 5: Set the payment gateway and order status
    const payment_gateway_type = createOrderInput.payment_gateway ?? PaymentGatewayType.CASH_ON_DELIVERY;
    order.payment_gateway = payment_gateway_type;
    order.payment_intent = createOrderInput.payment_intent || null;
  
    switch (payment_gateway_type) {
      case PaymentGatewayType.CASH_ON_DELIVERY:
        order.order_status = OrderStatusType.PROCESSING;
        order.payment_status = PaymentStatusType.CASH_ON_DELIVERY;
        break;
      case PaymentGatewayType.CASH:
        order.order_status = OrderStatusType.PROCESSING;
        order.payment_status = PaymentStatusType.CASH;
        break;
      case PaymentGatewayType.FULL_WALLET_PAYMENT:
        order.order_status = OrderStatusType.COMPLETED;
        order.payment_status = PaymentStatusType.WALLET;
        break;
      default:
        order.order_status = OrderStatusType.PENDING;
        order.payment_status = PaymentStatusType.PENDING;
        break;
    }

    try {
      if (
          [
            PaymentGatewayType.STRIPE,
            PaymentGatewayType.PAYPAL,
            PaymentGatewayType.RAZORPAY,
          ].includes(payment_gateway_type)
        ) {
          const paymentIntent = await this.processPaymentIntent(
            order,
            // this.setting,
            user
          );
          console.log('paymentIntent',paymentIntent)
          if(!!paymentIntent) {
            order.payment_intent = paymentIntent;
          }
          else {
            throw new BadRequestException("create payment failed, try again later")
          }
          
        }

        // return order;
    } catch (error) {
      console.log('create ordew error',error)
      throw new BadRequestException("something went wrong, try again later")
      //return order;
    }
    
    const id = await this.firebaseService.addDocument('orders', order);

    // Step 7: Retrieve and return the stored order
    const storedOrder = await this.firebaseService.getDocumentById<Order>('orders', id);
    console.log('storedOrder =============',storedOrder)
    return storedOrder;
   
    // Step 6: Save the order to Firebase
    
  }
  prepareOrderDocument(createOrderInput: UpdateOrderDto) {

  }
  
  
  generateTrackingNumber(): string {
    const now = new Date();
  
    const year = now.getFullYear(); // e.g., 2024
    const month = String(now.getMonth() + 1).padStart(2, '0'); // e.g., 02 for February
    const day = String(now.getDate()).padStart(2, '0'); // e.g., 07
    const hours = String(now.getHours()).padStart(2, '0'); // e.g., 15 (24-hour format)
    const minutes = String(now.getMinutes()).padStart(2, '0'); // e.g., 30
    const seconds = String(now.getSeconds()).padStart(2, '0'); // e.g., 36
  
    // Concatenate the parts to form the tracking number
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  // async verifyCheckout(input: CheckoutVerificationDto): Promise<VerifiedCheckoutData> {
  //   const products = input.products; // Array of products from the input
  //   console.log('products',products,Array.isArray(products))
  //   const unavailableProducts: string[] = [];
  //   const availableProducts: ConnectProductOrderPivot[] = [];
  //   let subtotal = 0;
  
  //   // Iterate through each product to check availability and calculate the subtotal
  //   for (const product of products) {
  //     const productData: Product = await this.firebaseService.getDocumentById('products',product.product_id); // Fetch product from Firebase using product_id
  //     console.log('productData',productData)
  //     if (productData && productData.quantity >= product.order_quantity) {
  //       // Add to available products if sufficient quantity exists
  //       if (product.unit_price !== productData.price) {
  //         // Update the price and set the flag if the price was updated
  //         product.unit_price = productData.price;
  //         product.price_updated = true;
  //       } else {
  //         // If the price matches, set the flag to false
  //         product.price_updated = false;
  //       }
  //       availableProducts.push(product);
  
  //       // Add to subtotal: price * quantity
  //       subtotal += productData.price * product.order_quantity;
  //     } else {
  //       // If not available, add to unavailable products
  //       unavailableProducts.push(product.product_id);
  //     }
  //   }
    
  //   // Calculate total tax (5%)
  //   const totalTax = subtotal * 0.05;
  
  //   // Calculate total (subtotal + tax)
  //   const total = subtotal + totalTax + shipping_charge;
  
  //   // Prepare the response data
  //   return {
  //     total_tax: totalTax,
  //     shipping_charge: shipping_charge, // You can add logic to calculate shipping charges if needed
  //     unavailable_products: unavailableProducts,
  //     available_products: availableProducts,
  //     wallet_currency: 0, // Assuming no wallet usage for now
  //     wallet_amount: 0, // Assuming no wallet usage for now
  //     subtotal: subtotal,
  //     total: total,
  //   };
  // }
  async verifyCheckout(input: CheckoutVerificationDto): Promise<VerifiedCheckoutData> {
    
    const allProducts: Product[] = await this.firebaseService.getCollection('products')
    const unavailableProducts: string[] = [];
    const availableProducts: ConnectProductOrderPivot[] = [];
    let subtotal = 0;
  
    // Iterate through each input product to check availability and calculate subtotal
    for (const product of input.products) {
      const productData = allProducts.find(p => p.id === product.product_id); // Find the product in fetched data
  
      if (!productData) {
        unavailableProducts.push(product.product_id);
        continue;
      }
  
      if (productData.quantity >= product.order_quantity) {
        // Use sale_price if available, otherwise use price
        const applicablePrice = productData.sale_price || productData.price;
        console.log('applicable price',applicablePrice)
        // Check and update the price if it differs
        if (product.unit_price !== applicablePrice) {
          product.unit_price = applicablePrice;
          product.price_updated = true;
        } else {
          product.price_updated = false;
        }
  
        availableProducts.push(product);
  
        // Add to subtotal: sale_price (or price) * order_quantity
        subtotal += applicablePrice * product.order_quantity;
      } else {
        unavailableProducts.push(product.product_id);
      }
    }
    const shipping_charge = await this.getFirstShippingCharge();

    // Get the first tax rate from the TaxesService
    const taxRate = await this.getFirstTaxRate();
    // Calculate total tax (5%)
    const totalTax = subtotal * taxRate;
  
    // Calculate total (subtotal + tax + shipping charge)
    const total = subtotal + totalTax + shipping_charge;
  
    // Prepare the response data
    return {
      total_tax: totalTax,
      shipping_charge: shipping_charge, // Placeholder, update shipping calculation as needed
      unavailable_products: unavailableProducts,
      available_products: availableProducts,
      wallet_currency: 0, // Assuming no wallet usage for now
      wallet_amount: 0, // Assuming no wallet usage for now
      subtotal: subtotal,
      total: total,
    };
  }
  private async getFirstShippingCharge(): Promise<number> {
    const shippingCharges: Shipping[] = await this.shippingsService.getShippings({}); // Assuming it fetches all
    return shippingCharges[0]?.amount || 0; // Return the first shipping rate or 0 if not available
  }
  
  // Helper method to get the first tax rate
  private async getFirstTaxRate(): Promise<number> {
    const taxes: Tax[] = await this.taxesService.findAll(); // Assuming it fetches all
    return (taxes[0]?.rate / 100) || 0; // Return the first tax rate or 0.05 (default 5%) if not available
  }

  async getOrders({
    limit,
    page,
    orderBy,
    sortedBy,
    search,
    language
  }: GetOrdersDto, user: User): Promise<OrderPaginator> {
    if (!page) page = 1;
    if (!limit || isNaN(limit)) {
      limit = 15; // Default limit value
    } else {
      limit = +limit // Ensure it's an integer
    }
    const trackingNumber = getSearchParam(search,'tracking_number')
  
    // Reference to Firestore collection
    const orderCollection = this.firebaseService.firestore.collection('orders');
  
    let query: admin.firestore.Query = orderCollection;
  
    // If the user is not an admin, filter by customer ID
    if (!user.isAdmin) {
      query = query.where('customer_id', '==', user.id);
    }
    if (trackingNumber && isNaN(Number(trackingNumber))) {
      // Return an empty result if the tracking number is not valid
      return {
        data: [],
        ...paginate(0, page, limit, 0, `/orders?limit=${limit}`),
      };
    }
    if (trackingNumber) {
      // Use a string range for "starts with"
      const prefixStart = trackingNumber;
      const prefixEnd = prefixStart.slice(0, -1) + String.fromCharCode(prefixStart.charCodeAt(prefixStart.length - 1) + 1);
      
      console.log('String-based range:', prefixStart, prefixEnd);
    
      // Apply range query using string comparison
      query = query.where('tracking_number', '>=', prefixStart);
      query = query.where('tracking_number', '<', prefixEnd);
    }
  
    // Default orderBy to created_at if not provided
    const fieldToOrderBy = orderBy === 'name' ? 'customer.name' : orderBy === 'total' ? 'total' : orderBy || 'created_at';
    const sortDirection = sortedBy === 'asc' ? 'asc' : 'desc';
  
    query = query.orderBy(fieldToOrderBy, sortDirection);
  
    // Fetch the first page * limit documents (for simulating offset)
    const fetchLimit = limit * page;
    query = query.limit(fetchLimit);
  
    // Fetch the current batch of orders
    const orderSnapshot = await query.get();
    const allOrders = orderSnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    } as Order));
  
    // Calculate the slice to return for the requested page
    const startIndex = (page - 1) * limit;
    const paginatedOrders = allOrders.slice(startIndex, startIndex + limit);
  
    // Get total number of orders
    const totalOrders = await orderCollection.get().then(snapshot => snapshot.size);
  
    const url = `/orders?limit=${limit}`;
  
    return {
      data: paginatedOrders,
      // lastDocumentId: null, // Not needed for this approach
      ...paginate(totalOrders, page, limit, paginatedOrders.length, url),
    };
  }

  
  // async getOrders({ // last document
  //   limit,
  //   page,
  //   tracking_number,
  //   search,
  //   lastDocumentId,
  //   orderBy,
  //   sortedBy
  // }: GetOrdersDto, user: User): Promise<OrderPaginator> {
  //   // console.log('user===================getOrders', user.isAdmin);
  //   if (!page) page = 1;

   
  //   // if (!limit || isNaN(limit)) {
  //   //   limit = 15; // Default limit value
  //   // } else {
  //   //   limit = +limit // Ensure it's an integer
  //   // }
  //   limit = 5;
  //   console.log('limit ==========',limit,typeof(limit),page)
  //   let orders: Order[] = [];

  //   // Reference to Firestore collection
  //   const orderCollection = this.firebaseService.firestore.collection('orders');

  //   let query: admin.firestore.Query = orderCollection;

  //   // If the user is not an admin, filter by customer ID
  //   if (!user.isAdmin) {
  //     query = query.where('customer_id', '==', user.id);
  //   }

  //   const fieldToOrderBy = orderBy === 'name' 
  //     ? 'customer.name' 
  //     : orderBy === 'total' 
  //       ? 'total' 
  //       : orderBy || 'created_at';
  //   const sortDirection = sortedBy === 'asc' ? 'asc' : 'desc';

  //   console.log('fieldToOrderBy',fieldToOrderBy)
  //   // Apply `orderBy` to the query
  //   query = query.orderBy(fieldToOrderBy, sortDirection);

  //   // Apply Firestore pagination with limit
  //   query = query.limit(limit);

  //   // Use the lastDocument from the previous page if available
  //   if (lastDocumentId) {
  //     const lastDocumentSnapshot = await this.firebaseService.firestore.doc(`orders/${lastDocumentId}`).get();
  //     console.log('lastDocumentSnapshot-----------',lastDocumentSnapshot)
  //     query = query.startAfter(lastDocumentSnapshot);
  //   }

  //   // Fetch the current page's orders from Firestore
  //   const orderSnapshot = await query.get();
  //   orders = orderSnapshot.docs.map((doc) => ({
  //     ...doc.data(),
  //     id: doc.id,
  //     // Spread the Firestore document data into the object
  // } as Order));
  //   console.log('orders',orders.length)
  //   // Store the last document for the next pagination call
  //   const lastVisible = orderSnapshot.docs[orderSnapshot.docs.length - 1];

  //   const lastDocumentIdForNextPage = lastVisible ? lastVisible.id : null;
  //   console.log('lastVisible=============',lastVisible)

  //   const totalOrders = await orderCollection.get().then(snapshot => snapshot.size);
  //   const url = `/orders?search=${search}&limit=${limit}`;

  //   return {
  //     data: orders,
  //     lastDocumentId: lastDocumentIdForNextPage, // Return last document to store on client-side for next request
  //     ...paginate(totalOrders, page, limit, orders.length, url),
  //   };
  // }
  
  // async getOrders({
  //   limit,
  //   page,
  //   customer_id,
  //   tracking_number,
  //   search,
  //   shop_id,
  // }: GetOrdersDto, user: User): Promise<OrderPaginator> {
  //   // console.log('user===================getOrders', user.isAdmin);
  //   if (!page) page = 1;
  //   // if (!limit || isNaN(limit)) {
  //   //   limit = 15; // Default limit value
  //   // } else {
  //   //   limit = +limit // Ensure it's an integer
  //   // }
  //   limit = 5;
  //   console.log('limit ==========',limit,typeof(limit),page)
  //   let orders: Order[] = [];
  //   // const startIndex = (page - 1) * limit;
    
  //   // Reference to Firestore collection
  //   const orderCollection = this.firebaseService.firestore.collection('orders');
  
  //   let query: admin.firestore.Query = orderCollection;
  
  //   // If the user is not an admin, filter by customer ID
  //   if (!user.isAdmin) {
  //     query = query.where('customer_id', '==', user.id);
  //   }
  
  //   // Apply Firestore pagination with limit and startAfter
  //   query = query.limit(limit);
  
  //   // If this is not the first page, we need to use `startAfter` for pagination
  //   if (page > 1) {
  //     // Fetch previous orders to get the last document
  //     const previousOrdersSnapshot = await query.get();
  //     const lastOrder = previousOrdersSnapshot.docs[previousOrdersSnapshot.docs.length - 1];
  //     console.log('lastOrder ============',lastOrder)
  //     if (lastOrder) {
  //       query = query.startAfter(lastOrder);
  //     }
  //   }
  
  //   // Fetch the orders from Firestore
  //   const orderSnapshot = await query.get();
  //   orders = orderSnapshot.docs.map((doc) => doc.data() as Order);
  
  //   const totalOrders = await orderCollection.get().then(snapshot => snapshot.size);
  //   const url = `/orders?search=${search}&limit=${limit}`;
  //   return {
  //     data: orders,
  //     ...paginate(totalOrders, page, limit, orders.length, url),
  //   };
  // }
  
  // async getOrders2({
  //   limit,
  //   page,
  //   customer_id,
  //   tracking_number,
  //   search,
  //   shop_id,
  // }: GetOrdersDto,user: User): Promise<OrderPaginator> {
  //   console.log('user===================getOrders',user.isAdmin)
  //   if (!page) page = 1;
  //   if (!limit) limit = 15;
  //   const startIndex = (page - 1) * limit;
  //   const endIndex = page * limit;

  //   // let data: Order[] = this.orders;

  //   // if (shop_id && shop_id !== 'undefined') {
  //   //   data = this.orders?.filter((p) => p?.shop?.id === Number(shop_id));
  //   // }
  //   // const results = data.slice(startIndex, endIndex);
  //   // const url = `/orders?search=${search}&limit=${limit}`;
  //   // return {
  //   //   data: results,
  //   //   ...paginate(data.length, page, limit, results.length, url),
  //   // };
  //   let orders: Order[] = []
  //   if (user.isAdmin) {
  //     orders = await this.firebaseService.getCollection('orders')
  //   }
  //   else {
  //     orders = await this.firebaseService.getCollection('orders',(ref) => ref.where('customer_id', '==', user.id))
  //   }

  //   return {
  //     data: orders,
  //     ...paginate(orders.length, page, limit, orders.length, ""),
  //   };
  // }

  async getOrderByIdOrTrackingNumber(id: string): Promise<Order> {
    // Step 1: Try to fetch the order by its document ID (Firestore's document ID)
    let order: Order = await this.firebaseService.getDocumentById<Order>('orders', id);
  
    // Step 2: If no order was found by document ID, attempt to search by `tracking_number`
    if (!order) {
      const result: Order[] = await this.firebaseService
        .getCollection('orders',(ref) => ref.where('tracking_number', '==', id))
  
      // Step 3: If an order with the matching tracking number is found, retrieve it
      if (result.length > 0) {
        order = result[0]
      }
    }
  
    // Step 4: If no order was found by both document ID and tracking number, throw an error
    if (!order) {
      throw new NotFoundException(`Order not found with ID or Tracking Number: ${id}`);
    }
  
    return order;
  }
  

  getOrderStatuses({
    limit,
    page,
    search,
    orderBy,
  }: GetOrderStatusesDto): OrderStatusPaginator {
    if (!page) page = 1;
    if (!limit) limit = 30;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    let data: OrderStatus[] = this.orderStatus;

    // if (shop_id) {
    //   data = this.orders?.filter((p) => p?.shop?.id === shop_id);
    // }

    if (search) {
      const parseSearchParams = search.split(';');
      const searchText: any = [];
      for (const searchParam of parseSearchParams) {
        const [key, value] = searchParam.split(':');
        // TODO: Temp Solution
        if (key !== 'slug') {
          searchText.push({
            [key]: value,
          });
        }
      }

      data = fuse
        .search({
          $and: searchText,
        })
        ?.map(({ item }) => item);
    }

    const results = data.slice(startIndex, endIndex);
    const url = `/order-status?search=${search}&limit=${limit}`;

    return {
      data: results,
      ...paginate(data.length, page, limit, results.length, url),
    };
  }

  getOrderStatus(param: string, language: string) {
    return this.orderStatus.find((p) => p.slug === param);
  }

  // update(id: string, updateOrderInput: UpdateOrderDto) {
  //   return this.orders[0];
  // }
  async update(id: string, updateOrderInput: UpdateOrderDto): Promise<Order> {
    // Step 1: Fetch the order by ID from Firebase
    const order = await this.firebaseService.getDocumentById<Order>('orders', id);

    if (!order) {
      throw new BadRequestException(`Order with ID ${id} not found`);
    }

    // Step 2: Update the order status
    const updatedOrder = {
      ...order,
      order_status: updateOrderInput.order_status, // Update the order status from the input
    };

    // Step 3: Save the updated order back to Firebase
    await this.firebaseService.updateDocument('orders', id, updatedOrder);

    // Step 4: Return the updated order
    const storedOrder = await this.firebaseService.getDocumentById<Order>('orders', id);
    
    return storedOrder;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }

  // verifyCheckout(input: CheckoutVerificationDto): VerifiedCheckoutData {
    
  //   return {
  //     total: 0,
  //     subtotal: 0,
  //     total_tax: 0,
  //     shipping_charge: 0,
  //     unavailable_products: ["GT5QtzqHeb8OBXmoXMNb"],
  //     available_products: [],
  //     wallet_currency: 0,
  //     wallet_amount: 0,
  //   };
  // }

  

  createOrderStatus(createOrderStatusInput: CreateOrderStatusDto) {
    return this.orderStatus[0];
  }

  updateOrderStatus(updateOrderStatusInput: UpdateOrderStatusDto) {
    return this.orderStatus[0];
  }

  async getOrderFileItems({ page, limit }: GetOrderFilesDto) {
    if (!page) page = 1;
    if (!limit) limit = 30;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const results = orderFiles.slice(startIndex, endIndex);

    const url = `/downloads?&limit=${limit}`;
    return {
      data: results,
      ...paginate(orderFiles.length, page, limit, results.length, url),
    };
  }

  async getDigitalFileDownloadUrl(digitalFileId: number) {
    const item: OrderFiles = this.orderFiles.find(
      (singleItem) => singleItem.digital_file_id === digitalFileId,
    );

    return item.file.url;
  }

  async exportOrder(shop_id: string) {
    return exportOrderJson.url;
  }

  async downloadInvoiceUrl(shop_id: string) {
    return orderInvoiceJson[0].url;
  }

  /**
   * helper methods from here
   */

  /**
   * this method will process children of Order Object
   * @param order
   * @returns Children[]
   */
  processChildrenOrder(order: Order) {
    return [...order.children].map((child) => {
      child.order_status = order.order_status;
      child.payment_status = order.payment_status;
      return child;
    });
  }
  /**
   * This action will return Payment Intent
   * @param order
   * @param setting
   */
  async processPaymentIntent(
    order: Partial<Order>,
    // setting: Setting,
    user: User
  ): Promise<PaymentIntent> {
    // const paymentIntent = paymentIntents.find(
    //   (intent: PaymentIntent) =>
    //     intent.tracking_number === order.tracking_number &&
    //     intent.payment_gateway.toString().toLowerCase() ===
    //       setting.options.paymentGateway.toString().toLowerCase(),
    // );
    // if (paymentIntent) {
    //   return paymentIntent;
    // }
    const {
      id: payment_id,
      client_secret = null,
      redirect_url = null,
      customer = null,
    } = await this.savePaymentIntent(order,user,order.payment_gateway);
    const is_redirect = redirect_url ? true : false;
    const paymentIntentInfo: PaymentIntent = {
      id: Number(Date.now()),
      order_id: null,
      tracking_number: order.tracking_number,
      payment_gateway: order.payment_gateway.toString().toLowerCase(),
      payment_intent_info: {
        client_secret,
        payment_id,
        redirect_url,
        is_redirect,
      },
    };

    /**
     * Commented below code will work for real database.
     * if you uncomment this for json will arise conflict.
     */

    // paymentIntents.push(paymentIntentInfo);
    // const paymentGateway: PaymentGateWay = {
    //   id: Number(Date.now()),
    //   user_id: this.authService.me().id,
    //   customer_id: customer,
    //   gateway_name: setting.options.paymentGateway,
    //   created_at: new Date(),
    //   updated_at: new Date(),
    // };
    // paymentGateways.push(paymentGateway);
    console.log('paymentIntentInfo-0------------',paymentIntentInfo)
    return paymentIntentInfo;
  }

  /**
   * Trailing method of ProcessPaymentIntent Method
   *
   * @param order
   * @param paymentGateway
   */
  async savePaymentIntent(order: Partial<Order>,user: User,paymentGateway?: string): Promise<any> {
    const me = user;
    console.log('savePaymentIntent me',me)
    switch (order.payment_gateway) {
      case PaymentGatewayType.STRIPE:
        const paymentIntentParam =
          await this.stripeService.makePaymentIntentParam(order, me);
        console.log('paymentIntentParam',paymentIntentParam)
        return await this.stripeService.createPaymentIntent(paymentIntentParam);
      case PaymentGatewayType.PAYPAL:
        // here goes PayPal
        // return this.paypalService.createPaymentIntent(order);
        break;

      default:
        //
        break;
    }
  }

  /**
   *  Route {order/payment} Submit Payment intent here
   * @param order
   * @param orderPaymentDto
   */
  async stripePay(order: Order) {
    // this.firebaseService.setWithMerge("orders",order.id,{
    //   order_status: OrderStatusType.PROCESSING,
    //   payment_status: PaymentStatusType.SUCCESS
    // })
    // this.orders[0]['order_status'] = OrderStatusType.PROCESSING;
    // this.orders[0]['payment_status'] = PaymentStatusType.SUCCESS;
    // this.orders[0]['payment_intent'] = null;
  }
  async stripePaySuccess(trackingNumber: string) {
    const order = await this.getOrderByIdOrTrackingNumber(trackingNumber)

    this.firebaseService.setWithMerge("orders",order.id,{
      order_status: OrderStatusType.PROCESSING,
      payment_status: PaymentStatusType.SUCCESS
    })
  }

  async stripePayChargeSuccess(trackingNumber: string,invoice:string) {
    const order = await this.getOrderByIdOrTrackingNumber(trackingNumber)

    this.firebaseService.setWithMerge("orders",order.id,{
      invoice_url: invoice
    })
  }

  async stripePayFail(trackingNumber: string) {
    const order = await this.getOrderByIdOrTrackingNumber(trackingNumber)
    this.firebaseService.setWithMerge("orders",order.id,{
      order_status: OrderStatusType.PENDING,
      payment_status: PaymentStatusType.FAILED
    })
  }

  // async paypalPay(order: Order) {
  //   this.orders[0]['order_status'] = OrderStatusType.PROCESSING;
  //   this.orders[0]['payment_status'] = PaymentStatusType.SUCCESS;
  //   const { status } = await this.paypalService.verifyOrder(
  //     order.payment_intent.payment_intent_info.payment_id,
  //   );
  //   this.orders[0]['payment_intent'] = null;
  //   if (status === 'COMPLETED') {
  //     //console.log('payment Success');
  //   }
  // }

  /**
   * This method will set order status and payment status
   * @param orderStatus
   * @param paymentStatus
   */
  changeOrderPaymentStatus(
    orderStatus: OrderStatusType,
    paymentStatus: PaymentStatusType,
  ) {
    this.orders[0]['order_status'] = orderStatus;
    this.orders[0]['payment_status'] = paymentStatus;
  }
  async orderSeen(id: string) {
    await this.firebaseService.updateDocument('orders',id,{is_seen: true})
  }
}
