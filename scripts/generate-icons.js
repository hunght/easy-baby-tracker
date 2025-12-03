#!/usr/bin/env node
/**
 * Icon generation script
 * - Reads SVG logo and exports PNG raster variants used by Expo config.
 * - Overwrites existing image assets if present.
 *
 * Usage: `npm run generate:icons`
 */

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const SVG_PATH = path.resolve(__dirname, '../assets/images/logo.svg');
const OUT_DIR = path.resolve(__dirname, '../assets/images');

if (!fs.existsSync(SVG_PATH)) {
  console.error('Logo SVG not found at', SVG_PATH);
  process.exit(1);
}

const svgData = fs.readFileSync(SVG_PATH, 'utf8');

// Target outputs (size px, filename, optional background color for solid fills)
const targets = [
  { size: 1024, name: 'icon.png' }, // main app icon (iOS App Store)
  { size: 1024, name: 'adaptive-icon.png' }, // Android adaptive icon (same as main icon)
  { size: 512, name: 'splash-icon.png' }, // splash image (referenced by expo-splash-screen plugin)
  { size: 512, name: 'playstore-icon.png' }, // Google Play Store app icon (512x512 required)
  { size: 64, name: 'favicon.png' }, // web favicon
  { size: 432, name: 'android-icon-foreground.png' }, // Android adaptive foreground
  { size: 432, name: 'android-icon-monochrome.png', monochrome: true }, // Android 13+ monochrome
];

// Monochrome SVG variant (single color, no gradient)
const monoSvgData = svgData
  .replace(/fill="url\(#babyEaseGrad\)"/g, 'fill="#5B7FFF"')
  .replace(/<defs>[\s\S]*?<\/defs>/g, '');

function render(size, name, options = {}) {
  const source = options.monochrome ? monoSvgData : svgData;
  const resvg = new Resvg(source, {
    fitTo: { mode: 'width', value: size },
    background: options.background || 'transparent',
  });
  const png = resvg.render().asPng();
  const outPath = path.join(OUT_DIR, name);
  fs.writeFileSync(outPath, png);
  console.log(`Generated ${name} (${size}px)`);
}

// Generate solid background for Android adaptive icon
function renderBackground() {
  const bgColor = '#ffffff'; // White background for adaptive icon
  const size = 432;
  const canvas = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" fill="${bgColor}"/></svg>`;
  const resvg = new Resvg(canvas, { fitTo: { mode: 'width', value: size } });
  const png = resvg.render().asPng();
  const outPath = path.join(OUT_DIR, 'android-icon-background.png');
  fs.writeFileSync(outPath, png);
  console.log(`Generated android-icon-background.png (${size}px, solid ${bgColor})`);
}

// Generate splash screen with gradient background and decorative elements
function renderSplash() {
  const width = 1284;
  const height = 2778;

  // Brand colors
  const PRIMARY = '#5B7FFF';
  const ACCENT = '#FF8AB8';
  const MINT = '#7FE3CC';
  const LAVENDER = '#C7B9FF';

  // Extract logo content to embed
  const logoContent = svgData
    .replace(/<\?xml[^>]*>/, '')
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>/, '');

  const splashSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Gradient background -->
  <defs>
    <linearGradient id="splashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${PRIMARY};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${LAVENDER};stop-opacity:1" />
    </linearGradient>

    <!-- Decorative circles -->
    <radialGradient id="splashCircle1" cx="50%" cy="50%">
      <stop offset="0%" style="stop-color:${MINT};stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:${MINT};stop-opacity:0" />
    </radialGradient>
    <radialGradient id="splashCircle2" cx="50%" cy="50%">
      <stop offset="0%" style="stop-color:${ACCENT};stop-opacity:0.25" />
      <stop offset="100%" style="stop-color:${ACCENT};stop-opacity:0" />
    </radialGradient>
    <radialGradient id="splashCircle3" cx="50%" cy="50%">
      <stop offset="0%" style="stop-color:white;stop-opacity:0.15" />
      <stop offset="100%" style="stop-color:white;stop-opacity:0" />
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#splashGrad)"/>

  <!-- Decorative circles -->
  <circle cx="200" cy="400" r="280" fill="url(#splashCircle1)"/>
  <circle cx="1000" cy="1800" r="350" fill="url(#splashCircle2)"/>
  <circle cx="100" cy="2200" r="200" fill="url(#splashCircle3)"/>
  <circle cx="1100" cy="600" r="180" fill="url(#splashCircle3)"/>

  <!-- Centered logo -->
  <g transform="translate(${width/2 - 200}, ${height/2 - 200}) scale(2.5)">
    ${logoContent}
  </g>

  <!-- App name below logo -->
  <text x="${width/2}" y="${height/2 + 380}"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="56"
        font-weight="bold"
        fill="white"
        text-anchor="middle">
    Easy Baby Tracker
  </text>
</svg>`;

  const resvg = new Resvg(splashSvg, {
    fitTo: { mode: 'width', value: width },
  });
  const png = resvg.render().asPng();
  const outPath = path.join(OUT_DIR, 'splash.png');
  fs.writeFileSync(outPath, png);
  console.log(`Generated splash.png (${width}x${height})`);
}

// Generate feature graphic for Google Play (landscape banner)
function renderFeatureGraphic() {
  const bgColor = '#5B7FFF'; // Primary brand color
  const width = 1024;
  const height = 500;

  const canvas = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="${bgColor}"/>
  </svg>`;
  const resvg = new Resvg(canvas, { fitTo: { mode: 'width', value: width } });
  const png = resvg.render().asPng();
  const outPath = path.join(OUT_DIR, 'feature-graphic.png');
  fs.writeFileSync(outPath, png);
  console.log(`Generated feature-graphic.png (${width}x${height})`);
}

try {
  targets.forEach(t => render(t.size, t.name, t));
  renderBackground();
  renderSplash();
  renderFeatureGraphic();
  console.log('Icon generation complete.');
  console.log('\nNext steps:');
  console.log('- Verify images visually.');
  console.log('- Commit changes: git add assets/images/*.png && git commit -m "chore: regenerate app icons"');
  console.log('- Restart Expo server if running.');
  console.log('\nTo test on real device:');
  console.log('  npx expo run:android');
  console.log('  npx expo run:ios');
} catch (err) {
  console.error('Icon generation failed:', err);
  process.exit(1);
}
