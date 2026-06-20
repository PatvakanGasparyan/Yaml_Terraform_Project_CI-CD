import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File, FileVersion } from '../../entities';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';

@Module({
  imports: [TypeOrmModule.forFeature([File, FileVersion])],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
