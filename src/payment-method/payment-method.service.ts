import paymentGatewayJson from '../db/payment-gateway.json';
import cards from '../db/payment-methods.json';
import { ConflictException, Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { AuthService } from '../auth/auth.service';
import {
  StripeCustomer,
  StripePaymentMethod,
} from '../payment/entity/stripe.entity';
import { StripePaymentService } from '../payment/stripe-payment.service';
import { SettingsService } from '../settings/settings.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { DefaultCart } from './dto/set-default-card.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentGateWay } from './entities/payment-gateway.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { PaymentGatewayType } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { FirebaseService } from '../firebase/firebase.service';

// const paymentMethods = plainToClass(PaymentMethod, cards);
// const paymentGateways = plainToClass(PaymentGateWay, paymentGatewayJson);
@Injectable()
export class PaymentMethodService {
  // private paymentMethods: PaymentMethod[] = paymentMethods;
  constructor(
    private readonly authService: AuthService,
    private readonly stripeService: StripePaymentService,
    private readonly settingService: SettingsService,
    private readonly firebaseService: FirebaseService,
  ) {}
  // private setting: Setting = this.settingService.findAll();

  async create(createPaymentMethodDto: CreatePaymentMethodDto,user: User,environment: string) {
    this.stripeService.setEnvironment(environment);
    let paymentMethods = user.payment_methods  ?? []
    try {
      const defaultCard = paymentMethods.find(
        (card: PaymentMethod) => card.default_card,
      );
      if (!defaultCard || paymentMethods.length === 0) {
        createPaymentMethodDto.default_card = true;
      }
      if (createPaymentMethodDto.default_card) {
        paymentMethods = [...paymentMethods].map(
          (card: PaymentMethod) => {
            card.default_card = false;
            return card;
          },
        );
      }
      const paymentGateway: string = PaymentGatewayType.STRIPE as string;
      return await this.saveCard(createPaymentMethodDto, paymentGateway,user,paymentMethods);
    } catch (error) {
      console.error('Error creating payment method:', error);
      throw new ConflictException('Unable to create payment method. Please try again.');
    }
  }

  findAll(user: User,environment: string) {
    this.stripeService.setEnvironment(environment);
    let paymentMethods = user.payment_methods  ?? []
    return paymentMethods;
  }

  findOne(id: number,user: User,environment: string) {
    this.stripeService.setEnvironment(environment);
    let paymentMethods = user.payment_methods  ?? []
    return paymentMethods.find(
      (pm: PaymentMethod) => pm.id === Number(id),
    );
  }

  update(id: number, updatePaymentMethodDto: UpdatePaymentMethodDto,environment: string) {
    this.stripeService.setEnvironment(environment);
    return //this.findOne(id);
  }
  async saveToUser(data: Partial<User>, id: string) {
    await this.firebaseService.setWithMerge('users',id,data)
  }
  async remove(id: number,user: User,environment: string) {
    this.stripeService.setEnvironment(environment);
    const card: PaymentMethod = this.findOne(id,user,environment);
    let paymentMethods = user.payment_methods  ?? []
    const filtered = [...paymentMethods].filter(
      (cards: PaymentMethod) => cards.id !== id,
    );
    const data = {
      payment_methods: filtered
    }
    await this.saveToUser(data,user.id);
    return card;
  }

  async saveDefaultCart(defaultCart: DefaultCart,user: User,environment: string) {
    this.stripeService.setEnvironment(environment);
    const { method_id } = defaultCart;
    let paymentMethods = user.payment_methods  ?? []
    const updatedpaymentMethods = [...paymentMethods].map((c: PaymentMethod) => {
      if (c.id === Number(method_id)) {
        c.default_card = true;
      } else {
        c.default_card = false;
      }
      return c;
    });
    const data = {
      payment_methods: updatedpaymentMethods
    }
    await this.saveToUser(data,user.id)
    const newUser: User = await this.firebaseService.getDocumentById('users',user.id)
    return this.findOne(Number(method_id),newUser,environment);
  }

  async savePaymentMethod(createPaymentMethodDto: CreatePaymentMethodDto, user: User,environment: string) {
    this.stripeService.setEnvironment(environment);
    let paymentMethods = user.payment_methods  ?? []
    const paymentGateway: string = PaymentGatewayType.STRIPE as string;
    try {
      return this.saveCard(createPaymentMethodDto, paymentGateway, user,paymentMethods);
    } catch (err) {
      console.log(err);
    }
  }

