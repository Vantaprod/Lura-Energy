'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { Select } from '@/components/ui/select';

const RANGES = ['all', '24h', '7d', '30d'] as const;
type Range = (typeof RANGES)[number];

export type ActorOption = {
  id: string;
  name: string;
  email: string;
};

type Props = {
  actors: ActorOption[];
};

export function AuditLogFilters({ actors }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();

  const initialQ = params.get('q') ?? '';
  const initialRange = (params.get('range') as Range) || 'all';
  const initialActor = params.get('actor') ?? '';
  const [q, setQ] = useState(initialQ);
  const [range, setRange] = useState<Range>(
    RANGES.includes(initialRange) ? initialRange : 'all',
  );

  // Debounced navigation on query change
  useEffect(() => {
    if (q === initialQ) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (q.trim()) next.set('q', q.trim());
      else next.delete('q');
      next.delete('page');
      router.push(`/admin/audit-log?${next.toString()}`);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function pushWith(mutate: (p: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    next.delete('page');
    router.push(`/admin/audit-log?${next.toString()}`);
  }

  function onRangeChange(next: Range) {
    setRange(next);
    pushWith((p) => {
      if (next !== 'all') p.set('range', next);
      else p.delete('range');
    });
  }

  function onActorChange(next: string) {
    pushWith((p) => {
      if (next) p.set('actor', next);
      else p.delete('actor');
    });
  }

  const rangeOptions = [
    { value: 'all', label: t('admin.audit.filter.allTime') },
    { value: '24h', label: t('admin.audit.filter.last24h') },
    { value: '7d', label: t('admin.audit.filter.last7d') },
    { value: '30d', label: t('admin.audit.filter.last30d') },
  ];

  const actorOptions = [
    { value: '', label: t('admin.audit.filter.allActors') },
    ...actors.map((a) => ({
      value: a.id,
      label: a.name ? `${a.name} · ${a.email}` : a.email,
    })),
  ];

  return (
    <div className="audit-filters">
      <div className="audit-filters__search">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('admin.audit.filter.searchPlaceholder')}
          aria-label={t('admin.audit.filter.searchLabel')}
          maxLength={120}
        />
      </div>

      <div className="audit-filters__field">
        <label htmlFor="audit-actor">
          {t('admin.audit.filter.actorLabel')}
        </label>
        <Select
          id="audit-actor"
          value={initialActor}
          onChange={onActorChange}
          options={actorOptions}
          fullWidth
        />
      </div>

      <div className="audit-filters__field">
        <label htmlFor="audit-range">
          {t('admin.audit.filter.rangeLabel')}
        </label>
        <Select
          id="audit-range"
          value={range}
          onChange={(v) => onRangeChange(v as Range)}
          options={rangeOptions}
          fullWidth
        />
      </div>
    </div>
  );
}