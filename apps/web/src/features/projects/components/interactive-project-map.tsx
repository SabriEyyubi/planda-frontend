'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  setWorkerUrl,
} from 'maplibre-gl';
import type { ProjectSummary } from '../model/project';

const defaultStyle =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL || '/api/map/styles/liberty';

export function InteractiveProjectMap({
  projects,
  selectedId,
  onSelect,
  onBoundsChange,
}: {
  projects: ProjectSummary[];
  selectedId?: string;
  onSelect: (projectId: string) => void;
  onBoundsChange?: (bounds: LngLatBounds) => void;
}) {
  const t = useTranslations('MapDiscovery');
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<globalThis.Map<string, Marker>>(
    new globalThis.Map(),
  );
  const userMovingRef = useRef(false);
  const hasFittedRef = useRef(false);
  const previousSelectedIdRef = useRef(selectedId);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    setState('loading');
    hasFittedRef.current = false;
    setWorkerUrl('/maplibre-gl-worker.mjs');
    const map = new MapLibreMap({
      container: containerRef.current,
      style: defaultStyle,
      center: [28.91, 41.04],
      zoom: 9.3,
      attributionControl: { compact: true },
    });
    const loadTimeout = window.setTimeout(() => setState('error'), 15_000);
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', () => {
      window.clearTimeout(loadTimeout);
      setState('ready');
    });
    // MapLibre also emits `error` for recoverable style resources (for example
    // an optional sprite image). Those warnings must not replace an otherwise
    // usable map with the fatal error panel. A provider/worker failure is still
    // bounded by the initialization timeout above.
    map.on('error', () => undefined);
    map.on('dragstart', () => {
      userMovingRef.current = true;
    });
    map.on('zoomstart', (event) => {
      if (event.originalEvent) userMovingRef.current = true;
    });
    map.on('moveend', () => {
      if (!userMovingRef.current) return;
      userMovingRef.current = false;
      onBoundsChange?.(map.getBounds());
    });
    mapRef.current = map;
    const markers = markersRef.current;
    return () => {
      markers.forEach((marker) => marker.remove());
      markers.clear();
      window.clearTimeout(loadTimeout);
      map.remove();
      mapRef.current = null;
    };
  }, [onBoundsChange, retryKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== 'ready') return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();
    const bounds = new LngLatBounds();
    for (const project of projects) {
      const coordinate = projectCoordinate(project);
      if (!coordinate) continue;
      bounds.extend(coordinate);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `map-price-marker ${project.id === selectedId ? 'is-selected' : ''}`;
      const price = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: project.currency,
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(Number(project.startingPrice));
      button.textContent = price;
      button.setAttribute(
        'aria-label',
        t('markerLabel', { name: project.name, price }),
      );
      button.addEventListener('click', () => onSelect(project.id));
      const marker = new Marker({ element: button, anchor: 'bottom' })
        .setLngLat(coordinate)
        .addTo(map);
      markersRef.current.set(project.id, marker);
    }
    if (!hasFittedRef.current && !bounds.isEmpty()) {
      hasFittedRef.current = true;
      map.fitBounds(bounds, { padding: 72, maxZoom: 12, duration: 0 });
    }
  }, [locale, onSelect, projects, selectedId, state, t]);

  useEffect(() => {
    const previousSelectedId = previousSelectedIdRef.current;
    previousSelectedIdRef.current = selectedId;
    if (!previousSelectedId || previousSelectedId === selectedId) return;
    const map = mapRef.current;
    const project = projects.find((item) => item.id === selectedId);
    const coordinate = project ? projectCoordinate(project) : null;
    if (!map || state !== 'ready' || !coordinate || !hasFittedRef.current)
      return;
    map.easeTo({ center: coordinate, duration: 450 });
  }, [projects, selectedId, state]);

  return (
    <div className="map-shell">
      {state === 'loading' && (
        <div className="map-loading" role="status">
          {t('loading')}
        </div>
      )}
      {state === 'error' && (
        <div className="map-error" role="alert">
          <strong>{t('loadFailed')}</strong>
          <span>{t('listStillAvailable')}</span>
          <button type="button" onClick={() => setRetryKey((key) => key + 1)}>
            {t('retry')}
          </button>
        </div>
      )}
      <div
        ref={containerRef}
        className="project-map"
        role="region"
        aria-label={t('mapLabel')}
      />
    </div>
  );
}

function projectCoordinate(project: ProjectSummary): [number, number] | null {
  const longitude = Number(project.longitude);
  const latitude = Number(project.latitude);
  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  )
    return null;
  return [longitude, latitude];
}
