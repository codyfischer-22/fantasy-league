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
      // plain T: title bar, taskbar, small desktop icons
      { src: '/icons/icon-32-v2.png', sizes: '32x32', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-48-v2.png', sizes: '48x48', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-96-v2.png', sizes: '96x96', type: 'image/png', purpose: 'any' },
      // car (no checkers): phones, Start menu, large desktop icons
      { src: '/icons/icon-192-v2.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512-v2.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512-v2.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
