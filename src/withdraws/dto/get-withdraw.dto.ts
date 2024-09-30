import { PaginationArgs } from '../../common/dto/pagination-args.dto';
import { Paginator } from '../../common/dto/paginator.dto';
import { Withdraw } from '../entities/withdraw.entity';

export class WithdrawPaginator extends Paginator<Withdraw> {
  data: Withdraw[];
}

export class GetWithdrawsDto extends PaginationArgs {
  orderBy?: string;
  sortedBy?: string;
  status?: string;
  shop_id?: number;
}
