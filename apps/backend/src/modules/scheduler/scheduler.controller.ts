import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SchedulerService } from './scheduler.service';

@ApiTags('Scheduler')
@Controller('scheduler')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SchedulerController {
  constructor(private readonly service: SchedulerService) {}

  @Get('jobs')
  list(@Req() req: { user: { id: string } }) {
    return this.service.listJobs(req.user.id);
  }

  @Post('jobs')
  create(@Body() body: { name: string; cronExpression: string; fileName?: string; content?: string; format?: string }, @Req() req: { user: { id: string } }) {
    return this.service.createJob(req.user.id, body);
  }

  @Put('jobs/:id')
  update(@Param('id') id: string, @Body() body: Partial<{ name: string; cronExpression: string; content: string; format: string; enabled: boolean }>, @Req() req: { user: { id: string } }) {
    return this.service.updateJob(req.user.id, id, body);
  }

  @Delete('jobs/:id')
  delete(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.deleteJob(req.user.id, id);
  }

  @Post('jobs/:id/run')
  runNow(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.runJobNow(req.user.id, id);
  }
}
