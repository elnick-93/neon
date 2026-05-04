import { defineConfig } from 'vite';

// Capacitor native plugins are resolved at runtime inside the native WebView.
// They must be treated as external during the web build.
const capacitorExternals = [
  '@capacitor/haptics',
  '@capacitor/status-bar',
  '@capacitor/splash-screen',
  '@capacitor/app',
  '@capacitor/local-notifications',
  '@revenuecat/purchases-capacitor',
];

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    rollupOptions: {
      external: capacitorExternals,
      output: {
        manualChunks: {
          phaser: ['phaser']
        }
      }
    }
  },
  server: {
    host: true,
    port: 5173
  }
});
