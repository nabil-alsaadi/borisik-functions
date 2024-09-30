import { Address } from '../../addresses/entities/address.entity';
import { CoreEntity, CoreFirebaseEntity } from '../../common/entities/core.entity';
import { Shop } from '../../shops/entities/shop.entity';
import { Profile } from './profile.entity';

export class User extends CoreFirebaseEntity {
  name: string;
  email: string;
  password?: string;
  profile?: Profile;
  shops?: Shop[];
  managed_shop?: Shop;
  is_active?: boolean = true;
  address?: Address[];
  permissions?: Permission[];
  // orders?: Order[];
  wallet?: any;
  isAdmin?: boolean = false;
}

export class Permission extends CoreEntity {
  name?: string;
  guard_name?: string;
  pivot?: any;
}

export enum UserPermissionType {
  SUPER_ADMIN = 'super_admin',
  STORE_OWNER = 'store_owner',
  STAFF = 'staff',
  CUSTOMER = 'customer',
}