import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@kolab/config', '@kolab/types', '@kolab/ui', '@kolab/sdk', '@kolab/auth'],
};

export default nextConfig;
