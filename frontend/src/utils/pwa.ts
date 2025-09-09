import { Workbox } from 'workbox-window';

let wb: Workbox | null = null;

export const registerSW = () => {
  if ('serviceWorker' in navigator) {
    wb = new Workbox('/sw.js');
    wb.register();
  }
};