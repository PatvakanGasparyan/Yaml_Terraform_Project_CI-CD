import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import {
  ExplainDto,
  FixDto,
  ValidateAiDto,
  HoverExplainDto,
  OptimizeDto,
  SecurityAuditDto,
  TranslateDto,
  GenerateDto,
  RootCauseDto,
  ContentDto,
} from './dto/ai.dto';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('status')
  @ApiOperation({ summary: 'OpenAI configuration status' })
  status() {
    return {
      configured: this.aiService.isConfigured(),
      provider: 'openai',
      models: this.aiService.getModels(),
    };
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async validate(@Body() dto: ValidateAiDto, @Req() req: { user: { id: string } }) {
    const issues = await this.aiService.validateWithAI(dto.content, dto.format, req.user.id, dto.model);
    return { issues };
  }

  @Post('fix')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async fix(@Body() dto: FixDto, @Req() req: { user: { id: string } }) {
    const fixed = await this.aiService.fixContent(dto.content, dto.format, dto.issues || [], req.user.id, dto.model);
    return { fixed };
  }

  @Post('explain')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async explain(@Body() dto: ExplainDto, @Req() req: { user: { id: string } }) {
    const explanation = await this.aiService.explain(dto.content, dto.format, dto.level || 'detailed', req.user.id, dto.model);
    return { explanation };
  }

  @Post('optimize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async optimize(@Body() dto: OptimizeDto, @Req() req: { user: { id: string } }) {
    const suggestions = await this.aiService.optimize(dto.content, dto.format, req.user.id, dto.model);
    return { suggestions };
  }

  @Post('security-audit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async securityAudit(@Body() dto: SecurityAuditDto, @Req() req: { user: { id: string } }) {
    return this.aiService.securityAudit(dto.content, dto.format, req.user.id, dto.model);
  }

  @Post('hover-explain')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async hoverExplain(@Body() dto: HoverExplainDto, @Req() req: { user: { id: string } }) {
    const lines = dto.content.split('\n');
    const lineContent = lines[dto.line - 1] || '';
    return this.aiService.hoverExplain(dto.content, dto.format, dto.line, lineContent, req.user.id, dto.model);
  }

  @Post('translate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async translate(@Body() dto: TranslateDto, @Req() req: { user: { id: string } }) {
    const translated = await this.aiService.translate(dto.text, dto.targetLanguage, dto.context, req.user.id, dto.model);
    return { translated };
  }

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async generate(@Body() dto: GenerateDto, @Req() req: { user: { id: string } }) {
    const content = await this.aiService.generateResource(dto.prompt, dto.format, req.user.id, dto.model);
    return { content };
  }

  @Post('root-cause')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async rootCause(@Body() dto: RootCauseDto, @Req() req: { user: { id: string } }) {
    return this.aiService.rootCauseAnalysis(dto.content, dto.error, dto.format, req.user.id, dto.model);
  }

  @Post('cost-analysis')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async costAnalysis(@Body() dto: ContentDto, @Req() req: { user: { id: string } }) {
    const analysis = await this.aiService.costAnalysis(dto.content, dto.format, req.user.id, dto.model);
    return { analysis };
  }

  @Post('generate-docs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async generateDocs(@Body() dto: ContentDto, @Req() req: { user: { id: string } }) {
    const documentation = await this.aiService.generateDocumentation(dto.content, dto.format, req.user.id, dto.model);
    return { documentation };
  }

  @Post('explain-error')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async explainError(
    @Body() dto: { content: string; format: string; issue: { message: string; line?: number; severity?: string; rule?: string }; model?: string },
    @Req() req: { user: { id: string } },
  ) {
    return this.aiService.explainError(dto.issue, dto.content, dto.format as never, req.user.id, dto.model);
  }
}
