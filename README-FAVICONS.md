# Generating Favicons

This project includes a script to generate all required favicon sizes from your source image.

## Quick Start

1. **Install the required dependency:**
   ```bash
   npm install --save-dev sharp
   ```

2. **Run the script with your image file:**
   ```bash
   npm run generate-favicons <path-to-your-image>
   ```
   
   Or directly:
   ```bash
   node scripts/generate-favicons.js <path-to-your-image>
   ```

## Example

If you have an image file called `electroplating-icon.png` in the project root:
```bash
npm run generate-favicons electroplating-icon.png
```

Or if it's in a subdirectory:
```bash
npm run generate-favicons ./images/my-logo.png
```

## Generated Files

The script will generate the following files in the `public/` directory:

- `favicon-16x16.png` - Standard favicon (16x16)
- `favicon-32x32.png` - Standard favicon (32x32)
- `favicon.ico` - Legacy favicon format (32x32)
- `apple-touch-icon.png` - iOS home screen icon (180x180)
- `android-chrome-192x192.png` - Android icon (192x192)
- `android-chrome-512x512.png` - Android icon (512x512)

## Notes

- The script uses `sharp` for image processing
- Images are resized with `contain` fit mode (maintains aspect ratio)
- White background is added if the image has transparency
- The `favicon.ico` file is actually a PNG (sharp doesn't support true ICO format)
- For a true multi-size ICO file, use ImageMagick or an online tool

## Current Status

The project already includes:
- ✅ `favicon.svg` - Modern SVG favicon (works in all modern browsers)
- ✅ `logo.svg` - Full logo version
- ✅ `site.webmanifest` - Web app manifest

After running the script, you'll have all PNG favicons for maximum compatibility.
