import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Configurações para evitar problemas de hidratação
  reactStrictMode: true,
  // Configurações para melhorar a compatibilidade
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;
