import { SortOrder } from '../../common/dto/generic-conditions.dto';
import { PaginationArgs } from '../../common/dto/pagination-args.dto';
import { Paginator } from '../../common/dto/paginator.dto';

import { Tag } from '../entities/tag.entity';

export class TagPaginator extends Paginator<Tag> {
  data: Tag[];
}

export class GetTagsDto extends PaginationArgs {
  orderBy?: QueryTagsOrderByColumn;
  sortedBy?: SortOrder;
  text?: string;
  name?: string;
  hasType?: string;
  language?: string;
  search?: string;
}

export enum QueryTagsOrderByColumn {
  CREATED_AT = 'CREATED_AT',
  NAME = 'NAME',
  UPDATED_AT = 'UPDATED_AT',
}
