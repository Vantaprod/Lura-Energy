import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Lura Energy Admin',
    short_name: 'Lura Admin',
    description: 'Lura Energy administration console.',
    start_url: '/admin',
    scope: '/admin/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#050E1F',
    theme_color: '#1428A0',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}