import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      devOptions: {
        enabled: false, // Disable in dev to prevent conflicts
      },
      // Use Firebase service worker as the main service worker
      injectRegister: false,
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'sproutsync-pwa-192x192.png', 'sproutsync-pwa-512x512.png'],
      manifest: {
        name: 'SproutSync',
        short_name: 'SproutSync',
        description: 'Track and care for your plants',
        theme_color: '#10b981',
        background_color: '#f0fdf4',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'sproutsync-pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'sproutsync-pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
        ],
      },
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});