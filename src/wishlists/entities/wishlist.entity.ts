import { CoreEntity } from '../../common/entities/core.entity';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

export class Wishlist extends CoreEntity {
  product: Product;
  product_id: string;
  user: User[];
  user_id: string;
}
