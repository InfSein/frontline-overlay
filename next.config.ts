import type { NextConfig } from "next";
import PackageInfo from "./package.json";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/frontline-overlay' : '',
  env: {
    APP_VERSION: PackageInfo.version,
  },
  transpilePackages: ['tdesign-react'],
};

export default nextConfig;
