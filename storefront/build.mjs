import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('storefront/dist', { recursive: true });
await build({
  entryPoints: ['storefront/src/main.js'], bundle: true, minify: true, format: 'iife', outfile: 'storefront/dist/main.js', target: 'es2020',
  loader: { '.jpg': 'dataurl' }, logLevel: 'info',
});
let html = readFileSync('storefront/index.html', 'utf8');
const css = readFileSync('storefront/style.css', 'utf8');
const js = readFileSync('storefront/dist/main.js', 'utf8').replace(/<\/script>/g, '<\\/script>');
const inlined = html.replace('<link rel="stylesheet" href="style.css">', `<style>${css}</style>`).replace('<script src="dist/main.js"></script>', () => `<script>${js}</script>`);
writeFileSync('storefront/dist/storefront.single.html', inlined);
const body = inlined.match(/<body>([\s\S]*)<\/body>/)[1];
const fonts = inlined.match(/<link rel="stylesheet" href="https:\/\/fonts[^>]+>/)[0];
const art = `<title>Bách Ngộ Storefront</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n${fonts}\n<style>${css}</style>\n${body}`;
writeFileSync('storefront/dist/storefront.artifact.html', art);
console.log('single KB:', Math.round(inlined.length / 1024), ' artifact KB:', Math.round(art.length / 1024));
