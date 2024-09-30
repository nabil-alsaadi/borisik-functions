import { Module } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { AddressesController } from './addresses.controller';
import { FirebaseService } from '../firebase/firebase.service';

@Module({
  controllers: [AddressesController],
  providers: [AddressesService,FirebaseService],
})
export class AddressesModule {}
