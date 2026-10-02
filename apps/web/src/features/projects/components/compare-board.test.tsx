import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import messages from '@/messages/tr.json';
import { CompareBoard } from './compare-board';
import { projectFixtures, detailFixtureFor } from '../model/fixtures';
const source = projectFixtures[0]!;
const detail = detailFixtureFor(source.slug)!;
afterEach(() => {
  cleanup();
  localStorage.clear();
  history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
});
describe('CompareBoard live selected details', () => {
  it('loads selected projects outside the catalog page and carries plan context into the lead form', async () => {
    history.replaceState(null, '', `/?ids=${source.id}`);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify(detail))),
    );
    render(
      <NextIntlClientProvider locale="tr" messages={messages}>
        <CompareBoard projects={[]} />
      </NextIntlClientProvider>,
    );
    expect(
      await screen.findByRole('combobox', {
        name: `${source.name} daire tipi`,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Toplam · örnek')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Satış ofisiyle iletişime geç' }),
    );
    expect(screen.getByRole('dialog')).toHaveTextContent(
      detail.paymentPlans[0]!.name,
    );
    expect(screen.getByLabelText(messages.BuyerCore.unitPreference)).toHaveValue(
      detail.unitTypes[0]!.roomType,
    );
  });
  it('offers recovery for fetch failure rather than declaring the project unpublished', async () => {
    history.replaceState(null, '', '/?ids=remote-id');
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response('{}', { status: 503 }))
      .mockResolvedValueOnce(new Response('{}', { status: 404 }));
    vi.stubGlobal('fetch', fetch);
    render(
      <NextIntlClientProvider locale="tr" messages={messages}>
        <CompareBoard projects={[]} />
      </NextIntlClientProvider>,
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Yeniden dene' }),
    );
    await waitFor(() =>
      expect(screen.getByText('Proje artık yayında değil')).toBeInTheDocument(),
    );
  });
});
