import { Module } from '@nestjs/common';
import { PublicationsService } from './publications.service';
import { PublicationsController } from './publications.controller';
import { FirebaseService } from '../firebase/firebase.service'; // Import the FirebaseService

@Module({
  controllers: [PublicationsController],
  providers: [PublicationsService, FirebaseService], // Register FirebaseService here
})
export class PublicationsModule {}
