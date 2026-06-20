import { Controller, Get, Query, UseGuards, Req, Header, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditService } from './audit.service';

@ApiTags('Audit')
@Controller('audit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  search(
    @Req() req: { user: { id: string } },
    @Query('action') action?: string,
    @Query('module') module?: string,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.auditService.search({
      userId: req.user.id,
      action,
      module,
      search,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 50,
    });
  }

  @Get('export/csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="audit-log.csv"')
  async exportCsv(
    @Req() req: { user: { id: string } },
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Res() res?: Response,
  ) {
    const csv = await this.auditService.exportCsvAsync(
      req.user.id,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
    res?.send(csv);
  }

  @Get('export/pdf')
  @Header('Content-Type', 'text/html')
  async exportPdf(
    @Req() req: { user: { id: string } },
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Res() res?: Response,
  ) {
    const html = await this.auditService.exportHtml(
      req.user.id,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
    res?.send(html);
  }
}
