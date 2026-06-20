import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GithubService } from './github.service';
import {
  GithubRepoDto,
  GithubCommitDto,
  GithubBranchDto,
  GithubPrDto,
  GithubCompareDto,
  GithubRollbackDto,
  GithubGenerateCommitDto,
  GithubWorkflowDto,
  GithubPrReviewDto,
  GithubResolveConflictDto,
  GithubCreateIssueDto,
  GithubIssueFromValidationDto,
} from './dto/github.dto';

@ApiTags('GitHub')
@Controller('github')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Get('repositories')
  getRepos(@Req() req: { user: { id: string } }) {
    return this.githubService.getRepositories(req.user.id);
  }

  @Get('history')
  getHistory(@Req() req: { user: { id: string } }) {
    return this.githubService.getActionHistory(req.user.id);
  }

  @Get('commit-messages')
  getCommitMessages(@Req() req: { user: { id: string } }) {
    return this.githubService.getCommitMessages(req.user.id);
  }

  @Post('branches')
  getBranches(@Body() dto: GithubRepoDto, @Req() req: { user: { id: string } }) {
    return this.githubService.getBranches(req.user.id, dto.repo);
  }

  @Post('compare')
  compareBranches(@Body() dto: GithubCompareDto, @Req() req: { user: { id: string } }) {
    return this.githubService.compareBranches(req.user.id, dto.repo, dto.base, dto.head);
  }

  @Post('workflows')
  getWorkflows(@Body() dto: GithubWorkflowDto, @Req() req: { user: { id: string } }) {
    return this.githubService.getWorkflowRuns(req.user.id, dto.repo);
  }

  @Post('workflows/:runId/logs')
  getWorkflowLogs(@Param('runId') runId: string, @Body() dto: GithubWorkflowDto, @Req() req: { user: { id: string } }) {
    return this.githubService.getWorkflowLogs(req.user.id, dto.repo, parseInt(runId));
  }

  @Post('workflows/:runId/rerun')
  rerunWorkflow(@Param('runId') runId: string, @Body() dto: GithubWorkflowDto, @Req() req: { user: { id: string } }) {
    return this.githubService.rerunWorkflow(req.user.id, dto.repo, parseInt(runId));
  }

  @Post('generate-commit-message')
  generateCommitMessage(@Body() dto: GithubGenerateCommitDto, @Req() req: { user: { id: string } }) {
    return this.githubService.generateCommitMessage(req.user.id, dto.originalContent, dto.newContent, dto.fileName, dto.format, dto.repo);
  }

  @Post('commits')
  getCommits(@Body() dto: GithubRepoDto, @Req() req: { user: { id: string } }) {
    return this.githubService.getCommitHistory(req.user.id, dto.repo, dto.path);
  }

  @Post('branch')
  createBranch(@Body() dto: GithubBranchDto, @Req() req: { user: { id: string } }) {
    return this.githubService.createBranch(req.user.id, dto.repo, dto.branchName, dto.fromBranch);
  }

  @Post('commit')
  commit(@Body() dto: GithubCommitDto, @Req() req: { user: { id: string } }) {
    return this.githubService.commitFile(req.user.id, dto.repo, dto.path, dto.content, dto.message, dto.branch, dto.commitMessageId);
  }

  @Post('rollback')
  rollback(@Body() dto: GithubRollbackDto, @Req() req: { user: { id: string } }) {
    return this.githubService.rollbackCommit(req.user.id, dto.repo, dto.commitSha, dto.path, dto.branch);
  }

  @Post('pull-request')
  createPr(@Body() dto: GithubPrDto, @Req() req: { user: { id: string } }) {
    return this.githubService.createPullRequest(req.user.id, dto.repo, dto.title, dto.body, dto.head, dto.base);
  }

  @Post('pull-requests')
  listPrs(@Body() dto: GithubRepoDto, @Req() req: { user: { id: string } }) {
    return this.githubService.listPullRequests(req.user.id, dto.repo);
  }

  @Post('pull-requests/review')
  reviewPr(@Body() dto: GithubPrReviewDto, @Req() req: { user: { id: string } }) {
    return this.githubService.reviewPullRequest(req.user.id, dto.repo, dto.prNumber);
  }

  @Get('pull-requests/reviews')
  listPrReviews(@Req() req: { user: { id: string } }) {
    return this.githubService.listPrReviews(req.user.id);
  }

  @Post('resolve-conflicts')
  resolveConflicts(@Body() dto: GithubResolveConflictDto, @Req() req: { user: { id: string } }) {
    return this.githubService.resolveMergeConflicts(req.user.id, dto.fileName, dto.conflictContent);
  }

  @Post('issues')
  createIssue(@Body() dto: GithubCreateIssueDto, @Req() req: { user: { id: string } }) {
    return this.githubService.createIssue(req.user.id, dto.repo, dto.title, dto.body, dto.labels);
  }

  @Post('issues/from-validation')
  createIssueFromValidation(@Body() dto: GithubIssueFromValidationDto, @Req() req: { user: { id: string } }) {
    return this.githubService.createIssueFromValidation(req.user.id, dto.repo, dto.issue, dto.content, dto.format);
  }
}
