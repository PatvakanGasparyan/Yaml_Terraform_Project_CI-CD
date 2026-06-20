import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TeamsService } from './teams.service';
import type { TeamRole } from '@iac-platform/shared';

@ApiTags('Teams')
@Controller('teams')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeamsController {
  constructor(private readonly service: TeamsService) {}

  @Get('project/:projectId')
  listMembers(@Param('projectId') projectId: string) {
    return this.service.listMembers(projectId);
  }

  @Post('project/:projectId/members')
  addMember(
    @Param('projectId') projectId: string,
    @Body() body: { userId: string; role: TeamRole },
    @Req() req: { user: { id: string } },
  ) {
    return this.service.addMember(projectId, body.userId, body.role, req.user.id);
  }

  @Delete('project/:projectId/members/:memberId')
  removeMember(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.service.removeMember(projectId, memberId, req.user.id);
  }

  @Get('project/:projectId/my-role')
  myRole(@Param('projectId') projectId: string, @Req() req: { user: { id: string } }) {
    return this.service.getUserRole(projectId, req.user.id);
  }
}
