'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileCode2, Shield, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/i18n/provider';

export default function HomePage() {
  const { t } = useI18n();

  const features = [
    { icon: FileCode2, title: t('landing.feature1Title'), desc: t('landing.feature1Desc') },
    { icon: Shield, title: t('landing.feature2Title'), desc: t('landing.feature2Desc') },
    { icon: Zap, title: t('landing.feature3Title'), desc: t('landing.feature3Desc') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <span className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
          {t('app.name')}
        </span>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/auth/login">{t('auth.login')}</Link>
          </Button>
          <Button asChild>
            <Link href="/editor">{t('landing.launchEditor')}</Link>
          </Button>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-bold tracking-tight"
        >
          {t('landing.title')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto"
        >
          {t('landing.subtitle')}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-10 flex gap-4 justify-center"
        >
          <Button size="lg" asChild>
            <Link href="/editor">
              {t('landing.getStarted')} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/register">{t('auth.createAccount')}</Link>
          </Button>
        </motion.div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            <Card className="h-full hover:shadow-xl transition-shadow">
              <CardHeader>
                <f.icon className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
