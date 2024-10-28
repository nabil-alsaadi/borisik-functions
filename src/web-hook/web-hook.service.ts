import { BadRequestException, Injectable } from '@nestjs/common';
// import { STRIPE_API_KEY_PRODUCTION, STRIPE_API_KEY_TESTING, WEBHOOK_STRIPE_SECRET_LOCAL, WEBHOOK_STRIPE_SECRET_PRODUCTION, WEBHOOK_STRIPE_SECRET_TESTING } from '../utils/config.util';
import Stripe from 'stripe';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class WebHookService {
  private stripeClient: Stripe;
  constructor(private readonly orderService: OrdersService) {
    
    // this.stripeClient = new Stripe(STRIPE_API_KEY_TESTING, { apiVersion: '2022-11-15' });
  }

  razorPay() {
    return `this action is for razorpay pay`;
  }
  stripe(body: any, sig: string,environment: string) {
    console.log('stripe webhook called:', environment);

    const stripeKey = environment === 'production' ? process.env.STRIPE_API_KEY_PRODUCTION : process.env.STRIPE_API_KEY_TESTING;
    const webhookSecret = process.env.WEBHOOK_STRIPE_SECRET_LOCAL //environment === 'production' ? process.env.WEBHOOK_STRIPE_SECRET_PRODUCTION : process.env.WEBHOOK_STRIPE_SECRET_TESTING; //WEBHOOK_STRIPE_SECRET_LOCAL // 
    this.stripeClient = new Stripe(stripeKey, { apiVersion: '2022-11-15' });

    console.log('stripe',body,sig)
    if (!body || body.length === 0) {
      throw new BadRequestException('No webhook payload was provided.');
    }
    
    let event;
    try {
       event = this.stripeClient.webhooks.constructEvent(body, sig, webhookSecret);
       console.log('event',event)
    } catch (err) {
      console.log('Webhook Error:',err.message)
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'payment_intent.payment_failed':
        const paymentIntentPaymentFailed = event.data.object;
        console.log('paymentIntentPaymentFailed',paymentIntentPaymentFailed)
        const trackingNumberFailed = paymentIntentPaymentFailed.metadata.order_tracking_number
        if (trackingNumberFailed && trackingNumberFailed !== ''){
          this.orderService.stripePaySuccess(trackingNumberFailed)
        }
        // Then define and call a function to handle the event payment_intent.payment_failed
        break;
      case 'payment_intent.succeeded':
        const paymentIntentSucceeded = event.data.object;
        console.log('paymentIntentSucceeded',paymentIntentSucceeded)
        const trackingNumberSucceeded = paymentIntentSucceeded.metadata.order_tracking_number
        if (trackingNumberSucceeded && trackingNumberSucceeded !== ''){
          this.orderService.stripePaySuccess(trackingNumberSucceeded)
        }
        // Then define and call a function to handle the event payment_intent.succeeded
        break;
      case 'charge.succeeded':
        const chargedsucess = event.data.object;
        const trackingNumberChargeSucess = chargedsucess.metadata.order_tracking_number
        const receipt_url = chargedsucess.receipt_url
        this.orderService.stripePayChargeSuccess(trackingNumberChargeSucess,receipt_url)
        console.log('charge.succeeded data',chargedsucess.metadata)
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return true;
  }
  paypal() {
    return `this action is for paypal pay`;
  }
}
