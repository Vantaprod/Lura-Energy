'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

type CatalogueProduct = {
  id: string;
  name: string;
  brand: string | null;
  slug: string;
  summary: string | null;
};

type CatalogueCategory = {
  id: string;
  name: string;
  slug: string;
  products: CatalogueProduct[];
};

type LineItem = {
  productId: string;
  productName: string;
  categoryName: string;
  quantity: number;
  notes: string;
};

type Intent = 'install' | 'purchase' | 'both';

export function QuoteForm({ initialProduct }: { initialProduct?: string }) {
  const { t } = useTranslation();
  const [catalogue, setCatalogue] = useState<CatalogueCategory[]>([]);
  const [loadingCatalogue, setLoadingCatalogue] = useState(true);
  const [items, setItems] = useState<LineItem[]>([]);
  const [intent, setIntent] = useState<Intent>('install');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/catalogue')
      .then((r) => r.json())
      .then((data: CatalogueCategory[]) => {
        setCatalogue(data);
        if (initialProduct) {
          for (const cat of data) {
            const match = cat.products.find((p) => p.slug === initialProduct);
            if (match) {
              setItems([
                {
                  productId: match.id,
                  productName: match.name,
                  categoryName: cat.name,
                  quantity: 1,
                  notes: '',
                },
              ]);
              break;
            }
          }
        }
      })
      .finally(() => setLoadingCatalogue(false));
  }, [initialProduct]);

  function addItem(category: CatalogueCategory, productId: string) {
    const product = category.products.find((p) => p.id === productId);
    if (!product) return;
    setItems((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        categoryName: category.name,
        quantity: 1,
        notes: '',
      },
    ]);
  }

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get('name') ?? '').trim(),
      email: String(form.get('email') ?? '').trim(),
      phone: String(form.get('phone') ?? '').trim(),
      location: String(form.get('location') ?? '').trim() || undefined,
      intent,
      message: String(form.get('message') ?? '').trim() || undefined,
      quoteItems: items.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        categoryName: it.categoryName,
        quantity: it.quantity,
        notes: it.notes || undefined,
      })),
      consent: true,
    };

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error((body as { error?: string }).error || t('quote.error.submit'));
      }
      setDone(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('quote.error.submit'));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="quote-success">
        <div className="quote-success__icon" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2>{t('quote.successTitle')}</h2>
        <p>{t('quote.successBody')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="quote-form">
      <div className="quote-grid">
        <div className="quote-grid__left">
          <section className="quote-section" data-step="1">
            <h3 className="quote-section__title">{t('quote.step1')}</h3>
            <div className="quote-contact">
              <div className="field">
                <label htmlFor="q-name">{t('quote.name')} *</label>
                <input id="q-name" name="name" required maxLength={160} autoComplete="name" />
              </div>
              <div className="field">
                <label htmlFor="q-phone">{t('quote.phone')} *</label>
                <input id="q-phone" name="phone" type="tel" required maxLength={40} autoComplete="tel" placeholder="+234..." />
              </div>
              <div className="field">
                <label htmlFor="q-email">{t('quote.email')} *</label>
                <input id="q-email" name="email" type="email" required maxLength={200} autoComplete="email" />
              </div>
              <div className="field">
                <label htmlFor="q-location">{t('quote.location')}</label>
                <input id="q-location" name="location" maxLength={200} autoComplete="address-level2" />
              </div>
            </div>
          </section>

          <section className="quote-section" data-step="2">
            <h3 className="quote-section__title">{t('quote.step2')}</h3>
            <div className="quote-intent quote-intent--stack">
              {([
                { key: 'install', label: t('quote.install'), hint: t('quote.installHint') },
                { key: 'purchase', label: t('quote.purchase'), hint: t('quote.purchaseHint') },
                { key: 'both', label: t('quote.both'), hint: t('quote.bothHint') },
              ] as const).map((opt) => (
                <label
                  key={opt.key}
                  className={'quote-intent__option' + (intent === opt.key ? ' is-selected' : '')}
                >
                  <input
                    type="radio"
                    name="intent"
                    value={opt.key}
                    checked={intent === opt.key}
                    onChange={() => setIntent(opt.key)}
                  />
                  <span className="quote-intent__label">{opt.label}</span>
                  <span className="quote-intent__hint">{opt.hint}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="quote-section" data-step="3">
            <h3 className="quote-section__title">{t('quote.step3')}</h3>
            <div className="field">
              <label htmlFor="q-message">{t('quote.projectLabel')}</label>
              <textarea
                id="q-message"
                name="message"
                maxLength={4000}
                placeholder={t('quote.projectPlaceholder')}
              />
            </div>
          </section>
        </div>

        <div className="quote-grid__right">
          <section className="quote-section quote-section--products" data-step="4">
            <h3 className="quote-section__title">{t('quote.step4')}</h3>
            <p className="form-note" style={{ marginBottom: '1rem' }}>
              {t('quote.productsNote')}
            </p>

            {loadingCatalogue ? (
              <p className="form-note">{t('quote.catalogueLoading')}</p>
            ) : catalogue.length === 0 ? (
              <div className="empty-panel">
                <strong>{t('quote.catalogueEmptyTitle')}</strong>
                {t('quote.catalogueEmptyBody')}
              </div>
            ) : (
              <>
                <div className="quote-add-grid quote-add-grid--single">
                  {catalogue.map((cat) => (
                    <div className="quote-add" key={cat.id}>
                      <label htmlFor={'cat-' + cat.slug} className="quote-add__label">
                        {cat.name}
                      </label>
                      <select
                        id={'cat-' + cat.slug}
                        value=""
                        disabled={cat.products.length === 0}
                        onChange={(e) => {
                          if (e.target.value) {
                            addItem(cat, e.target.value);
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="">
                          {cat.products.length === 0 ? t('quote.noProducts') : t('quote.selectProduct')}
                        </option>
                        {cat.products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.brand ? p.brand + ' - ' : ''}{p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {items.length > 0 && (
                  <div className="quote-items">
                    <h4 className="quote-items__title">{t('quote.selected')}</h4>
                    {items.map((it, i) => (
                      <div className="quote-item" key={i}>
                        <div className="quote-item__main">
                          <p className="quote-item__category">{it.categoryName}</p>
                          <p className="quote-item__name">{it.productName}</p>
                        </div>
                        <div className="quote-item__qty">
                          <label htmlFor={'qty-' + i}>{t('quote.qty')}</label>
                          <input
                            id={'qty-' + i}
                            type="number"
                            min={1}
                            max={9999}
                            value={it.quantity}
                            onChange={(e) => updateItem(i, { quantity: Number(e.target.value) || 1 })}
                          />
                        </div>
                        <button
                          type="button"
                          className="quote-item__remove"
                          onClick={() => removeItem(i)}
                          aria-label={t('quote.items.remove')}
                        >
                          {'\u00D7'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="quote-submit">
        <button className="button" disabled={submitting} type="submit">
          {submitting ? t('quote.sending') : t('quote.submit')}
        </button>
        <p className="form-note">{t('quote.submitNote')}</p>
      </div>
    </form>
  );
}