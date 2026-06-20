import { Module } from '@nestjs/common';
import { YamlService } from './yaml.service';
import { YamlController } from './yaml.controller';
import { ValidationModule } from '../validation/validation.module';

@Module({
  imports: [ValidationModule],
  controllers: [YamlController],
  providers: [YamlService],
  exports: [YamlService],
})
export class YamlModule {}
