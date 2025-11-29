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
  const bgColor = '#5B7FFF'; // BrandColors.primary
  const size = 432;
  const canvas = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" fill="${bgColor}"/></svg>`;
  const resvg = new Resvg(canvas, { fitTo: { mode: 'width', value: size } });
  const png = resvg.render().asPng();
  const outPath = path.join(OUT_DIR, 'android-icon-background.png');
  fs.writeFileSync(outPath, png);
  console.log(`Generated android-icon-background.png (${size}px, solid ${bgColor})`);
}

try {
  targets.forEach(t => render(t.size, t.name, t));
  renderBackground();
  console.log('Icon generation complete.');
  console.log('\nNext steps:');
  console.log('- Verify images visually.');
  console.log('- Commit changes: git add assets/images/*.png && git commit -m "chore: regenerate app icons"');
  console.log('- Restart Expo server if running.');
} catch (err) {
  console.error('Icon generation failed:', err);
  process.exit(1);
}
