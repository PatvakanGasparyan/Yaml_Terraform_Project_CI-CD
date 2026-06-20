import type { FileFormat } from './types';
import { FILE_EXTENSIONS } from './constants';

export function detectFormat(fileName: string, content?: string): FileFormat {
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  if (FILE_EXTENSIONS[ext]) return FILE_EXTENSIONS[ext];

  if (content) {
    const trimmed = content.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
    if (trimmed.startsWith('---') || trimmed.includes('apiVersion:')) return 'kubernetes';
    if (trimmed.startsWith('resource ') || trimmed.startsWith('terraform ') || trimmed.startsWith('provider ')) return 'terraform';
    if (trimmed.startsWith('<?xml')) return 'xml';
    if (trimmed.startsWith('[') && trimmed.includes('=')) return 'toml';
    if (trimmed.startsWith('AWSTemplateFormatVersion') || trimmed.includes('Resources:')) return 'cloudformation';
    if (trimmed.includes('on:') && trimmed.includes('jobs:')) return 'github-actions';
    if (trimmed.includes('pipeline:') || trimmed.includes('stages:')) return 'gitlab-ci';
    if (trimmed.includes('version:') && trimmed.includes('services:')) return 'docker-compose';
  }

  if (fileName.includes('docker-compose')) return 'docker-compose';
  if (fileName.includes('Chart.yaml')) return 'helm';
  if (fileName.includes('playbook')) return 'ansible';
  if (fileName.includes('Jenkinsfile')) return 'jenkins';

  return 'unknown';
}

export function getMonacoLanguage(format: FileFormat): string {
  const map: Record<FileFormat, string> = {
    yaml: 'yaml',
    terraform: 'hcl',
    tfvars: 'hcl',
    json: 'json',
    xml: 'xml',
    toml: 'ini',
    ini: 'ini',
    hcl: 'hcl',
    'docker-compose': 'yaml',
    kubernetes: 'yaml',
    helm: 'yaml',
    ansible: 'yaml',
    cloudformation: 'yaml',
    openapi: 'yaml',
    'github-actions': 'yaml',
    'gitlab-ci': 'yaml',
    jenkins: 'groovy',
    crd: 'yaml',
    properties: 'ini',
    env: 'ini',
    csv: 'plaintext',
    markdown: 'markdown',
    unknown: 'plaintext',
  };
  return map[format] || 'plaintext';
}

export const CONVERSION_MATRIX: Record<string, FileFormat[]> = {
  yaml: ['json', 'xml', 'terraform'],
  json: ['yaml', 'xml', 'terraform', 'csv'],
  xml: ['yaml', 'json'],
  toml: ['yaml', 'json'],
  terraform: ['json', 'yaml'],
  csv: ['json'],
};

export function getAvailableConversions(format: FileFormat): FileFormat[] {
  return CONVERSION_MATRIX[format] || [];
}
