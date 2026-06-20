import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TerraformService } from './terraform.service';
import { TerraformContentDto, PlanReviewDto, DriftDto, StateSnapshotDto } from './dto/terraform.dto';

@ApiTags('Terraform')
@Controller('terraform')
export class TerraformController {
  constructor(private readonly terraformService: TerraformService) {}

  @Post('validate')
  @ApiOperation({ summary: 'Validate Terraform configuration' })
  validate(@Body() dto: TerraformContentDto) {
    return this.terraformService.validate(dto.content);
  }

  @Post('format')
  @ApiOperation({ summary: 'Format Terraform (terraform fmt)' })
  format(@Body() dto: TerraformContentDto) {
    return { formatted: this.terraformService.format(dto.content) };
  }

  @Post('dependency-graph')
  @ApiOperation({ summary: 'Build resource dependency graph' })
  dependencyGraph(@Body() dto: TerraformContentDto) {
    return this.terraformService.buildDependencyGraph(dto.content);
  }

  @Post('modules')
  @ApiOperation({ summary: 'Analyze Terraform modules' })
  modules(@Body() dto: TerraformContentDto) {
    return this.terraformService.analyzeModules(dto.content);
  }

  @Post('cost-estimate')
  @ApiOperation({ summary: 'Estimate infrastructure costs' })
  costEstimate(@Body() dto: TerraformContentDto) {
    return this.terraformService.estimateCost(dto.content);
  }

  @Post('plan-review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'AI plan review' })
  async planReview(@Body() dto: PlanReviewDto, @Req() req: { user: { id: string } }) {
    const result = await this.terraformService.planReview(dto.planOutput, req.user.id);
    return { analysis: result.content };
  }

  @Post('drift')
  @ApiOperation({ summary: 'Detect drift between state and code' })
  drift(@Body() dto: DriftDto) {
    return this.terraformService.detectDrift(dto.stateContent, dto.codeContent);
  }

  @Post('plan')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Parse and analyze Terraform plan' })
  createPlan(@Body() dto: PlanReviewDto, @Req() req: { user: { id: string } }) {
    return this.terraformService.createPlan(req.user.id, dto.planOutput);
  }

  @Get('plans')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  listPlans(@Req() req: { user: { id: string } }) {
    return this.terraformService.listPlans(req.user.id);
  }

  @Get('plans/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getPlan(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.terraformService.getPlan(req.user.id, id);
  }

  @Post('plans/:id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  approvePlan(
    @Param('id') id: string,
    @Body() body: { decision: 'approved' | 'rejected'; reason?: string },
    @Req() req: { user: { id: string } },
  ) {
    return this.terraformService.approvePlan(req.user.id, id, body.decision, body.reason);
  }

  @Post('state')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  saveState(@Body() dto: StateSnapshotDto, @Req() req: { user: { id: string } }) {
    return this.terraformService.saveStateSnapshot(req.user.id, dto.name, dto.stateJson);
  }

  @Get('state')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  listStates(@Req() req: { user: { id: string } }) {
    return this.terraformService.listStateSnapshots(req.user.id);
  }

  @Get('state/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getState(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.terraformService.getStateSnapshot(req.user.id, id);
  }

  @Post('state/:id/drift')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  stateDrift(@Param('id') id: string, @Body() body: { codeContent: string }, @Req() req: { user: { id: string } }) {
    return this.terraformService.compareStateWithCode(req.user.id, id, body.codeContent);
  }
}
