export type PlatformRole =
  'BUYER' | 'DEVELOPER_MEMBER' | 'BROKER' | 'ADMIN' | 'SUPER_ADMIN';
export type OrganizationRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export type PermissionSubject = {
  platformRole?: PlatformRole;
  platformRoles?: readonly PlatformRole[];
  organizationRole?: OrganizationRole;
  organizationRoles?: readonly OrganizationRole[];
  organizationMemberships?: ReadonlyArray<{
    organizationId: string;
    role: OrganizationRole;
  }>;
};

const platformRoles = (user: PermissionSubject) =>
  user.platformRoles ?? (user.platformRole ? [user.platformRole] : []);
export const canAccessDeveloperPanel = (user: PermissionSubject) =>
  platformRoles(user).includes('DEVELOPER_MEMBER');
export const canViewBrokerData = (user: PermissionSubject) =>
  platformRoles(user).includes('BROKER');
export const canAccessAdmin = (user: PermissionSubject) =>
  platformRoles(user).some((role) => ['ADMIN', 'SUPER_ADMIN'].includes(role));
export const canManageOrganization = (
  user: PermissionSubject,
  organizationId?: string,
) => {
  if (organizationId && user.organizationMemberships) {
    return user.organizationMemberships.some(
      (membership) =>
        membership.organizationId === organizationId &&
        (membership.role === 'OWNER' || membership.role === 'ADMIN'),
    );
  }
  const roles =
    user.organizationRoles ??
    user.organizationMemberships?.map(({ role }) => role) ??
    (user.organizationRole ? [user.organizationRole] : []);
  return roles.some((role) => role === 'OWNER' || role === 'ADMIN');
};

export type ProtectedArea = 'buyer' | 'developer' | 'broker' | 'admin';

export function canAccessArea(user: PermissionSubject, area: ProtectedArea) {
  if (area === 'buyer') return true;
  if (area === 'developer') return canAccessDeveloperPanel(user);
  if (area === 'broker') return canViewBrokerData(user);
  return canAccessAdmin(user);
}
