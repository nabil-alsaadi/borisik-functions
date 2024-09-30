import { CoreEntity } from '../../common/entities/core.entity';
import { User } from '../../users/entities/user.entity';

export class Report extends CoreEntity {
  user_id?: number;
  user: User[];
  model_id: number;
  model_type: string;
  message: string;
}
