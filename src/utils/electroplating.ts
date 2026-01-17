import type { Material } from '../types';

/**
 * Faraday's law constants for electroplating materials
 * These constants assume:
 * - Thickness in microns (µm)
 * - Current density in A/dm²
 * - 100% current efficiency
 * 
 * K represents: (molecular weight × 1000) / (valence × density × 96.485 × 10000)
 * where 10000 converts dm² to cm² for density calculations
 * 
 * For Copper: K = 270.5 seconds
 * For Nickel: K = 292.6 seconds
 */
const FARADAY_CONSTANTS: Record<Material, number> = {
  Copper: 270.5, // seconds
  Nickel: 292.6, // seconds
};

/**
 * Calculate electroplating time from target thickness
 * Mode A: Thickness → Time
 * 
 * Formula: t_seconds = (K × thickness_um) / (currentDensity × efficiency)
 * 
 * Derived from Faraday's law:
 * thickness = (time × current × efficiency × molecular_weight) / (valence × density × surface_area × 96.485)
 * Rearranging for time and using current_density = current / surface_area gives the above formula
 * 
 * @param thickness_um Target thickness in microns
 * @param currentDensity Current density in A/dm²
 * @param efficiency Current efficiency (0-1, where 1 = 100%)
 * @param material Plating material (Copper or Nickel)
 * @returns Time in seconds
 */
export function calculateTimeFromThickness(
  thickness_um: number,
  currentDensity: number,
  efficiency: number,
  material: Material
): number {
  const K = FARADAY_CONSTANTS[material];
  // t = (K × thickness) / (currentDensity × efficiency)
  return (K * thickness_um) / (currentDensity * efficiency);
}

/**
 * Calculate electroplating thickness from available time
 * Mode B: Time → Thickness
 * 
 * Formula: thickness_um = (time_seconds × currentDensity × efficiency) / K
 * 
 * @param time_seconds Available time in seconds
 * @param currentDensity Current density in A/dm²
 * @param efficiency Current efficiency (0-1, where 1 = 100%)
 * @param material Plating material (Copper or Nickel)
 * @returns Thickness in microns
 */
export function calculateThicknessFromTime(
  time_seconds: number,
  currentDensity: number,
  efficiency: number,
  material: Material
): number {
  const K = FARADAY_CONSTANTS[material];
  // thickness = (time × currentDensity × efficiency) / K
  return (time_seconds * currentDensity * efficiency) / K;
}

/**
 * Calculate deposition rate in microns per minute
 * 
 * Formula: rate_um_per_min = (60 × currentDensity × efficiency) / K
 * 
 * This is derived from the thickness formula by setting time = 60 seconds
 * 
 * @param currentDensity Current density in A/dm²
 * @param efficiency Current efficiency (0-1, where 1 = 100%)
 * @param material Plating material (Copper or Nickel)
 * @returns Deposition rate in microns per minute
 */
export function calculateDepositionRate(
  currentDensity: number,
  efficiency: number,
  material: Material
): number {
  const K = FARADAY_CONSTANTS[material];
  // rate = (60 × currentDensity × efficiency) / K
  return (60 * currentDensity * efficiency) / K;
}

/**
 * Calculate total current required
 * 
 * Formula: I = surfaceArea_dm2 × currentDensity
 * 
 * @param surfaceArea_dm2 Total surface area in square decimeters
 * @param currentDensity Current density in A/dm²
 * @returns Total current in Amperes
 */
export function calculateTotalCurrent(surfaceArea_dm2: number, currentDensity: number): number {
  return surfaceArea_dm2 * currentDensity;
}

/**
 * Format time in seconds to hh:mm:ss format
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parse hh:mm:ss time string to seconds
 */
export function parseTime(timeString: string): number {
  const parts = timeString.split(':').map(Number);
  
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  
  return 0;
}
