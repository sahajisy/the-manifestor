import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'The Manifestor',
    short_name: 'Manifestor',
    description: 'Face the harsh reality. Track your progress. Achieve your ultimate aim.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0d0f12',
    theme_color: '#0d0f12',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
