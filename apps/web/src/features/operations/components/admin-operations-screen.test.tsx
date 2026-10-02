import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/tr.json';
import { AdminOperationsScreen } from './admin-operations-screen';
const request = vi.hoisted(() => vi.fn());
vi.mock('../api/operations-client', () => ({ operationsRequest: request }));
afterEach(() => {
  cleanup();
  request.mockReset();
});
describe('admin request ownership', () => {
  it('ignores an old overview response after the review queue loads', async () => {
    let finishOverview!: (value: unknown) => void;
    request.mockImplementation((path: string) =>
      path === '/admin/overview'
        ? new Promise((resolve) => {
            finishOverview = resolve;
          })
        : Promise.resolve({
            items: [
              {
                id: 'p',
                name: 'İncelenecek proje',
                developerName: 'Geliştirici',
                status: 'IN_REVIEW',
              },
            ],
            pageInfo: { hasNextPage: false, nextCursor: null },
          }),
    );
    render(
      <NextIntlClientProvider locale="tr" messages={messages}>
        <AdminOperationsScreen />
      </NextIntlClientProvider>,
    );
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith('/admin/overview'),
    );
    const queue = document.getElementById('admin-tab-queue')!;
    fireEvent.click(queue);
    expect(await screen.findByText('İncelenecek proje')).toBeInTheDocument();
    await act(async () => finishOverview({ publishedProjectCount: 99 }));
    expect(screen.getByText('İncelenecek proje')).toBeInTheDocument();
    expect(
      screen.queryByText('Onay kuyruğu tamamlandı.'),
    ).not.toBeInTheDocument();
  });
});

it('keeps a loaded active admin tab ready when selected again', async () => {
  request.mockResolvedValue({
    publishedProjectCount: 7,
    pendingReviewCount: 0,
    developerCount: 2,
    buyerCount: 3,
    leadCount: 4,
  });
  render(
    <NextIntlClientProvider locale="tr" messages={messages}>
      <AdminOperationsScreen />
    </NextIntlClientProvider>,
  );
  await waitFor(() => expect(screen.getByText('7')).toBeInTheDocument());
  fireEvent.click(document.getElementById('admin-tab-overview')!);
  expect(screen.getByText('7')).toBeInTheDocument();
});
