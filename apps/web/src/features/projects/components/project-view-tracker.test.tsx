import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProjectViewTracker } from './project-view-tracker';

afterEach(() => {
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

describe('ProjectViewTracker', () => {
  it('reuses a first-party session id and never blocks on request failure', async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError('offline'));
    vi.stubGlobal('fetch', fetch);
    vi.stubGlobal('crypto', { randomUUID: () => 'session-1' });

    const first = render(<ProjectViewTracker projectId="project-1" />);
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    expect(JSON.parse(String(fetch.mock.calls[0]![1]?.body))).toEqual({
      sessionId: 'session-1',
    });
    first.unmount();

    render(<ProjectViewTracker projectId="project-2" />);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(JSON.parse(String(fetch.mock.calls[1]![1]?.body))).toEqual({
      sessionId: 'session-1',
    });
  });
});
