import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PaypalPaymentService } from './paypal-payment.service';
import { StripePaymentService } from './stripe-payment.service';

@Module({
  imports: [AuthModule],
  providers: [StripePaymentService, PaypalPaymentService],
  exports: [StripePaymentService, PaypalPaymentService],
})
export class PaymentModule {}
