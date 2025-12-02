import fs from 'fs';
import QRCode from 'qrcode';

const [, , url, outPath = 'qr.svg'] = process.argv;
if (!url) {
  console.error('Usage: node make-qr.js <url> [outPath]');
  process.exit(2);
}

QRCode.toString(url, { type: 'svg', margin: 1 }, (err, svg) => {
  if (err) {
    console.error('QR generation failed:', err);
    process.exit(1);
  }
  fs.writeFileSync(outPath, svg, 'utf8');
  console.log('Wrote', outPath);
});
