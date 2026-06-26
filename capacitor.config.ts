import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.themanifestor.app',
  appName: 'the-manifestor',
  webDir: 'out',
  server: {
    url: 'https://the-manifestor.sahajbalgunde.com/',
    cleartext: true
  }
};

export default config;
