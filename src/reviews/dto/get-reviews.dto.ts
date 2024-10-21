import { SortOrder } from '../../common/dto/generic-conditions.dto';
import { PaginationArgs } from '../../common/dto/pagination-args.dto';
import { Paginator } from '../../common/dto/paginator.dto';
import { Review } from '../entities/review.entity';

export class ReviewPaginator extends Paginator<Review> {
  data: Review[];
}

export class GetReviewsDto extends PaginationArgs {
  orderBy?: QueryReviewsOrderByColumn;
  sortedBy?: SortOrder;
  search?: string;
  product_id?: string;
  placeId: string;
}

export enum QueryReviewsOrderByColumn {
  NAME = 'NAME',
  CREATED_AT = 'CREATED_AT',
  UPDATED_AT = 'UPDATED_AT',
}
