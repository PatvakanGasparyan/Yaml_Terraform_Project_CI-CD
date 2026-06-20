import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User, Settings } from '../../entities';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { DEFAULT_USER_SETTINGS } from '@iac-platform/shared';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Settings) private readonly settingsRepo: Repository<Settings>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.userRepo.save({
      id: uuidv4(),
      email: dto.email,
      passwordHash,
      name: dto.name,
      provider: 'local',
    });

    await this.settingsRepo.save({
      id: uuidv4(),
      userId: user.id,
      ...DEFAULT_USER_SETTINGS,
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      select: ['id', 'email', 'name', 'passwordHash', 'avatarUrl', 'provider', 'isActive'],
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });
    await this.auditService.log({ userId: user.id, action: 'login', resourceType: 'user', resourceId: user.id });
    return this.generateTokens(user);
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id: userId, isActive: true } });
  }

  async findOrCreateOAuthUser(data: {
    email: string;
    name: string;
    provider: 'google' | 'github';
    providerId: string;
    avatarUrl?: string;
    githubToken?: string;
  }) {
    let user = await this.userRepo.findOne({
      where: { provider: data.provider, providerId: data.providerId },
    });

    if (!user) {
      user = await this.userRepo.findOne({ where: { email: data.email } });
      if (user) {
        await this.userRepo.update(user.id, {
          provider: data.provider,
          providerId: data.providerId,
          avatarUrl: data.avatarUrl,
          githubToken: data.githubToken,
        });
      } else {
        user = await this.userRepo.save({
          id: uuidv4(),
          email: data.email,
          name: data.name,
          provider: data.provider,
          providerId: data.providerId,
          avatarUrl: data.avatarUrl,
          githubToken: data.githubToken,
        });

        await this.settingsRepo.save({
          id: uuidv4(),
          userId: user.id,
          ...DEFAULT_USER_SETTINGS,
          githubConnected: data.provider === 'github',
        });
      }
    }

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });
    await this.auditService.log({ userId: user.id, action: 'login', resourceType: 'user', resourceId: user.id, details: { provider: data.provider } });
    return this.generateTokens(user);
  }

  private generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '30d'),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        provider: user.provider,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
      const user = await this.validateUser(payload.sub);
      if (!user) throw new UnauthorizedException();
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
