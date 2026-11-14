import { LANGS, works, site } from '../lib/content';

// Every page in every language, with hreflang alternates.
export function GET() {
  const paths = ['', ...works.map((w) => `work/${w.slug}/`)];
  const u = (l: string, p: string) => new URL(`/${l}/${p}`, site.siteUrl).href;
  const body = paths.flatMap((p) => LANGS.map((l) =>
    `<url><loc>${u(l, p)}</loc>${LANGS.map((a) => `<xhtml:link rel="alternate" hreflang="${a}" href="${u(a, p)}"/>`).join('')}</url>`)).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${body}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } });
}
