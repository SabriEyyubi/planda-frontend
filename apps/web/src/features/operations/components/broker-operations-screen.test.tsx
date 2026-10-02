import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/tr.json';
import { BrokerProjectScreen } from './broker-operations-screen';

const project = {
  id: 'usd-project',
  name: 'USD project',
  developerName: 'Developer',
  publicStartingPrice: '300000',
  brokerPrice: '290000',
  currency: 'USD',
  updatedAt: '2026-09-20T00:00:00Z',
  units: [
    {
      id: 'try-unit',
      unitNumber: 'A1',
      roomType: '2+1',
      floor: 1,
      netArea: '80',
      price: '10000000',
      currency: 'TRY',
      status: 'AVAILABLE',
      updatedAt: '2026-09-20T00:00:00Z',
    },
  ],
};
vi.mock('../api/operations-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/operations-client')>()),
  operationsRequest: vi.fn(async (path: string) =>
    path === '/broker/projects' ? [project] : project,
  ),
  listItems: (value: unknown) => value,
}));
afterEach(cleanup);

describe('broker price denominations', () => {
  it('uses project currency for project prices and unit currency for inventory', async () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <BrokerProjectScreen />
      </NextIntlClientProvider>,
    );
    expect(await screen.findByText('$300,000')).toBeInTheDocument();
    expect(screen.getByText('$290,000')).toBeInTheDocument();
    expect(
      screen.getByText(
        (text) => text.includes('TRY') && text.includes('10,000,000'),
      ),
    ).toBeInTheDocument();
  });
});
