import { requireMaster } from '@/lib/auth/require-master';

export default async function MessagesPage() {
  await requireMaster();
  return (
    <>
      <p className="eyebrow">MESSAGES</p>
      <h2 className="master-h2">Team messages</h2>
      <p className="master-meta">Direct messaging and per-admin notifications ship in a later chunk.</p>
    </>
  );
}