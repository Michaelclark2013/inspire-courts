import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.inspirecourts.admin',
  appName: 'Inspire Admin',
  webDir: 'out',
  server: {
    url: 'https://inspirecourtsaz.com/admin',
    cleartext: false,
  },
  ios: {
    scheme: 'Inspire Admin',
    backgroundColor: '#CC0000',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#CC0000',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#CC0000',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
