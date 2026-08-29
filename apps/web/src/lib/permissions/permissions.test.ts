import { describe, expect, it } from 'vitest';
import {
  canAccessAdmin,
  canAccessArea,
  canAccessDeveloperPanel,
  canManageOrganization,
  canViewBrokerData,
} from './permissions';

describe('permissions', () => {
  it('keeps organization role separate from platform access', () => {
    expect(
      canAccessDeveloperPanel({
        platformRole: 'BUYER',
        organizationRole: 'OWNER',
      }),
    ).toBe(false);
  });
  it('allows platform admins', () =>
    expect(canAccessAdmin({ platformRole: 'SUPER_ADMIN' })).toBe(true));
  it('does not allow a buyer into protected operations areas', () => {
    const buyer = { platformRole: 'BUYER' as const };
    expect(canAccessArea(buyer, 'developer')).toBe(false);
    expect(canAccessArea(buyer, 'broker')).toBe(false);
    expect(canAccessArea(buyer, 'admin')).toBe(false);
  });
  it('preserves multiple platform roles and organization memberships', () => {
    const subject = {
      platformRoles: ['BUYER', 'DEVELOPER_MEMBER', 'BROKER'] as const,
      organizationMemberships: [
        { organizationId: 'org-1', role: 'MEMBER' as const },
        { organizationId: 'org-2', role: 'ADMIN' as const },
      ],
    };
    expect(canAccessDeveloperPanel(subject)).toBe(true);
    expect(canViewBrokerData(subject)).toBe(true);
    expect(canManageOrganization(subject)).toBe(true);
  });
  it('keeps MEMBER operations read-only', () => {
    expect(
      canManageOrganization({
        platformRoles: ['DEVELOPER_MEMBER'],
        organizationRoles: ['MEMBER'],
      }),
    ).toBe(false);
  });
  it('checks management permission for the selected organization', () => {
    const subject = {
      platformRoles: ['DEVELOPER_MEMBER'] as const,
      organizationMemberships: [
        { organizationId: 'org-a', role: 'OWNER' as const },
        { organizationId: 'org-b', role: 'MEMBER' as const },
      ],
    };
    expect(canManageOrganization(subject, 'org-a')).toBe(true);
    expect(canManageOrganization(subject, 'org-b')).toBe(false);
  });
});
