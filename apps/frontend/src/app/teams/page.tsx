'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { useI18n } from '@/i18n/provider';
import type { TeamMemberInfo, TeamRole } from '@iac-platform/shared';

export default function TeamsPage() {
  const { isAuthenticated } = useAuthStore();
  const { t } = useI18n();
  const [projectId, setProjectId] = useState('');
  const [members, setMembers] = useState<TeamMemberInfo[]>([]);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<TeamRole>('viewer');

  const loadMembers = async () => {
    if (!projectId) return;
    const list = await api.get<TeamMemberInfo[]>(`/teams/project/${projectId}`);
    setMembers(list);
  };

  useEffect(() => {
    if (isAuthenticated && projectId) loadMembers();
  }, [isAuthenticated, projectId]);

  const addMember = async () => {
    await api.post(`/teams/project/${projectId}/members`, { userId, role });
    setUserId('');
    loadMembers();
  };

  const removeMember = async (memberId: string) => {
    await api.delete(`/teams/project/${projectId}/members/${memberId}`);
    loadMembers();
  };

  if (!isAuthenticated) {
    return (
      <AppShell>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold">{t('enterprise.teamsTitle')}</h1>
          <p className="text-muted-foreground mt-2">{t('common.signInRequired')}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 space-y-4 overflow-auto h-full">
        <h1 className="text-2xl font-bold">{t('enterprise.teamsTitle')}</h1>
        <p className="text-muted-foreground">{t('enterprise.teamsDesc')}</p>
        <div className="flex gap-2">
          <input value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder={t('enterprise.projectId')} className="px-3 py-2 rounded-lg border bg-background" />
          <Button onClick={loadMembers}>{t('common.refresh')}</Button>
        </div>
        <Card>
          <CardHeader><CardTitle>{t('enterprise.addMember')}</CardTitle></CardHeader>
          <CardContent className="flex gap-2 flex-wrap">
            <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User ID" className="px-3 py-2 rounded-lg border bg-background" />
            <select value={role} onChange={(e) => setRole(e.target.value as TeamRole)} className="px-3 py-2 rounded-lg border bg-background">
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <Button onClick={addMember} disabled={!projectId || !userId}>{t('enterprise.addMember')}</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t('enterprise.members')}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex justify-between p-2 border rounded text-sm">
                <span>{m.userName || m.userEmail || m.userId} — <strong>{m.role}</strong></span>
                <Button size="sm" variant="ghost" onClick={() => removeMember(m.id)}>{t('common.delete')}</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
