import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import type { InfrastructureDiagramResult } from '@iac-platform/shared';
import { InfrastructureDiagram } from '../../entities';
import { OpenAIService } from '../../services/openai';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DiagramsService {
  constructor(
    @InjectRepository(InfrastructureDiagram) private readonly diagramRepo: Repository<InfrastructureDiagram>,
    private readonly openai: OpenAIService,
    private readonly audit: AuditService,
  ) {}

  async generate(userId: string, content: string, format: string): Promise<InfrastructureDiagramResult> {
    const result = await this.openai.generateInfrastructureDiagram(content, format, userId);
    const record = await this.diagramRepo.save({
      id: uuidv4(),
      userId,
      format,
      diagramMermaid: result.mermaid,
      resourceCount: result.resourceCount,
    });
    await this.audit.log({ userId, action: 'generate_diagram', module: 'diagrams', resourceType: 'diagram', resourceId: record.id, details: { format, resourceCount: result.resourceCount } });
    return { id: record.id, mermaid: result.mermaid, resourceCount: result.resourceCount, format };
  }

  async list(userId: string) {
    const diagrams = await this.diagramRepo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 20 });
    return diagrams.map((d) => ({ id: d.id, format: d.format, resourceCount: d.resourceCount, createdAt: d.createdAt.toISOString() }));
  }

  async get(userId: string, id: string): Promise<InfrastructureDiagramResult> {
    const diagram = await this.diagramRepo.findOne({ where: { id, userId } });
    if (!diagram) throw new NotFoundException('Diagram not found');
    return { id: diagram.id, mermaid: diagram.diagramMermaid, resourceCount: diagram.resourceCount, format: diagram.format };
  }
}
