# Generating Favicons from Image

To generate favicons from your original image file, you can use online tools or command-line tools:

## Option 1: Online Tool (Recommended)
1. Go to https://realfavicongenerator.net/
2. Upload your image file
3. Configure the settings:
   - iOS: Use the image as-is
   - Android: Use the image as-is
   - Windows Metro: Use the image as-is
   - Favicon for desktop browsers: 32x32, 16x16
4. Generate and download the package
5. Extract the files to the `public/` directory

## Option 2: Using ImageMagick (Command Line)
If you have ImageMagick installed:

```bash
# Convert to various sizes
convert your-image.png -resize 16x16 public/favicon-16x16.png
convert your-image.png -resize 32x32 public/favicon-32x32.png
convert your-image.png -resize 180x180 public/apple-touch-icon.png
convert your-image.png -resize 192x192 public/android-chrome-192x192.png
convert your-image.png -resize 512x512 public/android-chrome-512x512.png
```

## Option 3: Using Sharp (Node.js)
If you prefer a Node.js script, install sharp:
```bash
npm install --save-dev sharp
```

Then create a script to generate all sizes.

## Required Files
After generation, you should have:
- `favicon.ico` (multi-size ICO file)
- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png` (180x180)
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`
- `site.webmanifest` (for Android)

The SVG favicon (`favicon.svg`) is already created and will work in modern browsers.
