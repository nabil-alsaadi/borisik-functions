import { PaginationArgs } from '../../common/dto/pagination-args.dto';

import { Paginator } from '../../common/dto/paginator.dto';
import { Shop } from '../entities/shop.entity';

export class ShopPaginator extends Paginator<Shop> {
  data: Shop[];
}

export class GetShopsDto extends PaginationArgs {
  orderBy?: string;
  search?: string;
  sortedBy?: string;
  is_active?: boolean;
}
