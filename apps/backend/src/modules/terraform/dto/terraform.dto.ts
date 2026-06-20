import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TerraformContentDto {
  @ApiProperty()
  @IsString()
  content!: string;
}

export class PlanReviewDto {
  @ApiProperty()
  @IsString()
  planOutput!: string;
}

export class DriftDto {
  @ApiProperty()
  @IsString()
  stateContent!: string;

  @ApiProperty()
  @IsString()
  codeContent!: string;
}

export class StateSnapshotDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  stateJson!: string;
}

export class StateDriftDto extends DriftDto {
  @ApiProperty()
  @IsString()
  stateId!: string;
}
