// Shared utilities for admin settings components

export const getScoreBadgeColor = (score: number): string => {
  if (score >= 5) return '#10b981';
  if (score >= 4) return '#22c55e';
  if (score >= 3) return '#eab308';
  if (score >= 2) return '#f97316';
  return '#ef4444';
};

export const showMessage = (
  setMessage: (msg: string) => void,
  setMessageType: (type: string) => void,
  text: string,
  type: 'success' | 'error' | 'info' = 'info'
) => {
  setMessage(text);
  setMessageType(type);
  setTimeout(() => {
    setMessage('');
    setMessageType('');
  }, 3000);
};

// CSV generation helper
export const generateCSV = (headers: string[], rows: string[][]): string => {
  const escapeField = (field: string): string => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  const csvRows = [
    headers.map(escapeField).join(','),
    ...rows.map(row => row.map(escapeField).join(','))
  ];

  return csvRows.join('\n');
};

// Download file helper
export const downloadFile = (content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;') => {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Parse CSV helper
export const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());

  return result;
};

// Common styles
export const cardStyle = {
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: '24px',
  border: '1px solid #e5e7eb',
  marginBottom: '24px'
};

export const buttonPrimaryStyle = {
  padding: '10px 16px',
  backgroundColor: '#0066cc',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px'
};

export const buttonSecondaryStyle = {
  padding: '8px 16px',
  backgroundColor: '#f3f4f6',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  color: '#374151',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

export const selectStyle = {
  padding: '10px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  color: '#111827',
  backgroundColor: 'white',
  minWidth: '200px'
};

export const labelStyle = {
  fontSize: '14px',
  fontWeight: '500',
  color: '#374151',
  marginBottom: '6px',
  display: 'block'
};
