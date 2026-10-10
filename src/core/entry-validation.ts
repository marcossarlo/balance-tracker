import { RepositoryError } from './errors';
import { DURATION_VALUES, type Category, type DurationValue } from './types';

export interface EntryFields {
  category: Category;
  description: string;
  timeValue: DurationValue;
}

export function assertValidEntryFields(
  fields: { category: unknown; description: unknown; timeValue: unknown },
): asserts fields is EntryFields {
  if (fields.category !== 'WORK' && fields.category !== 'LEARNING') {
    throw new RepositoryError('VALIDATION', 'category must be WORK or LEARNING');
  }
  if (
    typeof fields.timeValue !== 'number' ||
    !DURATION_VALUES.includes(fields.timeValue as (typeof DURATION_VALUES)[number])
  ) {
    throw new RepositoryError('VALIDATION', 'timeValue must be in catalog');
  }
  if (
    typeof fields.description !== 'string' ||
    fields.description.trim().length < 1 ||
    fields.description.trim().length > 200
  ) {
    throw new RepositoryError('VALIDATION', 'description must be 1..200 chars');
  }
}
