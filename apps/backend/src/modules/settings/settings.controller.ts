import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/settings.dto';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  get(@Req() req: { user: { id: string } }) {
    return this.settingsService.get(req.user.id);
  }

  @Put()
  update(@Body() dto: UpdateSettingsDto, @Req() req: { user: { id: string } }) {
    return this.settingsService.update(req.user.id, dto);
  }
}
