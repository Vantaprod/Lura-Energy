import { getCurrentUser } from '@/lib/auth/session';
import { getServerLang } from '@/lib/i18n/server';
import { AdminGate } from '@/components/layout/admin-gate';
import { PresenceBeacon } from '@/components/admin/presence-beacon';

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
    <>
      <PresenceBeacon />
      <AdminGate user={user} adminLang={adminLang}>
        {children}
      </AdminGate>
    </>
  );
}