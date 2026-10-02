import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { projectFixtures } from '../model/fixtures';

vi.mock('next-intl/server', () => ({
  getLocale: async () => 'en',
  getTranslations: async () => (key: string) => key,
}));
vi.mock('@/lib/i18n/navigation', () => ({
  Link: ({ children, ...props }: { children: ReactNode; href: string }) => (
    <a {...props}>{children}</a>
  ),
}));
vi.mock('./compare-toggle-button', () => ({ CompareToggleButton: () => null }));
vi.mock('@/features/saved/components/favorite-button', () => ({
  FavoriteButton: () => null,
}));
import { ProjectCard } from './project-card';

afterEach(cleanup);

describe('ProjectCard backend facts', () => {
  it('renders the flat catalog variant with real developer, summary and unknown delivery', async () => {
    render(
      await ProjectCard({
        variant: 'catalog',
        project: {
          ...projectFixtures[0]!,
          currency: 'USD',
          startingPrice: '300000',
          deliveryDate: null,
          summary: 'Actual backend description',
          heroImageUrl: null,
        },
      }),
    );
    expect(document.querySelector('.catalog-project')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      projectFixtures[0]!.name,
    );
    expect(
      screen.getByText(projectFixtures[0]!.developerName),
    ).toBeInTheDocument();
    expect(screen.getByText('Actual backend description')).toBeInTheDocument();
    expect(screen.getByText('$300,000')).toBeInTheDocument();
    expect(screen.getByText('unspecified')).toBeInTheDocument();
    expect(screen.getByText('imagePending')).toBeInTheDocument();
    const projectLinks = screen.getAllByRole('link', { name: 'viewProject' });
    expect(projectLinks).toHaveLength(2);
    for (const link of projectLinks) {
      expect(link).toHaveAttribute(
        'href',
        `/projects/${projectFixtures[0]!.slug}`,
      );
    }
  });
  it('shows actual USD price and image, without falsely claiming ready/current', async () => {
    render(
      await ProjectCard({
        project: {
          ...projectFixtures[0]!,
          startingPrice: '300000',
          currency: 'USD',
          deliveryDate: null,
          stockUpdatedAt: null,
          heroImageUrl: '/media/project.webp',
        },
      }),
    );
    expect(screen.getByText('$300,000')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText('ready')).not.toBeInTheDocument();
    expect(screen.getByText('freshnessPending')).toBeInTheDocument();
    const image = document.querySelector('img')!;
    expect(image).toHaveAttribute('src', '/media/project.webp');
    fireEvent.error(image);
    expect(screen.getByText('imagePending')).toBeInTheDocument();
  });
  it('does not label stale inventory current', async () => {
    render(
      await ProjectCard({
        project: {
          ...projectFixtures[0]!,
          stockUpdatedAt: '2020-01-01T00:00:00Z',
        },
      }),
    );
    expect(screen.queryByText('stockCurrent')).not.toBeInTheDocument();
  });
});
