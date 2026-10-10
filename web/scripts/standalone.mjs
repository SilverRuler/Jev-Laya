import { readFile, writeFile } from 'node:fs/promises';
// Preserve the downloadable, self-contained page alongside Vite's normal output.
let html = await readFile('dist/index.html', 'utf8');
for (const match of [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)]) {
  const code = await readFile(`dist/${match[1].replace(/^\//, '')}`, 'utf8');
  html = html.replace(match[0], () => `<script type="module">${code.replace(/<\/script/gi, '<\\/script')}</script>`);
}
for (const match of [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)]) {
  const css = await readFile(`dist/${match[1].replace(/^\//, '')}`, 'utf8');
  html = html.replace(match[0], () => `<style>${css}</style>`);
}
await writeFile('dist/jev-lab.html', html);
console.log('Standalone React page written to dist/jev-lab.html');
