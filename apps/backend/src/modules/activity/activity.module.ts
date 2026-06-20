import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ActivityGateway } from './activity.gateway';
import { ActivityService } from './activity.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'change-me'),
      }),
    }),
  ],
  providers: [ActivityGateway, ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
