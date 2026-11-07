// @ts-check
import { defineConfig } from 'astro/config';

// Moral Service — homepage redesign.
//
// Static output. Every route except the homepage is a verbatim copy of the
// existing site (public/about, public/plumber-gold-coast, …), so their URLs,
// assets and behaviour are untouched. Only src/pages/index.astro is authored.
export default defineConfig({
  site: 'https://moralservice.com.au',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
  server: {
    port: 4321,
  },
});
