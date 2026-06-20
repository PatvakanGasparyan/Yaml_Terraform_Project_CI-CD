import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoriteRepository } from '../../entities';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FavoriteRepository])],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}
