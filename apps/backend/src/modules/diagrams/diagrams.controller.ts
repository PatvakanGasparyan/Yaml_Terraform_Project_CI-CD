import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DiagramsService } from './diagrams.service';

@ApiTags('Diagrams')
@Controller('diagrams')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DiagramsController {
  constructor(private readonly service: DiagramsService) {}

  @Post('generate')
  generate(@Body() body: { content: string; format: string }, @Req() req: { user: { id: string } }) {
    return this.service.generate(req.user.id, body.content, body.format);
  }

  @Get()
  list(@Req() req: { user: { id: string } }) {
    return this.service.list(req.user.id);
  }

  @Get(':id')
  get(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.get(req.user.id, id);
  }
}
