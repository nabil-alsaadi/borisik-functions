import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
// import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { FileInterceptor } from '../common/middleware/file.interceptor';

@Controller('attachments')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  // @UseInterceptors(FilesInterceptor('attachment[]'))
  @UseInterceptors(
    new FileInterceptor('attachment[]', 2, {
      limits: {
        // limit to 100Mb
        fileSize: 1024 * 1024 * 100,
      },
    }),
  )
  async uploadFile(@UploadedFiles() attachment?: Array<Express.Multer.File>) {
    if (!attachment || attachment.length === 0) {
      console.error('No file received');
      throw new BadRequestException('No file received');
    }
    const uploadPromises = attachment.map(file =>
      this.uploadsService.uploadFile(file),
    );
    try {
      const result = await Promise.all(uploadPromises);
      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
    // return result;
  }
}
