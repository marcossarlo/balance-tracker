import { describe, expect, it } from 'vitest';
import {
  BACKUP_APP,
  BACKUP_VERSION,
  buildBackupFileName,
  serializeBackupFile,
} from '../../src/core/backup-file';
import type { TimeEntry } from '../../src/core/types';

const SAMPLE_ENTRIES: TimeEntry[] = [
  {
    id: 'a0000000-0000-4000-8000-000000000001',
    category: 'WORK',
    description: 'Escribir especificacion',
    timeValue: 60,
    date: '2026-10-10',
    timestampCreation: 1760000000000,
  },
  {
    id: 'a0000000-0000-4000-8000-000000000002',
    category: 'LEARNING',
    description: 'Leer documentacion',
    timeValue: 30,
    date: '2026-10-09',
    timestampCreation: 1759900000000,
  },
];

describe('serializeBackupFile', () => {
  it('produces valid JSON with app, version and entries preserving all fields', () => {
    const text = serializeBackupFile(SAMPLE_ENTRIES, 1760100000000);
    const parsed = JSON.parse(text) as Record<string, unknown>;
    expect(parsed.app).toBe(BACKUP_APP);
    expect(parsed.app).toBe('balance-tracker');
    expect(parsed.version).toBe(BACKUP_VERSION);
    expect(parsed.version).toBe(1);
    expect(parsed.exportedAt).toBe(1760100000000);
    expect(parsed.entries).toEqual(SAMPLE_ENTRIES);
  });

  it('produces a valid file with entries: [] for an empty list', () => {
    const parsed = JSON.parse(serializeBackupFile([], 1760100000000)) as Record<string, unknown>;
    expect(parsed.entries).toEqual([]);
  });
});

describe('buildBackupFileName', () => {
  it('builds balance-tracker-YYYY-MM-DD.json', () => {
    expect(buildBackupFileName('2026-10-10')).toBe('balance-tracker-2026-10-10.json');
  });
});

describe('round-trip', () => {
  it('serialize then parse returns an identical structure (placeholder until parse exists)', () => {
    const text = serializeBackupFile(SAMPLE_ENTRIES, 1760100000000);
    const parsed = JSON.parse(text) as { entries: TimeEntry[] };
    expect(parsed.entries).toEqual(SAMPLE_ENTRIES);
  });
});
