const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const BRAND = '#635BFF';
const BRAND_LIGHT = '#8B7BFF';
const BRAND_DARK = '#4B45D6';

const FONT_STACK = "system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

function gradientDefs(id) {
  return `
    <linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BRAND_LIGHT}"/>
      <stop offset="100%" stop-color="${BRAND_DARK}"/>
    </linearGradient>
  `;
}

async function buildIcon() {
  const size = 1024;
  const cornerRadius = Math.round(size * 0.2237);
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${gradientDefs('iconGrad')}
        <clipPath id="round">
          <rect x="0" y="0" width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}"/>
        </clipPath>
      </defs>
      <g clip-path="url(#round)">
        <rect width="${size}" height="${size}" fill="url(#iconGrad)"/>
        <g transform="translate(${size / 2} ${size / 2})">
          <text
            x="0"
            y="0"
            text-anchor="middle"
            dominant-baseline="central"
            font-family="${FONT_STACK}"
            font-weight="800"
            font-size="${size * 0.62}"
            fill="#FFFFFF"
            letter-spacing="-${size * 0.04}"
          >S</text>
        </g>
      </g>
    </svg>
  `;
  await sharp(Buffer.from(svg)).png().toFile(path.join(ASSETS_DIR, 'icon.png'));
  console.log('  icon.png written');
}

async function buildSplash() {
  const w = 1284;
  const h = 2778;
  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${gradientDefs('splashGrad')}
      </defs>
      <rect width="${w}" height="${h}" fill="url(#splashGrad)"/>
      <g transform="translate(${w / 2} ${h / 2})">
        <text
          x="0"
          y="-40"
          text-anchor="middle"
          dominant-baseline="central"
          font-family="${FONT_STACK}"
          font-weight="800"
          font-size="200"
          fill="#FFFFFF"
          letter-spacing="-8"
        >ShipEasy</text>
        <text
          x="0"
          y="120"
          text-anchor="middle"
          dominant-baseline="central"
          font-family="${FONT_STACK}"
          font-weight="500"
          font-size="64"
          fill="#FFFFFF"
          fill-opacity="0.85"
          letter-spacing="2"
        >CANADA</text>
      </g>
    </svg>
  `;
  await sharp(Buffer.from(svg)).png().toFile(path.join(ASSETS_DIR, 'splash.png'));
  console.log('  splash.png written');
}

async function buildAdaptiveIcon() {
  const size = 1024;
  const safeInset = size * 0.20;
  const glyphSize = size - safeInset * 2;
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(${size / 2} ${size / 2})">
        <text
          x="0"
          y="0"
          text-anchor="middle"
          dominant-baseline="central"
          font-family="${FONT_STACK}"
          font-weight="800"
          font-size="${glyphSize * 0.85}"
          fill="#FFFFFF"
          letter-spacing="-${glyphSize * 0.05}"
        >S</text>
      </g>
    </svg>
  `;
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(ASSETS_DIR, 'adaptive-icon.png'));
  console.log('  adaptive-icon.png written');
}

async function buildFavicon() {
  const size = 48;
  const cornerRadius = Math.round(size * 0.22);
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${gradientDefs('favGrad')}
        <clipPath id="favRound">
          <rect x="0" y="0" width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}"/>
        </clipPath>
      </defs>
      <g clip-path="url(#favRound)">
        <rect width="${size}" height="${size}" fill="url(#favGrad)"/>
        <g transform="translate(${size / 2} ${size / 2})">
          <text
            x="0"
            y="0"
            text-anchor="middle"
            dominant-baseline="central"
            font-family="${FONT_STACK}"
            font-weight="800"
            font-size="${size * 0.65}"
            fill="#FFFFFF"
          >S</text>
        </g>
      </g>
    </svg>
  `;
  await sharp(Buffer.from(svg)).png().toFile(path.join(ASSETS_DIR, 'favicon.png'));
  console.log('  favicon.png written');
}

(async () => {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }
  console.log('Building branded assets...');
  await buildIcon();
  await buildSplash();
  await buildAdaptiveIcon();
  await buildFavicon();
  console.log('Done.');
})();
