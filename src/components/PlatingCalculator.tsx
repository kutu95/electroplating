import { useState, useMemo } from 'react';
import type { Material, CalculationMode } from '../types';
import {
  calculateTimeFromThickness,
  calculateThicknessFromTime,
  calculateDepositionRate,
  calculateTotalCurrent,
  formatTime,
  parseTime,
} from '../utils/electroplating';

interface PlatingCalculatorProps {
  totalSurfaceArea_dm2: number;
}

// Recommended current density limits (A/dm²)
const RECOMMENDED_LIMITS: Record<Material, number> = {
  Copper: 5.0,
  Nickel: 5.0,
};

type ThicknessUnit = 'µm' | 'mm';
type JobType = 'single' | 'three-stage';

export function PlatingCalculator({ totalSurfaceArea_dm2 }: PlatingCalculatorProps) {
  const [jobType, setJobType] = useState<JobType>('single');
  const [material, setMaterial] = useState<Material>('Copper');
  const [efficiency, setEfficiency] = useState(100); // Percentage (50-100)
  
  // Single stage or Stage 3 state
  const [currentDensity, setCurrentDensity] = useState<string>('2.0');
  const [mode, setMode] = useState<CalculationMode>('thickness-to-time');
  const [thicknessInput, setThicknessInput] = useState<string>('10');
  const [thicknessUnit, setThicknessUnit] = useState<ThicknessUnit>('µm');
  const [timeInput, setTimeInput] = useState<string>('01:00:00'); // hh:mm:ss
  
  // Stage 1 & 2 state (for 3-stage jobs)
  const [stage1Density, setStage1Density] = useState<string>('0.5');
  const [stage1Time, setStage1Time] = useState<string>('00:30:00');
  const [stage2Density, setStage2Density] = useState<string>('0.5');
  const [stage2Time, setStage2Time] = useState<string>('00:30:00');
  
  // Stage 3 state (for 3-stage jobs)
  const [stage3Density, setStage3Density] = useState<string>('2.0');
  const [stage3Mode, setStage3Mode] = useState<CalculationMode>('thickness-to-time');
  const [stage3ThicknessInput, setStage3ThicknessInput] = useState<string>('10');
  const [stage3TimeInput, setStage3TimeInput] = useState<string>('01:00:00');

  const currentDensityNum = parseFloat(currentDensity) || 0;
  const efficiencyDecimal = efficiency / 100;
  
  // Stage 1 & 2 values
  const stage1DensityNum = parseFloat(stage1Density) || 0;
  const stage2DensityNum = parseFloat(stage2Density) || 0;
  const stage3DensityNum = parseFloat(stage3Density) || 0;

  // Calculate thickness after stages 1 & 2 (for 3-stage jobs)
  const thicknessAfterStage1 = useMemo(() => {
    if (jobType === 'three-stage' && stage1Time && stage1DensityNum > 0 && efficiencyDecimal > 0) {
      const timeSeconds = parseTime(stage1Time);
      if (timeSeconds > 0) {
        return calculateThicknessFromTime(timeSeconds, stage1DensityNum, efficiencyDecimal, material);
      }
    }
    return 0;
  }, [jobType, stage1Time, stage1DensityNum, efficiencyDecimal, material]);

  const thicknessAfterStage2 = useMemo(() => {
    if (jobType === 'three-stage' && stage2Time && stage2DensityNum > 0 && efficiencyDecimal > 0) {
      const timeSeconds = parseTime(stage2Time);
      if (timeSeconds > 0) {
        const stage2Thickness = calculateThicknessFromTime(timeSeconds, stage2DensityNum, efficiencyDecimal, material);
        return thicknessAfterStage1 + stage2Thickness;
      }
    }
    return thicknessAfterStage1;
  }, [jobType, stage2Time, stage2DensityNum, efficiencyDecimal, material, thicknessAfterStage1]);

  // Calculations
  const totalCurrent = useMemo(() => {
    if (totalSurfaceArea_dm2 > 0) {
      if (jobType === 'single' && currentDensityNum > 0) {
        return calculateTotalCurrent(totalSurfaceArea_dm2, currentDensityNum);
      } else if (jobType === 'three-stage' && stage3DensityNum > 0) {
        return calculateTotalCurrent(totalSurfaceArea_dm2, stage3DensityNum);
      }
    }
    return 0;
  }, [jobType, totalSurfaceArea_dm2, currentDensityNum, stage3DensityNum]);

  const depositionRate = useMemo(() => {
    const density = jobType === 'single' ? currentDensityNum : stage3DensityNum;
    if (density > 0 && efficiencyDecimal > 0) {
      return calculateDepositionRate(density, efficiencyDecimal, material);
    }
    return 0;
  }, [jobType, currentDensityNum, stage3DensityNum, efficiencyDecimal, material]);

  // Convert thickness to micrometers for calculations
  const thicknessInMicrometers = useMemo(() => {
    const thickness = parseFloat(thicknessInput);
    if (isNaN(thickness)) return 0;
    // Convert to micrometers: 1 mm = 1000 µm
    return thicknessUnit === 'mm' ? thickness * 1000 : thickness;
  }, [thicknessInput, thicknessUnit]);

  // Stage 3 thickness calculations
  const stage3ThicknessInMicrometers = useMemo(() => {
    const thickness = parseFloat(jobType === 'single' ? thicknessInput : stage3ThicknessInput);
    if (isNaN(thickness)) return 0;
    return thicknessUnit === 'mm' ? thickness * 1000 : thickness;
  }, [jobType, thicknessInput, stage3ThicknessInput, thicknessUnit]);

  const calculatedTime = useMemo(() => {
    if (jobType === 'single') {
      if (mode === 'thickness-to-time' && thicknessInput) {
        if (thicknessInMicrometers > 0 && currentDensityNum > 0 && efficiencyDecimal > 0) {
          return calculateTimeFromThickness(thicknessInMicrometers, currentDensityNum, efficiencyDecimal, material);
        }
      }
    } else {
      // 3-stage: Stage 3 calculation
      if (stage3Mode === 'thickness-to-time' && stage3ThicknessInput) {
        // For stage 3, we need the remaining thickness (target - accumulated)
        const targetThickness = stage3ThicknessInMicrometers;
        const remainingThickness = targetThickness - thicknessAfterStage2;
        if (remainingThickness > 0 && stage3DensityNum > 0 && efficiencyDecimal > 0) {
          return calculateTimeFromThickness(remainingThickness, stage3DensityNum, efficiencyDecimal, material);
        }
      }
    }
    return null;
  }, [jobType, mode, stage3Mode, thicknessInMicrometers, stage3ThicknessInMicrometers, thicknessAfterStage2, 
      thicknessInput, stage3ThicknessInput, currentDensityNum, stage3DensityNum, efficiencyDecimal, material]);

  const calculatedThickness = useMemo(() => {
    if (jobType === 'single') {
      if (mode === 'time-to-thickness' && timeInput) {
        const timeSeconds = parseTime(timeInput);
        if (timeSeconds > 0 && currentDensityNum > 0 && efficiencyDecimal > 0) {
          return calculateThicknessFromTime(timeSeconds, currentDensityNum, efficiencyDecimal, material);
        }
      }
    } else {
      // 3-stage: Stage 3 calculation
      if (stage3Mode === 'time-to-thickness' && stage3TimeInput) {
        const timeSeconds = parseTime(stage3TimeInput);
        if (timeSeconds > 0 && stage3DensityNum > 0 && efficiencyDecimal > 0) {
          const stage3Thickness = calculateThicknessFromTime(timeSeconds, stage3DensityNum, efficiencyDecimal, material);
          // Total thickness = accumulated from stages 1 & 2 + stage 3
          return thicknessAfterStage2 + stage3Thickness;
        }
      }
    }
    return null;
  }, [jobType, mode, stage3Mode, timeInput, stage3TimeInput, currentDensityNum, stage3DensityNum, 
      efficiencyDecimal, material, thicknessAfterStage2]);

  // Convert calculated thickness to display unit
  const calculatedThicknessDisplay = useMemo(() => {
    if (calculatedThickness === null) return null;
    // Convert from micrometers to display unit: 1 mm = 1000 µm
    return thicknessUnit === 'mm' ? calculatedThickness / 1000 : calculatedThickness;
  }, [calculatedThickness, thicknessUnit]);

  const exceedsRecommended = useMemo(() => {
    return currentDensityNum > RECOMMENDED_LIMITS[material];
  }, [currentDensityNum, material]);

  const hasWarning = totalSurfaceArea_dm2 === 0;

  return (
    <div
      style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <h2 style={{ marginBottom: '20px' }}>Electroplating Calculator</h2>

      {hasWarning && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            marginBottom: '20px',
            color: '#856404',
          }}
        >
          ⚠️ Warning: No geometry loaded. Please upload STL or 3MF files first.
        </div>
      )}

      {/* Job Type Selector */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Job Type
        </label>
        <div style={{ display: 'flex', gap: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="radio"
              value="single"
              checked={jobType === 'single'}
              onChange={(e) => setJobType(e.target.value as JobType)}
              style={{ marginRight: '8px' }}
            />
            Single Stage
          </label>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="radio"
              value="three-stage"
              checked={jobType === 'three-stage'}
              onChange={(e) => setJobType(e.target.value as JobType)}
              style={{ marginRight: '8px' }}
            />
            3 Stage
          </label>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Material Selection */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Material
          </label>
          <select
            value={material}
            onChange={(e) => setMaterial(e.target.value as Material)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            <option value="Copper">Copper (K = 270.5 s)</option>
            <option value="Nickel">Nickel (K = 292.6 s)</option>
          </select>
        </div>

        {/* Efficiency Slider */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Current Efficiency: {efficiency}%
          </label>
          <input
            type="range"
            min="50"
            max="100"
            value={efficiency}
            onChange={(e) => setEfficiency(parseInt(e.target.value, 10))}
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Range: 50% - 100%
          </div>
        </div>
      </div>

      {jobType === 'single' ? (
        <>
          {/* Single Stage UI */}
          {/* Current Density Input */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Current Density (A/dm²)
            </label>
            <input
              type="number"
              value={currentDensity}
              onChange={(e) => setCurrentDensity(e.target.value)}
              min="0"
              step="0.1"
              style={{
                width: '100%',
                padding: '8px',
                border: exceedsRecommended ? '2px solid #f44336' : '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
            {exceedsRecommended && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px',
                  backgroundColor: '#ffebee',
                  border: '1px solid #f44336',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#c62828',
                }}
              >
                ⚠️ Warning: Current density exceeds recommended limit of{' '}
                {RECOMMENDED_LIMITS[material]} A/dm² for {material}
              </div>
            )}
          </div>

          {/* Calculation Mode */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Calculation Mode
            </label>
            <div style={{ display: 'flex', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="thickness-to-time"
                  checked={mode === 'thickness-to-time'}
                  onChange={(e) => setMode(e.target.value as CalculationMode)}
                  style={{ marginRight: '8px' }}
                />
                Thickness → Time
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="time-to-thickness"
                  checked={mode === 'time-to-thickness'}
                  onChange={(e) => setMode(e.target.value as CalculationMode)}
                  style={{ marginRight: '8px' }}
                />
                Time → Thickness
              </label>
            </div>
          </div>

          {/* Thickness Unit Selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Thickness Unit
            </label>
            <select
              value={thicknessUnit}
              onChange={(e) => {
                const newUnit = e.target.value as ThicknessUnit;
                if (mode === 'thickness-to-time') {
                  const currentValue = parseFloat(thicknessInput) || 0;
                  if (newUnit === 'mm' && thicknessUnit === 'µm') {
                    setThicknessInput((currentValue / 1000).toString());
                  } else if (newUnit === 'µm' && thicknessUnit === 'mm') {
                    setThicknessInput((currentValue * 1000).toString());
                  }
                }
                setThicknessUnit(newUnit);
              }}
              style={{
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                minWidth: '100px',
              }}
            >
              <option value="µm">Micrometers (µm)</option>
              <option value="mm">Millimeters (mm)</option>
            </select>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Applies to both input and output thickness values
            </p>
          </div>

          {/* Dynamic Inputs */}
          {mode === 'thickness-to-time' ? (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Target Thickness
              </label>
              <input
                type="number"
                value={thicknessInput}
                onChange={(e) => setThicknessInput(e.target.value)}
                min="0"
                step={thicknessUnit === 'mm' ? '0.001' : '0.1'}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>
          ) : (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Available Time (hh:mm:ss)
              </label>
              <input
                type="text"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                placeholder="01:00:00"
                pattern="^\d{1,2}:\d{2}:\d{2}$"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>
          )}
        </>
      ) : (
        <>
          {/* 3-Stage UI */}
          {/* Stage 1 */}
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
            <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Stage 1</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Current Density (A/dm²)
                </label>
                <select
                  value={stage1Density}
                  onChange={(e) => setStage1Density(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  <option value="0.5">0.5</option>
                  <option value="1.0">1.0</option>
                  <option value="1.5">1.5</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Time (hh:mm:ss)
                </label>
                <input
                  type="text"
                  value={stage1Time}
                  onChange={(e) => setStage1Time(e.target.value)}
                  placeholder="00:30:00"
                  pattern="^\d{1,2}:\d{2}:\d{2}$"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>
            {thicknessAfterStage1 > 0 && (
              <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                Thickness after Stage 1: {thicknessUnit === 'mm' 
                  ? (thicknessAfterStage1 / 1000).toFixed(4) 
                  : thicknessAfterStage1.toFixed(2)} {thicknessUnit}
              </div>
            )}
          </div>

          {/* Stage 2 */}
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
            <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Stage 2</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Current Density (A/dm²)
                </label>
                <select
                  value={stage2Density}
                  onChange={(e) => setStage2Density(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  <option value="0.5">0.5</option>
                  <option value="1.0">1.0</option>
                  <option value="1.5">1.5</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Time (hh:mm:ss)
                </label>
                <input
                  type="text"
                  value={stage2Time}
                  onChange={(e) => setStage2Time(e.target.value)}
                  placeholder="00:30:00"
                  pattern="^\d{1,2}:\d{2}:\d{2}$"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>
            {thicknessAfterStage2 > 0 && (
              <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                Cumulative Thickness after Stage 2: {thicknessUnit === 'mm' 
                  ? (thicknessAfterStage2 / 1000).toFixed(4) 
                  : thicknessAfterStage2.toFixed(2)} {thicknessUnit}
              </div>
            )}
          </div>

          {/* Stage 3 */}
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
            <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Stage 3</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Current Density (A/dm²)
              </label>
              <input
                type="number"
                value={stage3Density}
                onChange={(e) => setStage3Density(e.target.value)}
                min="0"
                step="0.1"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Calculation Mode
              </label>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="thickness-to-time"
                    checked={stage3Mode === 'thickness-to-time'}
                    onChange={(e) => setStage3Mode(e.target.value as CalculationMode)}
                    style={{ marginRight: '8px' }}
                  />
                  Thickness → Time
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="time-to-thickness"
                    checked={stage3Mode === 'time-to-thickness'}
                    onChange={(e) => setStage3Mode(e.target.value as CalculationMode)}
                    style={{ marginRight: '8px' }}
                  />
                  Time → Thickness
                </label>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Thickness Unit
              </label>
              <select
                value={thicknessUnit}
                onChange={(e) => {
                  const newUnit = e.target.value as ThicknessUnit;
                  if (stage3Mode === 'thickness-to-time') {
                    const currentValue = parseFloat(stage3ThicknessInput) || 0;
                    if (newUnit === 'mm' && thicknessUnit === 'µm') {
                      setStage3ThicknessInput((currentValue / 1000).toString());
                    } else if (newUnit === 'µm' && thicknessUnit === 'mm') {
                      setStage3ThicknessInput((currentValue * 1000).toString());
                    }
                  }
                  setThicknessUnit(newUnit);
                }}
                style={{
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  minWidth: '100px',
                }}
              >
                <option value="µm">Micrometers (µm)</option>
                <option value="mm">Millimeters (mm)</option>
              </select>
            </div>

            {stage3Mode === 'thickness-to-time' ? (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Target Total Thickness (after all 3 stages)
                </label>
                <input
                  type="number"
                  value={stage3ThicknessInput}
                  onChange={(e) => setStage3ThicknessInput(e.target.value)}
                  min="0"
                  step={thicknessUnit === 'mm' ? '0.001' : '0.1'}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
                {thicknessAfterStage2 > 0 && stage3ThicknessInMicrometers > thicknessAfterStage2 && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    Remaining thickness for Stage 3: {thicknessUnit === 'mm' 
                      ? ((stage3ThicknessInMicrometers - thicknessAfterStage2) / 1000).toFixed(4)
                      : (stage3ThicknessInMicrometers - thicknessAfterStage2).toFixed(2)} {thicknessUnit}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Available Time (hh:mm:ss)
                </label>
                <input
                  type="text"
                  value={stage3TimeInput}
                  onChange={(e) => setStage3TimeInput(e.target.value)}
                  placeholder="01:00:00"
                  pattern="^\d{1,2}:\d{2}:\d{2}$"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Results */}
      <div
        style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
        }}
      >
        <h3 style={{ marginBottom: '15px' }}>Results</h3>
        {jobType === 'single' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {mode === 'thickness-to-time' ? (
              <>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    Required Time
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '600' }}>
                    {calculatedTime !== null ? formatTime(calculatedTime) : 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    Target Thickness
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '600' }}>
                    {thicknessInput ? `${parseFloat(thicknessInput) || 0} ${thicknessUnit}` : 'N/A'}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    Available Time
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '600' }}>{timeInput}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    Resulting Thickness
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '600' }}>
                    {calculatedThicknessDisplay !== null
                      ? `${calculatedThicknessDisplay.toFixed(thicknessUnit === 'mm' ? 4 : 2)} ${thicknessUnit}`
                      : 'N/A'}
                  </div>
                </div>
              </>
            )}
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                Required Current
              </div>
              <div style={{ fontSize: '20px', fontWeight: '600' }}>
                {totalCurrent > 0 ? `${totalCurrent.toFixed(3)} A` : 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                Deposition Rate
              </div>
              <div style={{ fontSize: '20px', fontWeight: '600' }}>
                {depositionRate > 0 ? `${depositionRate.toFixed(3)} µm/min` : 'N/A'}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Stage 3 Results */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              {stage3Mode === 'thickness-to-time' ? (
                <>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      Stage 3 Required Time
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '600' }}>
                      {calculatedTime !== null ? formatTime(calculatedTime) : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      Target Total Thickness
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '600' }}>
                      {stage3ThicknessInput ? `${parseFloat(stage3ThicknessInput) || 0} ${thicknessUnit}` : 'N/A'}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      Stage 3 Available Time
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '600' }}>{stage3TimeInput}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      Final Total Thickness
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '600' }}>
                      {calculatedThicknessDisplay !== null
                        ? `${calculatedThicknessDisplay.toFixed(thicknessUnit === 'mm' ? 4 : 2)} ${thicknessUnit}`
                        : 'N/A'}
                    </div>
                  </div>
                </>
              )}
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  Stage 3 Required Current
                </div>
                <div style={{ fontSize: '20px', fontWeight: '600' }}>
                  {totalCurrent > 0 ? `${totalCurrent.toFixed(3)} A` : 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  Stage 3 Deposition Rate
                </div>
                <div style={{ fontSize: '20px', fontWeight: '600' }}>
                  {depositionRate > 0 ? `${depositionRate.toFixed(3)} µm/min` : 'N/A'}
                </div>
              </div>
            </div>

            {/* Cumulative Summary */}
            {thicknessAfterStage2 > 0 && (
              <div style={{ padding: '15px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #ddd' }}>
                <h4 style={{ marginBottom: '10px', fontSize: '16px' }}>Cumulative Summary</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '14px' }}>
                  <div>
                    <div style={{ color: '#666' }}>Thickness after Stage 1:</div>
                    <div style={{ fontWeight: '600' }}>
                      {thicknessUnit === 'mm' 
                        ? (thicknessAfterStage1 / 1000).toFixed(4) 
                        : thicknessAfterStage1.toFixed(2)} {thicknessUnit}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#666' }}>Thickness after Stage 2:</div>
                    <div style={{ fontWeight: '600' }}>
                      {thicknessUnit === 'mm' 
                        ? (thicknessAfterStage2 / 1000).toFixed(4) 
                        : thicknessAfterStage2.toFixed(2)} {thicknessUnit}
                    </div>
                  </div>
                  {calculatedThicknessDisplay !== null && (
                    <div>
                      <div style={{ color: '#666' }}>Final Thickness:</div>
                      <div style={{ fontWeight: '600' }}>
                        {calculatedThicknessDisplay.toFixed(thicknessUnit === 'mm' ? 4 : 2)} {thicknessUnit}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
