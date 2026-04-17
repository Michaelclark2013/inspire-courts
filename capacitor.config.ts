import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.inspirecourts.app',
  appName: 'Inspire Courts',
  webDir: 'out',
  server: {
    url: 'https://inspirecourtsaz.com',
    cleartext: false,
  },
  ios: {
    scheme: 'Inspire Courts',
    backgroundColor: '#0B1D3A',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#0B1D3A',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0B1D3A',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
