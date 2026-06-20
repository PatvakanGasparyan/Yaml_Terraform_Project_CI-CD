import { Controller, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put('profile')
  updateProfile(@Body() body: { name?: string; avatarUrl?: string }, @Req() req: { user: { id: string } }) {
    return this.usersService.updateProfile(req.user.id, body);
  }
}
