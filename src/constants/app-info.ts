import PackageJson from '../../package.json'

class AppInfo {
  static readonly version = PackageJson.version
  static readonly githubRepo = 'https://github.com/InfSein/frontline-overlay'
  static readonly changelogDoc = 'https://infsein.github.io/frontline-overlay/changelog'
}

export default AppInfo
