import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTimeEntry, getLocalToday } from '../../src/core/time-entry.repo';
import { db } from '../../src/core/db';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('createTimeEntry (integration, fake-indexeddb)', () => {
  beforeEach(async () => {
    await db.timeEntries.clear();
  });

  afterEach(async () => {
    await db.timeEntries.clear();
  });

  it('persists a valid WORK entry with local today date', async () => {
    const before = Date.now();
    const entry = await createTimeEntry({
      category: 'WORK',
      description: 'Escribir especificacion',
      timeValue: 60,
    });

    expect(entry.id).toMatch(UUID_RE);
    expect(entry.category).toBe('WORK');
    expect(entry.description).toBe('Escribir especificacion');
    expect(entry.timeValue).toBe(60);
    expect(entry.date).toBe(getLocalToday());
    expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(entry.timestampCreation).toBeGreaterThanOrEqual(before);

    const stored = await db.timeEntries.get(entry.id);
    expect(stored).toEqual(entry);
  });

  it('persists a valid LEARNING entry and trims description', async () => {
    const entry = await createTimeEntry({
      category: 'LEARNING',
      description: '  Leer documentacion  ',
      timeValue: 30,
    });

    expect(entry.description).toBe('Leer documentacion');
    expect((await db.timeEntries.get(entry.id))?.category).toBe('LEARNING');
  });

  it('allows multiple entries on the same day', async () => {
    await createTimeEntry({ category: 'WORK', description: 'A', timeValue: 15 });
    await createTimeEntry({ category: 'WORK', description: 'B', timeValue: 240 });
    const today = getLocalToday();
    const dayEntries = await db.timeEntries.where('date').equals(today).toArray();
    expect(dayEntries).toHaveLength(2);
  });
});
