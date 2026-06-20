import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import type { DependencyGraph, TerraformResource, TerraformPlanView, TerraformStateView, DriftReport } from '@iac-platform/shared';
import { TerraformPlan, TerraformPlanApproval, TerraformStateSnapshot } from '../../entities';
import { OfflineValidationService } from '../validation/offline-validation.service';
import { OpenAIService } from '../../services/openai';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class TerraformService {
  constructor(
    private readonly validator: OfflineValidationService,
    private readonly openai: OpenAIService,
    @InjectRepository(TerraformPlan) private readonly planRepo: Repository<TerraformPlan>,
    @InjectRepository(TerraformPlanApproval) private readonly approvalRepo: Repository<TerraformPlanApproval>,
    @InjectRepository(TerraformStateSnapshot) private readonly stateRepo: Repository<TerraformStateSnapshot>,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly activity: ActivityService,
  ) {}
  validate(content: string) {
    const result = this.validator.validate(content, 'terraform');
    return { valid: result.valid, issues: result.issues, score: result.score };
  }

  format(content: string): string {
    const lines = content.split('\n');
    let indent = 0;
    const formatted: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        formatted.push('');
        continue;
      }
      if (trimmed.startsWith('}')) indent = Math.max(0, indent - 1);
      formatted.push('  '.repeat(indent) + trimmed);
      if (trimmed.endsWith('{')) indent++;
    }

    return formatted.join('\n');
  }

  parseResources(content: string): TerraformResource[] {
    const resources: TerraformResource[] = [];
    const lines = content.split('\n');
    const resourceRefs = new Map<string, string[]>();

    lines.forEach((line, idx) => {
      const match = line.trim().match(/^(resource|data)\s+"([^"]+)"\s+"([^"]+)"/);
      if (match) {
        const id = `${match[1]}.${match[2]}.${match[3]}`;
        resources.push({
          type: match[2],
          name: match[3],
          line: idx + 1,
          dependencies: [],
        });
        resourceRefs.set(id, []);
      }

      const refMatches = line.matchAll(/(\w+\.\w+\.\w+)/g);
      for (const ref of refMatches) {
        const current = resources[resources.length - 1];
        if (current && !ref[1].startsWith('var.')) {
          current.dependencies.push(ref[1]);
        }
      }
    });

    return resources;
  }

  buildDependencyGraph(content: string): DependencyGraph {
    const resources = this.parseResources(content);
    const nodes = resources.map((r) => ({
      id: `resource.${r.type}.${r.name}`,
      label: `${r.type}.${r.name}`,
      type: 'resource',
    }));

    const edges: DependencyGraph['edges'] = [];
    for (const res of resources) {
      for (const dep of res.dependencies) {
        if (nodes.some((n) => n.id === dep)) {
          edges.push({ from: `resource.${res.type}.${res.name}`, to: dep, type: 'depends_on' });
        }
      }
    }

    const providerMatches = content.matchAll(/provider\s+"([^"]+)"/g);
    for (const match of providerMatches) {
      nodes.push({ id: `provider.${match[1]}`, label: match[1], type: 'provider' });
    }

    return { nodes, edges };
  }

  analyzeModules(content: string) {
    const modules: Array<{ name: string; source: string; version?: string; line: number; issues: string[] }> = [];
    const lines = content.split('\n');
    let currentModule: typeof modules[0] | null = null;

    lines.forEach((line, idx) => {
      const moduleStart = line.trim().match(/^module\s+"([^"]+)"/);
      if (moduleStart) {
        currentModule = { name: moduleStart[1], source: '', line: idx + 1, issues: [] };
        modules.push(currentModule);
      }
      if (currentModule) {
        const sourceMatch = line.match(/source\s*=\s*"([^"]+)"/);
        if (sourceMatch) currentModule.source = sourceMatch[1];
        const versionMatch = line.match(/version\s*=\s*"([^"]+)"/);
        if (versionMatch) currentModule.version = versionMatch[1];
      }
    });

    for (const mod of modules) {
      if (!mod.source) mod.issues.push('Missing module source');
      if (mod.source.startsWith('git::') && !mod.version) mod.issues.push('Git module without version pin');
      if (mod.source.includes('terraform-aws-modules') && !mod.version) {
        mod.issues.push('Community module without version constraint');
      }
    }

    const usedModules = new Set(modules.map((m) => m.name));
    const refMatches = content.matchAll(/module\.([^.\s]+)/g);
    for (const ref of refMatches) {
      if (!usedModules.has(ref[1])) {
        modules.push({
          name: ref[1],
          source: 'unknown',
          line: 0,
          issues: [`Referenced module "${ref[1]}" is not defined`],
        });
      }
    }

    return { modules, unused: modules.filter((m) => m.issues.some((i) => i.includes('not defined'))) };
  }

  estimateCost(content: string) {
    const resources = this.parseResources(content);
    const costMap: Record<string, number> = {
      aws_instance: 50,
      aws_rds_cluster: 200,
      aws_s3_bucket: 5,
      aws_lambda_function: 10,
      aws_ecs_service: 100,
      aws_eks_cluster: 150,
      azurerm_virtual_machine: 45,
      google_compute_instance: 40,
    };

    let monthlyEstimate = 0;
    const breakdown: Array<{ resource: string; estimatedMonthly: number }> = [];

    for (const res of resources) {
      const cost = costMap[res.type] || 20;
      monthlyEstimate += cost;
      breakdown.push({ resource: `${res.type}.${res.name}`, estimatedMonthly: cost });
    }

    return {
      monthlyEstimateUsd: monthlyEstimate,
      breakdown,
      disclaimer: 'Rough estimates based on typical configurations. Use cloud pricing APIs for accuracy.',
    };
  }

  async planReview(planOutput: string, userId?: string) {
    const analysis = await this.openai.planReview(planOutput, userId);
    return { content: analysis };
  }

  parsePlanJson(planJson: string): Omit<TerraformPlanView, 'id' | 'aiAnalysis' | 'status'> {
    let plan: Record<string, unknown>;
    try {
      plan = JSON.parse(planJson) as Record<string, unknown>;
    } catch {
      return this.parsePlanText(planJson);
    }

    const changes = (plan.resource_changes || []) as Array<{
      address: string;
      type: string;
      change?: { actions?: string[] };
    }>;

    const creates: TerraformPlanView['creates'] = [];
    const updates: TerraformPlanView['updates'] = [];
    const deletes: TerraformPlanView['deletes'] = [];
    const dependencies = new Set<string>();

    for (const rc of changes) {
      const actions = rc.change?.actions || [];
      const type = rc.type || rc.address.split('.')[0];
      const risk = actions.includes('delete') ? 'high' : actions.includes('create') ? 'medium' : 'low';

      if (actions.includes('create') && !actions.includes('delete')) {
        creates.push({ address: rc.address, type, risk });
      } else if (actions.includes('delete') && !actions.includes('create')) {
        deletes.push({ address: rc.address, type, risk: 'high' });
      } else if (actions.includes('update') || (actions.includes('create') && actions.includes('delete'))) {
        updates.push({ address: rc.address, type, risk, changes: actions });
      }
      rc.address.split('.').forEach((p) => dependencies.add(p));
    }

    const deleteCount = deletes.length;
    const riskScore = Math.min(100, deleteCount * 20 + updates.length * 5 + creates.length * 2);

    return {
      creates,
      updates,
      deletes,
      riskScore,
      costImpact: `${creates.length} create, ${updates.length} update, ${deleteCount} destroy`,
      dependencies: [...dependencies].slice(0, 50),
    };
  }

  private parsePlanText(planText: string): Omit<TerraformPlanView, 'id' | 'aiAnalysis' | 'status'> {
    const creates: TerraformPlanView['creates'] = [];
    const updates: TerraformPlanView['updates'] = [];
    const deletes: TerraformPlanView['deletes'] = [];

    for (const line of planText.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('+')) {
        const match = trimmed.match(/resource\s+"([^"]+)"\s+"([^"]+)"/);
        if (match) creates.push({ address: `${match[1]}.${match[2]}`, type: match[1], risk: 'medium' });
      } else if (trimmed.startsWith('-')) {
        const match = trimmed.match(/resource\s+"([^"]+)"\s+"([^"]+)"/);
        if (match) deletes.push({ address: `${match[1]}.${match[2]}`, type: match[1], risk: 'high' });
      } else if (trimmed.startsWith('~')) {
        const match = trimmed.match(/resource\s+"([^"]+)"\s+"([^"]+)"/);
        if (match) updates.push({ address: `${match[1]}.${match[2]}`, type: match[1], risk: 'low' });
      }
    }

    return {
      creates,
      updates,
      deletes,
      riskScore: deletes.length * 25 + updates.length * 5,
      costImpact: `${creates.length} create, ${updates.length} update, ${deletes.length} destroy`,
      dependencies: [],
    };
  }

  async createPlan(userId: string, planInput: string) {
    const parsed = this.parsePlanJson(planInput);
    const aiAnalysis = await this.openai.planReview(planInput, userId);
    const plan = await this.planRepo.save({
      id: uuidv4(),
      userId,
      planJson: planInput,
      riskScore: parsed.riskScore,
      aiAnalysis,
      status: 'pending',
      createCount: parsed.creates.length,
      updateCount: parsed.updates.length,
      deleteCount: parsed.deletes.length,
    });

    await this.audit.log({ userId, action: 'terraform_plan', module: 'terraform', resourceType: 'plan', resourceId: plan.id, details: { riskScore: parsed.riskScore } });
    await this.notifications.create(userId, 'terraform_plan', 'Terraform Plan Generated', `Risk score: ${parsed.riskScore}/100`, { planId: plan.id });
    this.activity.publish(userId, 'generated Terraform plan', { resourceType: 'terraform', metadata: { planId: plan.id, riskScore: parsed.riskScore } });

    return { id: plan.id, ...parsed, aiAnalysis, status: plan.status };
  }

  async approvePlan(userId: string, planId: string, decision: 'approved' | 'rejected', reason?: string) {
    const plan = await this.planRepo.findOne({ where: { id: planId } });
    if (!plan) return null;

    await this.approvalRepo.save({
      id: uuidv4(),
      planId,
      approverId: userId,
      decision,
      reason,
    });

    plan.status = decision === 'approved' ? 'approved' : 'rejected';
    await this.planRepo.save(plan);

    await this.audit.log({
      userId,
      action: 'terraform_apply',
      module: 'terraform',
      resourceType: 'plan',
      resourceId: planId,
      details: { decision, reason, approver: userId },
    });

    return { planId, status: plan.status, decision, reason };
  }

  async getPlan(userId: string, planId: string) {
    const plan = await this.planRepo.findOne({ where: { id: planId, userId } });
    if (!plan) return null;
    const parsed = this.parsePlanJson(plan.planJson);
    const approvals = await this.approvalRepo.find({ where: { planId }, order: { createdAt: 'DESC' } });
    return { id: plan.id, ...parsed, aiAnalysis: plan.aiAnalysis, status: plan.status, approvals };
  }

  async listPlans(userId: string) {
    const plans = await this.planRepo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 20 });
    return plans.map((p) => ({ id: p.id, riskScore: p.riskScore, status: p.status, createCount: p.createCount, updateCount: p.updateCount, deleteCount: p.deleteCount, createdAt: p.createdAt.toISOString() }));
  }

  detectDrift(stateContent: string, codeContent: string): DriftReport {
    const stateResources = this.parseStateResources(stateContent);
    const codeResources = this.parseResources(codeContent);
    const drift: DriftReport['drift'] = [];

    const stateMap = new Map(stateResources.map((r) => [`${r.type}.${r.name}`, r]));
    const codeMap = new Map(codeResources.map((r) => [`${r.type}.${r.name}`, r]));

    for (const [id, stateRes] of stateMap) {
      if (!codeMap.has(id)) {
        drift.push({ resource: id, status: 'missing_in_code', details: `In state but not in code` });
      } else {
        const codeRes = codeMap.get(id)!;
        if (stateRes.provider && codeRes.dependencies.length > 0) {
          const stateAttrs = JSON.stringify(stateRes.attributes || {});
          if (stateAttrs.length > 2 && !codeContent.includes(id.split('.')[1])) {
            drift.push({ resource: id, status: 'modified', details: 'Resource attributes may differ from state' });
          }
        }
      }
    }
    for (const res of codeResources) {
      const id = `${res.type}.${res.name}`;
      if (!stateMap.has(id)) {
        drift.push({ resource: id, status: 'missing_in_state', details: 'Defined in code but not in state' });
      }
    }

    const summary = {
      added: drift.filter((d) => d.status === 'missing_in_state').length,
      removed: drift.filter((d) => d.status === 'missing_in_code').length,
      modified: drift.filter((d) => d.status === 'modified').length,
    };

    return { drift, hasDrift: drift.length > 0, summary };
  }

  parseStateView(stateJson: string): Omit<TerraformStateView, 'id' | 'name' | 'createdAt'> {
    try {
      const state = JSON.parse(stateJson) as {
        resources?: Array<{ type: string; name: string; provider?: string; module?: string; instances?: unknown[] }>;
        outputs?: Record<string, { value?: unknown }>;
      };
      const resources = (state.resources || []).map((r) => ({
        type: r.type,
        name: r.name,
        provider: r.provider,
        module: r.module,
      }));
      const outputs = Object.entries(state.outputs || {}).map(([name, o]) => ({ name, value: o.value }));
      return { resources, outputs, resourceCount: resources.length };
    } catch {
      return { resources: [], outputs: [], resourceCount: 0 };
    }
  }

  async saveStateSnapshot(userId: string, name: string, stateJson: string) {
    const parsed = this.parseStateView(stateJson);
    const snapshot = await this.stateRepo.save({
      id: uuidv4(),
      userId,
      name,
      stateJson,
      resourceCount: parsed.resourceCount,
    });
    await this.audit.log({ userId, action: 'terraform_state', module: 'terraform', resourceType: 'state', resourceId: snapshot.id, details: { name, resourceCount: parsed.resourceCount } });
    return { id: snapshot.id, name, ...parsed, createdAt: snapshot.createdAt.toISOString() };
  }

  async getStateSnapshot(userId: string, id: string): Promise<TerraformStateView | null> {
    const snapshot = await this.stateRepo.findOne({ where: { id, userId } });
    if (!snapshot) return null;
    const parsed = this.parseStateView(snapshot.stateJson);
    return { id: snapshot.id, name: snapshot.name, ...parsed, createdAt: snapshot.createdAt.toISOString() };
  }

  async listStateSnapshots(userId: string) {
    const snapshots = await this.stateRepo.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 20 });
    return snapshots.map((s) => ({ id: s.id, name: s.name, resourceCount: s.resourceCount, createdAt: s.createdAt.toISOString() }));
  }

  async compareStateWithCode(userId: string, stateId: string, codeContent: string): Promise<DriftReport> {
    const snapshot = await this.stateRepo.findOne({ where: { id: stateId, userId } });
    if (!snapshot) throw new NotFoundException('State snapshot not found');
    return this.detectDrift(snapshot.stateJson, codeContent);
  }

  private parseStateResources(stateJson: string): Array<{ type: string; name: string; provider?: string; attributes?: Record<string, unknown> }> {
    try {
      const state = JSON.parse(stateJson) as {
        resources?: Array<{ type: string; name: string; provider?: string; instances?: Array<{ attributes?: Record<string, unknown> }> }>;
      };
      return (state.resources || []).map((r) => ({
        type: r.type,
        name: r.name,
        provider: r.provider,
        attributes: r.instances?.[0]?.attributes,
      }));
    } catch {
      return [];
    }
  }

  private extractStateResources(stateJson: string): string[] {
    return this.parseStateResources(stateJson).map((r) => `${r.type}.${r.name}`);
  }
}
