import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AnchorHTMLAttributes } from 'react';
import messages from '@/messages/en.json';
import { FavoriteButton } from './favorite-button';
import { SavedProjectsScreen } from './saved-projects-screen';

vi.mock('@/lib/i18n/navigation', () => ({
  Link: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />,
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function provider(children: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

describe('saved-project network recovery', () => {
  it('shows retry UI when the saved-project list request rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    render(provider(<SavedProjectsScreen />));
    expect(
      await screen.findByRole('heading', {
        name: 'Favorites could not be loaded',
      }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled();
  });

  it('rolls back optimistic favorite state when the mutation request rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    render(provider(<FavoriteButton projectId="project-1" />));
    const button = screen.getByRole('button', { name: /Add to favorites/ });
    fireEvent.click(button);
    await waitFor(() =>
      expect(button).toHaveAttribute('aria-pressed', 'false'),
    );
    expect(button).toBeEnabled();
    expect(screen.getByRole('status')).toHaveTextContent(
      'The favorite change could not be saved.',
    );
  });
});
