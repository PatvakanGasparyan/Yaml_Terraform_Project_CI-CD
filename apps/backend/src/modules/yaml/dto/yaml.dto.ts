import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class YamlSchemaDto {
  @ApiProperty()
  @IsString()
  content!: string;

  @ApiProperty({ enum: ['kubernetes', 'openapi', 'docker-compose', 'github-actions', 'helm'] })
  @IsIn(['kubernetes', 'openapi', 'docker-compose', 'github-actions', 'helm'])
  schemaType!: 'kubernetes' | 'openapi' | 'docker-compose' | 'github-actions' | 'helm';
}
