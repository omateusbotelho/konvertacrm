export interface CSVParseResult {
  headers: string[];
  rows: Record<string, string>[];
  rawRows: string[][];
}

export function parseCSV(content: string): CSVParseResult {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length === 0) {
    return { headers: [], rows: [], rawRows: [] };
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);
  
  // Parse data rows
  const rawRows: string[][] = [];
  const rows: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    rawRows.push(values);
    
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return { headers, rows, rawRows };
}

function parseCSVLine(line: string): string[] {
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
      } else if (char === ',' || char === ';') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  
  result.push(current.trim());
  return result;
}

export interface ColumnMapping {
  csvColumn: string;
  dbField: string;
}

export interface ImportValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface ImportResult {
  success: number;
  errors: ImportValidationError[];
  total: number;
}
