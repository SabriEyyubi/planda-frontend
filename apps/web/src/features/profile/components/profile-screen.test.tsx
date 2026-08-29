import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AnchorHTMLAttributes } from 'react';
import messages from '@/messages/en.json';
import { ProfileScreen } from './profile-screen';

vi.mock('@/lib/i18n/navigation', () => ({
  Link: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />,
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ProfileScreen', () => {
  it('leaves loading state and offers retry when the network request rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ProfileScreen />
      </NextIntlClientProvider>,
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Profile could not be loaded',
      }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled();
  });
});
