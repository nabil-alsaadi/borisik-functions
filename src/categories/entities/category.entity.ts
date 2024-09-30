import { Attachment } from '../../common/entities/attachment.entity';
import { CoreEntity, CoreFirebaseEntity } from '../../common/entities/core.entity';
import { Product } from '../../products/entities/product.entity';
import { Type } from '../../types/entities/type.entity';

export class Category extends CoreFirebaseEntity {
  name: string;
  slug: string;
  parent?: Category;
  children?: Category[];
  details?: string;
  image?: Attachment;
  icon?: string;
  type?: Type;
  products?: Product[];
  language?: string;
  translated_languages?: string[];
  children_ids: string[];
  parent_id?: string = null;
  translations: {
    [languageCode: string]: {
      name: string;
      details?: string;
    };
  };
}
