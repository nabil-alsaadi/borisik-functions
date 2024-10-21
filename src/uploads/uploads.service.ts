import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { v4 as uuidv4 } from 'uuid';
import { FileCategory } from './entites/file-category';

@Injectable()
export class UploadsService {
  constructor(private readonly firebaseService: FirebaseService) {}

  async uploadFile(attachment: Express.Multer.File,fileCategory: FileCategory = FileCategory.attachments) {
    console.log('async uploadFile(attachment: Express.Multer.File) {',attachment)
    if (attachment.size > 10 * 1024 * 1024) { // 10MB size limit
      throw new Error('File exceeds size limit');
    }
    const uniqueId = uuidv4();
    const fileUrl = await this.firebaseService.uploadFile(attachment,fileCategory);
   
    return {
      id: uniqueId, // Use actual file ID if you have one
      original: fileUrl,
      thumbnail: fileUrl, // Add logic for generating thumbnail if needed
      name: attachment.originalname,
      type: attachment.mimetype
    };
  }
  findAll() {
    return `This action returns all uploads`;
  }

  findOne(id: number) {
    return `This action returns a #${id} upload`;
  }

  remove(id: number) {
    return `This action removes a #${id} upload`;
  }
}
