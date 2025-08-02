
import type { NextConfig } from 'next';

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // React Strict Mode is true by default in Next.js 13+ App Router
  experimental: {
    allowedDevOrigins: [
      "https://6000-idx-studio-1745812285444.cluster-6dx7corvpngoivimwvvljgokdw.cloudworkstations.dev",
      "https://9000-idx-studio-1745812285444.cluster-6dx7corvpngoivimwvvljgokdw.cloudworkstations.dev",
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
