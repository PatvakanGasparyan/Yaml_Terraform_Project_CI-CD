import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { YamlService } from './yaml.service';
import { YamlSchemaDto } from './dto/yaml.dto';

@ApiTags('YAML')
@Controller('yaml')
export class YamlController {
  constructor(private readonly yamlService: YamlService) {}

  @Get('schemas')
  @ApiOperation({ summary: 'List available schema validators' })
  getSchemas() {
    return { schemas: this.yamlService.getAvailableSchemas() };
  }

  @Post('validate-schema')
  @ApiOperation({ summary: 'Validate YAML against schema' })
  validateSchema(@Body() dto: YamlSchemaDto) {
    return this.yamlService.validateSchema(dto.content, dto.schemaType);
  }

  @Post('kubernetes/explore')
  @ApiOperation({ summary: 'Explore Kubernetes resources' })
  exploreK8s(@Body() body: { content: string }) {
    return this.yamlService.exploreKubernetes(body.content);
  }
}
