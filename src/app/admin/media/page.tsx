import { MediaLibrary } from '@/components/admin/media-library';
import { getServerT } from '@/lib/i18n/server';

export async function generateMetadata() {
  const { t } = await getServerT('admin');
  return { title: t('admin.media.title') };
}

export default async function AdminMediaPage() {
  const { t } = await getServerT('admin');

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <div>
          <p className="eyebrow">{t('admin.media.eyebrow')}</p>
          <h1 style={{ fontSize: '2rem' }}>{t('admin.media.title')}</h1>
        </div>
      </div>
      <p className="form-note" style={{ marginBottom: '1.5rem' }}>
        {t('admin.media.intro')}
      </p>
      <MediaLibrary />
    </div>
  );
}