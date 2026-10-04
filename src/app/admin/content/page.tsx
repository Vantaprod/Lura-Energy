import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { SettingsEditor } from '@/components/admin/settings-editor';
import { getServerT } from '@/lib/i18n/server';

export default async function ContentSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  if (user.role !== 'OWNER') redirect('/admin');

  const { t } = await getServerT('admin');

  return (
    <section>
      <p className="eyebrow">{t('admin.settings.eyebrow')}</p>
      <h1 style={{ fontSize: '3rem' }}>{t('admin.settings.title')}</h1>
      <p className="form-note">{t('admin.settings.intro')}</p>
      <SettingsEditor />
    </section>
  );
}