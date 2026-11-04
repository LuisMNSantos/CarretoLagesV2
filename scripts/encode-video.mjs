// Encodes the hero background video into lightweight variants (spec: "Vídeo de fundo").
// Usage: VIDEO_SRC=path/to/Aveiro.mp4 npm run video   (default: ../CarretoLagesLawyer/web/public/Aveiro.mp4)
// The 4K source is never copied into this repository.
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ffmpeg = require('ffmpeg-static');
const src = process.env.VIDEO_SRC ?? '../CarretoLagesLawyer/web/public/Aveiro.mp4';
const DURATION = '15';
const MB = 1_000_000;

const variants = [
  // Capped-quality encodes: CRF for quality, maxrate (kbit/s) so the water texture cannot blow the budget.
  { name: 'mobile', vf: 'crop=ih*9/16:ih,scale=720:1280:flags=lanczos', budget: 2.5 * MB, crf: { mp4: 28, webm: 36 }, kbps: 1150 },
  { name: 'tablet', vf: 'scale=1280:720:flags=lanczos', budget: 4 * MB, crf: { mp4: 27, webm: 35 }, kbps: 1850 },
  { name: 'desktop', vf: 'scale=1920:1080:flags=lanczos', budget: 8 * MB, crf: { mp4: 26, webm: 34 }, kbps: 3800 },
];

mkdirSync('public/video', { recursive: true });
mkdirSync('src/assets', { recursive: true });

const run = (args) => execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });

function encode(v, ext, crf, kbps) {
  const out = `public/video/hero-${v.name}.${ext}`;
  const rate = ['-maxrate', `${kbps}k`, '-bufsize', `${kbps * 2}k`];
  const common = ['-i', src, '-t', DURATION, '-an', '-vf', `${v.vf},fps=25`, '-pix_fmt', 'yuv420p'];
  if (ext === 'mp4') {
    run([...common, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), ...rate, '-profile:v', 'high', '-movflags', '+faststart', out]);
  } else {
    run([...common, '-c:v', 'libvpx-vp9', '-crf', String(crf), '-b:v', `${kbps}k`, ...rate, '-row-mt', '1', '-deadline', 'good', '-cpu-used', '4', out]);
  }
  return { out, size: statSync(out).size };
}

for (const v of variants) {
  for (const ext of ['mp4', 'webm']) {
    let crf = v.crf[ext];
    let kbps = v.kbps;
    let r = encode(v, ext, crf, kbps);
    while (r.size > v.budget && kbps > 300) {
      kbps = Math.round(kbps * 0.85);
      r = encode(v, ext, crf, kbps);
    }
    console.log(`${r.out}  ${(r.size / MB).toFixed(2)} MB  (crf ${crf}, max ${kbps} kbit/s)`);
    if (r.size > v.budget) throw new Error(`${r.out} exceeds budget`);
  }
}

// Posters: the first frame, landscape and portrait crops (Astro converts to AVIF/WebP at build time).
run(['-ss', '0.2', '-i', src, '-frames:v', '1', '-vf', 'scale=1920:1080:flags=lanczos', '-q:v', '3', 'src/assets/hero-poster.jpg']);
run(['-ss', '0.2', '-i', src, '-frames:v', '1', '-vf', 'crop=ih*9/16:ih,scale=720:1280:flags=lanczos', '-q:v', '3', 'src/assets/hero-poster-portrait.jpg']);
console.log('posters written');

// Social sharing image (Open Graph), 1200×630, from the landscape poster.
run(['-i', 'src/assets/hero-poster.jpg', '-vf', 'crop=iw:iw*630/1200,scale=1200:630:flags=lanczos', '-q:v', '4', 'public/og-image.jpg']);
console.log('og image written');
