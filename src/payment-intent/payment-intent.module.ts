import { Module } from '@nestjs/common';
import { PaymentIntentController } from './payment-intent.controller';
import { PaymentIntentService } from './payment-intent.service';
import { OrdersService } from '../orders/orders.service';
import { StripePaymentService } from '../payment/stripe-payment.service';
import { FirebaseService } from '../firebase/firebase.service';

@Module({
  controllers: [PaymentIntentController],
  providers: [PaymentIntentService,OrdersService,StripePaymentService,FirebaseService],
})
export class PaymentIntentModule {}
