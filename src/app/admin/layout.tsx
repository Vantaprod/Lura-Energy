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

  // Check the database role instead of the hardcoded email list
  const isMaster = user?.role === 'OWNER';

  return (
    <>
      <PresenceBeacon />
      <AdminGate user={user} adminLang={adminLang} isMaster={isMaster}>
        {children}
      </AdminGate>
    </>
  );
}