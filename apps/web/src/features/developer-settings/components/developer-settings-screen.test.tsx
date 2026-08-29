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
import { AuthorizationProvider } from '@/lib/permissions/authorization-context';
import { DeveloperSettingsScreen } from './developer-settings-screen';

const operationsRequest = vi.hoisted(() => vi.fn());
vi.mock('@/features/operations/api/operations-client', () => ({
  operationsRequest,
}));

afterEach(() => {
  cleanup();
  operationsRequest.mockReset();
});

describe('DeveloperSettingsScreen', () => {
  it('reloads and remounts latest server values after a conflict', async () => {
    const first = settings(1, 'Old name');
    const latest = settings(2, 'Latest name');
    let reads = 0;
    operationsRequest.mockImplementation(
      (_path: string, init?: RequestInit) => {
        if (_path === '/developer/organizations')
          return Promise.resolve([
            {
              id: 'org-1',
              name: 'Development Yapı',
              type: 'DEVELOPER',
              role: 'OWNER',
              canManage: true,
            },
          ]);
        if (!init) return Promise.resolve(reads++ === 0 ? first : latest);
        return Promise.reject(
          Object.assign(new Error('CONFLICT'), { status: 409 }),
        );
      },
    );
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
          <DeveloperSettingsScreen />
        </AuthorizationProvider>
      </NextIntlClientProvider>,
    );
    const name = await screen.findByLabelText('Organization name');
    fireEvent.change(name, { target: { value: 'My edit' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    await waitFor(() =>
      expect(screen.getByLabelText('Organization name')).toHaveValue(
        'Latest name',
      ),
    );
  });

  it('ignores a stale organization response and saves only the displayed organization', async () => {
    let resolveFirst:
      ((value: ReturnType<typeof settings>) => void) | undefined;
    operationsRequest.mockImplementation((path: string, init?: RequestInit) => {
      if (path === '/developer/organizations') {
        return Promise.resolve([
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
            role: 'OWNER',
            canManage: true,
          },
        ]);
      }
      if (init?.method === 'PATCH') {
        return Promise.resolve(settings(2, 'Second edited', 'org-2'));
      }
      if (path.includes('organizationId=org-1')) {
        return new Promise((resolve) => {
          resolveFirst = resolve;
        });
      }
      return Promise.resolve(settings(1, 'Second developer', 'org-2'));
    });

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AuthorizationProvider
          value={{
            platformRoles: ['DEVELOPER_MEMBER'],
            organizationMemberships: [
              { organizationId: 'org-1', role: 'OWNER' },
              { organizationId: 'org-2', role: 'OWNER' },
            ],
          }}
        >
          <DeveloperSettingsScreen />
        </AuthorizationProvider>
      </NextIntlClientProvider>,
    );

    const selector = await screen.findByLabelText('Organization');
    await waitFor(() => expect(resolveFirst).toBeDefined());
    fireEvent.change(selector, { target: { value: 'org-2' } });
    expect(await screen.findByLabelText('Organization name')).toHaveValue(
      'Second developer',
    );

    resolveFirst?.(settings(1, 'Stale first developer', 'org-1'));
    await waitFor(() =>
      expect(screen.getByLabelText('Organization name')).toHaveValue(
        'Second developer',
      ),
    );
    fireEvent.change(screen.getByLabelText('Organization name'), {
      target: { value: 'Second edited' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    await waitFor(() =>
      expect(operationsRequest).toHaveBeenCalledWith(
        '/developer/settings?organizationId=org-2',
        expect.objectContaining({ method: 'PATCH' }),
      ),
    );
  });

  it('shows an explicit empty state when no developer organization is assigned', async () => {
    operationsRequest.mockResolvedValueOnce([]);
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AuthorizationProvider
          value={{ platformRoles: [], organizationMemberships: [] }}
        >
          <DeveloperSettingsScreen />
        </AuthorizationProvider>
      </NextIntlClientProvider>,
    );

    expect(
      await screen.findByText(
        'No developer organization is assigned to this account.',
      ),
    ).toBeVisible();
    expect(screen.queryByText('Loading organization settings…')).toBeNull();
  });

  it('shows only the error state when organization scope loading fails', async () => {
    operationsRequest.mockRejectedValueOnce(new Error('scope unavailable'));
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AuthorizationProvider
          value={{ platformRoles: [], organizationMemberships: [] }}
        >
          <DeveloperSettingsScreen />
        </AuthorizationProvider>
      </NextIntlClientProvider>,
    );

    expect(
      await screen.findByText('Organization settings could not be loaded.'),
    ).toBeVisible();
    expect(screen.queryByText('Loading organization settings…')).toBeNull();
    expect(
      screen.getByRole('region', { name: 'Developer settings' }),
    ).toHaveAttribute('aria-busy', 'false');
  });
});

function settings(version: number, name: string, id = 'org-1') {
  return {
    id,
    name,
    about: null,
    salesEmail: null,
    salesPhone: null,
    websiteUrl: null,
    logoUrl: null,
    version,
  };
}
