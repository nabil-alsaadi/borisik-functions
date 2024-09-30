import { SortOrder } from '../../common/dto/generic-conditions.dto';
import { PaginationArgs } from '../../common/dto/pagination-args.dto';
import { Paginator } from '../../common/dto/paginator.dto';
import { Conversation } from '../entities/conversation.entity';

export class ConversationPaginator extends Paginator<Conversation> {
  data: Conversation[];
}

export class GetConversationsDto extends PaginationArgs {
  orderBy?: string;
  sortedBy?: SortOrder;
  search?: string;
  language?: string;
}
