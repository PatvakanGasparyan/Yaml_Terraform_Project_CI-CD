import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ValidationResult, SecurityAuditResult } from '@iac-platform/shared';

export class ExportReportDto {
  @ApiProperty()
  @IsString()
  fileName!: string;

  @ApiProperty()
  validation!: ValidationResult;

  @ApiPropertyOptional()
  @IsOptional()
  security?: SecurityAuditResult;
}
