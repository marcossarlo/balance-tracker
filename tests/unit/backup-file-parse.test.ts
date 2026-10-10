import { describe, expect, it } from 'vitest';
import {
  BACKUP_APP,
  BACKUP_VERSION,
  MAX_BACKUP_TEXT_BYTES,
  parseBackupFile,
  serializeBackupFile,
} from '../../src/core/backup-file';
import { RepositoryError } from '../../src/core/errors';
import type { TimeEntry } from '../../src/core/types';

const VALID_ENTRY: TimeEntry = {
  id: 'c0000000-0000-4000-8000-000000000001',
  category: 'WORK',
  description: 'Escribir especificacion',
  timeValue: 60,
  date: '2026-10-10',
  timestampCreation: 1760000000000,
};

function backupJson(entries: unknown[], overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: 1760100000000,
    entries,
    ...overrides,
  });
}

function expectBackupInvalid(text: string): void {
  try {
    parseBackupFile(text);
    expect.fail('parseBackupFile should have thrown');
  } catch (error) {
    expect(error).toBeInstanceOf(RepositoryError);
    expect((error as RepositoryError).code).toBe('BACKUP_INVALID');
  }
}

describe('parseBackupFile', () => {
  it('accepts a valid backup and returns the full structure', () => {
    const text = backupJson([VALID_ENTRY]);
    const backup = parseBackupFile(text);
    expect(backup.app).toBe('balance-tracker');
    expect(backup.version).toBe(1);
    expect(backup.entries).toEqual([VALID_ENTRY]);
  });

  it('round-trips serializeBackupFile → parseBackupFile identically', () => {
    const text = serializeBackupFile([VALID_ENTRY], 1760100000000);
    expect(parseBackupFile(text)).toEqual({
      app: 'balance-tracker',
      version: 1,
      exportedAt: 1760100000000,
      entries: [VALID_ENTRY],
    });
  });

  it('accepts an empty entries array', () => {
    expect(parseBackupFile(backupJson([])).entries).toEqual([]);
  });

  it('rejects non-JSON text', () => {
    expectBackupInvalid('not json at all');
  });

  it('rejects JSON that is not an object (array)', () => {
    expectBackupInvalid(JSON.stringify([VALID_ENTRY]));
  });

  it('rejects wrong app marker', () => {
    expectBackupInvalid(backupJson([VALID_ENTRY], { app: 'other-app' }));
  });

  it('rejects version 2 (future format)', () => {
    expectBackupInvalid(backupJson([VALID_ENTRY], { version: 2 }));
  });

  it('rejects non-array entries', () => {
    expectBackupInvalid(backupJson([]).replace('"entries":[]', '"entries":{}'));
  });

  it('rejects entry with timeValue 45 (outside catalog)', () => {
    expectBackupInvalid(backupJson([{ ...VALID_ENTRY, timeValue: 45 }]));
  });

  it('rejects entry with category outside the enum', () => {
    expectBackupInvalid(backupJson([{ ...VALID_ENTRY, category: 'STUDY' }]));
  });

  it('rejects entry with description longer than 200 chars', () => {
    expectBackupInvalid(backupJson([{ ...VALID_ENTRY, description: 'x'.repeat(201) }]));
  });

  it('rejects entry with empty description', () => {
    expectBackupInvalid(backupJson([{ ...VALID_ENTRY, description: '' }]));
  });

  it('rejects entry with malformed date', () => {
    expectBackupInvalid(backupJson([{ ...VALID_ENTRY, date: '10-10-2026' }]));
  });

  it('rejects text larger than MAX_BACKUP_TEXT_BYTES with BACKUP_TOO_LARGE', () => {
    const padding = ' '.repeat(MAX_BACKUP_TEXT_BYTES + 1);
    const text = backupJson([VALID_ENTRY]) + padding;
    try {
      parseBackupFile(text);
      expect.fail('parseBackupFile should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(RepositoryError);
      expect((error as RepositoryError).code).toBe('BACKUP_TOO_LARGE');
    }
  });
});
