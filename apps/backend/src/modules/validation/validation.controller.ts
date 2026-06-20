import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ValidationService } from './validation.service';
import { ValidateDto, FixDto } from './dto/validation.dto';

@ApiTags('Validation')
@Controller('validation')
export class ValidationController {
  constructor(private readonly validationService: ValidationService) {}

  @Post()
  @ApiOperation({ summary: 'Validate configuration (offline + optional AI)' })
  async validate(@Body() dto: ValidateDto, @Req() req: { user?: { id: string } }) {
    const result = await this.validationService.validate(
      dto.content,
      dto.fileName,
      dto.format,
      dto.useAi ?? false,
      req.user?.id,
    );
    return result;
  }

  @Post('fix')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fix Everything - auto-fix all issues' })
  async fix(@Body() dto: FixDto, @Req() req: { user: { id: string } }) {
    return this.validationService.fixEverything(
      dto.content,
      dto.fileName,
      dto.format,
      req.user.id,
    );
  }
}
