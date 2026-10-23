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

  const isMaster = isMasterEmail(user?.email ?? null);

  return (
    <>
      <PresenceBeacon />
      <AdminGate user={user} adminLang={adminLang} isMaster={isMaster}>
        {children}
      </AdminGate>
    </>
  );
}