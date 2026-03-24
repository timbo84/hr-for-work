export default function manifest() {
  const countyName = process.env.NEXT_PUBLIC_COUNTY_NAME || 'County';

  return {
    name: `${countyName} HR Portal`,
    short_name: 'HR Portal',
    description: `${countyName} Employee Self-Service Portal`,
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#ffffff',
    theme_color: '#1e40af',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { src: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  };
}
