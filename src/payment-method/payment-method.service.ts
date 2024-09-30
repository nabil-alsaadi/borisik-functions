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

const paymentMethods = plainToClass(PaymentMethod, cards);
const paymentGateways = plainToClass(PaymentGateWay, paymentGatewayJson);
@Injectable()
export class PaymentMethodService {
  private paymentMethods: PaymentMethod[] = paymentMethods;
  constructor(
    private readonly authService: AuthService,
    private readonly stripeService: StripePaymentService,
    private readonly settingService: SettingsService,
  ) {}
  // private setting: Setting = this.settingService.findAll();

  async create(createPaymentMethodDto: CreatePaymentMethodDto,user: User) {
    try {
      const defaultCard = this.paymentMethods.find(
        (card: PaymentMethod) => card.default_card,
      );
      if (!defaultCard || this.paymentMethods.length === 0) {
        createPaymentMethodDto.default_card = true;
      }
      if (createPaymentMethodDto.default_card) {
        this.paymentMethods = [...this.paymentMethods].map(
          (card: PaymentMethod) => {
            card.default_card = false;
            return card;
          },
        );
      }
      const paymentGateway: string = PaymentGatewayType.STRIPE as string;
      return await this.saveCard(createPaymentMethodDto, paymentGateway,user);
    } catch (error) {
      console.log(error);
      return this.paymentMethods[0];
    }
  }

  findAll() {
    return this.paymentMethods;
  }

  findOne(id: number) {
    return this.paymentMethods.find(
      (pm: PaymentMethod) => pm.id === Number(id),
    );
  }

  update(id: number, updatePaymentMethodDto: UpdatePaymentMethodDto) {
    return this.findOne(id);
  }

  remove(id: number) {
    const card: PaymentMethod = this.findOne(id);
    this.paymentMethods = [...this.paymentMethods].filter(
      (cards: PaymentMethod) => cards.id !== id,
    );
    return card;
  }

  saveDefaultCart(defaultCart: DefaultCart) {
    const { method_id } = defaultCart;
    this.paymentMethods = [...this.paymentMethods].map((c: PaymentMethod) => {
      if (c.id === Number(method_id)) {
        c.default_card = true;
      } else {
        c.default_card = false;
      }
      return c;
    });
    return this.findOne(Number(method_id));
  }

  async savePaymentMethod(createPaymentMethodDto: CreatePaymentMethodDto, user: User) {
    const paymentGateway: string = PaymentGatewayType.STRIPE as string;
    try {
      return this.saveCard(createPaymentMethodDto, paymentGateway, user);
    } catch (err) {
      console.log(err);
    }
  }

  async saveCard(
    createPaymentMethodDto: CreatePaymentMethodDto,
    paymentGateway: string,
    user: User
  ) {
    const { method_key, default_card } = createPaymentMethodDto;
    const defaultCard = this.paymentMethods.find(
      (card: PaymentMethod) => card.default_card,
    );
    if (!defaultCard || this.paymentMethods.length === 0) {
      createPaymentMethodDto.default_card = true;
    }
    const retrievedPaymentMethod =
      await this.stripeService.retrievePaymentMethod(method_key);
    if (
      this.paymentMethodAlreadyExists(retrievedPaymentMethod.card.fingerprint)
    ) {
      return this.paymentMethods.find(
        (pMethod: PaymentMethod) => pMethod.method_key === method_key,
      );
    } else {
      const paymentMethod = await this.makeNewPaymentMethodObject(
        createPaymentMethodDto,
        paymentGateway,
        user
      );
      this.paymentMethods.push(paymentMethod);
      return paymentMethod;
    }
    switch (paymentGateway) {
      case 'stripe':
        break;
      case 'paypal':
        // TODO
        //paypal code goes here
        break;
      default:
        break;
    }
  }
  paymentMethodAlreadyExists(fingerPrint: string) {
    const paymentMethod = this.paymentMethods.find(
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
