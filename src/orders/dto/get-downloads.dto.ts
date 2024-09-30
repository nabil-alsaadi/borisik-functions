import { SortOrder } from '../../common/dto/generic-conditions.dto';
import { PaginationArgs } from '../../common/dto/pagination-args.dto';
import { Paginator } from '../../common/dto/paginator.dto';
import { OrderFiles } from '../entities/order.entity';

export class OrderFilesPaginator extends Paginator<OrderFiles> {
  data: OrderFiles[];
}

export class GetOrderFilesDto extends PaginationArgs {
  orderBy?: QueryOrderFilesOrderByColumn;
  sortedBy?: SortOrder;
  // search?: string;
}

export enum QueryOrderFilesOrderByColumn {
  CREATED_AT = 'CREATED_AT',
  NAME = 'NAME',
  UPDATED_AT = 'UPDATED_AT',
}
