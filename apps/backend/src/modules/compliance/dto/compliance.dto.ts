import { IsString, IsOptional, IsArray, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { FileFormat } from '@iac-platform/shared';

export class ComplianceScanDto {
  @ApiProperty()
  @IsString()
  content!: string;

  @ApiProperty()
  @IsString()
  format!: FileFormat;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  frameworks?: string[];
}

export class PolicyCheckDto {
  @ApiProperty()
  @IsString()
  content!: string;

  @ApiProperty({ enum: ['opa', 'sentinel'] })
  @IsIn(['opa', 'sentinel'])
  policyType!: 'opa' | 'sentinel';

  @ApiProperty()
  @IsString()
  policy!: string;
}
