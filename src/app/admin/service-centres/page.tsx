import { ServiceCentresManager } from '@/components/admin/service-centres-manager';

export const metadata = { title: 'Service Centres' };

export default function AdminServiceCentresPage() {
  return (
    <div className="admin-shell">
      <div className="admin-top">
        <div>
          <p className="eyebrow">Lura Chain Store</p>
          <h1 style={{ fontSize: '2rem' }}>Service Centres</h1>
        </div>
      </div>
      <p className="form-note" style={{ marginBottom: '1.5rem' }}>
        Locations that appear on the public Service Centres page. Only published
        locations are visible to visitors.
      </p>
      <ServiceCentresManager />
    </div>
  );
}