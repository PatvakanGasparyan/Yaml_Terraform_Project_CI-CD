import { Injectable } from '@nestjs/common';

export interface ActivityPayload {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  resourceType?: string;
  resourceName?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

@Injectable()
export class ActivityService {
  private gateway: { emitToUser: (userId: string, event: string, data: unknown) => void; broadcast: (event: string, data: unknown) => void } | null = null;

  setGateway(gateway: ActivityService['gateway']) {
    this.gateway = gateway;
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.gateway?.emitToUser(userId, event, data);
  }

  broadcast(event: string, data: unknown) {
    this.gateway?.broadcast(event, data);
  }

  publish(userId: string, action: string, opts?: {
    userName?: string;
    resourceType?: string;
    resourceName?: string;
    metadata?: Record<string, unknown>;
  }): ActivityPayload {
    const payload: ActivityPayload = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      userId,
      userName: opts?.userName,
      action,
      resourceType: opts?.resourceType,
      resourceName: opts?.resourceName,
      metadata: opts?.metadata,
      createdAt: new Date().toISOString(),
    };
    this.broadcast('activity', payload);
    return payload;
  }
}
