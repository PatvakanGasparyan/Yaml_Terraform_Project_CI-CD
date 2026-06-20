import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { I18nProvider } from '@/i18n/provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'IaC Platform - AI-Powered YAML & Terraform Validation',
  description: 'Enterprise AI-Powered Infrastructure-as-Code Validation Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <I18nProvider>
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
