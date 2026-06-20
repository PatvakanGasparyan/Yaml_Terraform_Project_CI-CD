import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  summary(
    @Req() req: { user: { id: string } },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getSummary(
      req.user.id,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }
}
