import { PaginationArgs } from '../../common/dto/pagination-args.dto';
import { Paginator } from '../../common/dto/paginator.dto';

import { Order } from '../entities/order.entity';
import * as admin from 'firebase-admin';
export class OrderPaginator extends Paginator<Order> {
  data: Order[];
  lastDocumentId?: string;
}

export class GetOrdersDto extends PaginationArgs {
  tracking_number?: string;
  orderBy?: string;
  sortedBy?: string;
  customer_id?: number;
  shop_id?: string;
  search?: string;
  lastDocumentId?: string;
  language?: string;
}
