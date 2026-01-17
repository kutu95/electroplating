/**
 * Unit types for STL file input
 */
export type STLUnit = 'mm' | 'cm' | 'inch';

/**
 * Electroplating material type
 */
export type Material = 'Copper' | 'Nickel';

/**
 * Calculation mode for electroplating
 */
export type CalculationMode = 'thickness-to-time' | 'time-to-thickness';

/**
 * File metadata with surface area
 */
export interface FileData {
  filename: string;
  surfaceArea_dm2: number; // Surface area in square decimeters
}

/**
 * Geometry parsing result
 */
export interface ParseResult {
  triangles: Triangle[];
  units?: STLUnit; // For STL files with unit override
}

/**
 * Triangle vertex representation
 */
export interface Triangle {
  a: [number, number, number]; // Vertex a
  b: [number, number, number]; // Vertex b
  c: [number, number, number]; // Vertex c
}
