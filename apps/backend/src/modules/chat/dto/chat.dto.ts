import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  message!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileContext?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileId?: string;
}
