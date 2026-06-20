import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFileDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;
}

export class UpdateFileDto {
  @ApiProperty()
  @IsString()
  content!: string;
}
