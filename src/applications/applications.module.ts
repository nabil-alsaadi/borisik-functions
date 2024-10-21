import { Module } from '@nestjs/common';

import { FirebaseService } from '../firebase/firebase.service';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';

@Module({
  controllers: [ApplicationsController],
  providers: [ApplicationsService, FirebaseService],
})
export class ApplicationsModule {}
