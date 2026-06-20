import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { FileFormat } from '@iac-platform/shared';

export class ConvertDto {
  @ApiProperty()
  @IsString()
  content!: string;

  @ApiProperty()
  @IsString()
  from!: FileFormat;

  @ApiProperty()
  @IsString()
  to!: FileFormat;
}
