import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PaymentModule } from '../payment/payment.module';
import {
  DownloadInvoiceController,
  OrderExportController,
  OrderFilesController,
  OrdersController,
  OrderStatusController,
} from './orders.controller';
import { OrdersService } from './orders.service';
import { TaxesService } from '../taxes/taxes.service';
import { ShippingsService } from '../shippings/shippings.service';

@Module({
  imports: [AuthModule, PaymentModule],
  controllers: [
    OrdersController,
    OrderStatusController,
    OrderFilesController,
    OrderExportController,
    DownloadInvoiceController,
  ],
  providers: [OrdersService,TaxesService,ShippingsService],
  exports: [OrdersService],
})
export class OrdersModule {}
