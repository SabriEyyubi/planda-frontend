'use client';

import { createContext, useContext } from 'react';
import type { PermissionSubject } from './permissions';
import { canManageOrganization } from './permissions';

const AuthorizationContext = createContext<PermissionSubject>({});

export const AuthorizationProvider = AuthorizationContext.Provider;

export function useAuthorization() {
  const subject = useContext(AuthorizationContext);
  return {
    subject,
    canManageOrganization: (organizationId?: string) =>
      canManageOrganization(subject, organizationId),
  };
}
