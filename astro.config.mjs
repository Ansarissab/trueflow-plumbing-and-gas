// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Fully static output — deploys to Cloudflare Pages as-is (build: `npm run build`, output dir: `dist`).
export default defineConfig({
  site: 'https://trueflow-demo.pages.dev',
  integrations: [sitemap()],
});
