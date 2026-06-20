'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores';
import { useI18n } from '@/i18n/provider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const router = useRouter();
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      router.push('/editor');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{t('auth.login')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <input type="email" placeholder={t('auth.email')} value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background" required />
            <input type="password" placeholder={t('auth.password')} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background" required />
            <Button type="submit" className="w-full">{t('auth.login')}</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            {t('auth.noAccount')} <Link href="/auth/register" className="text-primary hover:underline">{t('auth.register')}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
