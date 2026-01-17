import { useState } from 'react';
import type { FileData, STLUnit } from './types';
import { FileDropZone } from './components/FileDropZone';
import { ResultsTable } from './components/ResultsTable';
import { PlatingCalculator } from './components/PlatingCalculator';

function App() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [unit, setUnit] = useState<STLUnit>('mm');

  const handleFilesLoaded = (newFiles: FileData[]) => {
    setFiles(newFiles);
  };

  const totalSurfaceArea = files.reduce((sum, file) => sum + file.surfaceArea_dm2, 0);

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

      {/* Results Table */}
      <ResultsTable files={files} />

      {/* Plating Calculator */}
      <PlatingCalculator totalSurfaceArea_dm2={totalSurfaceArea} />
    </div>
  );
}

export default App;
