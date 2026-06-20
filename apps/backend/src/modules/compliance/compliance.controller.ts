import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ComplianceService } from './compliance.service';
import { ComplianceScanDto, PolicyCheckDto } from './dto/compliance.dto';

@ApiTags('Compliance')
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Post('scan')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  scan(@Body() dto: ComplianceScanDto, @Req() req: { user: { id: string } }) {
    return this.complianceService.scan(dto.content, dto.format, dto.frameworks, req.user.id);
  }

  @Post('policy')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  checkPolicy(@Body() dto: PolicyCheckDto) {
    return this.complianceService.checkPolicy(dto.content, dto.policyType, dto.policy);
  }
}
