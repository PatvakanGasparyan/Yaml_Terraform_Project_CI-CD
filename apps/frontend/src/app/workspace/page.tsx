'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { useI18n } from '@/i18n/provider';

interface Project {
  id: string;
  name: string;
  description?: string;
  files?: Array<{ id: string; name: string; format: string }>;
}

export default function WorkspacePage() {
  const { isAuthenticated } = useAuthStore();
  const { t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      api.get<Project[]>('/projects').then(setProjects).catch(() => {});
    }
  }, [isAuthenticated]);

  const createProject = async () => {
    if (!newName.trim()) return;
    const project = await api.post<Project>('/projects', { name: newName });
    setProjects([project, ...projects]);
    setNewName('');
  };

  return (
    <AppShell>
      <div className="p-6 space-y-6 overflow-auto h-full">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('workspace.title')}</h1>
          <div className="flex gap-2">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('workspace.projectName')}
              className="px-3 py-2 rounded-lg border bg-background" />
            <Button onClick={createProject}>{t('workspace.newProject')}</Button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle>{p.name}</CardTitle>
                {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t('workspace.files', { count: p.files?.length || 0 })}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
