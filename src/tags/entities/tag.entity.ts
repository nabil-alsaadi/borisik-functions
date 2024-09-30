import { Attachment } from '../../common/entities/attachment.entity';
import { CoreEntity } from '../../common/entities/core.entity';
import { Product } from '../../products/entities/product.entity';
import { Type } from '../../types/entities/type.entity';

export class Tag extends CoreEntity {
  name: string;
  slug: string;
  parent: number;
  details: string;
  image: Attachment;
  icon: string;
  type: Type;
  products: Product[];
  language: string;
  translated_languages: string[];
}
