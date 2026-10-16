import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { createHash } from "node:crypto";
function offlineShell(): Plugin {
  return {
    name: "still-offline-shell",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle).filter((file) =>
        /\.(js|css|html)$/.test(file),
      );
      const version = createHash("sha256")
        .update(
          assets
            .map((file) => {
              const entry = bundle[file];
              return entry.type === "chunk" ? entry.code : String(entry.source);
            })
            .join(""),
        )
        .digest("hex")
        .slice(0, 16);
      const files = [
        "/",
        "/index.html",
        "/manifest.json",
        "/favicon.ico",
        "/icons/still.svg",
        "/icons/icon-192.png",
        "/icons/icon-512.png",
        "/icons/icon-maskable.png",
        "/icons/apple-touch-icon.png",
        ...assets.map((file) => "/" + file),
      ];
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: `
const CACHE = 'still-shell-${version}';
const FILES = ${JSON.stringify([...new Set(files)])};
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('still-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
 const url = new URL(event.request.url);
 if(event.request.method !== 'GET' || url.origin !== self.location.origin) return;
 if(event.request.mode === 'navigate') { event.respondWith(fetch(event.request).catch(() => caches.match('/index.html'))); return; }
 if(FILES.includes(url.pathname)) event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
`,
      });
    },
  };
}
export default defineConfig({ plugins: [react(), offlineShell()] });
