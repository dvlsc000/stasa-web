#!/usr/bin/env node
/**
 * Image pipeline. Runs automatically before `npm run dev` and `npm run build`.
 *
 * Reads every photo in /public/images/works, /public/images/cutouts and /public/images
 * (portrait), and writes responsive AVIF + WebP versions to /public/images/_gen, plus a tiny
 * blurred preview. The list of what exists is saved to src/data/image-manifest.json, which the
 * site reads. A work whose photo is missing simply shows its stitched placeholder.
 *
 * Already-generated files are skipped, so re-running is fast.
 */
import { readdir, mkdir, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// fileURLToPath gives a correct path on Windows, macOS and Linux
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUB = path.join(ROOT, 'public');
const OUT = path.join(PUB, 'images', '_gen');
const DIRS = ['images/works', 'images/cutouts', 'images'];
const WIDTHS = [480, 800, 1200, 1800];
const EXT = /\.(jpe?g|png|webp|avif|tiff?)$/i;

await mkdir(OUT, { recursive: true });
const manifest = {};

for (const dir of DIRS) {
  const abs = path.join(PUB, dir);
  if (!existsSync(abs)) continue;
  for (const file of (await readdir(abs)).sort()) {
    if (!EXT.test(file)) continue;
    const src = path.join(abs, file);
    if (!(await stat(src)).isFile()) continue;
    const key = `/${dir}/${file}`;  // dir is written with / above, so keys match on every OS
    const base = `${dir.replace(/\//g, '-')}-${file.replace(EXT, '')}`;
    const img = sharp(src, { failOn: 'none' }).rotate();
    const meta = await img.metadata();
    const w0 = meta.autoOrient?.width ?? meta.width, h0 = meta.autoOrient?.height ?? meta.height;
    const alpha = !!meta.hasAlpha;
    const widths = WIDTHS.filter((w) => w < w0).concat(Math.min(w0, 2400));
    const sources = { avif: [], webp: [] };
    for (const w of [...new Set(widths)]) {
      for (const fmt of ['avif', 'webp']) {
        const name = `${base}-${w}.${fmt}`;
        const dest = path.join(OUT, name);
        if (!existsSync(dest)) {
          const pipe = sharp(src, { failOn: 'none' }).rotate().resize({ width: w, withoutEnlargement: true });
          await (fmt === 'avif' ? pipe.avif({ quality: 52, effort: 4 }) : pipe.webp({ quality: 76, alphaQuality: 90 })).toFile(dest);
        }
        sources[fmt].push(`/images/_gen/${name} ${w}w`);  // URL paths always use /
      }
    }
    const lqipBuf = await sharp(src, { failOn: 'none' }).rotate().resize({ width: 16 }).blur(1.2).webp({ quality: 40 }).toBuffer();
    // a jpeg/png fallback for very old browsers and for Open Graph
    const fbName = `${base}-1200.${alpha ? 'png' : 'jpg'}`;
    const fbDest = path.join(OUT, fbName);
    if (!existsSync(fbDest)) {
      const pipe = sharp(src, { failOn: 'none' }).rotate().resize({ width: 1200, withoutEnlargement: true });
      await (alpha ? pipe.png({ compressionLevel: 9 }) : pipe.jpeg({ quality: 78, mozjpeg: true })).toFile(fbDest);
    }
    manifest[key] = {
      width: w0, height: h0, alpha,
      avif: sources.avif.join(', '), webp: sources.webp.join(', '),
      fallback: `/images/_gen/${fbName}`,
      lqip: `data:image/webp;base64,${lqipBuf.toString('base64')}`,
    };
  }
}

await writeFile(path.join(ROOT, 'src', 'data', 'image-manifest.json'), JSON.stringify(manifest, null, 1));
console.log(`images: ${Object.keys(manifest).length} source image(s) ready`);
