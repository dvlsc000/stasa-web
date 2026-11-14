import { defineConfig } from 'astro/config';
import site from './content/site.json' with { type: 'json' };

// https://docs.astro.build — static multi-language build
export default defineConfig({
  site: site.siteUrl,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  compressHTML: true,
  devToolbar: { enabled: false },
  vite: { build: { assetsInlineLimit: 2048 } },
});
