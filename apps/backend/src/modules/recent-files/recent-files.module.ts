import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecentFile } from '../../entities';
import { RecentFilesService } from './recent-files.service';
import { RecentFilesController } from './recent-files.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RecentFile])],
  controllers: [RecentFilesController],
  providers: [RecentFilesService],
  exports: [RecentFilesService],
})
export class RecentFilesModule {}
