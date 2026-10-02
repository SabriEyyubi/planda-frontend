import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, expect, it } from 'vitest';
import messages from '@/messages/tr.json';
import { CompareToggleButton } from './compare-toggle-button';
import { COMPARE_STORAGE_KEY } from '../model/compare-storage';
afterEach(() => {
  cleanup();
  localStorage.clear();
});
it('accumulates and removes selections across separately mounted catalog buttons', async () => {
  render(
    <NextIntlClientProvider locale="tr" messages={messages}>
      <CompareToggleButton projectId="a" />
      <CompareToggleButton projectId="b" />
    </NextIntlClientProvider>,
  );
  const buttons = screen.getAllByRole('button');
  fireEvent.click(buttons[0]!);
  fireEvent.click(buttons[1]!);
  expect(JSON.parse(localStorage.getItem(COMPARE_STORAGE_KEY)!)).toEqual([
    'a',
    'b',
  ]);
  await waitFor(() =>
    expect(
      buttons.every((button) => button.getAttribute('aria-pressed') === 'true'),
    ).toBe(true),
  );
  fireEvent.click(buttons[0]!);
  expect(JSON.parse(localStorage.getItem(COMPARE_STORAGE_KEY)!)).toEqual(['b']);
  expect(buttons[1]).toHaveAttribute('aria-pressed', 'true');
  act(() => {
    localStorage.setItem(COMPARE_STORAGE_KEY, '[]');
    window.dispatchEvent(
      new StorageEvent('storage', { key: COMPARE_STORAGE_KEY }),
    );
  });
  expect(buttons[1]).toHaveAttribute('aria-pressed', 'false');
});
