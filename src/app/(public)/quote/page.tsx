import type { Metadata } from 'next';
import { QuoteBuilder } from '@/components/public/quote-builder';

export const metadata: Metadata = {
  title: 'Request a Quote',
  description:
    'Request a quotation for Lura solar products, installation, or custom energy systems. Select products, describe your project, and get a response within 1 business day.',
};

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const params = await searchParams;

  return (
    <main>
      <section className="page-intro">
        <p className="eyebrow">Request a quote</p>
        <h1>Let us price your project.</h1>
        <p>
          Select the products you are interested in, describe your needs, and the
          Lura team will send you a detailed quotation.
        </p>
      </section>

      <section className="section-generous">
        <QuoteBuilder initialProduct={params.product ?? ''} />
      </section>
    </main>
  );
}