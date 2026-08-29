import { act, render, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '@/messages/tr.json';
import type { ProjectSummary } from '../model/project';

const maplibre = vi.hoisted(() => ({
  easeTo: vi.fn(),
  fitBounds: vi.fn(),
  marker: vi.fn(),
  setWorkerUrl: vi.fn(),
  emitRecoverableError: false,
  emitLoad: true,
}));

vi.mock('maplibre-gl', () => {
  class FakeBounds {
    private empty = true;

    extend() {
      this.empty = false;
      return this;
    }

    isEmpty() {
      return this.empty;
    }
  }

  class FakeMap {
    addControl() {}
    easeTo = maplibre.easeTo;
    fitBounds = maplibre.fitBounds;
    getBounds() {
      return new FakeBounds();
    }
    on(event: string, listener: () => void) {
      if (event === 'error' && maplibre.emitRecoverableError)
        queueMicrotask(listener);
      if (event === 'load' && maplibre.emitLoad) queueMicrotask(listener);
      return this;
    }
    remove() {}
  }

  class FakeMarker {
    constructor(options: { element: HTMLElement }) {
      maplibre.marker(options.element);
    }
    addTo() {
      return this;
    }
    remove() {}
    setLngLat() {
      return this;
    }
  }

  return {
    LngLatBounds: FakeBounds,
    Map: FakeMap,
    Marker: FakeMarker,
    NavigationControl: class {},
    setWorkerUrl: maplibre.setWorkerUrl,
  };
});

import { InteractiveProjectMap } from './interactive-project-map';

const project = {
  id: 'project-1',
  developerOrganizationId: 'developer-1',
  slug: 'seed-bosphorus',
  name: 'Seed Bosphorus',
  developerName: 'Development Yapı',
  developerVerified: true,
  province: { id: '34', code: '34', name: 'İstanbul', slug: 'istanbul' },
  district: {
    id: 'uskudar',
    code: 'uskudar',
    name: 'Üsküdar',
    slug: 'uskudar',
  },
  latitude: '41.0256',
  longitude: '29.0159',
  startingPrice: '12500000',
  currency: 'TRY',
  deliveryDate: null,
  summary: null,
  heroImageUrl: null,
  stockUpdatedAt: null,
  priceUpdatedAt: null,
} satisfies ProjectSummary;
const secondProject = {
  ...project,
  id: 'project-2',
  slug: 'capital-metro',
  name: 'Capital Metro',
  latitude: '39.9334',
  longitude: '32.8597',
} satisfies ProjectSummary;

describe('InteractiveProjectMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    maplibre.emitRecoverableError = false;
    maplibre.emitLoad = true;
  });

  it('configures the bundled worker and renders initial markers after load', async () => {
    const { rerender } = render(
      <NextIntlClientProvider locale="tr" messages={messages}>
        <InteractiveProjectMap
          projects={[project, secondProject]}
          selectedId={project.id}
          onSelect={vi.fn()}
        />
      </NextIntlClientProvider>,
    );

    expect(maplibre.setWorkerUrl).toHaveBeenCalledWith(
      '/maplibre-gl-worker.mjs',
    );
    await waitFor(() => expect(maplibre.marker).toHaveBeenCalledTimes(2));
    expect(maplibre.fitBounds).toHaveBeenCalledOnce();
    expect(maplibre.easeTo).not.toHaveBeenCalled();

    rerender(
      <NextIntlClientProvider locale="tr" messages={messages}>
        <InteractiveProjectMap
          projects={[project, secondProject]}
          selectedId={secondProject.id}
          onSelect={vi.fn()}
        />
      </NextIntlClientProvider>,
    );
    await waitFor(() => expect(maplibre.easeTo).toHaveBeenCalledOnce());
  });

  it('keeps a usable map when MapLibre reports a recoverable resource error', async () => {
    maplibre.emitRecoverableError = true;
    const { container } = render(
      <NextIntlClientProvider locale="tr" messages={messages}>
        <InteractiveProjectMap
          projects={[project]}
          selectedId={project.id}
          onSelect={vi.fn()}
        />
      </NextIntlClientProvider>,
    );

    await waitFor(() => expect(maplibre.marker).toHaveBeenCalledOnce());
    expect(container.querySelector('.map-error')).not.toBeInTheDocument();
  });

  it('shows the recoverable list fallback when map initialization times out', async () => {
    vi.useFakeTimers();
    maplibre.emitLoad = false;
    const { container } = render(
      <NextIntlClientProvider locale="tr" messages={messages}>
        <InteractiveProjectMap
          projects={[project]}
          selectedId={project.id}
          onSelect={vi.fn()}
        />
      </NextIntlClientProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(container.querySelector('.map-error')).toBeInTheDocument();
    expect(container.querySelector('.map-loading')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
