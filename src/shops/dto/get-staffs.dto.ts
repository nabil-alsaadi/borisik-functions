import { PaginationArgs } from '../../common/dto/pagination-args.dto';

export class GetStaffsDto extends PaginationArgs {
  orderBy?: string;
  sortedBy?: string;
  shop_id?: number;
}
