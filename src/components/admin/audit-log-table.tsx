'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

export type AuditEntry = {
  id: string;
  createdAtIso: string;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  metadata: unknown;
  actor: { id: string; name: string; email: string } | null;
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(iso));
}

function formatJson(value: unknown): string {
  if (value === null || value === undefined) return '';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function AuditLogTable({ entries }: { entries: AuditEntry[] }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<AuditEntry | null>(null);

  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('admin.audit.colTime')}</th>
              <th>{t('admin.audit.colActor')}</th>
              <th>{t('admin.audit.colAction')}</th>
              <th>{t('admin.audit.colEntity')}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.id}
                onClick={() => setSelected(entry)}
                className="audit-row"
              >
                <td style={{ whiteSpace: 'nowrap', fontSize: '12.5px' }}>
                  {formatDate(entry.createdAtIso)}
                </td>
                <td>
                  {entry.actor?.name ?? t('admin.audit.systemActor')}
                  {entry.actor?.email && (
                    <div className="form-note" style={{ fontSize: '11.5px' }}>
                      {entry.actor.email}
                    </div>
                  )}
                </td>
                <td>
                  <code className="audit-action-chip">{entry.action}</code>
                </td>
                <td>
                  {entry.entityType}
                  {entry.entityId && (
                    <div
                      className="form-note"
                      style={{
                        fontSize: '11px',
                        fontFamily: 'ui-monospace, monospace',
                      }}
                    >
                      {entry.entityId.slice(-8)}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div
          className="audit-drawer-backdrop"
          onClick={() => setSelected(null)}
          role="presentation"
        >
          <aside
            className="audit-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={selected.action}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="audit-drawer__header">
              <div style={{ minWidth: 0 }}>
                <p className="audit-drawer__eyebrow">
                  {t('admin.audit.drawer.title')}
                </p>
                <h2 className="audit-drawer__title">{selected.action}</h2>
              </div>
              <button
                type="button"
                className="audit-drawer__close"
                onClick={() => setSelected(null)}
                aria-label={t('admin.audit.drawer.close')}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <div className="audit-drawer__body">
              <dl className="audit-drawer__grid">
                <div>
                  <dt>{t('admin.audit.drawer.time')}</dt>
                  <dd>{formatDate(selected.createdAtIso)}</dd>
                </div>
                <div>
                  <dt>{t('admin.audit.drawer.actor')}</dt>
                  <dd>
                    {selected.actor ? (
                      <>
                        <strong>{selected.actor.name}</strong>
                        <div className="form-note">
                          {selected.actor.email}
                        </div>
                      </>
                    ) : (
                      t('admin.audit.systemActor')
                    )}
                  </dd>
                </div>
                <div>
                  <dt>{t('admin.audit.drawer.entity')}</dt>
                  <dd>
                    {selected.entityType}
                    {selected.entityId && (
                      <div
                        className="form-note"
                        style={{
                          fontFamily: 'ui-monospace, monospace',
                          wordBreak: 'break-all',
                        }}
                      >
                        {selected.entityId}
                      </div>
                    )}
                  </dd>
                </div>
                {selected.ipAddress && (
                  <div>
                    <dt>{t('admin.audit.drawer.ip')}</dt>
                    <dd style={{ fontFamily: 'ui-monospace, monospace' }}>
                      {selected.ipAddress}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="audit-drawer__section">
                <h3 className="audit-drawer__section-title">
                  {t('admin.audit.drawer.metadata')}
                </h3>
                {selected.metadata === null ||
                selected.metadata === undefined ? (
                  <p className="form-note">
                    {t('admin.audit.drawer.noMetadata')}
                  </p>
                ) : (
                  <pre className="audit-drawer__json">
                    {formatJson(selected.metadata)}
                  </pre>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}