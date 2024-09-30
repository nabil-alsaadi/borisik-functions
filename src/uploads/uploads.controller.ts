import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';

@Controller('attachments')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('attachment[]'))
  async uploadFile(@UploadedFiles() attachment: Array<Express.Multer.File>) {
    // console.log(attachment);
    // return [
    //   {
    //     id: '883',
    //     original:
    //       'https://pickbazarlaravel.s3.ap-southeast-1.amazonaws.com/881/aatik-tasneem-7omHUGhhmZ0-unsplash%402x.png',
    //     thumbnail:
    //       'https://pickbazarlaravel.s3.ap-southeast-1.amazonaws.com/881/conversions/aatik-tasneem-7omHUGhhmZ0-unsplash%402x-thumbnail.jpg',
    //   },
    // ];
    console.log('attachment =========================',attachment)
    const uploadPromises = attachment.map(file =>
      this.uploadsService.uploadFile(file),
    );
    const result = await Promise.all(uploadPromises);
    return result;
  }
}
