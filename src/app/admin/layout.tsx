import { getCurrentUser } from '@/lib/auth/session';
import { getServerLang } from '@/lib/i18n/server';
import { AdminGate } from '@/components/layout/admin-gate';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, adminLang] = await Promise.all([
    getCurrentUser(),
    getServerLang('admin'),
  ]);

  return (
    <AdminGate user={user} adminLang={adminLang}>
      {children}
    </AdminGate>
  );
}