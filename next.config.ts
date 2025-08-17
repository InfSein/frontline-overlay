import type { NextConfig } from "next";
import PackageInfo from "./package.json";

const isGitHubPages = process.env.GITHUB_PAGES === '1'

const nextConfig: NextConfig = {
  output: isGitHubPages ? 'export' : undefined,
  basePath: isGitHubPages ? '/frontline-overlay' : '',
  env: {
    APP_VERSION: PackageInfo.version,
  },
  transpilePackages: ['tdesign-react'],
};

export default nextConfig;
