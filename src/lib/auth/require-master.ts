import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';

export const requireMaster = cache(async () => {
  const user = await getCurrentUser();
  if (!user || !user.active) redirect('/admin/login');
  if (user.role !== 'OWNER') redirect('/admin');
  return user;
});

export const requireAdmin = cache(async () => {
  const user = await getCurrentUser();
  if (!user || !user.active) redirect('/admin/login');
  if (user.role !== 'OWNER' && user.role !== 'ADMIN') redirect('/admin/login');
  return user;
});