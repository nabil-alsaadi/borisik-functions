import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString, IsArray } from 'class-validator';
import { Vacancy } from '../entities/vacancy.entity';

export class CreateVacancyDto extends PartialType(Vacancy){}
