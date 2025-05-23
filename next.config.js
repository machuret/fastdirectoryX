/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      // Add other domains here if needed, e.g., your own S3 bucket
    ],
  },
  async headers() {
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https: *.googleusercontent.com;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self';
      frame-ancestors 'none';
      form-action 'self';
      object-src 'none';
      base-uri 'self';
      report-uri /api/csp-report;
    `.replace(/\s{2,}/g, ' ').trim(); // Process to remove newlines and extra spaces

    return [
      {
        source: '/:path*', // Apply CSP to all paths
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
