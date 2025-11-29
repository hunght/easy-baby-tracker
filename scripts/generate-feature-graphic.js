#!/usr/bin/env node
/**
 * Feature graphic generation script for Google Play Store
 * Creates a 1024x500 px PNG banner with app branding
 *
 * Usage: `node scripts/generate-feature-graphic.js`
 */

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const OUT_DIR = path.resolve(__dirname, '../assets/images');
const WIDTH = 1024;
const HEIGHT = 500;

// Brand colors
const PRIMARY = '#5B7FFF';
const ACCENT = '#FF8AB8';
const MINT = '#7FE3CC';
const LAVENDER = '#C7B9FF';

// Read logo SVG
const SVG_PATH = path.resolve(__dirname, '../assets/images/logo.svg');
const logoSvg = fs.existsSync(SVG_PATH) ? fs.readFileSync(SVG_PATH, 'utf8') : null;

// Extract logo content (remove svg wrapper to embed)
const logoContent = logoSvg 
  ? logoSvg.replace(/<\?xml[^>]*>/, '').replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')
  : '';

// Create feature graphic SVG
const featureGraphicSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <!-- Gradient background -->
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${PRIMARY};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${LAVENDER};stop-opacity:1" />
    </linearGradient>
    
    <!-- Decorative circles -->
    <radialGradient id="circle1" cx="50%" cy="50%">
      <stop offset="0%" style="stop-color:${MINT};stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:${MINT};stop-opacity:0" />
    </radialGradient>
    <radialGradient id="circle2" cx="50%" cy="50%">
      <stop offset="0%" style="stop-color:${ACCENT};stop-opacity:0.25" />
      <stop offset="100%" style="stop-color:${ACCENT};stop-opacity:0" />
    </radialGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGrad)"/>
  
  <!-- Decorative circles -->
  <circle cx="150" cy="100" r="120" fill="url(#circle1)"/>
  <circle cx="900" cy="400" r="150" fill="url(#circle2)"/>
  
  <!-- Logo (left side, scaled to fit) -->
  <g transform="translate(60, 130) scale(1.8)">
    ${logoContent}
  </g>
  
  <!-- App name and tagline -->
  <text x="380" y="180" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="bold" fill="white">
    Easy Baby Tracker
  </text>
  <text x="380" y="260" font-family="system-ui, -apple-system, sans-serif" font-size="32" fill="white" opacity="0.95">
    Track feeding, sleep, diapers &amp; growth
  </text>
  <text x="380" y="320" font-family="system-ui, -apple-system, sans-serif" font-size="26" fill="white" opacity="0.9">
    Simple • Private • Offline
  </text>
</svg>`;

// Render to PNG
try {
  const resvg = new Resvg(featureGraphicSvg, {
    fitTo: { mode: 'width', value: WIDTH },
  });
  const png = resvg.render().asPng();
  const outPath = path.join(OUT_DIR, 'feature-graphic.png');
  fs.writeFileSync(outPath, png);
  
  // Check file size
  const stats = fs.statSync(outPath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log(`✅ Generated feature-graphic.png (${WIDTH}x${HEIGHT}px)`);
  console.log(`   File size: ${sizeKB} KB (${sizeMB} MB)`);
  console.log(`   Location: ${outPath}`);
  
  if (stats.size > 15 * 1024 * 1024) {
    console.warn('⚠️  Warning: File exceeds 15 MB limit for Google Play');
  } else {
    console.log('✅ File size is within Google Play limit (< 15 MB)');
  }
  
  console.log('\nNext steps:');
  console.log('- Upload to Google Play Console → Main store listing → Graphics');
  console.log('- Verify it looks good at 1024x500 px');
  
} catch (err) {
  console.error('❌ Feature graphic generation failed:', err);
  process.exit(1);
}
