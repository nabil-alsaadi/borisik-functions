import { PickType } from '@nestjs/swagger';
import { Address } from '../entities/address.entity';

export class CreateAddressDto extends PickType(Address, [
  'title',
  'type',
  'default',
  'address',
]) {
  id?: number;
  'customer_id': number;
}
