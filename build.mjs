import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';

mkdirSync('demo/dist', { recursive: true });
await build({ entryPoints: ['demo/main.js'], bundle: true, minify: true, format: 'iife', outfile: 'demo/dist/main.js', target: 'es2020', logLevel: 'info' });

// single-file build: inline css, js and images (for sharing or publishing as one page)
let html = readFileSync('demo/index.html', 'utf8');
const css = readFileSync('demo/style.css', 'utf8');
const js = readFileSync('demo/dist/main.js', 'utf8').replace(/<\/script>/g, '<\\/script>');
html = html.replace('<link rel="stylesheet" href="style.css">', `<style>${css}</style>`);
for (const f of readdirSync('demo/assets')) {
  const b64 = readFileSync('demo/assets/' + f).toString('base64');
  html = html.split(`assets/${f}`).join(`data:image/jpeg;base64,${b64}`);
}
html = html.replace('<script src="dist/main.js"></script>', () => `<script>${js}</script>`);
writeFileSync('demo/dist/demo.single.html', html);
console.log('single file KB:', Math.round(html.length / 1024));

// artifact build: page content only (no doctype/html/head/body) with title + viewport meta, for the Artifact viewer
const body = html.match(/<body>([\s\S]*)<\/body>/)[1];
const fonts = html.match(/<link rel="stylesheet" href="https:\/\/fonts[^>]+>/)[0];
const art = `<title>Bách Ngộ GSAP Kit</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n${fonts}\n<style>${css}</style>\n${body}`;
writeFileSync('demo/dist/demo.artifact.html', art);
console.log('artifact file KB:', Math.round(art.length / 1024));
