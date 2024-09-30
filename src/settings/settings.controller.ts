import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateSettingDto } from './dto/create-setting.dto';
import { SettingsService } from './settings.service';

const SETTINGS_ID = "general_settings"
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  create(@Body() createSettingDto: CreateSettingDto) {
    return this.settingsService.update(SETTINGS_ID,createSettingDto);
  }

  @Get()
  findAll() {
    return this.settingsService.findAll();
  }
}
