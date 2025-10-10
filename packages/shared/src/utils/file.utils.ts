import { Readable } from 'stream';

export const ALLOWED_TYPES = [
  'text/csv',
  'application/json',
  'application/x-ndjson',
] as const;

export type SupportedMimeType = (typeof ALLOWED_TYPES)[number];

export interface FileTypeResult {
  mime: SupportedMimeType;
  ext: string;
  isSupported: true;
}

export interface UnsupportedFileResult {
  mime: string;
  ext: string;
  isSupported: false;
  error: string;
}

export type ParseResult = FileTypeResult | UnsupportedFileResult;

export const isCSVContent = (content: string): boolean => {
  const lines = content.trim().split('\n');
  if (lines.length < 1) {
    return false;
  }
  const firstLine = lines[0].trim();

  try {
    JSON.parse(firstLine);
    return false;
  } catch {
    // Not JSON, continue checking
  }

  if (firstLine.startsWith('{') || firstLine.startsWith('[')) {
    return false;
  }

  return firstLine.includes(',') || firstLine.includes(';');
};

export const isJSONContent = (content: string): boolean => {
  const trimmed = content.trim();
  try {
    JSON.parse(trimmed);
    return trimmed.startsWith('{') || trimmed.startsWith('[');
  } catch {
    return false;
  }
};

export const isNDJSONContent = (content: string): boolean => {
  const lines = content
    .trim()
    .split('\n')
    .filter(line => line.trim());
  if (lines.length === 0) {
    return false;
  }

  try {
    for (const line of lines.slice(0, 3)) {
      // Check first 3 lines
      JSON.parse(line);
    }
    // Must have newlines and each line should be JSON
    return lines.length > 1 || content.includes('\n');
  } catch {
    return false;
  }
};

export const detectFileType = (
  buffer: Buffer,
  filename: string
): ParseResult => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1000));

  if (ext === 'csv' || isCSVContent(content)) {
    return {
      mime: 'text/csv',
      ext: 'csv',
      isSupported: true,
    };
  }

  if (ext === 'json' || isJSONContent(content)) {
    return {
      mime: 'application/json',
      ext: 'json',
      isSupported: true,
    };
  }

  if (ext === 'ndjson' || ext === 'jsonl' || isNDJSONContent(content)) {
    return {
      mime: 'application/x-ndjson',
      ext: 'ndjson',
      isSupported: true,
    };
  }

  return {
    mime: 'application/octet-stream',
    ext: ext || 'unknown',
    isSupported: false,
    error: `Unsupported file type. Expected: ${ALLOWED_TYPES.join(', ')}`,
  };
};

export const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

export const streamToString = async (stream: Readable): Promise<string> => {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
};

export const streamToJson = async (stream: Readable): Promise<any> => {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () =>
      resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')))
    );
  });
};

export const streamToCsv = async (stream: Readable): Promise<any> => {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
};
