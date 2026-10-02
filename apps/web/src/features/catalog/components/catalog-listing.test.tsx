import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { projectFixtures } from '@/features/projects/model/fixtures';

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string, values?: { city?: string }) =>
    values?.city ? `${values.city} projects` : key,
}));
vi.mock('../api/public-catalog', () => ({ getCities: vi.fn() }));
vi.mock('@/features/projects/api/projects-adapter', () => ({
  getProjects: vi.fn(),
}));
vi.mock('@/features/projects/components/project-card', () => ({
  ProjectCard: ({
    project,
    variant,
  }: {
    project: { name: string };
    variant: string;
  }) => <article data-variant={variant}>{project.name}</article>,
}));
vi.mock('@/features/projects/components/project-filters', () => ({
  ProjectFilters: () => <form aria-label="filters" />,
}));
vi.mock('@/lib/i18n/navigation', () => ({
  Link: ({ children, ...props }: { children: ReactNode; href: string }) => (
    <a {...props}>{children}</a>
  ),
}));

import { getCities } from '../api/public-catalog';
import { getProjects } from '@/features/projects/api/projects-adapter';
import { CatalogListing } from './catalog-listing';

afterEach(cleanup);
beforeEach(() => {
  vi.mocked(getCities).mockResolvedValue([
    {
      id: 'real-city',
      code: '34',
      name: 'İstanbul',
      slug: 'istanbul',
      publishedProjectCount: 2,
      startingPrice: null,
      currency: null,
    },
  ]);
  vi.mocked(getProjects).mockResolvedValue({
    items: [projectFixtures[0]!],
    pageInfo: { hasNextPage: false, nextCursor: null },
  });
});

describe('open catalog listing', () => {
  it('uses the actual listing API with no implicit default currency and no hero', async () => {
    const { container } = render(await CatalogListing({ searchParams: {} }));
    expect(getProjects).toHaveBeenLastCalledWith('');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'projects',
    );
    expect(
      container.querySelector('[data-variant="catalog"]'),
    ).toBeInTheDocument();
    expect(container.querySelector('.home-hero')).not.toBeInTheDocument();
  });
  it('names the selected real city and preserves query, currency and pagination', async () => {
    vi.mocked(getProjects).mockResolvedValue({
      items: [projectFixtures[0]!],
      pageInfo: { hasNextPage: true, nextCursor: 'next-page' },
    });
    render(
      await CatalogListing({
        searchParams: {
          provinceId: 'real-city',
          q: 'garden',
          currency: 'USD',
          minPrice: '200000',
        },
      }),
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'İstanbul projects',
    );
    const href = screen
      .getByRole('link', { name: 'loadMore' })
      .getAttribute('href')!;
    const query = new URLSearchParams(href.slice(1));
    expect(query.get('provinceId')).toBe('real-city');
    expect(query.get('currency')).toBe('USD');
    expect(query.get('q')).toBe('garden');
    expect(query.get('cursor')).toBe('next-page');
  });
  it('provides a reset for an empty result without inventing inventory', async () => {
    vi.mocked(getProjects).mockResolvedValue({
      items: [],
      pageInfo: { hasNextPage: false, nextCursor: null },
    });
    render(await CatalogListing({ searchParams: { q: 'no match' } }));
    expect(
      screen.getByRole('heading', { name: 'noProjects' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'clearAll' })).toHaveAttribute(
      'href',
      '?',
    );
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
});
