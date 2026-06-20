import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamMember, User } from '../../entities';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TeamMember, User])],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
