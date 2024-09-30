import { CoreEntity } from '../../common/entities/core.entity';

export class Attachment extends CoreEntity {
  thumbnail?: string;
  original?: string;
}
