import { Controller, Post, Body, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportService } from './export.service';
import { ExportReportDto } from './dto/export.dto';

@ApiTags('Export')
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('report')
  exportReport(@Body() dto: ExportReportDto, @Res() res: Response) {
    const html = this.exportService.exportValidationReport(dto.fileName, dto.validation, dto.security);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${dto.fileName}-report.html"`);
    res.send(html);
  }

  @Post('json')
  exportJson(@Body() body: Record<string, unknown>, @Res() res: Response) {
    const json = this.exportService.exportJson(body);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="export.json"');
    res.send(json);
  }

  @Post('csv')
  exportCsv(@Body() body: { data: Array<Record<string, unknown>> }, @Res() res: Response) {
    const csv = this.exportService.exportCsv(body.data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="export.csv"');
    res.send(csv);
  }
}
