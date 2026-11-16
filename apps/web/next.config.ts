import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/account', destination: '/', permanent: true },
      { source: '/account/:path+', destination: '/:path+', permanent: true },
    ];
  },
  async rewrites() {
    const apiUrl = process.env['API_URL'] ?? 'http://localhost:3000';
    return [{ source: '/api/:path*', destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
