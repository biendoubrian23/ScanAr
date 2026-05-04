/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rtwlwilronfcdatsjyab.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-e035ef6264ce48cda403991e42b4de57.r2.dev',
      },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: '20mb' },
  },
}

export default nextConfig
