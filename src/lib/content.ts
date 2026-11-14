import worksJson from '../../content/works.json';
import siteJson from '../../content/site.json';
import exhibitionsJson from '../../content/exhibitions.json';
import hr from '../../content/i18n/hr.json';
import en from '../../content/i18n/en.json';
import nl from '../../content/i18n/nl.json';
import es from '../../content/i18n/es.json';
import de from '../../content/i18n/de.json';
import fr from '../../content/i18n/fr.json';
import manifestJson from '../data/image-manifest.json';

export const LANGS = ['hr', 'en', 'nl', 'es', 'de', 'fr'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'hr';

export interface Work {
  id: string; slug: string; wing: 'wearable' | 'wall'; room: string; year: number;
  image: string; cutout?: string; gallery?: string[]; dimensions: string;
  available: boolean; price: number | null; depth: number; wallpaper: string;
  placeholder?: string; size?: string; frame?: string;
}
export interface WorkText { title: string; materials: string; technique: string; story: string; alt: string }
export interface ImageInfo { width: number; height: number; alpha: boolean; avif: string; webp: string; fallback: string; lqip: string }

const DICTS = { hr, en, nl, es, de, fr } as Record<Lang, { ui: Record<string, any>; works: Record<string, WorkText> }>;
export const site = siteJson;
export const works = worksJson as Work[];
export const exhibitions = exhibitionsJson.items;
export const manifest = manifestJson as Record<string, ImageInfo>;

export const WEARABLE_ROOMS = ['hats', 'headpieces', 'bags', 'parasols', 'textiles', 'clothes'] as const;
export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

export const wearable = () => works.filter((w) => w.wing === 'wearable');
export const wall = () => works.filter((w) => w.wing === 'wall');
export const byRoom = (room: string) => works.filter((w) => w.room === room);
/** order used for prev/next in the Plate: walk order, then the salon wall */
export const plateOrder = () => [...WEARABLE_ROOMS.flatMap((r) => byRoom(r)), ...wall()];

export function t(lang: Lang) {
  const d = DICTS[lang] ?? DICTS[DEFAULT_LANG];
  const fb = DICTS[DEFAULT_LANG];
  const ui = (key: string): any => d.ui[key] ?? fb.ui[key] ?? key;
  const work = (id: string): WorkText => d.works[id] ?? fb.works[id] ?? { title: id, materials: '', technique: '', story: '', alt: '' };
  return { ui, work, lang };
}

export const plateNo = (id: string) => id.replace('pl-', '');
export const img = (src?: string) => (src ? manifest[src] : undefined);
export const hasImage = (w: Work) => !!img(w.image);
export const hasCutout = (w: Work) => !!img(w.cutout);

const LOCALE: Record<Lang, string> = { hr: 'hr-HR', en: 'en-GB', nl: 'nl-NL', es: 'es-ES', de: 'de-DE', fr: 'fr-FR' };
export const price = (lang: Lang, n: number | null) =>
  n == null ? null : new Intl.NumberFormat(LOCALE[lang], { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

/** typographic quotes per language */
export const quote = (lang: Lang, s: string) =>
  ({ hr: `„${s}“`, de: `„${s}“`, en: `“${s}”`, nl: `‘${s}’`, es: `«${s}»`, fr: `«\u00A0${s}\u00A0»` })[lang];

export const workUrl = (lang: Lang, w: Work) => `/${lang}/work/${w.slug}/`;
