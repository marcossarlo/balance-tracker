import { describe, expect, it } from 'vitest';
import { mapIndexedDbError, RepositoryError } from '../../src/core/errors';

function namedError(name: string): Error {
  const error = new Error(name);
  error.name = name;
  return error;
}

describe('mapIndexedDbError', () => {
  it('maps QuotaExceededError to QUOTA_EXCEEDED', () => {
    const mapped = mapIndexedDbError(namedError('QuotaExceededError'));
    expect(mapped).toBeInstanceOf(RepositoryError);
    expect(mapped.code).toBe('QUOTA_EXCEEDED');
  });

  it.each(['AbortError', 'InvalidStateError', 'SecurityError', 'UnknownError'])(
    'maps %s to DB_UNAVAILABLE',
    (name) => {
      expect(mapIndexedDbError(namedError(name)).code).toBe('DB_UNAVAILABLE');
    },
  );

  it('passes through RepositoryError unchanged', () => {
    const original = new RepositoryError('VALIDATION', 'bad input');
    expect(mapIndexedDbError(original)).toBe(original);
  });

  it('maps arbitrary errors to UNKNOWN preserving message', () => {
    const mapped = mapIndexedDbError(new Error('boom'));
    expect(mapped.code).toBe('UNKNOWN');
    expect(mapped.message).toBe('boom');
  });

  it('maps non-Error values to UNKNOWN', () => {
    expect(mapIndexedDbError('oops').code).toBe('UNKNOWN');
  });
});
