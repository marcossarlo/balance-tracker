import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTimeEntry } from '../../src/core/time-entry.repo';
import { RepositoryError } from '../../src/core/errors';
import { db } from '../../src/core/db';
import { DURATION_VALUES } from '../../src/core/types';

async function expectValidationFailure(input: {
  category?: unknown;
  description?: unknown;
  timeValue?: unknown;
}): Promise<RepositoryError> {
  try {
    await createTimeEntry(input as never);
  } catch (error) {
    expect(error).toBeInstanceOf(RepositoryError);
    expect((error as RepositoryError).code).toBe('VALIDATION');
    return error as RepositoryError;
  }
  throw new Error('expected VALIDATION failure');
}

describe('createTimeEntry validation (integration)', () => {
  beforeEach(async () => {
    await db.timeEntries.clear();
  });

  afterEach(async () => {
    await db.timeEntries.clear();
  });

  it('rejects category outside WORK|LEARNING', async () => {
    await expectValidationFailure({
      category: 'STUDY',
      description: 'x',
      timeValue: 15,
    });
    expect(await db.timeEntries.count()).toBe(0);
  });

  it.each([45, 0, 16, -15, 360])('rejects timeValue %s outside catalog', async (value) => {
    await expectValidationFailure({
      category: 'WORK',
      description: 'x',
      timeValue: value,
    });
    expect(await db.timeEntries.count()).toBe(0);
  });

  it('accepts every value of the catalog', async () => {
    for (const timeValue of DURATION_VALUES) {
      const entry = await createTimeEntry({
        category: 'WORK',
        description: `min ${timeValue}`,
        timeValue,
      });
      expect(entry.timeValue).toBe(timeValue);
    }
    expect(await db.timeEntries.count()).toBe(DURATION_VALUES.length);
  });

  it.each(['', '   ', '\t\n'])('rejects empty/whitespace description %j', async (description) => {
    await expectValidationFailure({ category: 'WORK', description, timeValue: 15 });
    expect(await db.timeEntries.count()).toBe(0);
  });

  it('rejects description longer than 200 chars', async () => {
    await expectValidationFailure({
      category: 'WORK',
      description: 'a'.repeat(201),
      timeValue: 15,
    });
    expect(await db.timeEntries.count()).toBe(0);
  });

  it('accepts description of exactly 200 chars', async () => {
    const entry = await createTimeEntry({
      category: 'LEARNING',
      description: 'a'.repeat(200),
      timeValue: 15,
    });
    expect(entry.description).toHaveLength(200);
  });
});
