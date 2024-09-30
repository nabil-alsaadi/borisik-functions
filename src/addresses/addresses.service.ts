import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { FirebaseService } from '../firebase/firebase.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AddressesService {
  constructor(
    private readonly firebaseService: FirebaseService
  ) {}
  create(createAddressDto: CreateAddressDto) {
    return 'This action adds a new address';
  }

  findAll() {
    return `This action returns all addresses`;
  }

  findOne(id: number) {
    return `This action returns a #${id} address`;
  }

  update(id: number, updateAddressDto: UpdateAddressDto) {
    return `This action updates a #${id} address`;
  }

  async remove(id: number,user: User) {
    const addressIndex = user.address.findIndex((addr) => addr.id === id);

    // If the address doesn't exist, throw an error
    if (addressIndex === -1) {
      throw new UnauthorizedException('Address not found or unauthorized');
    }

    // Remove the address from the user's address array
    user.address.splice(addressIndex, 1);

    // Update the user's data in Firebase
    await this.firebaseService.setWithMerge<User>('users', user.id, {
      address: user.address, // Update the address array after deletion
      // updated_at: new Date(), // Update the timestamp
    });

    return { message: `Address with id #${id} deleted successfully` };
  }
}
