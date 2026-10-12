import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTimeEntry,
  getDailyBalance,
  getLocalToday,
  replaceTimeEntry,
} from '../../src/core/time-entry.repo';
import { db } from '../../src/core/db';
import type { TimeEntry } from '../../src/core/types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('replaceTimeEntry (integration, fake-indexeddb)', () => {
  beforeEach(async () => {
    await db.timeEntries.clear();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await db.timeEntries.clear();
  });

  it('replaces an entry via delete+create preserving the date (success path)', async () => {
    const original = await createTimeEntry({
      category: 'WORK',
      description: 'Descripcion A',
      timeValue: 60,
    });

    const before = Date.now();
    const replaced = await replaceTimeEntry({
      id: original.id,
      category: 'LEARNING',
      description: '  Descripcion B  ',
      timeValue: 120,
    });

    expect(replaced.id).toMatch(UUID_RE);
    expect(replaced.id).not.toBe(original.id);
    expect(replaced.category).toBe('LEARNING');
    expect(replaced.description).toBe('Descripcion B');
    expect(replaced.timeValue).toBe(120);
    expect(replaced.date).toBe(getLocalToday());
    expect(replaced.date).toBe(original.date);
    expect(replaced.timestampCreation).toBeGreaterThanOrEqual(before);

    expect(await db.timeEntries.get(original.id)).toBeUndefined();
    expect(await db.timeEntries.get(replaced.id)).toEqual(replaced);

    const dayRows = await db.timeEntries.where('date').equals(getLocalToday()).toArray();
    expect(dayRows).toHaveLength(1);
    expect(dayRows[0].id).toBe(replaced.id);

    const balance = await getDailyBalance(getLocalToday());
    expect(balance).toEqual({ work: 0, learning: 120, total: 120 });
  });

  it('rejects invalid category with VALIDATION and leaves the DB unchanged', async () => {
    const original = await createTimeEntry({
      category: 'WORK',
      description: 'Original',
      timeValue: 30,
    });

    await expect(
      replaceTimeEntry({
        id: original.id,
        category: 'OTHER' as never,
        description: 'Nueva',
        timeValue: 60,
      }),
    ).rejects.toMatchObject({ name: 'RepositoryError', code: 'VALIDATION' });

    expect(await db.timeEntries.get(original.id)).toEqual(original);
    expect(await db.timeEntries.count()).toBe(1);
  });

  it('rejects invalid timeValue with VALIDATION and leaves the DB unchanged', async () => {
    const original = await createTimeEntry({
      category: 'WORK',
      description: 'Original',
      timeValue: 30,
    });

    await expect(
      replaceTimeEntry({
        id: original.id,
        category: 'WORK',
        description: 'Nueva',
        timeValue: 45 as never,
      }),
    ).rejects.toMatchObject({ name: 'RepositoryError', code: 'VALIDATION' });

    expect(await db.timeEntries.get(original.id)).toEqual(original);
    expect(await db.timeEntries.count()).toBe(1);
  });

  it('rejects empty description with VALIDATION and leaves the DB unchanged', async () => {
    const original = await createTimeEntry({
      category: 'WORK',
      description: 'Original',
      timeValue: 30,
    });

    await expect(
      replaceTimeEntry({
        id: original.id,
        category: 'WORK',
        description: '   ',
        timeValue: 60,
      }),
    ).rejects.toMatchObject({ name: 'RepositoryError', code: 'VALIDATION' });

    expect(await db.timeEntries.get(original.id)).toEqual(original);
    expect(await db.timeEntries.count()).toBe(1);
  });

  it('rejects a nonexistent id with VALIDATION and leaves the DB unchanged', async () => {
    await createTimeEntry({ category: 'WORK', description: 'Unica', timeValue: 15 });

    await expect(
      replaceTimeEntry({
        id: 'no-existe',
        category: 'WORK',
        description: 'Nueva',
        timeValue: 60,
      }),
    ).rejects.toMatchObject({ name: 'RepositoryError', code: 'VALIDATION' });

    expect(await db.timeEntries.count()).toBe(1);
  });

  it('rolls back the delete when add fails inside the transaction', async () => {
    const original = await createTimeEntry({
      category: 'WORK',
      description: 'Superviviente',
      timeValue: 60,
    });

    const addSpy = vi
      .spyOn(db.timeEntries, 'add')
      .mockRejectedValueOnce(new Error('forced failure'));

    await expect(
      replaceTimeEntry({
        id: original.id,
        category: 'LEARNING',
        description: 'Nunca persistida',
        timeValue: 120,
      }),
    ).rejects.toMatchObject({ name: 'RepositoryError', code: 'UNKNOWN' });

    expect(await db.timeEntries.get(original.id)).toEqual(original);
    expect(await db.timeEntries.count()).toBe(1);

    addSpy.mockRestore();

    const retried = await replaceTimeEntry({
      id: original.id,
      category: 'LEARNING',
      description: 'Reintento valido',
      timeValue: 120,
    });
    expect(await db.timeEntries.get(original.id)).toBeUndefined();
    expect((await db.timeEntries.get(retried.id))?.description).toBe('Reintento valido');
  });

  it('preserves the original past date when replacing a past-day entry (US2)', async () => {
    const past: TimeEntry = {
      id: crypto.randomUUID(),
      category: 'WORK',
      description: 'Tarea antigua',
      timeValue: 60,
      date: '2020-01-15',
      timestampCreation: 0,
    };
    await db.timeEntries.add(past);

    const replaced = await replaceTimeEntry({
      id: past.id,
      category: 'WORK',
      description: 'Tarea antigua',
      timeValue: 120,
    });

    expect(replaced.date).toBe('2020-01-15');
    expect(replaced.id).not.toBe(past.id);
    expect(await db.timeEntries.get(past.id)).toBeUndefined();

    const todayRows = await db.timeEntries.where('date').equals(getLocalToday()).toArray();
    expect(todayRows).toHaveLength(0);

    expect(await getDailyBalance('2020-01-15')).toEqual({
      work: 120,
      learning: 0,
      total: 120,
    });
    expect(await getDailyBalance(getLocalToday())).toEqual({ work: 0, learning: 0, total: 0 });
  });
});
