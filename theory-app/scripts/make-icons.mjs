// Renders the SVG app icon to the PNG sources that @capacitor/assets expects.
import sharp from 'sharp';
import { mkdir, readFile } from 'node:fs/promises';

const svg = await readFile(new URL('../www/img/icon.svg', import.meta.url));
await mkdir(new URL('../assets', import.meta.url), { recursive: true });
const out = (n) => new URL('../assets/' + n, import.meta.url).pathname;
await sharp(svg, { density: 300 }).resize(1024, 1024).png().toFile(out('icon-only.png'));
// Adaptive icon: foreground = the symbol on transparent, background = brand blue.
const fg = Buffer.from(
  svg.toString().replace(/<rect[^>]*\/>/, '').replace('viewBox="0 0 512 512"', 'viewBox="-128 -128 768 768"')
);
await sharp(fg, { density: 300 }).resize(1024, 1024).png().toFile(out('icon-foreground.png'));
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#1f6feb' } }).png().toFile(out('icon-background.png'));
await sharp({ create: { width: 2732, height: 2732, channels: 4, background: '#f5f7fb' } })
  .composite([{ input: await sharp(svg, { density: 300 }).resize(600, 600).png().toBuffer(), gravity: 'center' }])
  .png()
  .toFile(out('splash.png'));
await sharp({ create: { width: 2732, height: 2732, channels: 4, background: '#0e1117' } })
  .composite([{ input: await sharp(svg, { density: 300 }).resize(600, 600).png().toBuffer(), gravity: 'center' }])
  .png()
  .toFile(out('splash-dark.png'));
console.log('icons written to assets/');
