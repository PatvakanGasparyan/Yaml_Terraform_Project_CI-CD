import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import type { TeamMemberInfo, TeamRole } from '@iac-platform/shared';
import { TeamMember, User } from '../../entities';

const ROLE_HIERARCHY: Record<TeamRole, number> = { owner: 4, admin: 3, editor: 2, viewer: 1 };

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(TeamMember) private readonly teamRepo: Repository<TeamMember>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async listMembers(projectId: string): Promise<TeamMemberInfo[]> {
    const members = await this.teamRepo.find({ where: { projectId } });
    const result: TeamMemberInfo[] = [];
    for (const m of members) {
      const user = await this.userRepo.findOne({ where: { id: m.userId }, select: ['id', 'name', 'email'] });
      result.push({
        id: m.id,
        projectId: m.projectId,
        userId: m.userId,
        userName: user?.name,
        userEmail: user?.email,
        role: m.role,
        createdAt: m.createdAt.toISOString(),
      });
    }
    return result;
  }

  async addMember(projectId: string, userId: string, role: TeamRole, requesterId: string) {
    await this.requireRole(projectId, requesterId, 'admin');
    const existing = await this.teamRepo.findOne({ where: { projectId, userId } });
    if (existing) {
      existing.role = role;
      await this.teamRepo.save(existing);
      return existing;
    }
    return this.teamRepo.save({ id: uuidv4(), projectId, userId, role });
  }

  async removeMember(projectId: string, memberId: string, requesterId: string) {
    await this.requireRole(projectId, requesterId, 'admin');
    await this.teamRepo.delete({ id: memberId, projectId });
    return { success: true };
  }

  async getUserRole(projectId: string, userId: string): Promise<TeamRole | null> {
    const member = await this.teamRepo.findOne({ where: { projectId, userId } });
    return member?.role || null;
  }

  async requireRole(projectId: string, userId: string, minRole: TeamRole) {
    const role = await this.getUserRole(projectId, userId);
    if (!role || ROLE_HIERARCHY[role] < ROLE_HIERARCHY[minRole]) {
      throw new ForbiddenException(`Requires ${minRole} role or higher`);
    }
    return role;
  }

  async canPerform(projectId: string, userId: string, action: 'read' | 'write' | 'admin'): Promise<boolean> {
    const role = await this.getUserRole(projectId, userId);
    if (!role) return false;
    if (action === 'read') return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.viewer;
    if (action === 'write') return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.editor;
    return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.admin;
  }

  async ensureOwnerOnProjectCreate(projectId: string, ownerId: string) {
    await this.teamRepo.save({ id: uuidv4(), projectId, userId: ownerId, role: 'owner' });
  }
}
