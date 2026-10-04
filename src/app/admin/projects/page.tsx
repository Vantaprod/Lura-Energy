import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { ProjectsManager } from '@/components/admin/projects-manager';
import { getServerT } from '@/lib/i18n/server';

export default async function AdminProjects() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');

  const { t } = await getServerT('admin');

  return (
    <section>
      <p className="eyebrow">{t('admin.proj.eyebrow')}</p>
      <h1 style={{ fontSize: '3rem' }}>{t('admin.proj.title')}</h1>
      <p className="form-note">{t('admin.proj.intro')}</p>
      <ProjectsManager />
    </section>
  );
}