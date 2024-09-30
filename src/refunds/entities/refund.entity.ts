import { CoreEntity } from '../../common/entities/core.entity';
import { Order } from '../../orders/entities/order.entity';
import { Shop } from '../../shops/entities/shop.entity';
import { User } from '../../users/entities/user.entity';

export enum RefundStatus {
  APPROVED = 'Approved',
  PENDING = 'Pending',
  REJECTED = 'Rejected',
  PROCESSING = 'Processing',
}

export class Refund extends CoreEntity {
  amount: string;
  status: RefundStatus;
  shop: Shop;
  order: Order;
  customer: User;
}
