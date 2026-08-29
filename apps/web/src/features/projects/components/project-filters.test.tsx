import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProjectFilters } from './project-filters';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/tr.json';

describe('ProjectFilters accessibility', () => {
  it('names the mobile dialog, focuses its close button and restores focus', () => {
    render(
      <NextIntlClientProvider locale="tr" messages={messages}>
        <ProjectFilters values={{ sort: 'NEWEST' }} />
      </NextIntlClientProvider>,
    );
    const opener = screen.getByRole('button', { name: 'Filtreler' });
    fireEvent.click(opener);

    expect(screen.getByRole('dialog', { name: 'Filtreler' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Filtreleri kapat' }),
    ).toHaveFocus();

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