  async saveCard(
    createPaymentMethodDto: CreatePaymentMethodDto,
    paymentGateway: string,
    user: User,
    paymentMethods: PaymentMethod[]
  ) {
    const { method_key, default_card } = createPaymentMethodDto;
    const defaultCard = paymentMethods.find(
      (card: PaymentMethod) => card.default_card,
    );
    if (!defaultCard || paymentMethods.length === 0) {
      createPaymentMethodDto.default_card = true;
    }
    const retrievedPaymentMethod =
      await this.stripeService.retrievePaymentMethod(method_key);
    console.log('retrievedPaymentMethod',retrievedPaymentMethod)
    if (
      this.paymentMethodAlreadyExists(retrievedPaymentMethod.card.fingerprint,paymentMethods)
    ) {
      // if payment card exist return the saved one
      const existingPaymentMethod = paymentMethods.find(
        (pMethod: PaymentMethod) => pMethod.fingerprint === retrievedPaymentMethod.card.fingerprint,
      );
      if (existingPaymentMethod){
        return existingPaymentMethod
      }
      else {
        throw new Error('payment issue please contact support');
      } 
      
    } else {
      const paymentMethod = await this.makeNewPaymentMethodObject(
        createPaymentMethodDto,
        paymentGateway,
        user
      );
      const data = {
        payment_methods: [...paymentMethods,
        paymentMethod]
      }
      // paymentMethods.push(paymentMethod);
      await this.saveToUser(data,user.id);
      return paymentMethod;
    }
  }
  paymentMethodAlreadyExists(fingerPrint: string, paymentMethods: PaymentMethod[]) {
    const paymentMethod = paymentMethods.find(
      (pMethod: PaymentMethod) => pMethod.fingerprint === fingerPrint,
    );
    if (paymentMethod) {
      return true;
    }
    return false;
  }
  
  async makeNewPaymentMethodObject(
    createPaymentMethodDto: CreatePaymentMethodDto,
    paymentGateway: string,
    user: User
  ) {
    const { method_key, default_card } = createPaymentMethodDto;
    const { id: user_id, name, email } = user;
    let currentCustomer = await this.stripeService.listCustomerByEmail(email);

    if (!currentCustomer) {
      currentCustomer = await this.stripeService.createCustomer({ name, email });
    }
    const attachedPaymentMethod: StripePaymentMethod =
      await this.stripeService.attachPaymentMethodToCustomer(
        method_key,
        currentCustomer.id,
      );
    const customerGateway = await this.findOrCreatePaymentGateway(user_id, paymentGateway, currentCustomer.id);
    const paymentMethod: PaymentMethod = {
      id: Number(Date.now()),
      method_key: method_key,
      payment_gateway_id: customerGateway.id,
      default_card: default_card,
      fingerprint: attachedPaymentMethod.card.fingerprint,
      owner_name: attachedPaymentMethod.billing_details.name,
      last4: attachedPaymentMethod.card.last4,
      expires: `${attachedPaymentMethod.card.exp_month}/${attachedPaymentMethod.card.exp_year}`,
      network: attachedPaymentMethod.card.brand,
      type: attachedPaymentMethod.card.funding,
      origin: attachedPaymentMethod.card.country,
      verification_check: attachedPaymentMethod.card.checks.cvc_check,
      created_at: new Date(),
      updated_at: new Date(),
    };
    return paymentMethod;
  }

  private async findOrCreatePaymentGateway(
    userId: string,
    gatewayName: string,
    customerId: string
  ): Promise<PaymentGateWay> {
    // Query Firebase to check if the gateway already exists
    const gatewaySnapshot = await this.firebaseService.getCollection('paymentGateways', (ref) =>
      ref.where('user_id', '==', userId).where('gateway_name', '==', gatewayName).limit(1)
    );
  
    // If the gateway exists, return it
    if (gatewaySnapshot.length > 0) {
      return gatewaySnapshot[0] as PaymentGateWay;
    }
  
    // Otherwise, create a new gateway record
    const newGateway: PaymentGateWay = {
      id: Number(Date.now()),
      user_id: userId,
      customer_id: customerId,
      gateway_name: gatewayName,
      created_at: new Date(),
      updated_at: new Date(),
    };
  
    // Save the new gateway record to Firebase and return it
    await this.firebaseService.addDocument('paymentGateways', newGateway);
    return newGateway;
  }
}
