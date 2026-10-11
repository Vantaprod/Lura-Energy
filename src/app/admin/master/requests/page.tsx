import { requireMaster } from '@/lib/auth/require-master';

export default async function RequestsPage() {
  await requireMaster();
  return (
    <>
      <p className="eyebrow">ACCESS REQUESTS</p>
      <h2 className="master-h2">Approval queue</h2>
      <p className="master-meta">This page ships in the next chunk. The public request form at <code>/admin/request-access</code> will post here.</p>
    </>
  );
}