import type { NextConfig } from 'next';

const config: NextConfig = {
  serverExternalPackages: ['pg', 'pg-boss'],
  // The marketing site is static (public/index.html, blog/, legal/); the product app lives at /app.
  async rewrites() { return [{ source: '/', destination: '/index.html' }]; },
  async headers() { return [{ source: '/(.*)', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }, { key: 'X-Frame-Options', value: 'DENY' }] }]; },
};
export default config;
