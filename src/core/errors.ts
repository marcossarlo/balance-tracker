export type RepositoryErrorCode =
  | 'QUOTA_EXCEEDED'
  | 'DB_UNAVAILABLE'
  | 'VALIDATION'
  | 'UNKNOWN';

export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;

  constructor(code: RepositoryErrorCode, message: string) {
    super(message);
    this.name = 'RepositoryError';
    this.code = code;
  }
}

export function mapIndexedDbError(error: unknown): RepositoryError {
  if (error instanceof RepositoryError) {
    return error;
  }

  const name = error instanceof Error ? error.name : '';

  switch (name) {
    case 'QuotaExceededError':
      return new RepositoryError('QUOTA_EXCEEDED', 'Storage quota exceeded');
    case 'AbortError':
    case 'InvalidStateError':
    case 'SecurityError':
    case 'UnknownError':
      return new RepositoryError(
        'DB_UNAVAILABLE',
        `IndexedDB unavailable: ${name || 'unknown failure'}`,
      );
    default:
      return new RepositoryError(
        'UNKNOWN',
        error instanceof Error ? error.message : 'Unknown repository error',
      );
  }
}
