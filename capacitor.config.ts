import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nexustrading.app',
  appName: 'Nexus Trading Bot',
  webDir: 'out',
  server: {
    url: 'https://trading-bot-nu-khaki.vercel.app',
    cleartext: true
  }
};

export default config;
