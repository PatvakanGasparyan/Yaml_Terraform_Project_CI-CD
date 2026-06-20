import { OfflineValidationService } from './offline-validation.service';

describe('OfflineValidationService', () => {
  const service = new OfflineValidationService();

  it('should detect invalid YAML', () => {
    const result = service.validate('key: [unclosed', 'yaml');
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('should validate correct JSON', () => {
    const result = service.validate('{"key": "value"}', 'json');
    expect(result.issues.filter((i) => i.severity === 'critical')).toHaveLength(0);
  });

  it('should detect duplicate terraform resources', () => {
    const content = `
resource "aws_instance" "web" {}
resource "aws_instance" "web" {}
`;
    const result = service.validate(content, 'terraform');
    expect(result.issues.some((i) => i.rule === 'tf-duplicate-resource')).toBe(true);
  });

  it('should detect kubernetes missing apiVersion', () => {
    const content = 'kind: Pod\nmetadata:\n  name: test\n';
    const result = service.validate(content, 'kubernetes');
    expect(result.issues.some((i) => i.rule === 'k8s-api-version')).toBe(true);
  });
});
