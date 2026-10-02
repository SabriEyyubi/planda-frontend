import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/tr.json';
import { ProjectFilters } from './project-filters';

afterEach(cleanup);
function setup() {
  const { container } = render(
    <NextIntlClientProvider locale="tr" messages={messages}>
      <ProjectFilters values={{}} />
    </NextIntlClientProvider>,
  );
  const form = container.querySelector('form')!;
  const currency = form.elements.namedItem('currency') as HTMLSelectElement;
  return { form, currency };
}
describe('multi-currency project filters', () => {
  it.each(['city-b', ''])(
    'clears dependent geography when city changes to %s',
    (city) => {
      const { container } = render(
        <NextIntlClientProvider locale="tr" messages={messages}>
          <ProjectFilters
            cities={[
              { id: 'city-a', name: 'Ankara' },
              { id: 'city-b', name: 'İstanbul' },
            ]}
            values={{
              provinceId: 'city-a',
              districtId: 'district-a',
              bounds: '28,40,30,42',
              currency: 'USD',
              roomType: '2+1',
            }}
          />
        </NextIntlClientProvider>,
      );
      const form = container.querySelector('form')!;
      const province = form.querySelector<HTMLSelectElement>(
        '[name="provinceId"]',
      )!;
      expect(new FormData(form).get('bounds')).toBe('28,40,30,42');
      fireEvent.change(province, { target: { value: city } });
      const changed = new FormData(form);
      expect(changed.get('provinceId')).toBe(city);
      expect(changed.has('districtId')).toBe(false);
      expect(changed.has('bounds')).toBe(false);
      expect(changed.get('currency')).toBe('USD');
      expect(changed.get('roomType')).toBe('2+1');
      fireEvent.change(province, { target: { value: 'city-a' } });
      expect(new FormData(form).get('districtId')).toBe('district-a');
      expect(new FormData(form).get('bounds')).toBe('28,40,30,42');
    },
  );
  it('submits one real city ID while preserving existing filter values', () => {
    const { container } = render(
      <NextIntlClientProvider locale="tr" messages={messages}>
        <ProjectFilters
          cities={[{ id: 'city-id', name: 'Ankara' }]}
          values={{
            provinceId: 'city-id',
            currency: 'USD',
            roomType: '2+1',
            districtId: 'district-id',
          }}
        />
      </NextIntlClientProvider>,
    );
    const form = container.querySelector('form')!;
    const data = new FormData(form);
    expect(screen.getByRole('option', { name: 'Ankara' })).toHaveValue(
      'city-id',
    );
    expect(data.getAll('provinceId')).toEqual(['city-id']);
    expect(data.get('currency')).toBe('USD');
    expect(data.get('roomType')).toBe('2+1');
    expect(data.get('districtId')).toBe('district-id');
  });
  it('does not silently exclude USD for nonmonetary searches', () => {
    const { form, currency } = setup();
    fireEvent.change(
      form.querySelector<HTMLSelectElement>('[name="roomType"]')!,
      {
        target: { value: '2+1' },
      },
    );
    expect(new FormData(form).get('currency')).toBe('');
    expect(currency.required).toBe(false);
    expect(form.checkValidity()).toBe(true);
  });
  it.each(['minPrice', 'maxPrice', 'maxMonthlyPayment'])(
    'requires explicit currency for %s',
    (field) => {
      const { form, currency } = setup();
      fireEvent.change(
        form.querySelector<HTMLInputElement>(`[name="${field}"]`)!,
        {
          target: { value: '100000' },
        },
      );
      expect(currency.required).toBe(true);
      expect(form.checkValidity()).toBe(false);
      fireEvent.change(currency, { target: { value: 'USD' } });
      expect(form.checkValidity()).toBe(true);
      expect(new FormData(form).get('currency')).toBe('USD');
      fireEvent.change(
        form.querySelector<HTMLInputElement>(`[name="${field}"]`)!,
        {
          target: { value: '' },
        },
      );
      expect(currency.required).toBe(false);
    },
  );
  it('requires currency for price ordering, but not newest ordering', () => {
    const { form, currency } = setup();
    const sort = form.querySelector<HTMLSelectElement>('[name="sort"]')!;
    fireEvent.change(sort, { target: { value: 'PRICE_ASC' } });
    expect(currency.required).toBe(true);
    fireEvent.change(sort, { target: { value: 'NEWEST' } });
    expect(currency.required).toBe(false);
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });
});

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
