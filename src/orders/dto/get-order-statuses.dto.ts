import { SortOrder } from '../../common/dto/generic-conditions.dto';
import { PaginationArgs } from '../../common/dto/pagination-args.dto';
import { Paginator } from '../../common/dto/paginator.dto';

import { OrderStatus } from '../entities/order-status.entity';

export class OrderStatusPaginator extends Paginator<OrderStatus> {
  data: OrderStatus[];
}

export class GetOrderStatusesDto extends PaginationArgs {
  orderBy?: QueryOrderStatusesOrderByColumn;
  sortedBy?: SortOrder;
  search?: string;
  language?: string;
}

export enum QueryOrderStatusesOrderByColumn {
  CREATED_AT = 'CREATED_AT',
  NAME = 'NAME',
  UPDATED_AT = 'UPDATED_AT',
  SERIAL = 'SERIAL',
}
