import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  editorFontSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  editorTheme?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoSave?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoFixOnUpload?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoTranslate?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aiProvider?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aiModel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  githubConnected?: boolean;
}
