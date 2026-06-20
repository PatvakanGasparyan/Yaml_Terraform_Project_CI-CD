'use client';

import { useEffect } from 'react';
import { Activity } from 'lucide-react';
import { useNotificationStore } from '@/stores/notifications';
import { useI18n } from '@/i18n/provider';

export function ActivityFeed() {
  const { activityFeed, connectActivity } = useNotificationStore();
  const { t } = useI18n();

  useEffect(() => {
    connectActivity();
  }, [connectActivity]);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-border bg-secondary/50">
        <Activity className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">{t('activity.title')}</span>
        <span className="ml-auto h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Live" />
      </div>
      <div className="max-h-64 overflow-y-auto">
        {activityFeed.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">{t('activity.empty')}</p>
        ) : (
          activityFeed.map((e) => (
            <div key={e.id} className="px-3 py-2 border-b border-border text-xs">
              <span className="font-medium">{e.userName || t('activity.user')}</span>
              <span className="text-muted-foreground"> {e.action}</span>
              {e.resourceName && <span className="text-primary ml-1">{e.resourceName}</span>}
              <span className="block text-[10px] text-muted-foreground mt-0.5">{new Date(e.createdAt).toLocaleTimeString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
