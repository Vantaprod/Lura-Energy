import { requireMaster } from '@/lib/auth/require-master';
import { getServerT } from '@/lib/i18n/server';
import { MasterMessagesView } from '@/components/admin/master-messages-view';

export const dynamic = 'force-dynamic';

export default async function MasterMessagesPage() {
  await requireMaster();
  const { t } = await getServerT('admin');
  return (
    <>
      <p className="eyebrow">{t('master.messages.eyebrow')}</p>
      <h2 className="master-h2">{t('master.messages.title')}</h2>
      <p className="master-meta">{t('master.messages.subtitle')}</p>
      <MasterMessagesView />
    </>
  );
}