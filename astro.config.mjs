// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Fully static output — deploys to Cloudflare as-is (build: `npm run build`, output dir: `dist`).
// `site` matches the live deployment so canonical URLs, og:urls, JSON-LD IDs
// and the sitemap all resolve to the real domain.
export default defineConfig({
  site: 'https://trueflow-plumbing-and-gas.zahidensari116.workers.dev',
  integrations: [sitemap()],
});
