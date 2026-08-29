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
import { BrokerClientsScreen } from './broker-growth-screens';

const operationsRequest = vi.hoisted(() => vi.fn());
vi.mock('@/features/operations/api/operations-client', () => ({
  operationsRequest,
  listItems: (value: unknown) =>
    Array.isArray(value) ? value : (value as { items: unknown[] }).items,
}));

const client = {
  id: 'client-1',
  fullName: 'Ada Lovelace',
  phone: '+905551112233',
  email: 'ada@example.com',
  notes: null,
  status: 'ACTIVE',
  version: 4,
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-20T00:00:00Z',
};
const agencyScope = {
  id: 'agency-1',
  name: 'Seed Broker',
  type: 'BROKER_AGENCY',
  role: 'MEMBER',
  canManage: false,
};

afterEach(() => {
  cleanup();
  operationsRequest.mockReset();
  vi.restoreAllMocks();
});

describe('BrokerClientsScreen', () => {
  it('sends explicit null when clearing a contact field', async () => {
    operationsRequest.mockImplementation((path: string, init?: RequestInit) => {
      if (path === '/broker/organizations')
        return Promise.resolve([agencyScope]);
      return init?.method
        ? Promise.resolve(client)
        : Promise.resolve({ items: [client] });
    });
    renderScreen();
    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(operationsRequest).toHaveBeenCalledWith(
        '/broker/clients/client-1',
        expect.objectContaining({ method: 'PATCH' }),
      ),
    );
    const call = operationsRequest.mock.calls.find(
      ([path, init]) =>
        path === '/broker/clients/client-1' && init?.method === 'PATCH',
    );
    expect(JSON.parse(String(call?.[1]?.body))).toMatchObject({
      version: 4,
      phone: null,
      email: 'ada@example.com',
    });
  });

  it('archives with the current optimistic-concurrency version', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    operationsRequest.mockImplementation((path: string, init?: RequestInit) => {
      if (path === '/broker/organizations')
        return Promise.resolve([agencyScope]);
      return init?.method
        ? Promise.resolve(undefined)
        : Promise.resolve({ items: [client] });
    });
    renderScreen();
    fireEvent.click(await screen.findByRole('button', { name: 'Archive' }));
    await waitFor(() =>
      expect(operationsRequest).toHaveBeenCalledWith(
        '/broker/clients/client-1?version=4',
        { method: 'DELETE' },
      ),
    );
  });

  it('shows an explicit empty state when no broker agency is assigned', async () => {
    operationsRequest.mockResolvedValueOnce([]);
    renderScreen();

    expect(
      await screen.findByText('No broker agency is assigned to this account.'),
    ).toBeVisible();
    expect(screen.queryByText('Loading agency clients…')).toBeNull();
  });

  it('shows only the error state when agency scope loading fails', async () => {
    operationsRequest.mockRejectedValueOnce(new Error('scope unavailable'));
    renderScreen();

    expect(await screen.findByText('Data could not be loaded.')).toBeVisible();
    expect(screen.queryByText('Loading agency clients…')).toBeNull();
    expect(
      screen.getByRole('region', { name: 'Agency clients' }),
    ).toHaveAttribute('aria-busy', 'false');
  });
});

function renderScreen() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <BrokerClientsScreen />
    </NextIntlClientProvider>,
  );
}
