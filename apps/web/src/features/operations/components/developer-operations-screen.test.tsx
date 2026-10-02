import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DeveloperOperationsScreen } from './developer-operations-screen';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/tr.json';
import { AuthorizationProvider } from '@/lib/permissions/authorization-context';

const operationsRequest = vi.hoisted(() => vi.fn());
vi.mock('../api/operations-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/operations-client')>()),
  operationsRequest,
  listItems: (value: unknown) =>
    Array.isArray(value) ? value : (value as { items: unknown[] }).items,
}));

describe('DeveloperOperationsScreen accessibility', () => {
  beforeEach(() => {
    operationsRequest.mockReset();
  });
  afterEach(cleanup);
  it('exposes a named busy region and announces loading state', () => {
    operationsRequest.mockReturnValue(new Promise(() => undefined));
    render(
      <NextIntlClientProvider locale="tr" messages={messages}>
        <DeveloperOperationsScreen view="overview" />
      </NextIntlClientProvider>,
    );

    expect(
      screen.getByRole('region', { name: 'Operasyon özeti' }),
    ).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Veriler yükleniyor');
  });

  it('enables only project rows managed in that organization', async () => {
    operationsRequest.mockResolvedValue({
      items: [project('project-a', 'org-a'), project('project-b', 'org-b')],
    });
    render(
      <NextIntlClientProvider locale="tr" messages={messages}>
        <AuthorizationProvider
          value={{
            platformRoles: ['DEVELOPER_MEMBER'],
            organizationMemberships: [
              { organizationId: 'org-a', role: 'OWNER' },
              { organizationId: 'org-b', role: 'MEMBER' },
            ],
          }}
        >
          <DeveloperOperationsScreen view="projects" />
        </AuthorizationProvider>
      </NextIntlClientProvider>,
    );
    const actions = await screen.findAllByRole('button', {
      name: 'İncelemeye gönder',
    });
    expect(actions[0]).toBeEnabled();
    expect(actions[1]).toBeDisabled();
    fireEvent.click(actions[0]!);
    await waitFor(() =>
      expect(operationsRequest).toHaveBeenCalledWith(
        '/developer/projects/project-a',
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'IN_REVIEW', expectedVersion: 1 }),
        },
      ),
    );
  });

  it('displays a USD project in its actual currency', async () => {
    operationsRequest.mockResolvedValue({
      items: [
        {
          ...project('usd-project', 'org-a'),
          currency: 'USD',
          startingPrice: '300000',
        },
      ],
    });
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <DeveloperOperationsScreen view="projects" />
      </NextIntlClientProvider>,
    );
    expect(await screen.findByText('$300,000')).toBeInTheDocument();
  });
});

function project(id: string, developerOrganizationId: string) {
  return {
    id,
    developerOrganizationId,
    name: id,
    slug: id,
    developerName: 'Developer',
    developerVerified: true,
    status: 'DRAFT',
    constructionStatus: 'PLANNED',
    province: { id: 'p', code: '34', name: 'İstanbul', slug: 'istanbul' },
    district: { id: 'd', code: '1', name: 'Merkez', slug: 'merkez' },
    latitude: '0',
    longitude: '0',
    startingPrice: '1',
    currency: 'TRY',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    unitCount: 0,
    availableUnitCount: 0,
    leadCount: 0,
    paymentPlanCount: 0,
    completenessPercent: 0,
  };
}

describe('developer lead follow-up', () => {
  afterEach(cleanup);
  it('exposes contact actions and reaches later lead pages', async () => {
    operationsRequest.mockReset();
    const lead = {
      id: 'lead-a',
      fullName: 'Birinci Alıcı',
      phone: '+905551112233',
      email: 'buyer@example.test',
      projectName: 'project-a',
      preferredLanguage: 'TR',
      createdAt: new Date().toISOString(),
      status: 'NEW',
      version: 1,
    };
    operationsRequest.mockImplementation(async (path: string) => {
      if (path === '/developer/projects')
        return { items: [project('project-a', 'org-a')] };
      if (path.includes('cursor=next'))
        return {
          items: [
            { ...lead, id: 'lead-b', fullName: 'İkinci Alıcı', email: null },
          ],
          pageInfo: { hasNextPage: false, nextCursor: null },
        };
      return {
        items: [lead],
        pageInfo: { hasNextPage: true, nextCursor: 'next' },
      };
    });
    render(
      <NextIntlClientProvider locale="tr" messages={messages}>
        <DeveloperOperationsScreen view="leads" />
      </NextIntlClientProvider>,
    );
    expect(
      await screen.findByRole('link', { name: '+905551112233' }),
    ).toHaveAttribute('href', 'tel:+905551112233');
    expect(
      screen.getByRole('link', { name: 'buyer@example.test' }),
    ).toHaveAttribute('href', 'mailto:buyer@example.test');
    fireEvent.click(screen.getByRole('button', { name: 'Sonraki sayfa' }));
    expect(await screen.findByText('İkinci Alıcı')).toBeInTheDocument();
    expect(screen.queryByText('Birinci Alıcı')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Önceki sayfa' }));
    expect(await screen.findByText('Birinci Alıcı')).toBeInTheDocument();
  });
});
