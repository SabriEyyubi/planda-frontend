'use client';

import { useEffect } from 'react';

const sessionKey = 'planda.anonymous-session';

export function ProjectViewTracker({ projectId }: { projectId: string }) {
  useEffect(() => {
    try {
      let sessionId = sessionStorage.getItem(sessionKey);
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem(sessionKey, sessionId);
      }
      void fetch(`/api/projects/${encodeURIComponent(projectId)}/views`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId }),
        keepalive: true,
      }).catch(() => undefined);
    } catch {
      // Analytics is best-effort and never blocks project discovery.
    }
  }, [projectId]);

  return null;
}
