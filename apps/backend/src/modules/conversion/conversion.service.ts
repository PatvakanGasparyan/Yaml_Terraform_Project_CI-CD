import { Injectable } from '@nestjs/common';
import * as yaml from 'js-yaml';
import { parseStringPromise, Builder } from 'xml2js';
import * as TOML from '@iarna/toml';
import { parse as parseCsv } from 'csv-parse/sync';
import { stringify as stringifyCsv } from 'csv-stringify/sync';
import type { ConversionResult, FileFormat } from '@iac-platform/shared';
import { OfflineValidationService } from '../validation/offline-validation.service';

type ConversionPair = `${FileFormat}->${FileFormat}`;

@Injectable()
export class ConversionService {
  constructor(private readonly validator: OfflineValidationService) {}

  async convert(content: string, from: FileFormat, to: FileFormat): Promise<ConversionResult> {
    if (from === to) {
      return { sourceFormat: from, targetFormat: to, content, valid: true, issues: [] };
    }
    try {
      const converted = await this.doConvert(content, from, to);
      const validation = this.validator.validate(converted, to);
      return {
        sourceFormat: from,
        targetFormat: to,
        content: converted,
        valid: validation.valid,
        issues: validation.issues,
      };
    } catch (error) {
      return {
        sourceFormat: from,
        targetFormat: to,
        content: '',
        valid: false,
        issues: [{ severity: 'critical', message: (error as Error).message, category: 'conversion' }],
      };
    }
  }

  private async doConvert(content: string, from: FileFormat, to: FileFormat): Promise<string> {
    const key = `${from}->${to}` as ConversionPair;
    const handlers: Partial<Record<ConversionPair, () => string | Promise<string>>> = {
      'yaml->json': () => JSON.stringify(yaml.load(content), null, 2),
      'json->yaml': () => yaml.dump(JSON.parse(content), { indent: 2, lineWidth: 120, noRefs: true }),
      'yaml->xml': () => {
        const data = yaml.load(content);
        return new Builder({ rootName: 'root', headless: false }).buildObject(data as Record<string, unknown>);
      },
      'xml->yaml': async () => yaml.dump(await parseStringPromise(content), { indent: 2 }),
      'xml->json': async () => JSON.stringify(await parseStringPromise(content), null, 2),
      'json->xml': () => new Builder({ rootName: 'root', headless: false }).buildObject(JSON.parse(content)),
      'toml->yaml': () => yaml.dump(TOML.parse(content), { indent: 2 }),
      'toml->json': () => JSON.stringify(TOML.parse(content), null, 2),
      'yaml->toml': () => TOML.stringify(yaml.load(content) as TOML.JsonMap),
      'json->toml': () => TOML.stringify(JSON.parse(content)),
      'yaml->ini': () => this.objectToIni(yaml.load(content) as Record<string, unknown>),
      'ini->yaml': () => yaml.dump(this.iniToObject(content), { indent: 2 }),
      'ini->json': () => JSON.stringify(this.iniToObject(content), null, 2),
      'json->ini': () => this.objectToIni(JSON.parse(content)),
      'csv->json': () => {
        const records = parseCsv(content, { columns: true, skip_empty_lines: true });
        return JSON.stringify(records, null, 2);
      },
      'json->csv': () => {
        const data = JSON.parse(content) as Record<string, unknown>[];
        if (!Array.isArray(data) || data.length === 0) throw new Error('JSON must be a non-empty array for CSV conversion');
        return stringifyCsv(data, { header: true });
      },
      'terraform->json': () => this.terraformToJson(content),
      'json->terraform': () => this.jsonToTerraform(content),
      'yaml->terraform': () => this.jsonToTerraform(JSON.stringify(yaml.load(content))),
      'terraform->yaml': () => yaml.dump(JSON.parse(this.terraformToJson(content)), { indent: 2 }),
    };

    const handler = handlers[key];
    if (!handler) throw new Error(`Conversion from ${from} to ${to} is not supported`);
    return handler();
  }

