import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HistoryService } from './history.service';

@ApiTags('History')
@Controller('history')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  getHistory(
    @Req() req: { user: { id: string } },
    @Query('filter') filter?: 'today' | 'week' | 'month' | 'custom',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.historyService.getHistory(
      req.user.id,
      filter,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }
}
