import { useState } from 'react';
import type { FileData, STLUnit } from './types';
import { FileDropZone } from './components/FileDropZone';
import { ResultsTable } from './components/ResultsTable';
import { PlatingCalculator } from './components/PlatingCalculator';

type InputMode = 'upload' | 'manual';

type SurfaceAreaUnit = 'dm²' | 'cm²' | 'm²' | 'mm²';

function App() {
  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [files, setFiles] = useState<FileData[]>([]);
  const [unit, setUnit] = useState<STLUnit>('mm');
  const [manualSurfaceArea, setManualSurfaceArea] = useState<string>('');
  const [manualSurfaceAreaUnit, setManualSurfaceAreaUnit] = useState<SurfaceAreaUnit>('mm²');

  const handleFilesLoaded = (newFiles: FileData[]) => {
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  const handleClearFiles = () => {
    setFiles([]);
  };

  // Convert manual surface area to dm²
  const manualSurfaceArea_dm2 = (() => {
    const value = parseFloat(manualSurfaceArea);
    if (isNaN(value) || value <= 0) return 0;
    
    switch (manualSurfaceAreaUnit) {
      case 'dm²':
        return value;
      case 'cm²':
        return value / 100; // 1 dm² = 100 cm²
      case 'm²':
        return value * 100; // 1 m² = 100 dm²
      case 'mm²':
        return value / 10000; // 1 dm² = 10000 mm²
      default:
        return 0;
    }
  })();

  const totalSurfaceArea = inputMode === 'upload' 
    ? files.reduce((sum, file) => sum + file.surfaceArea_dm2, 0)
    : manualSurfaceArea_dm2;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
          <img 
            src="/logo.svg" 
            alt="Electroplating Calculator Logo" 
            style={{ 
              height: '48px', 
              width: '48px',
              flexShrink: 0
            }} 
          />
          <h1 style={{ fontSize: '32px', margin: 0 }}>
            Electroplating Calculator
          </h1>
        </div>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Workshop-grade calculator for computing surface area and electroplating parameters
          using Faraday's law
        </p>
      </header>

      {/* Input Mode Selector */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Input Method
        </label>
        <div style={{ display: 'flex', gap: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="radio"
              value="upload"
              checked={inputMode === 'upload'}
              onChange={(e) => setInputMode(e.target.value as InputMode)}
              style={{ marginRight: '8px' }}
            />
            Upload Files
          </label>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="radio"
              value="manual"
              checked={inputMode === 'manual'}
              onChange={(e) => setInputMode(e.target.value as InputMode)}
              style={{ marginRight: '8px' }}
            />
            Manual Entry
          </label>
        </div>
      </div>

      {inputMode === 'upload' ? (
        <>
          {/* Unit Selector for STL files */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              STL File Units (3MF files auto-detect units):
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as STLUnit)}
              style={{
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                minWidth: '150px',
              }}
            >
              <option value="mm">Millimeters (mm)</option>
              <option value="cm">Centimeters (cm)</option>
              <option value="inch">Inches (inch)</option>
            </select>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              This setting applies to STL files loaded after selection. 3MF files automatically
              read units from the file.
            </p>
          </div>

          {/* File Drop Zone */}
          <FileDropZone onFilesLoaded={handleFilesLoaded} unit={unit} />

          {/* Clear Files Button */}
          {files.length > 0 && (
            <div style={{ marginTop: '15px', marginBottom: '15px' }}>
              <button
                onClick={handleClearFiles}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f44336',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#d32f2f';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#f44336';
                }}
              >
                Clear All Files
              </button>
            </div>
          )}

          {/* Results Table */}
          <ResultsTable files={files} />
        </>
      ) : (
        <>
          {/* Manual Entry Section */}
          <div
            style={{
              marginBottom: '20px',
              padding: '20px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ marginBottom: '15px', fontSize: '20px' }}>Manual Surface Area Entry</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Surface Area
                </label>
                <input
                  type="number"
                  value={manualSurfaceArea}
                  onChange={(e) => setManualSurfaceArea(e.target.value)}
                  min="0"
                  step="0.0001"
                  placeholder="0.0000"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Unit
                </label>
                <select
                  value={manualSurfaceAreaUnit}
                  onChange={(e) => setManualSurfaceAreaUnit(e.target.value as SurfaceAreaUnit)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  <option value="dm²">Square Decimeters (dm²)</option>
                  <option value="cm²">Square Centimeters (cm²)</option>
                  <option value="m²">Square Meters (m²)</option>
                  <option value="mm²">Square Millimeters (mm²)</option>
                </select>
              </div>
            </div>
            {manualSurfaceArea_dm2 > 0 && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#f0f8ff',
                  border: '1px solid #2196F3',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <strong>Total Surface Area:</strong> {manualSurfaceArea_dm2.toFixed(4)} dm²
              </div>
            )}
          </div>
        </>
      )}

      {/* Plating Calculator */}
      <PlatingCalculator totalSurfaceArea_dm2={totalSurfaceArea} />
    </div>
  );
}

export default App;
