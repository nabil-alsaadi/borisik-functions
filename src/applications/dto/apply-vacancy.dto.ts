import { PartialType } from '@nestjs/mapped-types';
import { VacancyApplication } from '../entities/application.entity';

export class ApplyVacancyDto extends PartialType(VacancyApplication) {}
