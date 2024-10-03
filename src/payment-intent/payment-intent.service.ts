import taxesJson from '../db/taxes.json';
import { ConflictException, Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { PaymentIntent } from './entries/payment-intent.entity';
import { Order } from '../orders/entities/order.entity';
import { GetPaymentIntentDto } from './dto/get-payment-intent.dto';
import { OrdersService } from '../orders/orders.service';

// const orders = plainToClass(Order, ordersJson);
const paymentIntents = plainToClass(PaymentIntent, taxesJson);

@Injectable()
export class PaymentIntentService {
  constructor(
    private readonly orderService: OrdersService
  ) {}
  private paymentIntents: PaymentIntent[] = paymentIntents;
  async getPaymentIntent(query: GetPaymentIntentDto) {
    const order: Order = await this.orderService.getOrderByIdOrTrackingNumber(query.tracking_number)
    // const order = [...orders].find(
    //   (or) => or.tracking_number === ('334983046149' as string),
    // );
    if (order?.payment_intent?.id) {
      return order.payment_intent;
    }
    throw new ConflictException('payment error, please contact support');
  }
}
