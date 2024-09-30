import { SortOrder } from '../../common/dto/generic-conditions.dto';
import { PaginationArgs } from '../../common/dto/pagination-args.dto';
import { Paginator } from '../../common/dto/paginator.dto';
import { Manufacturer } from '../entities/manufacturer.entity';

export class ManufacturerPaginator extends Paginator<Manufacturer> {
  data: Manufacturer[];
}

export class GetManufacturersDto extends PaginationArgs {
  orderBy?: QueryManufacturersOrderByColumn;
  sortedBy?: SortOrder;
  search?: string;
  language?: string;
}

export enum QueryManufacturersOrderByColumn {
  CREATED_AT = 'CREATED_AT',
  NAME = 'NAME',
  UPDATED_AT = 'UPDATED_AT',
}
