import type { Triangle } from '../types';
import JSZip from 'jszip';

/**
 * Parse 3MF file XML content
 * 3MF files contain units and transforms, which we extract here
 * 3MF files are ZIP archives containing XML model files
 */
/**
 * Apply 3x4 transformation matrix to a point
 * 3MF uses a 12-value transformation matrix: [m00 m01 m02 m03 m10 m11 m12 m13 m20 m21 m22 m23]
 */
function applyTransform(point: [number, number, number], matrix: number[]): [number, number, number] {
  if (matrix.length !== 12) return point;
  
  const [x, y, z] = point;
  const [
    m00, m01, m02, m03,
    m10, m11, m12, m13,
    m20, m21, m22, m23,
  ] = matrix;
  
  return [
    m00 * x + m01 * y + m02 * z + m03,
    m10 * x + m11 * y + m12 * z + m13,
    m20 * x + m21 * y + m22 * z + m23,
  ];
}

/**
 * Check if buffer is a ZIP file (3MF format)
 */
function isZipFile(buffer: ArrayBuffer): boolean {
  const uint8 = new Uint8Array(buffer);
  // ZIP files start with "PK" (0x50 0x4B)
  return uint8.length >= 2 && uint8[0] === 0x50 && uint8[1] === 0x4B;
}

/**
 * Extract XML content from 3MF ZIP file
 */
async function extract3MFXML(buffer: ArrayBuffer): Promise<string> {
  if (!isZipFile(buffer)) {
    // Not a ZIP file, treat as raw XML
    return new TextDecoder('utf-8').decode(buffer);
  }

  const zip = await JSZip.loadAsync(buffer);
  
  // 3MF specification: look for model file (usually "3D/3dmodel.model")
  // Try common locations first
  const preferredPaths = [
    '3D/3dmodel.model',
    '3dmodel.model',
  ];

  for (const path of preferredPaths) {
    const file = zip.file(path);
    if (file) {
      return await file.async('string');
    }
  }

  // If no .model file found at preferred paths, search all files
  const allFiles = Object.keys(zip.files);
  const modelFiles = allFiles.filter(name => 
    name.endsWith('.model') || (name.endsWith('.xml') && name.includes('model'))
  );
  
  if (modelFiles.length > 0) {
    const file = zip.file(modelFiles[0]);
    if (file) {
      return await file.async('string');
    }
  }

  // Last resort: try any XML file
  const xmlFiles = allFiles.filter(name => name.endsWith('.xml'));
  if (xmlFiles.length > 0) {
    const file = zip.file(xmlFiles[0]);
    if (file) {
      return await file.async('string');
    }
  }

  throw new Error('No model file found in 3MF archive');
}

export async function parse3MF(buffer: ArrayBuffer): Promise<{ triangles: Triangle[]; unitScale: number }> {
  // Extract XML content from 3MF ZIP file (or use as-is if already XML)
  const xmlText = await extract3MFXML(buffer);
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'application/xml');
  
  // Extract unit from 3MF (default is millimeter if not specified)
  const model = xml.querySelector('model');
  const unit = model?.getAttribute('unit') || 'millimeter';
  
  // Convert unit to scale factor (3MF units: millimeter, micron, centimeter, inch, foot, meter)
  const unitScales: Record<string, number> = {
    millimeter: 1,
    micron: 0.001,
    centimeter: 10,
    inch: 25.4,
    foot: 304.8,
    meter: 1000,
  };
  
  const unitScale = unitScales[unit.toLowerCase()] || 1;
  
  // Parse mesh vertices and triangles
  const triangles: Triangle[] = [];
  
  // Find all objects with mesh data
  const objects = xml.querySelectorAll('object');
  
  for (const object of Array.from(objects)) {
    const mesh = object.querySelector('mesh');
    if (!mesh) continue;
    
    // Parse vertices
    const verticesElement = mesh.querySelector('vertices');
    if (!verticesElement) continue;
    
    const vertexElements = verticesElement.querySelectorAll('vertex');
    const vertices: [number, number, number][] = [];
    
    for (const vertex of Array.from(vertexElements)) {
      const x = parseFloat(vertex.getAttribute('x') || '0');
      const y = parseFloat(vertex.getAttribute('y') || '0');
      const z = parseFloat(vertex.getAttribute('z') || '0');
      vertices.push([x, y, z]);
    }
    
    // Parse triangles
    const trianglesElement = mesh.querySelector('triangles');
    if (!trianglesElement) continue;
    
    const triangleElements = trianglesElement.querySelectorAll('triangle');
    
    for (const triangle of Array.from(triangleElements)) {
      const v1 = parseInt(triangle.getAttribute('v1') || '0', 10);
      const v2 = parseInt(triangle.getAttribute('v2') || '0', 10);
      const v3 = parseInt(triangle.getAttribute('v3') || '0', 10);
      
      if (v1 >= 0 && v1 < vertices.length &&
          v2 >= 0 && v2 < vertices.length &&
          v3 >= 0 && v3 < vertices.length) {
        triangles.push({
          a: vertices[v1],
          b: vertices[v2],
          c: vertices[v3],
        });
      }
    }
    
    // Apply transforms if present
    const transform = object.getAttribute('transform');
    if (transform) {
      // Parse transformation matrix (3MF uses space-separated 12 values)
      const matrixValues = transform.split(/\s+/).map(parseFloat).filter(v => !isNaN(v));
      if (matrixValues.length === 12) {
        // Apply transformation matrix to all triangles from this object
        const objectTriangleStart = triangles.length - triangleElements.length;
        for (let i = objectTriangleStart; i < triangles.length; i++) {
          const t = triangles[i];
          t.a = applyTransform(t.a, matrixValues);
          t.b = applyTransform(t.b, matrixValues);
          t.c = applyTransform(t.c, matrixValues);
        }
      }
    }
  }
  
  // Scale vertices to millimeters
  if (unitScale !== 1) {
    for (const triangle of triangles) {
      triangle.a[0] *= unitScale;
      triangle.a[1] *= unitScale;
      triangle.a[2] *= unitScale;
      triangle.b[0] *= unitScale;
      triangle.b[1] *= unitScale;
      triangle.b[2] *= unitScale;
      triangle.c[0] *= unitScale;
      triangle.c[1] *= unitScale;
      triangle.c[2] *= unitScale;
    }
  }
  
  return { triangles, unitScale: 1 }; // Already converted to mm
}
