'use client';

import { create } from 'zustand';
import type { NotificationItem, ActivityEvent } from '@iac-platform/shared';
import { api } from '@/lib/api';
import { getActivitySocket } from '@/lib/websocket';

interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;
  activityFeed: ActivityEvent[];
  open: boolean;
  load: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  setOpen: (open: boolean) => void;
  connectActivity: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  unreadCount: 0,
  activityFeed: [],
  open: false,

  load: async () => {
    try {
      const [items, count] = await Promise.all([
        api.get<NotificationItem[]>('/notifications'),
        api.get<number>('/notifications/unread-count'),
      ]);
      set({ items, unreadCount: count });
    } catch {
      /* not authenticated */
    }
  },

  markRead: async (id) => {
    await api.put(`/notifications/${id}/read`);
    set((s) => ({
      items: s.items.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
  },

  markAllRead: async () => {
    await api.put('/notifications/read-all');
    set((s) => ({ items: s.items.map((n) => ({ ...n, isRead: true })), unreadCount: 0 }));
  },

  deleteNotification: async (id) => {
    await api.delete(`/notifications/${id}`);
    set((s) => ({ items: s.items.filter((n) => n.id !== id) }));
  },

  setOpen: (open) => set({ open }),

  connectActivity: () => {
    const socket = getActivitySocket();
    socket.off('activity');
    socket.on('activity', (event: ActivityEvent) => {
      set((s) => ({ activityFeed: [event, ...s.activityFeed].slice(0, 50) }));
    });
    socket.off('notification');
    socket.on('notification', (item: NotificationItem) => {
      set((s) => ({ items: [item, ...s.items], unreadCount: s.unreadCount + 1 }));
    });
  },
}));
