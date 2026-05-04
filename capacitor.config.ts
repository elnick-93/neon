import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lumipet.app',
  appName: 'Lumipet',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a0e2e',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a0e2e',
    },
    LocalNotifications: {
      smallIcon: 'ic_lumipet_notif',
      iconColor: '#f9a8d4',
    },
  },
};

export default config;
