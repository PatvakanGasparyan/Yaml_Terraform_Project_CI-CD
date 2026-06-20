import { IsString, IsOptional, IsEnum, IsArray, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ExplainLevel, FileFormat, ValidationIssue } from '@iac-platform/shared';

export class ContentDto {
  @ApiProperty()
  @IsString()
  content!: string;

  @ApiProperty()
  @IsString()
  format!: FileFormat;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;
}

export class ValidateAiDto extends ContentDto {}

export class FixDto extends ContentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  issues?: ValidationIssue[];
}

export class ExplainDto extends ContentDto {
  @ApiPropertyOptional({ enum: ['beginner', 'intermediate', 'expert', 'detailed'] })
  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'expert', 'detailed'])
  level?: ExplainLevel;
}

export class OptimizeDto extends ContentDto {}
export class SecurityAuditDto extends ContentDto {}

export class HoverExplainDto extends ContentDto {
  @ApiProperty()
  @IsNumber()
  line!: number;
}

export class TranslateDto {
  @ApiProperty()
  @IsString()
  text!: string;

  @ApiProperty()
  @IsString()
  targetLanguage!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  context?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;
}

export class GenerateDto {
  @ApiProperty()
  @IsString()
  prompt!: string;

  @ApiProperty()
  @IsString()
  format!: FileFormat;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;
}

export class RootCauseDto extends ContentDto {
  @ApiProperty()
  @IsString()
  error!: string;
}
