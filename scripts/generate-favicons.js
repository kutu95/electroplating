#!/usr/bin/env node

/**
 * Script to generate favicons from a source image
 * Usage: node scripts/generate-favicons.js <path-to-image>
 * Example: node scripts/generate-favicons.js logo.png
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get image path from command line
const imagePath = process.argv[2];

if (!imagePath) {
  console.error('Error: Please provide the path to your image file.');
  console.log('\nUsage:');
  console.log('  node scripts/generate-favicons.js <path-to-image>');
  console.log('\nExample:');
  console.log('  node scripts/generate-favicons.js logo.png');
  console.log('  node scripts/generate-favicons.js ./images/electroplating-icon.png');
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(imagePath)) {
  console.error(`Error: File not found: ${imagePath}`);
  process.exit(1);
}

const publicDir = path.join(__dirname, '..', 'public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Favicon sizes to generate
const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
];

async function generateFavicons() {
  // Check if sharp is available
  let sharp;
  try {
    const sharpModule = await import('sharp');
    sharp = sharpModule.default;
  } catch (error) {
    console.error('Error: sharp package is required.');
    console.log('\nPlease install it first:');
    console.log('  npm install --save-dev sharp');
    process.exit(1);
  }

  console.log(`Generating favicons from: ${imagePath}\n`);

  try {
    // Generate all PNG sizes
    for (const { name, size } of sizes) {
      const outputPath = path.join(publicDir, name);
      await sharp(imagePath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated ${name} (${size}x${size})`);
    }

    // Generate favicon.ico (using 32x32 as base)
    // Note: This creates a PNG file named .ico. For a true ICO file, use a tool like imagemagick
    const icoPath = path.join(publicDir, 'favicon.ico');
    await sharp(imagePath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(icoPath);
    console.log(`✓ Generated favicon.ico (32x32)`);

    console.log('\n✅ All favicons generated successfully!');
    console.log(`\nFiles created in: ${publicDir}`);
    console.log('\nGenerated files:');
    sizes.forEach(({ name, size }) => {
      console.log(`  - ${name} (${size}x${size})`);
    });
    console.log('  - favicon.ico (32x32)');

  } catch (error) {
    console.error('Error generating favicons:', error.message);
    process.exit(1);
  }
}

generateFavicons();
