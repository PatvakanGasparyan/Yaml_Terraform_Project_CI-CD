'use client';

import { useEffect } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotificationStore } from '@/stores/notifications';
import { useI18n } from '@/i18n/provider';
import { cn } from '@/lib/utils';

export function NotificationCenter() {
  const { items, unreadCount, open, load, markRead, markAllRead, deleteNotification, setOpen, connectActivity } = useNotificationStore();
  const { t } = useI18n();

  useEffect(() => {
    load();
    connectActivity();
  }, [load, connectActivity]);

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className="relative">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-96 max-h-[480px] overflow-hidden rounded-lg border border-border bg-background shadow-xl z-50 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="font-semibold text-sm">{t('notifications.title')}</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={markAllRead} title={t('notifications.markAllRead')}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t('notifications.empty')}</p>
              ) : (
                items.map((n) => (
                  <div key={n.id} className={cn('p-3 border-b border-border text-sm', !n.isRead && 'bg-primary/5')}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{n.title}</p>
                        <p className="text-muted-foreground text-xs mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-0.5 shrink-0">
                        {!n.isRead && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => markRead(n.id)}>
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteNotification(n.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
