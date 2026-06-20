'use client';

import { useEffect, useCallback } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import {
  FileCode2, CheckCircle, Wrench, BookOpen, Shield, Zap,
  ArrowLeftRight, Settings, BarChart3,
} from 'lucide-react';
import { useUIStore, useEditorStore } from '@/stores';
import { useI18n } from '@/i18n/provider';

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const { validate, fixAll, explain, optimize, securityAudit, addTab } = useEditorStore();
  const router = useRouter();
  const { t } = useI18n();

  const commands = [
    { id: 'validate', label: t('command.validate'), icon: CheckCircle, action: 'validate' },
    { id: 'fix', label: t('command.fix'), icon: Wrench, action: 'fix' },
    { id: 'explain', label: t('command.explain'), icon: BookOpen, action: 'explain' },
    { id: 'optimize', label: t('command.optimize'), icon: Zap, action: 'optimize' },
    { id: 'security', label: t('command.security'), icon: Shield, action: 'security' },
    { id: 'convert', label: t('command.convert'), icon: ArrowLeftRight, href: '/convert' },
    { id: 'analytics', label: t('command.analytics'), icon: BarChart3, href: '/analytics' },
    { id: 'settings', label: t('command.settings'), icon: Settings, href: '/settings' },
    { id: 'new-yaml', label: t('command.newYaml'), icon: FileCode2, action: 'new-yaml' },
    { id: 'new-tf', label: t('command.newTf'), icon: FileCode2, action: 'new-tf' },
  ];

  const runAction = useCallback(async (action: string) => {
    setCommandPaletteOpen(false);
    switch (action) {
      case 'validate': await validate(true); break;
      case 'fix': await fixAll(); break;
      case 'explain': await explain(); break;
      case 'optimize': await optimize(); break;
      case 'security': await securityAudit(); break;
      case 'new-yaml': addTab('untitled.yaml', '# New YAML file\n'); break;
      case 'new-tf': addTab('main.tf', '# New Terraform file\nterraform {\n  required_version = ">= 1.0"\n}\n'); break;
    }
  }, [validate, fixAll, explain, optimize, securityAudit, addTab, setCommandPaletteOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[20vh]">
      <Command className="w-full max-w-lg glass-card overflow-hidden shadow-2xl animate-slide-up">
        <Command.Input
          placeholder={t('command.placeholder')}
          className="w-full px-4 py-3 bg-transparent border-b border-border outline-none text-sm"
        />
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="p-4 text-sm text-muted-foreground text-center">{t('common.noResults')}</Command.Empty>
          {commands.map((cmd) => {
            const Icon = cmd.icon;
            return (
              <Command.Item
                key={cmd.id}
                value={cmd.label}
                onSelect={() => {
                  if (cmd.href) {
                    router.push(cmd.href);
                    setCommandPaletteOpen(false);
                  } else if (cmd.action) {
                    runAction(cmd.action);
                  }
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer aria-selected:bg-accent"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                {cmd.label}
              </Command.Item>
            );
          })}
        </Command.List>
      </Command>
    </div>
  );
}
