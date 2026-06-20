import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConversionService } from './conversion.service';
import { ConvertDto } from './dto/conversion.dto';

@ApiTags('Conversion')
@Controller('conversion')
export class ConversionController {
  constructor(private readonly conversionService: ConversionService) {}

  @Get('supported')
  @ApiOperation({ summary: 'Get supported conversions' })
  getSupported() {
    return this.conversionService.getSupportedConversions();
  }

  @Post()
  @ApiOperation({ summary: 'Convert between formats' })
  async convert(@Body() dto: ConvertDto) {
    return this.conversionService.convert(dto.content, dto.from, dto.to);
  }
}
