import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'Scribe',
  description: 'Generate a README for the GitHub repository you are viewing, powered by Groq.',
  version: pkg.version,
  icons: {
    16: 'public/icons/icon16.png',
    48: 'public/icons/icon48.png',
    128: 'public/icons/icon128.png',
  },
  action: {
    default_popup: 'src/popup/popup.html',
    default_icon: {
      16: 'public/icons/icon16.png',
      48: 'public/icons/icon48.png',
      128: 'public/icons/icon128.png',
    },
  },
  background: {
    service_worker: 'src/background/background.js',
    type: 'module',
  },
  permissions: ['storage', 'activeTab'],
  host_permissions: ['https://api.groq.com/*', 'https://api.github.com/*'],
})
