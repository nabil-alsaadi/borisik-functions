import { Paginator } from "../../common/dto/paginator.dto";
import { Publication } from "../entities/publication.entity";
import { PaginationArgs } from "../../common/dto/pagination-args.dto";

export class PublicationPaginator extends Paginator<Publication> {
    data: Publication[];
    lastDocumentId?: string;
  }
  
  export class GetPublicationDto extends PaginationArgs {
    tracking_number?: string;
    orderBy?: string;
    sortedBy?: string;
    customer_id?: number;
    shop_id?: string;
    search?: string;
    lastDocumentId?: string;
    language?: string;
  }
  