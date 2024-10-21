import { Module } from '@nestjs/common';
import { WebHookController } from './web-hook.controller';
import { WebHookService } from './web-hook.service';
import { OrdersService } from '../orders/orders.service';
import { StripePaymentService } from '../payment/stripe-payment.service';
import { ShippingsService } from '../shippings/shippings.service';
import { TaxesService } from '../taxes/taxes.service';

@Module({
  controllers: [WebHookController],
  providers: [WebHookService,OrdersService,StripePaymentService,ShippingsService,TaxesService],
})
export class WebHookModule {}
