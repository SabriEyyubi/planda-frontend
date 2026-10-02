import { test, expect } from '@playwright/test';

// Runs against the standard isolated base-seed backend, without request interception.
test('real compare choices, separate freshness and authentication context recovery', async ({
  page,
}) => {
  await page.goto('/tr/compare');
  await page
    .getByLabel('Karşılaştırmaya proje ekle')
    .selectOption({ label: 'Seed Garden' });
  await page
    .getByLabel('Karşılaştırmaya proje ekle')
    .selectOption({ label: 'Seed Park' });
  await expect(
    page.getByRole('heading', { name: '2 proje karşılaştırılıyor' }),
  ).toBeVisible();
  const unit = page.getByLabel('Seed Garden daire tipi');
  await expect(unit).toBeVisible();
  await unit.selectOption('2+1:TRY');
  await expect(page.getByLabel('Seed Garden ödeme planı')).toContainText(
    'Plan A',
  );
  await expect(
    page.getByRole('row').filter({ hasText: 'Seçilen tip başlangıcı' }),
  ).not.toContainText('Hesaplanamıyor');
  await expect(
    page.getByRole('row').filter({ hasText: 'Aylık · örnek' }),
  ).not.toContainText('Hesaplanamıyor');
  const freshness = page
    .getByRole('row')
    .filter({ hasText: 'Veri güncelliği' });
  await expect(freshness.locator('.data-freshness')).toHaveCount(4);
  await expect(freshness).toContainText('Stok:');
  await expect(freshness).toContainText('Fiyat:');
  await expect(
    page.getByText('Farklı para birimleri dönüştürülmez.', { exact: false }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Satış ofisiyle iletişime geç', exact: true })
    .first()
    .click();
  let dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('İlgilenilen daire')).toHaveValue('2+1');
  await expect(dialog).toContainText('Plan A');
  await dialog.getByLabel('Ad soyad').fill('Closure Test Buyer');
  await dialog.getByLabel('Telefon', { exact: true }).fill('+905551110099');
  await dialog
    .getByLabel('Satış ofisine sorunuz (isteğe bağlı)')
    .fill('Closure check: teslim ödemesi hangi tarihte?');
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Talebi gönder' }).click();
  await expect(dialog.getByRole('alert')).toContainText(
    'giriş yapmanız gerekiyor',
  );
  await dialog.getByRole('link', { name: 'Giriş yap' }).click();
  await page.getByLabel('E-posta', { exact: true }).fill('buyer@planda.test');
  await page.getByLabel('Şifre', { exact: true }).fill('DevelopmentOnly!123');
  await page.getByRole('button', { name: 'Giriş yap', exact: true }).click();
  await expect(page).toHaveURL(/\/tr\/compare\?ids=/);
  dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('İlgilenilen daire')).toHaveValue('2+1');
  await expect(dialog).toContainText('Plan A');
  await expect(
    dialog.getByLabel('Satış ofisine sorunuz (isteğe bağlı)'),
  ).toHaveValue('Closure check: teslim ödemesi hangi tarihte?');
  await expect(dialog.getByLabel('Ad soyad')).toHaveValue('');
  await expect(dialog.getByLabel('Telefon', { exact: true })).toHaveValue('');
  await expect(dialog.getByRole('checkbox')).not.toBeChecked();
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});
