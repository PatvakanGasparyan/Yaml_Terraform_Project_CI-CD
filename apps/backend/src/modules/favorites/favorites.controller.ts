import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FavoritesService } from './favorites.service';

@ApiTags('Favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
  constructor(private readonly service: FavoritesService) {}

  @Get()
  list(@Req() req: { user: { id: string } }) {
    return this.service.list(req.user.id);
  }

  @Post()
  add(
    @Body() body: { repository: string; defaultBranch?: string; pinned?: boolean },
    @Req() req: { user: { id: string } },
  ) {
    return this.service.add(req.user.id, body.repository, body.defaultBranch, body.pinned);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.remove(req.user.id, id);
  }

  @Post(':id/pin')
  togglePin(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.togglePin(req.user.id, id);
  }
}
