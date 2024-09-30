import { Type } from 'class-transformer';

export class CoreEntity {
  uid?: string;
  id: number;
  @Type(() => Date)
  created_at: Date;
  @Type(() => Date)
  updated_at: Date;
}

export class CoreFirebaseEntity {
  id: string;
  @Type(() => Date)
  created_at: Date;
  @Type(() => Date)
  updated_at: Date;
}