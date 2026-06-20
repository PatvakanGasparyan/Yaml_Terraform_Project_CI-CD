import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/projects.dto';

@ApiTags('Projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  list(@Req() req: { user: { id: string } }) {
    return this.projectsService.findByUser(req.user.id);
  }

  @Get(':id')
  get(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.projectsService.findOne(id, req.user.id);
  }

  @Post()
  create(@Body() dto: CreateProjectDto, @Req() req: { user: { id: string } }) {
    return this.projectsService.create(req.user.id, dto.name, dto.description);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto, @Req() req: { user: { id: string } }) {
    return this.projectsService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.projectsService.delete(id, req.user.id);
  }
}
