import { describe, expect, it } from 'vitest';
import { mergeMessages } from './messages';

describe('mergeMessages', () => {
  it('keeps localized copy and safely fills missing nested keys from English', () => {
    expect(
      mergeMessages(
        { Common: { projects: 'Projects', map: 'Map' } },
        { Common: { projects: 'Projeler' } },
      ),
    ).toEqual({ Common: { projects: 'Projeler', map: 'Map' } });
  });
});
