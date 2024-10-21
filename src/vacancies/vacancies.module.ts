import { Module } from '@nestjs/common';
import { VacanciesService } from './vacancies.service';
import { VacanciesController } from './vacancies.controller';
import { FirebaseService } from '../firebase/firebase.service';

@Module({
  controllers: [VacanciesController],
  providers: [VacanciesService, FirebaseService],
})
export class VacanciesModule {}
