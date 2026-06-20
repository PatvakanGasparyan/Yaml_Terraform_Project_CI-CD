'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FileCode2, Boxes, FileJson, ArrowLeftRight, Github, BarChart3, History, Settings, FolderOpen, Shield, ChevronLeft, GitCompare, Workflow, ClipboardList, Layers,
  GitPullRequest, GitMerge, Database, AlertTriangle, Container, Calendar, Users, Network,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores';
import { useI18n } from '@/i18n/provider';

const navKeys = [
  { href: '/editor', key: 'nav.editor', icon: FileCode2 },
  { href: '/terraform', key: 'nav.terraform', icon: Boxes },
  { href: '/yaml', key: 'nav.yaml', icon: FileJson },
  { href: '/convert', key: 'nav.convert', icon: ArrowLeftRight },
  { href: '/workspace', key: 'nav.workspace', icon: FolderOpen },
  { href: '/github', key: 'nav.github', icon: Github },
  { href: '/github/compare', key: 'nav.branchCompare', icon: GitCompare },
  { href: '/github/actions', key: 'nav.githubActions', icon: Workflow },
  { href: '/github/pr-review', key: 'nav.prReview', icon: GitPullRequest },
  { href: '/github/conflicts', key: 'nav.mergeConflicts', icon: GitMerge },
  { href: '/terraform/plan', key: 'nav.terraformPlan', icon: Layers },
  { href: '/terraform/state', key: 'nav.terraformState', icon: Database },
  { href: '/terraform/drift', key: 'nav.terraformDrift', icon: AlertTriangle },
  { href: '/kubernetes/explore', key: 'nav.k8sExplorer', icon: Container },
  { href: '/scheduler', key: 'nav.scheduler', icon: Calendar },
  { href: '/teams', key: 'nav.teams', icon: Users },
  { href: '/diagrams', key: 'nav.diagrams', icon: Network },
  { href: '/audit', key: 'nav.audit', icon: ClipboardList },
  { href: '/templates', key: 'nav.templates', icon: FileCode2 },
  { href: '/compliance', key: 'nav.compliance', icon: Shield },
  { href: '/analytics', key: 'nav.analytics', icon: BarChart3 },
  { href: '/history', key: 'nav.history', icon: History },
  { href: '/settings', key: 'nav.settings', icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { t } = useI18n();

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 240 : 64 }}
      className="h-screen glass border-r border-border flex flex-col shrink-0"
    >
      <div className="p-4 flex items-center justify-between border-b border-border">
        {sidebarOpen && (
          <Link href="/" className="font-bold text-lg bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            {t('app.name')}
          </Link>
        )}
        <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-accent" aria-label="Toggle sidebar">
          <ChevronLeft className={cn('h-4 w-4 transition-transform', !sidebarOpen && 'rotate-180')} />
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navKeys.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>{t(item.key)}</span>}
            </Link>
          );
        })}
      </nav>
    </motion.aside>
  );
}
