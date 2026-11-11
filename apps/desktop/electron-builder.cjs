const { join } = require('node:path')

module.exports = {
  appId: 'com.phonivra.desktop',
  productName: 'Phonivra',
  electronDist: join(__dirname, 'node_modules', 'electron', 'dist'),
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
    maintainer: 'Phonivra contributors'
  }
}
