import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourcePath = '/home/z/my-project/public/icons/icon-source.png';
const outputDir = '/home/z/my-project/public/icons';

async function generateIcons() {
  console.log('🎨 Generating PWA icons...');
  
  // Also create apple-touch-icon
  await sharp(sourcePath)
    .resize(180, 180)
    .png()
    .toFile(path.join(outputDir, 'apple-touch-icon.png'));
  console.log('✓ Generated apple-touch-icon.png (180x180)');
  
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    await sharp(sourcePath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✓ Generated icon-${size}x${size}.png`);
  }
  
  // Create favicon
  await sharp(sourcePath)
    .resize(32, 32)
    .png()
    .toFile('/home/z/my-project/public/favicon.png');
  console.log('✓ Generated favicon.png (32x32)');
  
  console.log('🎉 All PWA icons generated successfully!');
}

generateIcons().catch(console.error);
