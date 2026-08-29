import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import messages from '@/messages/en.json';
import { AuthorizationProvider } from '@/lib/permissions/authorization-context';
import { DeveloperMediaScreen } from './developer-media-screen';

const operationsRequest = vi.hoisted(() => vi.fn());
vi.mock('@/features/operations/api/operations-client', () => ({
  operationsRequest,
  listItems: (value: unknown) =>
    Array.isArray(value) ? value : (value as { items: unknown[] }).items,
}));

const media = [
  {
    id: 'm1',
    kind: 'IMAGE',
    url: '/one.jpg',
    altText: 'One',
    sortOrder: 0,
    version: 2,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 'm2',
    kind: 'IMAGE',
    url: '/two.jpg',
    altText: 'Two',
    sortOrder: 1,
    version: 3,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

afterEach(() => operationsRequest.mockReset());

describe('DeveloperMediaScreen', () => {
  it('sends a full exact-set reorder from keyboard-operable controls', async () => {
    operationsRequest.mockImplementation((path: string, init?: RequestInit) => {
      if (path === '/developer/projects')
        return Promise.resolve({
          items: [{ id: 'p1', name: 'Nova', developerOrganizationId: 'org-1' }],
        });
      if (init?.method === 'PUT') return Promise.resolve([...media].reverse());
      return Promise.resolve(media);
    });
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AuthorizationProvider
          value={{
            platformRoles: ['DEVELOPER_MEMBER'],
            organizationMemberships: [
              { organizationId: 'org-1', role: 'OWNER' },
            ],
          }}
        >
          <DeveloperMediaScreen />
        </AuthorizationProvider>
      </NextIntlClientProvider>,
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Move image 1 down' }),
    );
    await waitFor(() =>
      expect(operationsRequest).toHaveBeenCalledWith(
        '/developer/projects/p1/media/reorder',
        expect.objectContaining({ method: 'PUT' }),
      ),
    );
    const call = operationsRequest.mock.calls.find(
      ([, init]) => init?.method === 'PUT',
    );
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({
      items: [
        { id: 'm2', version: 3 },
        { id: 'm1', version: 2 },
      ],
    });
  });
});
