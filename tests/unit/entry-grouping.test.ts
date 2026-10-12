import { describe, expect, it } from 'vitest';
import { groupEntriesByCategory } from '../../src/core/entry-grouping';
import type { TimeEntry } from '../../src/core/types';

function entry(id: string, category: 'WORK' | 'LEARNING', order: number): TimeEntry {
  return {
    id,
    category,
    description: `entry-${id}`,
    timeValue: 30,
    date: '2026-10-12',
    timestampCreation: order,
  };
}

describe('groupEntriesByCategory', () => {
  it('returns empty arrays for an empty input', () => {
    expect(groupEntriesByCategory([])).toEqual({ work: [], learning: [] });
  });

  it('splits one WORK and one LEARNING entry preserving references', () => {
    const w = entry('w', 'WORK', 1);
    const l = entry('l', 'LEARNING', 2);
    const result = groupEntriesByCategory([w, l]);
    expect(result.work).toEqual([w]);
    expect(result.learning).toEqual([l]);
    expect(result.work[0]).toBe(w);
    expect(result.learning[0]).toBe(l);
  });

  it('keeps the order of three WORK entries', () => {
    const entries = [entry('a', 'WORK', 1), entry('b', 'WORK', 2), entry('c', 'WORK', 3)];
    const result = groupEntriesByCategory(entries);
    expect(result.work.map((e) => e.id)).toEqual(['a', 'b', 'c']);
    expect(result.learning).toHaveLength(0);
  });

  it('preserves relative order for interleaved categories', () => {
    const entries = [
      entry('w1', 'WORK', 1),
      entry('l1', 'LEARNING', 2),
      entry('w2', 'WORK', 3),
    ];
    const result = groupEntriesByCategory(entries);
    expect(result.work.map((e) => e.id)).toEqual(['w1', 'w2']);
    expect(result.learning.map((e) => e.id)).toEqual(['l1']);
  });

  it('satisfies the length invariant and does not mutate the input', () => {
    const entries = [entry('w1', 'WORK', 1), entry('l1', 'LEARNING', 2), entry('w2', 'WORK', 3)];
    const snapshot = [...entries];
    const result = groupEntriesByCategory(entries);
    expect(result.work.length + result.learning.length).toBe(entries.length);
    expect(entries).toEqual(snapshot);
  });
});
