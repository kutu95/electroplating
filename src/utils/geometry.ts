import type { Triangle, STLUnit } from '../types';

/**
 * Convert length from one unit to millimeters
 */
export function toMillimeters(value: number, unit: STLUnit): number {
  const conversions: Record<STLUnit, number> = {
    mm: 1,
    cm: 10,
    inch: 25.4,
  };
  return value * conversions[unit];
}

/**
 * Convert millimeters to decimeters (for surface area)
 */
export function mm2ToDm2(mm2: number): number {
  // 1 dm² = 10000 mm²
  return mm2 / 10000;
}

/**
 * Calculate exact triangle area using vector cross product
 * Formula: area = 0.5 × |(b − a) × (c − a)|
 * @param triangle Triangle with vertices a, b, c
 * @returns Area in square millimeters
 */
export function calculateTriangleArea(triangle: Triangle): number {
  const [ax, ay, az] = triangle.a;
  const [bx, by, bz] = triangle.b;
  const [cx, cy, cz] = triangle.c;

  // Vector (b - a)
  const ba = [bx - ax, by - ay, bz - az];
  // Vector (c - a)
  const ca = [cx - ax, cy - ay, cz - az];

  // Cross product (b - a) × (c - a)
  const crossX = ba[1] * ca[2] - ba[2] * ca[1];
  const crossY = ba[2] * ca[0] - ba[0] * ca[2];
  const crossZ = ba[0] * ca[1] - ba[1] * ca[0];

  // Magnitude of cross product
  const magnitude = Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ);

  // Area = 0.5 × magnitude
  return 0.5 * magnitude;
}

/**
 * Calculate total surface area from triangles
 * @param triangles Array of triangles
 * @param unit Unit for input vertices (defaults to mm)
 * @returns Surface area in square decimeters
 */
export function calculateSurfaceArea(triangles: Triangle[], unit: STLUnit = 'mm'): number {
  let totalArea_mm2 = 0;

  for (const triangle of triangles) {
    // Convert triangle vertices to millimeters if needed
    const convertedTriangle: Triangle = {
      a: [
        toMillimeters(triangle.a[0], unit),
        toMillimeters(triangle.a[1], unit),
        toMillimeters(triangle.a[2], unit),
      ],
      b: [
        toMillimeters(triangle.b[0], unit),
        toMillimeters(triangle.b[1], unit),
        toMillimeters(triangle.b[2], unit),
      ],
      c: [
        toMillimeters(triangle.c[0], unit),
        toMillimeters(triangle.c[1], unit),
        toMillimeters(triangle.c[2], unit),
      ],
    };

    const area_mm2 = calculateTriangleArea(convertedTriangle);
    totalArea_mm2 += area_mm2;
  }

  // Convert to square decimeters
  return mm2ToDm2(totalArea_mm2);
}
