import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { isMasterEmail } from '@/lib/auth/masters';

export async function requireMaster() {
  const user = await getCurrentUser();
  if (!user || !user.active) redirect('/admin/login');
  if (user.role !== 'OWNER' || !isMasterEmail(user.email)) redirect('/admin');
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !user.active) redirect('/admin/login');
  if (user.role !== 'OWNER' && user.role !== 'ADMIN') redirect('/admin/login');
  return user;
}