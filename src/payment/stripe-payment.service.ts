import { ConflictException, Injectable } from '@nestjs/common';
import settingJson from '../db/settings.json';
import { Setting } from '../settings/entities/setting.entity';
import { plainToClass } from 'class-transformer';
import paymentGatewayJson from '../db/payment-gateway.json';
import { Order } from '../orders/entities/order.entity';
import { PaymentGateWay } from '../payment-method/entities/payment-gateway.entity';
import { User } from '../users/entities/user.entity';
import Stripe from 'stripe';
import {
  CardElementDto,
  CreatePaymentIntentDto,
  StripeCreateCustomerDto,
} from './dto/stripe.dto';
import {
  StripeCustomer,
  StripeCustomerList,
  StripePaymentIntent,
  StripePaymentMethod,
} from './entity/stripe.entity';
import { DEFUALT_CURRENCY } from '../utils/config.util';

@Injectable()
export class StripePaymentService {

  private stripeClient: Stripe;
  // constructor() {
  //   this.stripeClient = new Stripe(STRIPE_API_KEY_TESTING, { apiVersion: '2022-11-15' });
  // }

  setEnvironment(environment: string) {
    const stripeKey =
      environment === 'production'
        ? process.env.STRIPE_API_KEY_PRODUCTION
        : process.env.STRIPE_API_KEY_TESTING;

    this.stripeClient = new Stripe(stripeKey, { apiVersion: '2022-11-15' });
    console.log(`Stripe client initialized for ${environment}`);
  }
  // constructor(@InjectStripe() private readonly stripeClient: Stripe) {}

  /**
   * @param  {StripeCreateCustomerDto} createCustomerDto?
   * @returns Promise
   */
  async createCustomer(
    createCustomerDto?: StripeCreateCustomerDto,
  ): Promise<StripeCustomer> {
    try {
      console.log('createCustomerDto',createCustomerDto)
      return await this.stripeClient.customers.create(createCustomerDto);
    } catch (error) {
      throw new ConflictException('Unable to create customer');
    }
  }

  /**
   * @param  {string} id
   * @returns Promise
   */
  async retrieveCustomer(id: string): Promise<StripeCustomer> {
    try {
      return await this.stripeClient.customers.retrieve(id);
    } catch (error) {
      throw new ConflictException('Unable to retrieve customer');
    }
  }

  /**
   * @returns Promise
   */
  async listAllCustomer(): Promise<StripeCustomerList> {
    try {
      return await this.stripeClient.customers.list();
    } catch (error) {
      throw new ConflictException('Unable to list customers');
    }
  }

  async listCustomerByEmail(email: string): Promise<StripeCustomer | null> {
    try {
      // Retrieve a customer by email with a limit of 1 for efficiency
      const customerList = await this.stripeClient.customers.list({
        email,
        limit: 1,
      });
  
      // Return the first customer if found; otherwise, return null
      return customerList.data.length > 0 ? customerList.data[0] : null;
  
    } catch (error) {
      console.error('Error listing customer by email:', error);
      throw new ConflictException('Unable to retrieve customer data');
    }
  }

  /**
   *
   * @param createStripPaymentMethod
   * @returns StripePaymentMethod
   */
  async createPaymentMethod(
    cardElementDto: CardElementDto,
  ): Promise<StripePaymentMethod> {
    try {
      const paymentMethod = await this.stripeClient.paymentMethods.create({
        type: 'card',
        card: cardElementDto,
      });
      const { ...newPaymentMethod }: StripePaymentMethod = paymentMethod;
      return newPaymentMethod;
    } catch (error) {
      throw new ConflictException('Unable to create payment method');
    }
  }

  /**
   * @param  {string} id
   * @returns Promise
   */
  async retrievePaymentMethod(
    method_key: string,
  ): Promise<StripePaymentMethod> {
    try {
      return await this.stripeClient.paymentMethods.retrieve(method_key);
    } catch (error) {
      throw new ConflictException('Unable to retrieve payment method');
    }
  }

