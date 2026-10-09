const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://luraenergy.com';

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Lura Energy',
    alternateName: 'Lura',
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo.png`,
    description: 'Home of Premium Solar. Lura supplies solar batteries, inverters, panels, and C&I systems across Nigeria.',
    areaServed: {
      '@type': 'Country',
      name: 'Nigeria',
    },
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Lura Energy',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/products?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export type ProductSchemaInput = {
  name: string;
  description: string | null;
  sku: string | null;
  brand: string | null;
  category: string;
  images: string[];
  url: string;
};

export function productSchema(input: ProductSchemaInput) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    url: input.url,
  };
  if (input.description) data.description = input.description;
  if (input.sku) data.sku = input.sku;
  if (input.brand) {
    data.brand = { '@type': 'Brand', name: input.brand };
  }
  if (input.category) data.category = input.category;
  if (input.images.length) {
    data.image = input.images.slice(0, 6).map((url) =>
      url.startsWith('http') ? url : `${SITE_URL}${url}`,
    );
  }
  return data;
}

export type BreadcrumbItem = { name: string; url: string };

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

export function projectSchema(input: {
  title: string;
  description: string | null;
  images: string[];
  location: string | null;
  url: string;
}) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: input.title,
    url: input.url,
  };
  if (input.description) data.description = input.description;
  if (input.location) {
    data.locationCreated = {
      '@type': 'Place',
      name: input.location,
    };
  }
  if (input.images.length) {
    data.image = input.images.slice(0, 6).map((url) =>
      url.startsWith('http') ? url : `${SITE_URL}${url}`,
    );
  }
  return data;
}