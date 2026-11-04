import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Trekkon Fantasy Leagues',
    short_name: 'Trekkon',
    description: 'Choose Fandoms. Draft Teams. Beat Buddies.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0a0a0f',
    theme_color: '#12121a',
    icons: [
      // small, simple icons: used for the app window's title bar and taskbar
      { src: '/icons/icon-32.png', sizes: '32x32', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-48.png', sizes: '48x48', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png', purpose: 'any' },
      // larger icons: home screens, Start menu, splash screen
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
