import { CoreEntity } from '../../common/entities/core.entity';
import { Shop } from '../../shops/entities/shop.entity';
import { User } from '../../users/entities/user.entity';

export enum StoreNoticePriorityType {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

export class StoreNotice extends CoreEntity {
  priority: StoreNoticePriorityType;
  notice: string;
  description?: string;
  effective_from?: string;
  expired_at: string;
  type?: string;
  is_read?: boolean;
  shops?: Shop[];
  users?: User[];
  received_by?: string;
  created_by: string;
  expire_at: string;
  deleted_at?: string;
  creator?: any;
  translated_languages: string[];
}
