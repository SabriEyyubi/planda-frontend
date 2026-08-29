import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { projectDetailFixture } from '../model/fixtures';
import { ProjectGallery } from './project-detail';

describe('ProjectGallery', () => {
  it('renders project media in backend order with accessible alternatives', () => {
    render(
      <ProjectGallery
        project={{
          ...projectDetailFixture,
          media: [
            {
              id: 'media-2',
              kind: 'IMAGE',
              url: '/ordered-first.png',
              altText: 'Ordered first',
            },
            {
              id: 'media-1',
              kind: 'IMAGE',
              url: '/ordered-second.png',
              altText: 'Ordered second',
            },
          ],
        }}
        label="Project images"
        allPhotos="All photos"
        imagePending="Images pending"
      />,
    );

    const gallery = screen.getByRole('region', { name: 'Project images' });
    const images = within(gallery).getAllByRole('img');
    expect(images.map((image) => image.getAttribute('src'))).toEqual([
      '/ordered-first.png',
      '/ordered-second.png',
    ]);
    expect(screen.getByText('All photos · 2')).toBeVisible();
  });
});
