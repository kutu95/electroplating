# Electroplating Calculator

A client-side web application for calculating surface area from 3D mesh files (STL and 3MF) and computing electroplating parameters using Faraday's law.

## Features

- **File Support**: Drag-and-drop support for STL (ASCII and binary) and 3MF files
- **Multiple Files**: Process multiple files at once
- **Unit Handling**: 
  - STL files default to millimeters with per-session override (mm, cm, inch)
  - 3MF files automatically read units and transforms from the file
- **Exact Surface Area**: Computes surface area using exact triangle area formula via vector cross product
- **Electroplating Calculator**: 
  - Supports Copper and Nickel materials
  - Two calculation modes: Thickness → Time and Time → Thickness
  - Configurable current efficiency (50-100%)
  - Current density input with warnings for recommended limits
  - Displays required current and deposition rate

## Technical Details

### Surface Area Calculation
Uses the exact formula: `area = 0.5 × |(b − a) × (c − a)|` for each triangle, summed across all triangles.

All surface areas are computed in square decimeters (dm²) internally.

### Electroplating Constants
- **Copper**: K = 270.5 seconds
- **Nickel**: K = 292.6 seconds

These constants assume:
- Thickness in microns (µm)
- Current density in A/dm²
- 100% current efficiency (adjustable via efficiency slider)

### Formulas

**Mode A (Thickness → Time)**:
```
t_seconds = (K × thickness_um) / (currentDensity × efficiency)
```

**Mode B (Time → Thickness)**:
```
thickness_um = (time_seconds × currentDensity × efficiency) / K
```

**Deposition Rate**:
```
rate_um_per_min = (60 × currentDensity × efficiency) / K
```

**Total Current**:
```
I = surfaceArea_dm2 × currentDensity
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Technologies

- React 18 with TypeScript
- Vite
- Three.js (for reference, though custom parsers are used for STL/3MF)

## License

MIT
