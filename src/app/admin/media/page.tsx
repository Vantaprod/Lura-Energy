import { MediaLibrary } from '@/components/admin/media-library';

export const metadata = { title: 'Media' };

export default function AdminMediaPage() {
  return (
    <div className="admin-shell">
      <div className="admin-top">
        <div>
          <p className="eyebrow">Library</p>
          <h1 style={{ fontSize: '2rem' }}>Media</h1>
        </div>
      </div>
      <p className="form-note" style={{ marginBottom: '1.5rem' }}>
        All images, videos, and documents used across the site. Upload once, reference anywhere.
      </p>
      <MediaLibrary />
    </div>
  );
}