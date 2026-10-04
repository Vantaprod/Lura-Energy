'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/context';

export function AdminLogout() {
  const router = useRouter();
  const { t } = useTranslation();

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      className="admin-logout-button"
      onClick={() => void logout()}
      style={{
        background: '#1428A0',
        color: '#FFFFFF',
        border: 0,
        fontFamily: 'inherit',
        fontSize: '12px',
        fontWeight: 700,
        padding: '8px 16px',
        borderRadius: '4px',
        cursor: 'pointer',
        lineHeight: 1,
      }}
    >
      {t('admin.signOut')}
    </button>
  );
}