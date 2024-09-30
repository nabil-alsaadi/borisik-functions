import { CoreEntity } from '../../common/entities/core.entity';
import { Refund } from '../../refunds/entities/refund.entity';
import { Shop } from '../../shops/entities/shop.entity';

export class RefundPolicy extends CoreEntity {
  title: string;
  slug: string;
  target: string;
  status: string;
  description?: string;
  language: string;
  shop_id?: string;
  shop?: Shop;
  refunds?: Refund[];
  translated_languages: Array<string>;
  deleted_at?: string;
}
