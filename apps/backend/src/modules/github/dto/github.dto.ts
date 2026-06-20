import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GithubRepoDto {
  @ApiProperty()
  @IsString()
  repo!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  path?: string;
}

export class GithubBranchDto extends GithubRepoDto {
  @ApiProperty()
  @IsString()
  branchName!: string;

  @ApiProperty()
  @IsString()
  fromBranch!: string;
}

export class GithubCommitDto {
  @ApiProperty()
  @IsString()
  repo!: string;

  @ApiProperty()
  @IsString()
  path!: string;

  @ApiProperty()
  @IsString()
  content!: string;

  @ApiProperty()
  @IsString()
  message!: string;

  @ApiProperty()
  @IsString()
  branch!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commitMessageId?: string;
}

export class GithubPrDto extends GithubRepoDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  body!: string;

  @ApiProperty()
  @IsString()
  head!: string;

  @ApiProperty()
  @IsString()
  base!: string;
}

export class GithubCompareDto extends GithubRepoDto {
  @ApiProperty()
  @IsString()
  base!: string;

  @ApiProperty()
  @IsString()
  head!: string;
}

export class GithubRollbackDto {
  @ApiProperty()
  @IsString()
  repo!: string;

  @ApiProperty()
  @IsString()
  commitSha!: string;

  @ApiProperty()
  @IsString()
  path!: string;

  @ApiProperty()
  @IsString()
  branch!: string;
}

export class GithubGenerateCommitDto {
  @ApiProperty()
  @IsString()
  originalContent!: string;

  @ApiProperty()
  @IsString()
  newContent!: string;

  @ApiProperty()
  @IsString()
  fileName!: string;

  @ApiProperty()
  @IsString()
  format!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  repo?: string;
}

export class GithubWorkflowDto extends GithubRepoDto {}

export class GithubPrReviewDto extends GithubRepoDto {
  @ApiProperty()
  @IsNumber()
  prNumber!: number;
}

export class GithubResolveConflictDto {
  @ApiProperty()
  @IsString()
  fileName!: string;

  @ApiProperty()
  @IsString()
  conflictContent!: string;
}

export class GithubCreateIssueDto extends GithubRepoDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  body!: string;

  @ApiPropertyOptional()
  @IsOptional()
  labels?: string[];
}

export class GithubIssueFromValidationDto extends GithubRepoDto {
  @ApiProperty()
  @IsString()
  content!: string;

  @ApiProperty()
  @IsString()
  format!: string;

  @ApiProperty()
  issue!: { message: string; line?: number; severity?: string; rule?: string };
}
