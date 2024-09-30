import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { Setting } from './entities/setting.entity';
import settingsJson from '../db/settings.json';
import { FirebaseService } from '../firebase/firebase.service';

const settings = plainToClass(Setting, settingsJson);

@Injectable()
export class SettingsService {
  private settings: Setting = settings;
  constructor(
    private readonly firebaseService: FirebaseService
  ) {}

  create(createSettingDto: CreateSettingDto) {
    return this.settings;
  }

  async findAll() {
    return await this.firebaseService.getDocumentById('settings','general_settings');
    // return this.settings;
  }

  findOne(id: number) {
    return `This action returns a #${id} setting`;
  }

  async update(id: string, updateSettingDto: UpdateSettingDto) {
    // console.log('updateSettingDto =============',updateSettingDto)
    // return this.settings;/
    this.firebaseService.updateDocument('settings',id,updateSettingDto);

    return await this.firebaseService.getDocumentById('settings',id);
  }

  remove(id: number) {
    return `This action removes a #${id} setting`;
  }
}
