import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';
import { Type } from './entities/type.entity';

import typesJson from '../db/types.json';
import Fuse from 'fuse.js';
import { GetTypesDto } from './dto/get-types.dto';
import { FirebaseService } from '../firebase/firebase.service';

const types = plainToClass(Type, typesJson);
const options = {
  keys: ['name'],
  threshold: 0.3,
};
const fuse = new Fuse(types, options);

@Injectable()
export class TypesService {
  constructor(private readonly firebaseService: FirebaseService) {}
  private types: Type[] = types;

  async getTypes({ text, search, language }: GetTypesDto) {
    let data = {}
    console.log('lanugahe ===========',language)
    if(language === "ru") {
      data = await this.firebaseService.getDocumentById('settings','types_ru')
    }
    else{
      data = await this.firebaseService.getDocumentById('settings','types')
    }
     

    return [data];
  }

  async getTypeBySlug(slug: string, lang: string = "en"): Promise<Type> {
    if(lang === "ru") {
      return await this.firebaseService.getDocumentById('settings','types_ru')
    }
    else{
      return await this.firebaseService.getDocumentById('settings','types')
    }
    
    // const data: Type[] = await this.firebaseService.getCollection('settings', ref => ref.where('slug', '==', slug).limit(1));
    // if (data.length === 0) {
    //   throw new Error('Product not found');
    // }
    // const type_ = data[0] as Type
    // return  type_
  }

  create(createTypeDto: CreateTypeDto) {
    return this.types[0];
  }

  findAll() {
    return `This action returns all types`;
  }

  findOne(id: number) {
    return `This action returns a #${id} type`;
  }

  async update(id: string, updateTypeDto: UpdateTypeDto) {
    await this.firebaseService.setWithMerge('settings',id,updateTypeDto)
    return this.firebaseService.getDocumentById('settings',id);
  }

  remove(id: number) {
    return `This action removes a #${id} type`;
  }
}
