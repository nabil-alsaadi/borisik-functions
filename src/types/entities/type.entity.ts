import { Attachment } from '../../common/entities/attachment.entity';
import { CoreEntity } from '../../common/entities/core.entity';

export class Type extends CoreEntity {
  name: string;
  slug: string;
  image: Attachment;
  icon: string;
  banners?: Banner[];
  promotional_sliders?: Attachment[];
  settings?: TypeSettings;
  language: string;
  translated_languages: string[];
}

export class Banner {
  id: number;
  title?: string;
  description?: string;
  image: Attachment;
}

export class TypeSettings {
  isHome: boolean;
  layoutType: string;
  productCard: string;
}
