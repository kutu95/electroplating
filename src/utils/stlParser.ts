import type { Triangle } from '../types';

/**
 * Parse ASCII STL file
 */
export function parseASCIISTL(content: string): Triangle[] {
  const triangles: Triangle[] = [];
  const lines = content.split('\n');
  
  let currentTriangle: { a?: number[]; b?: number[]; c?: number[] } = {};
  let vertexIndex = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check for vertex line: "vertex x y z"
    if (trimmed.startsWith('vertex')) {
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 4) {
        const x = parseFloat(parts[1]);
        const y = parseFloat(parts[2]);
        const z = parseFloat(parts[3]);
        
        if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
          if (vertexIndex === 0) {
            currentTriangle.a = [x, y, z];
          } else if (vertexIndex === 1) {
            currentTriangle.b = [x, y, z];
          } else if (vertexIndex === 2) {
            currentTriangle.c = [x, y, z];
          }
          vertexIndex++;
          
          // If we have all three vertices, add triangle
          if (vertexIndex === 3 && currentTriangle.a && currentTriangle.b && currentTriangle.c) {
            triangles.push({
              a: currentTriangle.a as [number, number, number],
              b: currentTriangle.b as [number, number, number],
              c: currentTriangle.c as [number, number, number],
            });
            currentTriangle = {};
            vertexIndex = 0;
          }
        }
      }
    } else if (trimmed.startsWith('endfacet')) {
      // Reset if we encounter endfacet without completing triangle
      currentTriangle = {};
      vertexIndex = 0;
    }
  }

  return triangles;
}

/**
 * Parse binary STL file
 */
export function parseBinarySTL(buffer: ArrayBuffer): Triangle[] {
  const view = new DataView(buffer);
  let offset = 80; // Skip 80-byte header
  
  // Read number of triangles (4 bytes, little-endian)
  const numTriangles = view.getUint32(offset, true);
  offset += 4;

  const triangles: Triangle[] = [];

  // Each triangle: 12 floats (normal vector, 3 vertices) + 2 bytes attribute
  // Total: 12 * 4 + 2 = 50 bytes per triangle
  for (let i = 0; i < numTriangles; i++) {
    // Skip normal vector (12 bytes)
    offset += 12;

    // Read three vertices
    const a: [number, number, number] = [
      view.getFloat32(offset, true),
      view.getFloat32(offset + 4, true),
      view.getFloat32(offset + 8, true),
    ];
    offset += 12;

    const b: [number, number, number] = [
      view.getFloat32(offset, true),
      view.getFloat32(offset + 4, true),
      view.getFloat32(offset + 8, true),
    ];
    offset += 12;

    const c: [number, number, number] = [
      view.getFloat32(offset, true),
      view.getFloat32(offset + 4, true),
      view.getFloat32(offset + 8, true),
    ];
    offset += 12;

    // Skip attribute byte count (2 bytes)
    offset += 2;

    triangles.push({ a, b, c });
  }

  return triangles;
}

/**
 * Detect if STL file is ASCII or binary
 */
export function isASCIISTL(buffer: ArrayBuffer): boolean {
  const uint8 = new Uint8Array(buffer);
  const text = new TextDecoder('ascii', { fatal: false }).decode(uint8.slice(0, Math.min(100, uint8.length)));
  
  // ASCII STL files typically start with "solid" keyword
  // Binary files have binary data in the header
  return text.trim().toLowerCase().startsWith('solid') && 
         !text.includes('\0') && // Binary files often have null bytes
         text.includes('\n'); // ASCII files have newlines
}
