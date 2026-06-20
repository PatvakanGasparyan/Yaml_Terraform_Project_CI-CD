import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VersionSnapshot } from '../../entities';
import { VersionsService } from './versions.service';
import { VersionsController } from './versions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VersionSnapshot])],
  controllers: [VersionsController],
  providers: [VersionsService],
  exports: [VersionsService],
})
export class VersionsModule {}
