const { join } = require('node:path')

module.exports = {
  appId: 'com.phonivra.desktop',
  productName: 'Phonivra',
  icon: 'public/logos/phonivra-icon.png',
  asar: true,
  // The staged app contains the compiled bundles and has no Node dependencies to collect.
  beforeBuild: () => false,
  directories: { app: '.release/app', output: '.release/installers' },
  files: ['out/**/*'],
  extraResources: [
    { from: '.release/engine', to: 'engine' },
    { from: join(__dirname, '../../LICENSE'), to: 'LICENSE' },
    { from: join(__dirname, '../../THIRD_PARTY_NOTICES.md'), to: 'THIRD_PARTY_NOTICES.md' },
    {
      from: join(__dirname, '../../licenses/RESEMBLE-AI-MIT.txt'),
      to: 'licenses/RESEMBLE-AI-MIT.txt'
    }
  ],
  electronFuses: {
    runAsNode: false,
    enableNodeOptionsEnvironmentVariable: false,
    enableNodeCliInspectArguments: false,
    grantFileProtocolExtraPrivileges: false,
    enableEmbeddedAsarIntegrityValidation: true,
    onlyLoadAppFromAsar: true
  },
  mac: {
    target: 'dmg',
    category: 'public.app-category.productivity',
    hardenedRuntime: true,
    entitlements: 'scripts/entitlements.mac.plist',
    entitlementsInherit: 'scripts/entitlements.mac.plist',
    extendInfo: {
      NSMicrophoneUsageDescription: 'Record a voice reference for local speech generation.'
    }
  },
  win: { target: 'nsis', signExts: ['.exe', '.dll', '.pyd'] },
  linux: {
    target: 'deb',
    category: 'AudioVideo',
    syncDesktopName: true,
    maintainer: 'Phonivra contributors'
  },
  deb: {
    // Include Electron's graphics and audio libraries and the FFmpeg system dependencies.
    depends: [
      'libc6 (>= 2.35)',
      'libgtk-3-0',
      'libnotify4',
      'libnss3',
      'libxss1',
      'libxtst6',
      'xdg-utils',
      'libatspi2.0-0',
      'libuuid1',
      'libsecret-1-0',
      'libgbm1',
      'libasound2t64 | libasound2',
      'libpulse0'
    ]
  }
}
