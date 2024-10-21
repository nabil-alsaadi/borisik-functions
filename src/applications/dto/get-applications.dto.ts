import { PaginationArgs } from '../../common/dto/pagination-args.dto';
import { Paginator } from '../../common/dto/paginator.dto';
import { VacancyApplication } from '../entities/application.entity';

export class ApplicationPaginator extends Paginator<VacancyApplication> {
  data: VacancyApplication[];
}

export class GetApplicationDto extends PaginationArgs {
  orderBy?: string;
  sortedBy?: string;
  searchJoin?: string;
  search?: string;
  date_range?: string;
  language?: string;
}

// export enum QueryProductsOrderByColumn {
//   CREATED_AT = 'CREATED_AT',
//   NAME = 'NAME',
//   UPDATED_AT = 'UPDATED_AT',
// }