  /**
   * @param  {string} customer
   * @returns Promise
   */
  async retrievePaymentMethodByCustomerId(
    customer: string,
  ): Promise<StripePaymentMethod[]> {
    try {
      const { data } = await this.stripeClient.customers.listPaymentMethods(
        customer,
        {
          type: 'card',
        },
      );
      return data;
    } catch (error) {
      throw new ConflictException('Unable to retrieve payment method');
    }
  }

  /**
   * Attach a payment method to a customer
   * @param  {string} method_id
   * @param  {string} customer_id
   * @returns Promise
   */
  async attachPaymentMethodToCustomer(
    method_id: string,
    customer_id: string,
  ): Promise<StripePaymentMethod> {
    try {
      return await this.stripeClient.paymentMethods.attach(method_id, {
        customer: customer_id,
      });
    } catch (error) {
      throw new ConflictException('Unable to atach payment method');
    }
  }

  /** Detach a payment method from customer
   * @param  {string} method_id
   * @returns Promise<StripePaymentMethod>
   */
  async detachPaymentMethodFromCustomer(
    method_id: string,
  ): Promise<StripePaymentMethod> {
    try {
      return await this.stripeClient.paymentMethods.detach(method_id);
    } catch (error) {
      throw new ConflictException('Unable to deatach payment method');
    }
  }

  /**
   * Create a Stripe paymentIntent
   * @param createPaymentIntentDto
   */
  async createPaymentIntent(
    createPaymentIntentDto: CreatePaymentIntentDto,
  ): Promise<StripePaymentIntent> {
    try {
      const paymentIntent = await this.stripeClient.paymentIntents.create(
        createPaymentIntentDto,
      );
      const { ...newIntent }: StripePaymentIntent = paymentIntent;
      return newIntent;
    } catch (error) {
      throw new ConflictException('Unable to retrieve or create Intent');
    }
  }

  /**
   * Retrieving Payment Intent from Stripe
   * @param payment_id
   */
  async retrievePaymentIntent(
    payment_id: string,
  ): Promise<StripePaymentIntent> {
    try {
      return await this.stripeClient.paymentIntents.retrieve(payment_id);
    } catch (error) {
      throw new ConflictException('Unable to retrieve or create Intent');
    }
  }

  // async makePaymentIntentParam(order: Partial<Order>, me: User) {
  //   const customerList = await this.listAllCustomer();
  //   let currentCustomer = customerList.data.find(
  //     (customer: StripeCustomer) => customer.email === me.email,
  //   );
  //   console.log('currentCustomer',currentCustomer,!!currentCustomer,!currentCustomer)
  //   if (!currentCustomer) {
  //     console.log('new customer condtion')
  //     const newCustomer = await this.createCustomer({
  //       name: me.name,
  //       email: me.email,
  //     });
  //     console.log('newCustomer',newCustomer,newCustomer.id)
  //     currentCustomer = newCustomer;
      
  //   }
  //   return {
  //     customer: currentCustomer.id,
  //     amount: Math.ceil(order.paid_total * 100),
  //     currency: DEFUALT_CURRENCY,
  //     payment_method_types: ['card'],
  //     metadata: {
  //       order_tracking_number: order.tracking_number,
  //     },
  //   };
  // }
  async makePaymentIntentParam(order: Partial<Order>, me: User) {
    let currentCustomer: StripeCustomer | null;
    try {
      currentCustomer = await this.listCustomerByEmail(me.email);

      if (!currentCustomer) {
        // Create a new customer if not found
        console.log('Creating new Stripe customer');
        currentCustomer = await this.createCustomer({ name: me.name, email: me.email });
      }
    } catch (error) {
      console.error('Error fetching or creating customer:', error);
      throw new ConflictException('Unable to retrieve or create customer');
    }
  
    // Construct payment intent params
    return {
      customer: currentCustomer.id,
      amount: Math.ceil(order.paid_total * 100),
      currency: DEFUALT_CURRENCY,
      payment_method_types: ['card'],
      metadata: { order_tracking_number: order.tracking_number },
    };
  }
  
}
