import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { FirebaseService } from '../firebase/firebase.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService,FirebaseService],
})
export class CategoriesModule {}
