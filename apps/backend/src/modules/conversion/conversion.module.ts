import { Module } from '@nestjs/common';
import { ConversionService } from './conversion.service';
import { ConversionController } from './conversion.controller';
import { ValidationModule } from '../validation/validation.module';

@Module({
  imports: [ValidationModule],
  controllers: [ConversionController],
  providers: [ConversionService],
  exports: [ConversionService],
})
export class ConversionModule {}
