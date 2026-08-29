import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeveloperOperationsScreen } from './developer-operations-screen';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/tr.json';
import { AuthorizationProvider } from '@/lib/permissions/authorization-context';

const operationsRequest = vi.hoisted(() => vi.fn());
vi.mock('../api/operations-client', () => ({
  operationsRequest,
  listItems: (value: unknown) =>
    Array.isArray(value) ? value : (value as { items: unknown[] }).items,
}));

describe('DeveloperOperationsScreen accessibility', () => {
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
