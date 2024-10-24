import paymentGatewayJson from '../db/payment-gateway.json';
import cards from '../db/payment-methods.json';
import { Injectable } from '@nestjs/common';
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
const paymentGateways = plainToClass(PaymentGateWay, paymentGatewayJson);
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

  async create(createPaymentMethodDto: CreatePaymentMethodDto,user: User) {
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
      console.log(error);
      return paymentMethods[0];
    }
  }

  findAll(user: User) {
    let paymentMethods = user.payment_methods  ?? []
    return paymentMethods;
  }

  findOne(id: number,user: User) {
    let paymentMethods = user.payment_methods  ?? []
    return paymentMethods.find(
      (pm: PaymentMethod) => pm.id === Number(id),
    );
  }

  update(id: number, updatePaymentMethodDto: UpdatePaymentMethodDto) {
    return //this.findOne(id);
  }
  async saveToUser(data: Partial<User>, id: string) {
    await this.firebaseService.setWithMerge('users',id,data)
  }
  async remove(id: number,user: User) {
    const card: PaymentMethod = this.findOne(id,user);
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

  async saveDefaultCart(defaultCart: DefaultCart,user: User) {
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
    return this.findOne(Number(method_id),newUser);
  }

  async savePaymentMethod(createPaymentMethodDto: CreatePaymentMethodDto, user: User) {
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
    if (
      this.paymentMethodAlreadyExists(retrievedPaymentMethod.card.fingerprint,paymentMethods)
    ) {
      return paymentMethods.find(
        (pMethod: PaymentMethod) => pMethod.method_key === method_key,
      );
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
    // switch (paymentGateway) {
    //   case 'stripe':
    //     break;
    //   case 'paypal':
    //     // TODO
    //     //paypal code goes here
    //     break;
    //   default:
    //     break;
    // }
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
    const listofCustomer = await this.stripeService.listAllCustomer();
    let currentCustomer = listofCustomer.data.find(
      (customer: StripeCustomer) => customer.email === email,
    );
    if (!currentCustomer) {
      const newCustomer = await this.stripeService.createCustomer({
        name,
        email,
      });
      currentCustomer = newCustomer;
    }
    const attachedPaymentMethod: StripePaymentMethod =
      await this.stripeService.attachPaymentMethodToCustomer(
        method_key,
        currentCustomer.id,
      );
    let customerGateway: PaymentGateWay = paymentGateways.find(
      (pGateway: PaymentGateWay) =>
        String(pGateway.user_id) === (user_id) &&
        pGateway.gateway_name === paymentGateway,
    );
    if (!customerGateway) {
      customerGateway = {
        id: Number(Date.now()),
        user_id: user_id,
        customer_id: currentCustomer['id'],
        gateway_name: paymentGateway,
        created_at: new Date(),
        updated_at: new Date(),
      };
      paymentGateways.push(customerGateway);
    }
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
}
