import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TemplatesService } from './templates.service';

@ApiTags('Templates')
@Controller('templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TemplatesController {
  constructor(private readonly service: TemplatesService) {}

  @Get()
  list(@Req() req: { user: { id: string } }, @Query('category') category?: string) {
    return this.service.list(req.user.id, category);
  }

  @Post()
  create(
    @Body() body: { name: string; category: 'fix' | 'validation' | 'conversion' | 'terraform' | 'security'; settings: Record<string, unknown> },
    @Req() req: { user: { id: string } },
  ) {
    return this.service.create(req.user.id, body.name, body.category, body.settings);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: { name?: string; settings?: Record<string, unknown> }, @Req() req: { user: { id: string } }) {
    return this.service.update(req.user.id, id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.delete(req.user.id, id);
  }

  @Get('export/all')
  exportAll(@Req() req: { user: { id: string } }) {
    return this.service.export(req.user.id);
  }

  @Post('import')
  importTemplates(
    @Body() body: { templates: Array<{ name: string; category: 'fix' | 'validation' | 'conversion' | 'terraform' | 'security'; settings: Record<string, unknown> }> },
    @Req() req: { user: { id: string } },
  ) {
    return this.service.import(req.user.id, body.templates);
  }
}
