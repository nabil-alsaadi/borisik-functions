import { CoreEntity } from '../../common/entities/core.entity';
import { Order } from '../../orders/entities/order.entity';
import { Shop } from '../../shops/entities/shop.entity';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { Attachment } from '../../common/entities/attachment.entity';
import { Report } from './reports.entity';
import { Feedback } from '../../feedbacks/entities/feedback.entity';

export class Review extends CoreEntity {
  rating: number;
  name: string;
  comment: string;
  shop: Shop;
  order: Order;
  customer: User;
  photos: Attachment[];
  user: User;
  product: Product;
  feedbacks: Feedback[];
  my_feedback: Feedback;
  positive_feedbacks_count: number;
  negative_feedbacks_count: number;
  user_id: number;
  product_id: number;
  abusive_reports: Report[];
  shop_id: string;
  variation_option_id: string;
  abusive_reports_count?: number;
}
