import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadsService {
  constructor(private readonly firebaseService: FirebaseService) {}

  async uploadFile(attachment: Express.Multer.File) {
    const uniqueId = uuidv4();
    const fileUrl = await this.firebaseService.uploadFile(attachment);
    return {
      id: uniqueId, // Use actual file ID if you have one
      original: fileUrl,
      thumbnail: fileUrl, // Add logic for generating thumbnail if needed
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
