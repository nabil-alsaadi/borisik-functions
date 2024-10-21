import { Controller, Get, Post, Body, Param, Delete, Patch, Put, Query } from '@nestjs/common';
import { ApplyVacancyDto } from './dto/apply-vacancy.dto';
import { ApplicationPaginator, GetApplicationDto } from './dto/get-applications.dto';
import { VacancyApplication } from './entities/application.entity';
import { ApplicationsService } from './applications.service';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  apply(@Body() applyVacancyDto:ApplyVacancyDto) {
    return this.applicationsService.apply(applyVacancyDto);
  }
  
  @Get()
  getapplications(@Query() query: GetApplicationDto): Promise<ApplicationPaginator> {
    console.log('getapplications--------------------')
    return this.applicationsService.getApplications(query);
  }

  @Get(':id')
  getapplication(@Param('id') id: string): Promise<VacancyApplication> {
    return this.applicationsService.getApplication(id);
  }
}
