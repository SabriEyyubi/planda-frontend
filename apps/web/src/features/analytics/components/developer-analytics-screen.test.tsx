import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import messages from '@/messages/en.json';
import { DeveloperAnalyticsScreen } from './developer-analytics-screen';

const operationsRequest = vi.hoisted(() => vi.fn());
vi.mock('@/features/operations/api/operations-client', () => ({
  operationsRequest,
}));

afterEach(() => {
  cleanup();
  operationsRequest.mockReset();
});

describe('DeveloperAnalyticsScreen', () => {
  it('renders an accessible visual chart and exact data fallback', async () => {
    const analytics = {
      range: {
        days: 30,
        from: '2026-08-01',
        to: '2026-08-30',
        previousFrom: '2026-07-02',
        previousTo: '2026-07-31',
        timeZone: 'UTC',
      },
      totals: {
        views: 10,
        favorites: 3,
        leads: 2,
        conversionRate: 20,
        viewsChangePercent: null,
        favoritesChangePercent: 50,
        leadsChangePercent: 0,
      },
      daily: [{ date: '2026-08-30', views: 10, favorites: 3, leads: 2 }],
      topProjects: [
        {
          projectId: 'p1',
          name: 'Nova',
          views: 10,
          favorites: 3,
          leads: 2,
          conversionRate: 20,
        },
      ],
    };
    operationsRequest.mockImplementation((path: string) =>
      path === '/developer/organizations'
        ? Promise.resolve([
            {
              id: 'org-1',
              name: 'Development Yapı',
              type: 'DEVELOPER',
              role: 'OWNER',
              canManage: true,
            },
          ])
        : Promise.resolve(analytics),
    );
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <DeveloperAnalyticsScreen />
      </NextIntlClientProvider>,
    );

    expect(
      await screen.findByRole('img', {
        name: /Daily views, favorite additions and leads line chart/,
      }),
    ).toBeVisible();
    expect(
      screen.getByRole('table', { name: 'Daily analytics values' }),
    ).toHaveTextContent('10');
    expect(operationsRequest).toHaveBeenCalledWith(
      '/developer/analytics?range=30&organizationId=org-1',
    );
  });

  it('switches analytics requests with an explicit multi-organization scope', async () => {
    operationsRequest.mockImplementation((path: string) =>
      path === '/developer/organizations'
        ? Promise.resolve([
            {
              id: 'org-1',
              name: 'First developer',
              type: 'DEVELOPER',
              role: 'OWNER',
              canManage: true,
            },
            {
              id: 'org-2',
              name: 'Second developer',
              type: 'DEVELOPER',
              role: 'MEMBER',
              canManage: false,
            },
          ])
        : Promise.resolve({
            range: {
              days: 30,
              from: '2026-08-01',
              to: '2026-08-30',
              previousFrom: '2026-07-02',
              previousTo: '2026-07-31',
              timeZone: 'UTC',
            },
            totals: {
              views: 0,
              favorites: 0,
              leads: 0,
              conversionRate: null,
              viewsChangePercent: null,
              favoritesChangePercent: null,
              leadsChangePercent: null,
            },
            daily: [],
            topProjects: [],
          }),
    );
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <DeveloperAnalyticsScreen />
      </NextIntlClientProvider>,
    );

    fireEvent.change(await screen.findByLabelText('Organization'), {
      target: { value: 'org-2' },
    });
    await waitFor(() =>
      expect(operationsRequest).toHaveBeenCalledWith(
        '/developer/analytics?range=30&organizationId=org-2',
      ),
    );
  });

  it('shows an explicit empty state when no developer organization is assigned', async () => {
    operationsRequest.mockResolvedValueOnce([]);
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <DeveloperAnalyticsScreen />
      </NextIntlClientProvider>,
    );

    expect(
      await screen.findByText(
        'No developer organization is assigned to this account.',
      ),
    ).toBeVisible();
    expect(screen.queryByText('Loading analytics…')).toBeNull();
  });

  it('shows only the error state when organization scope loading fails', async () => {
    operationsRequest.mockRejectedValueOnce(new Error('scope unavailable'));
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <DeveloperAnalyticsScreen />
      </NextIntlClientProvider>,
    );

    expect(
      await screen.findByText('Analytics could not be loaded.'),
    ).toBeVisible();
    expect(screen.queryByText('Loading analytics…')).toBeNull();
    expect(
      screen.getByRole('region', { name: 'Developer analytics' }),
    ).toHaveAttribute('aria-busy', 'false');
  });
});
