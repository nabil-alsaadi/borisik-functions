import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PaymentModule } from '../payment/payment.module';
import { SettingsModule } from '../settings/settings.module';
import {
  PaymentMethodController,
  SavePaymentMethodController,
  SetDefaultCartController,
} from './payment-method.controller';
import { PaymentMethodService } from './payment-method.service';

@Module({
  imports: [AuthModule, PaymentModule, SettingsModule],
  controllers: [
    PaymentMethodController,
    SetDefaultCartController,
    SavePaymentMethodController,
  ],
  providers: [PaymentMethodService],
})
export class PaymentMethodModule {}
