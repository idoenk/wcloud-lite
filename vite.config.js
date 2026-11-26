import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

function copyTimdreamWorkers() {
  const workers = ['wordfreq.worker.js', 'downloader-worker.js'];
  return {
    name: 'copy-timdream-workers',
    generateBundle() {
      for (const file of workers) {
        const source = readFileSync(resolve(__dirname, 'src/lib/timdream', file), 'utf8');
        this.emitFile({
          type: 'asset',
          fileName: `workers/${file}`,
          source,
        });
      }
    },
  };
}

export default defineConfig({
  base: './',
  publicDir: 'public',
  plugins: [copyTimdreamWorkers()],
  build: {
    outDir: 'build',
    emptyOutDir: true,
    cssCodeSplit: true,
    assetsInlineLimit: 0,
    sourcemap: false,
    rollupOptions: {
      input: {
        'timdream-app': resolve(__dirname, 'src/timdream/index.js'),
        'vendor-app': resolve(__dirname, 'src/vendor/index.js'),
        'wcloud-app': resolve(__dirname, 'src/wcloud/main.js'),
      },
      moduleContext: {
        [resolve(__dirname, 'src/lib/timdream/wordfreq.js')]: 'window',
        [resolve(__dirname, 'src/lib/timdream/wordcloud2.js')]: 'window',
      },
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames(assetInfo) {
          const names = assetInfo.names || (assetInfo.name ? [assetInfo.name] : []);
          const fileName = names[0] || '';
          if (fileName.endsWith('.css')) {
            return '[name][extname]';
          }
          if (/\.(woff2?|ttf|eot|otf)$/i.test(fileName)) {
            return 'fonts/[name][extname]';
          }
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(fileName)) {
            return 'images/[name][extname]';
          }
          return 'assets/[name][extname]';
        },
      },
    },
  },
});
