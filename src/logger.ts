export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogPayload {
  route?: string;
  tool?: string;
  duration?: number;
  error_code?: string;
  [key: string]: unknown;
}

const SENSITIVE_KEY_PATTERN = /password|hash|token|secret|authorization|key|cookie/i;

function redactSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(redactSensitiveData);
  }

  if (typeof data === 'object') {
    const copy: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        copy[key] = '[REDACTED]';
      } else {
        copy[key] = redactSensitiveData(value);
      }
    }
    return copy;
  }

  return data;
}

function writeLog(level: LogLevel, payload: LogPayload, message?: string): void {
  const sanitized = (redactSensitiveData(payload) as LogPayload) || {};

  const record = {
    level,
    time: new Date().toISOString(),
    message: message ?? (typeof payload.message === 'string' ? payload.message : undefined),
    ...sanitized,
  };

  const output = JSON.stringify(record);
  if (level === 'error') {
    console.error(output);
  } else if (level === 'warn') {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  debug: (payload: LogPayload, message?: string) => writeLog('debug', payload, message),
  info: (payload: LogPayload, message?: string) => writeLog('info', payload, message),
  warn: (payload: LogPayload, message?: string) => writeLog('warn', payload, message),
  error: (payload: LogPayload, message?: string) => writeLog('error', payload, message),
};
