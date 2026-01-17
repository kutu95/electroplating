import type { FileData } from '../types';

interface ResultsTableProps {
  files: FileData[];
}

export function ResultsTable({ files }: ResultsTableProps) {
  const totalArea = files.reduce((sum, file) => sum + file.surfaceArea_dm2, 0);

  if (files.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '30px' }}>
      <h2 style={{ marginBottom: '15px' }}>Surface Area Results</h2>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: '#fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th
              style={{
                padding: '12px',
                textAlign: 'left',
                borderBottom: '2px solid #ddd',
                fontWeight: '600',
              }}
            >
              Filename
            </th>
            <th
              style={{
                padding: '12px',
                textAlign: 'right',
                borderBottom: '2px solid #ddd',
                fontWeight: '600',
              }}
            >
              Surface Area (dm²)
            </th>
          </tr>
        </thead>
        <tbody>
          {files.map((file, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px' }}>{file.filename}</td>
              <td style={{ padding: '12px', textAlign: 'right' }}>
                {file.surfaceArea_dm2.toFixed(4)}
              </td>
            </tr>
          ))}
          <tr
            style={{
              backgroundColor: '#f9f9f9',
              fontWeight: '600',
              borderTop: '2px solid #333',
            }}
          >
            <td style={{ padding: '12px' }}>Total</td>
            <td style={{ padding: '12px', textAlign: 'right' }}>
              {totalArea.toFixed(4)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
