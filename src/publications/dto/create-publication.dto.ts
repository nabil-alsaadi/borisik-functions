import { IsString, IsNotEmpty, IsDateString } from 'class-validator';
import { Attachment } from '../../common/entities/attachment.entity';
import { PaginationArgs } from '../../common/dto/pagination-args.dto';

export class CreatePublicationDto {
//   @IsString()
//   @IsNotEmpty()
  title: string;
  slug: string;
//   @IsString()
  description: string;

  image?: Attachment;
}
