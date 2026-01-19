import React, { useCallback, useState } from 'react';
import type { FileData, STLUnit } from '../types';
import { parseASCIISTL, parseBinarySTL, isASCIISTL } from '../utils/stlParser';
import { parse3MF } from '../utils/threeMFParser';
import { calculateSurfaceArea } from '../utils/geometry';

interface FileDropZoneProps {
  onFilesLoaded: (files: FileData[]) => void;
  unit: STLUnit;
}

export function FileDropZone({ onFilesLoaded, unit }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = useCallback(async (file: File): Promise<FileData | null> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      let triangles;
      let useUnit = unit; // Default to session unit for STL

      if (file.name.toLowerCase().endsWith('.stl')) {
        if (isASCIISTL(arrayBuffer)) {
          const text = new TextDecoder('ascii').decode(arrayBuffer);
          triangles = parseASCIISTL(text);
        } else {
          triangles = parseBinarySTL(arrayBuffer);
        }
      } else if (file.name.toLowerCase().endsWith('.3mf')) {
        // 3MF files have units built-in, so unitScale is 1 (already converted to mm)
        const result = await parse3MF(arrayBuffer);
        triangles = result.triangles;
        useUnit = 'mm'; // 3MF is already converted to mm
      } else {
        throw new Error('Unsupported file type');
      }

      if (triangles.length === 0) {
        throw new Error('No triangles found in file');
      }

      const surfaceArea_dm2 = calculateSurfaceArea(triangles, useUnit);

      return {
        filename: file.name,
        surfaceArea_dm2,
      };
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      return null;
    }
  }, [unit]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(
      (f) => f.name.toLowerCase().endsWith('.stl') || f.name.toLowerCase().endsWith('.3mf')
    );

    if (validFiles.length === 0) {
      alert('Please select STL or 3MF files');
      return;
    }

    setIsProcessing(true);

    try {
      const results = await Promise.all(validFiles.map(processFile));
      const validResults = results.filter((r): r is FileData => r !== null);
      onFilesLoaded(validResults);
    } catch (error) {
      console.error('Error processing files:', error);
      alert('Error processing files. Please check the console for details.');
    } finally {
      setIsProcessing(false);
    }
  }, [processFile, onFilesLoaded]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragging ? '#2196F3' : '#ccc'}`,
        borderRadius: '8px',
        padding: '40px',
        textAlign: 'center',
        backgroundColor: isDragging ? 'rgba(240, 248, 255, 0.85)' : 'rgba(250, 250, 250, 0.85)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <input
        id="file-input"
        type="file"
        multiple
        accept=".stl,.3mf"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />
      {isProcessing ? (
        <div>
          <p>Processing files...</p>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: '18px', marginBottom: '10px' }}>
            📁 Drag and drop STL or 3MF files here
          </p>
          <p style={{ color: '#666', fontSize: '14px' }}>
            or click to browse
          </p>
          <p style={{ color: '#999', fontSize: '12px', marginTop: '10px' }}>
            Supports multiple files • STL (ASCII & Binary) • 3MF
          </p>
        </div>
      )}
    </div>
  );
}
