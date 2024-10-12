import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    Put,
  } from '@nestjs/common';
  import { PublicationsService } from './publications.service';
  import { CreatePublicationDto } from './dto/create-publication.dto';
  import { UpdatePublicationDto } from './dto/update-publication.dto';
import { GetPublicationDto } from './dto/get-publications.dto';
  
  @Controller('publications')
  export class PublicationsController {
    constructor(private readonly publicationsService: PublicationsService) {}
  
    @Get()
    async findAll(@Query() query: GetPublicationDto) {
      return this.publicationsService.findAll(query);
    }
  
    @Get(':slug')
    async findOne(@Param('slug') slug: string) {
      return this.publicationsService.findOneBySlug(slug);
    }
  
    @Post()
    async create(@Body() createPublicationDto: CreatePublicationDto) {
      return this.publicationsService.create(createPublicationDto);
    }
  
    @Put(':id')
    async update(
      @Param('id') id: string,
      @Body() updatePublicationDto: UpdatePublicationDto,
    ) {
        console.log('updatePublicationDto',updatePublicationDto)
      return this.publicationsService.update(id, updatePublicationDto);
    }
  
    @Delete(':id')
    async remove(@Param('id') id: string) {
      return this.publicationsService.remove(id);
    }
  }
  