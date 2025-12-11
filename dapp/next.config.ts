import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // Configurar el root directory para silenciar el warning de múltiples lockfiles
  // Esto indica a Next.js que el workspace root es el directorio 'dapp'
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
