import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkflowService } from './workflow.service';

@ApiTags('Workflow')
@Controller('workflow')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkflowController {
  constructor(private readonly service: WorkflowService) {}

  @Post('full')
  runFull(
    @Body() body: {
      content: string;
      fileName: string;
      format: string;
      repo: string;
      path: string;
      branch: string;
      commitMessage?: string;
      originalContent?: string;
    },
    @Req() req: { user: { id: string } },
  ) {
    return this.service.runFullWorkflow(req.user.id, body);
  }
}
