// Génère public/favicon.ico (16/32/48, PNG embarqués) et une og-image.jpg provisoire.
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const src = 'assets/icone/icon-1024.png';
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((s) => sharp(src).resize(s, s).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const e = 6 + i * 16;
  header.writeUInt8(s, e); header.writeUInt8(s, e + 1);
  header.writeUInt16LE(1, e + 4); header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(pngs[i].length, e + 8); header.writeUInt32LE(offset, e + 12);
  offset += pngs[i].length;
});
await writeFile('public/favicon.ico', Buffer.concat([header, ...pngs]));

const icon = await sharp(src).resize(220, 220).composite([{
  input: Buffer.from('<svg width="220" height="220"><rect width="220" height="220" rx="50" ry="50"/></svg>'),
  blend: 'dest-in',
}]).png().toBuffer();
const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<defs><radialGradient id="g" cx="0.5" cy="0.5" r="0.5">
<stop offset="0" stop-color="#B5892E" stop-opacity="0.28"/><stop offset="0.45" stop-color="#6B1E23" stop-opacity="0.14"/><stop offset="1" stop-color="#15120E" stop-opacity="0"/></radialGradient></defs>
<rect width="1200" height="630" fill="#15120E"/>
<circle cx="250" cy="315" r="420" fill="url(#g)"/>
<circle cx="250" cy="315" r="230" fill="none" stroke="#B5892E" stroke-opacity="0.35" stroke-width="1"/>
<circle cx="250" cy="315" r="214" fill="none" stroke="#B5892E" stroke-opacity="0.3" stroke-width="1" stroke-dasharray="2 9"/>
<text x="470" y="290" font-family="Cormorant Garamond, Georgia, serif" font-size="104" fill="#F7F1E3">Bibliae</text>
<text x="474" y="370" font-family="Cormorant Garamond, Georgia, serif" font-style="italic" font-size="46" fill="#E2BE6E">La Parole, la prière, l'Église.</text>
<text x="476" y="430" font-family="Inter, Arial, sans-serif" font-size="22" letter-spacing="3" fill="#F7F1E3" fill-opacity="0.7">BIBLE · LITURGIE · CHAPELET</text>
</svg>`;
await sharp(Buffer.from(bg)).composite([{ input: icon, left: 140, top: 205 }]).jpeg({ quality: 88 }).toFile('public/og-image.jpg');
console.log('ok');
