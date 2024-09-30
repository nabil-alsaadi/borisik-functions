import { SortOrder } from '../../common/dto/generic-conditions.dto';
import { PaginationArgs } from '../../common/dto/pagination-args.dto';
import { Paginator } from '../../common/dto/paginator.dto';

import { User } from '../entities/user.entity';

export class UserPaginator extends Paginator<User> {
  data: User[];
}

export class GetUsersDto extends PaginationArgs {
  orderBy?: QueryUsersOrderByColumn;
  sortedBy?: SortOrder;
  text?: string;
  search?: string;
}

export enum QueryUsersOrderByColumn {
  NAME = 'name',
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
  IS_ACTIVE = 'IS_ACTIVE',
}
