import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { FileFormat } from '@iac-platform/shared';

export class ValidateDto {
  @ApiProperty()
  @IsString()
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  format?: FileFormat;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  useAi?: boolean;
}

export class FixDto extends ValidateDto {}
