'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { CommandPalette } from '@/components/layout/command-palette';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
