import { ServiceCentresManager } from '@/components/admin/service-centres-manager';
import { getServerT } from '@/lib/i18n/server';

export const metadata = { title: 'Service Centres' };

export default async function AdminServiceCentresPage() {
  const { t } = await getServerT('admin');

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <div>
          <p className="eyebrow">{t('admin.sc.eyebrow')}</p>
          <h1 style={{ fontSize: '2rem' }}>{t('admin.sc.title')}</h1>
        </div>
      </div>
      <p className="form-note" style={{ marginBottom: '1.5rem' }}>
        {t('admin.sc.intro')}
      </p>
      <ServiceCentresManager />
    </div>
  );
}