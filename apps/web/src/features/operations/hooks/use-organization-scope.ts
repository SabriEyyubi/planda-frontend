'use client';

import { useCallback, useEffect, useState } from 'react';
import type { OrganizationScope } from '@/features/operations/api/growth-types';
import { operationsRequest } from '@/features/operations/api/operations-client';

export function useOrganizationScope(area: 'developer' | 'broker') {
  const [organizations, setOrganizations] = useState<OrganizationScope[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = useCallback(async () => {
    setState('loading');
    try {
      const scopes = await operationsRequest<OrganizationScope[]>(
        `/${area}/organizations`,
      );
      if (!Array.isArray(scopes))
        throw new Error('Invalid organization scope response');
      setOrganizations(scopes);
      setOrganizationId((current) =>
        scopes.some(({ id }) => id === current)
          ? current
          : (scopes[0]?.id ?? ''),
      );
      setState('ready');
    } catch {
      setState('error');
    }
  }, [area]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => void load());
    return () => cancelAnimationFrame(frame);
  }, [load]);

  return {
    organizations,
    organizationId,
    setOrganizationId,
    state,
    reload: load,
  };
}
