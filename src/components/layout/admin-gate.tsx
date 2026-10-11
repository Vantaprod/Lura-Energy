'use client';

import { usePathname } from 'next/navigation';
import { LanguageProvider } from '@/lib/i18n/context';
import { AdminShell } from './admin-shell';
import type { Lang } from '@/lib/i18n/dictionaries';

type User = { name: string; role: string } | null;

export function AdminGate({
  user,
  adminLang,
  children,
}: {
  user: User;
  adminLang: Lang;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage =
    pathname === '/admin/login' ||
    pathname === '/admin/request-access' ||
    (pathname?.startsWith('/admin/accept-invitation') ?? false);

  const scope = isAuthPage ? 'login' : 'admin';

  return (
    <LanguageProvider scope={scope} initialLang={adminLang}>
      {isAuthPage ? children : <AdminShell user={user}>{children}</AdminShell>}
    </LanguageProvider>
  );
}