  private iniToObject(content: string): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    let section = '';
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) continue;
      const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
      if (sectionMatch) {
        section = sectionMatch[1];
        result[section] = {};
        continue;
      }
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (section) {
        (result[section] as Record<string, unknown>)[key] = value;
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private objectToIni(obj: Record<string, unknown>, prefix = ''): string {
    const lines: string[] = [];
    const scalars: Array<[string, unknown]> = [];
    const sections: Array<[string, Record<string, unknown>]> = [];

    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        sections.push([key, value as Record<string, unknown>]);
      } else {
        scalars.push([key, value]);
      }
    }

    for (const [key, value] of scalars) {
      lines.push(`${key}=${value}`);
    }
    for (const [section, values] of sections) {
      lines.push(`[${section}]`);
      for (const [key, value] of Object.entries(values)) {
        lines.push(`${key}=${value}`);
      }
      lines.push('');
    }
    return lines.join('\n');
  }

  private terraformToJson(content: string): string {
    const result: Record<string, unknown[]> = {
      terraform: [], resources: [], variables: [], outputs: [], providers: [], modules: [], data: [],
    };
    const lines = content.split('\n');
    let current: Record<string, unknown> | null = null;
    let blockType = '';
    let braceDepth = 0;
    let inBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const blockMatch = trimmed.match(/^(resource|data|variable|output|provider|module|terraform)\s*(?:"([^"]+)"\s*(?:"([^"]+)")?)?/);
      if (blockMatch && trimmed.includes('{')) {
        blockType = blockMatch[1];
        current = {
          type: blockType,
          name: blockMatch[2] || null,
          label: blockMatch[3] || null,
          line: i + 1,
          attributes: {} as Record<string, unknown>,
        };
        const key = blockType === 'data' ? 'data' : `${blockType}s`;
        if (Array.isArray(result[key])) (result[key] as unknown[]).push(current);
        inBlock = true;
        braceDepth = 1;
        continue;
      }

      if (inBlock && current) {
        braceDepth += (trimmed.match(/{/g) || []).length;
        braceDepth -= (trimmed.match(/}/g) || []).length;
        const attrMatch = trimmed.match(/^(\w+)\s*=\s*(.+)/);
        if (attrMatch && !trimmed.startsWith('}')) {
          (current.attributes as Record<string, unknown>)[attrMatch[1]] = attrMatch[2];
        }
        if (braceDepth <= 0) {
          inBlock = false;
          current = null;
        }
      }
    }
    return JSON.stringify(result, null, 2);
  }

  private jsonToTerraform(content: string): string {
    const data = JSON.parse(content) as Record<string, unknown>;
    const lines: string[] = [];

    const emitBlock = (type: string, name: string, label: string | null, attrs: Record<string, unknown>) => {
      const header = label ? `${type} "${name}" "${label}"` : `${type} "${name}"`;
      lines.push(`${header} {`);
      for (const [key, value] of Object.entries(attrs)) {
        lines.push(`  ${key} = ${value}`);
      }
      lines.push('}');
      lines.push('');
    };

    const processBlocks = (items: unknown[], type: string) => {
      if (!Array.isArray(items)) return;
      for (const item of items) {
        const block = item as Record<string, unknown>;
        if (block.name) {
          emitBlock(type, String(block.name), block.label ? String(block.label) : null, (block.attributes || {}) as Record<string, unknown>);
        }
      }
    };

    if (data.resources) processBlocks(data.resources as unknown[], 'resource');
    else if (Array.isArray(data.resources)) {
      for (const res of data.resources as Array<Record<string, string>>) {
        emitBlock('resource', res.type || res.name || 'main', res.name || null, {});
      }
    }

    processBlocks(data.variables as unknown[], 'variable');
    processBlocks(data.outputs as unknown[], 'output');
    processBlocks(data.providers as unknown[], 'provider');
    processBlocks(data.modules as unknown[], 'module');
    processBlocks(data.data as unknown[], 'data');

    if (lines.length === 0 && typeof data === 'object') {
      lines.push('# Generated Terraform configuration');
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          lines.push(`# ${key}`);
          for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            lines.push(`#   ${k}: ${JSON.stringify(v)}`);
          }
        }
      }
    }

    return lines.join('\n') || '# Empty configuration';
  }

  getSupportedConversions(): Record<string, string[]> {
    return {
      yaml: ['json', 'xml', 'toml', 'ini', 'terraform'],
      json: ['yaml', 'xml', 'toml', 'ini', 'terraform', 'csv'],
      xml: ['yaml', 'json'],
      toml: ['yaml', 'json'],
      ini: ['yaml', 'json'],
      terraform: ['json', 'yaml'],
      csv: ['json'],
      hcl: ['json', 'yaml'],
      tfvars: ['json', 'yaml'],
    };
  }
}
