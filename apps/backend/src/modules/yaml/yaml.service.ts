import { Injectable } from '@nestjs/common';
import * as yaml from 'js-yaml';
import { OfflineValidationService } from '../validation/offline-validation.service';

type SchemaType = 'kubernetes' | 'openapi' | 'docker-compose' | 'github-actions' | 'helm';

@Injectable()
export class YamlService {
  constructor(private readonly validator: OfflineValidationService) {}

  validateSchema(content: string, schemaType: SchemaType) {
    const baseValidation = this.validator.validate(content, 'yaml');
    const schemaIssues = this.runSchemaValidation(content, schemaType);
    return {
      ...baseValidation,
      issues: [...baseValidation.issues, ...schemaIssues],
      schemaType,
    };
  }

  private runSchemaValidation(content: string, schemaType: SchemaType) {
    switch (schemaType) {
      case 'kubernetes':
        return this.validator.validate(content, 'kubernetes').issues;
      case 'docker-compose':
        return this.validateDockerCompose(content);
      case 'github-actions':
        return this.validateGitHubActions(content);
      case 'helm':
        return this.validateHelm(content);
      case 'openapi':
        return this.validateOpenAPI(content);
      default:
        return [];
    }
  }

  private validateDockerCompose(content: string) {
    const issues: Array<{ severity: 'high' | 'medium' | 'low'; message: string; category: string }> = [];
    try {
      const doc = yaml.load(content) as Record<string, unknown>;
      if (!doc.version && !doc.services) {
        issues.push({ severity: 'high', message: 'Missing services definition', category: 'docker-compose' });
      }
      const services = doc.services as Record<string, unknown> | undefined;
      if (services) {
        for (const [name, svc] of Object.entries(services)) {
          if (!(svc as Record<string, unknown>).image && !(svc as Record<string, unknown>).build) {
            issues.push({ severity: 'medium', message: `Service "${name}": missing image or build`, category: 'docker-compose' });
          }
        }
      }
    } catch {
      // handled by base validator
    }
    return issues;
  }

  private validateGitHubActions(content: string) {
    const issues: Array<{ severity: 'high' | 'medium'; message: string; category: string }> = [];
    try {
      const doc = yaml.load(content) as Record<string, unknown>;
      if (!doc.on) issues.push({ severity: 'high', message: 'Missing "on" trigger', category: 'github-actions' });
      if (!doc.jobs) issues.push({ severity: 'high', message: 'Missing "jobs" definition', category: 'github-actions' });
    } catch {
      // handled
    }
    return issues;
  }

  private validateHelm(content: string) {
    const issues: Array<{ severity: 'high' | 'medium'; message: string; category: string }> = [];
    try {
      const doc = yaml.load(content) as Record<string, unknown>;
      if (!doc.apiVersion) issues.push({ severity: 'high', message: 'Missing apiVersion', category: 'helm' });
      if (!doc.name) issues.push({ severity: 'high', message: 'Missing chart name', category: 'helm' });
      if (!doc.version) issues.push({ severity: 'medium', message: 'Missing chart version', category: 'helm' });
    } catch {
      // handled
    }
    return issues;
  }

  private validateOpenAPI(content: string) {
    const issues: Array<{ severity: 'high' | 'medium'; message: string; category: string }> = [];
    try {
      const doc = yaml.load(content) as Record<string, unknown>;
      if (!doc.openapi && !doc.swagger) {
        issues.push({ severity: 'high', message: 'Missing openapi/swagger version', category: 'openapi' });
      }
      if (!doc.info) issues.push({ severity: 'high', message: 'Missing info block', category: 'openapi' });
      if (!doc.paths) issues.push({ severity: 'medium', message: 'Missing paths definition', category: 'openapi' });
    } catch {
      // handled
    }
    return issues;
  }

  getAvailableSchemas(): SchemaType[] {
    return ['kubernetes', 'openapi', 'docker-compose', 'github-actions', 'helm'];
  }

  exploreKubernetes(content: string) {
    const docs: Record<string, unknown>[] = [];
    try {
      yaml.loadAll(content, (doc) => { if (doc && typeof doc === 'object') docs.push(doc as Record<string, unknown>); });
    } catch {
      try {
        const single = yaml.load(content);
        if (single && typeof single === 'object') docs.push(single as Record<string, unknown>);
      } catch {
        return { resources: [], totalCount: 0 };
      }
    }

    const resources = docs.map((doc, idx) => this.buildK8sNode(doc, idx));
    return { resources, totalCount: resources.length };
  }

  private buildK8sNode(doc: Record<string, unknown>, idx: number) {
    const kind = String(doc.kind || 'Unknown');
    const metadata = (doc.metadata || {}) as Record<string, unknown>;
    const name = String(metadata.name || `resource-${idx}`);
    const namespace = metadata.namespace ? String(metadata.namespace) : undefined;
    const labels = metadata.labels as Record<string, string> | undefined;
    const id = namespace ? `${namespace}/${kind}/${name}` : `${kind}/${name}`;
    const children: Array<{ id: string; kind: string; name: string; namespace?: string; apiVersion?: string; children?: unknown[]; labels?: Record<string, string> }> = [];

    const spec = doc.spec as Record<string, unknown> | undefined;
    if (spec) {
      if (Array.isArray(spec.containers)) {
        for (const c of spec.containers as Array<Record<string, unknown>>) {
          children.push({ id: `${id}/container/${c.name || 'unnamed'}`, kind: 'Container', name: String(c.name || 'unnamed') });
        }
      }
      if (spec.template && typeof spec.template === 'object') {
        const tpl = spec.template as Record<string, unknown>;
        const tplSpec = tpl.spec as Record<string, unknown> | undefined;
        if (tplSpec && Array.isArray(tplSpec.containers)) {
          for (const c of tplSpec.containers as Array<Record<string, unknown>>) {
            children.push({ id: `${id}/container/${c.name || 'unnamed'}`, kind: 'Container', name: String(c.name || 'unnamed') });
          }
        }
      }
      if (Array.isArray(spec.ports)) {
        for (const p of spec.ports as Array<Record<string, unknown>>) {
          children.push({ id: `${id}/port/${p.port || p.containerPort}`, kind: 'Port', name: String(p.port || p.containerPort) });
        }
      }
    }

    return {
      id,
      kind,
      name,
      namespace,
      apiVersion: doc.apiVersion ? String(doc.apiVersion) : undefined,
      labels,
      children: children.length > 0 ? children : undefined,
    };
  }
}
