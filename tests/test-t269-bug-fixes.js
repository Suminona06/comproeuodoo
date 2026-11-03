import 'dotenv/config';
import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import assert from 'assert';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_min_32_chars';

console.log('=== STARTING T-269 BUG FIX VERIFICATION SUITE ===\n');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  const adminToken = jwt.sign({
    id: 1,
    email: 'admin@euodoo.com',
    name: 'Super Administrator',
    role: 'superadmin'
  }, JWT_SECRET, { expiresIn: '2h' });

  await context.addCookies([
    {
      name: 'euodoo_session',
      value: adminToken,
      domain: 'localhost',
      path: '/'
    }
  ]);

  const page = await context.newPage();

  try {
    // ─────────────────────────────────────────────────────────────
    // TEST 1: Status Dropdown Change & Double-Dropdown Bug Fix
    // ─────────────────────────────────────────────────────────────
    console.log('[1] Menguji penggantian status inquiry di /admin/dashboard (tanpa duplicate dropdown & tersimpan)...');
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(200);

    const firstRowSel = page.locator('tbody tr').first();
    const rowId = await firstRowSel.getAttribute('id');
    console.log(`   - Testing row: ${rowId}`);

    const statusTd = firstRowSel.locator('td').nth(4);

    // Initial check: only 1 visible trigger, native select is hidden
    const initialVisibleSelects = await statusTd.locator('select:visible').count();
    const initialTriggers = await statusTd.locator('.eu-dd-trigger:visible').count();
    assert.strictEqual(initialVisibleSelects, 0, 'Native select harus tersembunyi (0 visible select)');
    assert.strictEqual(initialTriggers, 1, 'Hanya 1 custom dropdown trigger yang terlihat');

    // Click trigger to open
    const trigger = statusTd.locator('.eu-dd-trigger');
    await trigger.click();
    await page.waitForTimeout(100);

    // Select "Dibaca" (second option)
    const dibacaOption = statusTd.locator('.eu-dd-item[data-value="dibaca"]');
    await dibacaOption.click();
    await page.waitForTimeout(300);

    // Verify after first change: NO DUPLICATE SELECT!
    const visibleSelectsAfterFirst = await statusTd.locator('select:visible').count();
    const triggersAfterFirst = await statusTd.locator('.eu-dd-trigger:visible').count();
    console.log(`   - Setelah ganti ke 'dibaca': visible select=${visibleSelectsAfterFirst}, triggers=${triggersAfterFirst}`);
    assert.strictEqual(visibleSelectsAfterFirst, 0, 'Native select TIDAK BOLEH muncul/unhide (harus 0 visible select)');
    assert.strictEqual(triggersAfterFirst, 1, 'Hanya 1 custom dropdown trigger yang terlihat');

    const valueAfterFirst = await trigger.locator('.eu-dd-value').textContent();
    assert.strictEqual(valueAfterFirst.trim(), 'Dibaca', 'Value display harus Dibaca');

    // Check status color class on .eu-dd
    const ddHasDiproses = await statusTd.locator('.eu-dd').evaluate(el => el.classList.contains('st-diproses'));
    assert.strictEqual(ddHasDiproses, true, '.eu-dd harus memiliki class st-diproses');

    // CHANGE AGAIN: Select "Baru" to ensure second change works and SAVES!
    await trigger.click();
    await page.waitForTimeout(100);

    const baruOption = statusTd.locator('.eu-dd-item[data-value="baru"]');
    await baruOption.click();
    await page.waitForTimeout(300);

    const visibleSelectsAfterSecond = await statusTd.locator('select:visible').count();
    assert.strictEqual(visibleSelectsAfterSecond, 0, 'Native select tetap tersembunyi setelah perubahan kedua');

    const valueAfterSecond = await trigger.locator('.eu-dd-value').textContent();
    assert.strictEqual(valueAfterSecond.trim(), 'Baru', 'Value display harus Baru setelah perubahan kedua');

    const ddHasBaru = await statusTd.locator('.eu-dd').evaluate(el => el.classList.contains('st-baru'));
    assert.strictEqual(ddHasBaru, true, '.eu-dd harus memiliki class st-baru');

    // Reload page to verify persistence in database
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(200);

    const reloadedValue = await page.locator(`#${rowId} td`).nth(4).locator('.eu-dd-value').textContent();
    console.log(`   - Nilai status setelah reload halaman: ${reloadedValue.trim()}`);
    assert.strictEqual(reloadedValue.trim(), 'Baru', 'Status harus tersimpan permanen di database sebagai Baru');
    console.log('  ✓ Bug 1 teratasi: nol duplicate dropdown, pergantian kedua tersimpan sempurna.\n');

    // ─────────────────────────────────────────────────────────────
    // TEST 2: Kolom Kebutuhan (Hanya Menampilkan Kebutuhan, Tanpa Produk)
    // ─────────────────────────────────────────────────────────────
    console.log('[2] Memeriksa kolom Kebutuhan di /admin/dashboard dan /admin/inquiries...');

    // 2a. Dashboard Table Header & Content
    const dashboardHeader = await page.locator('table th').nth(3).textContent();
    assert.strictEqual(dashboardHeader.trim(), 'Kebutuhan', 'Header kolom harus "Kebutuhan" tanpa "/ Produk"');

    const dashboardCellHtml = await page.locator('tbody tr').first().locator('.td-req-text').innerHTML();
    console.log(`   - Dashboard req-text HTML: ${dashboardCellHtml.trim()}`);
    assert.ok(!dashboardCellHtml.includes('<strong>'), 'Kolom kebutuhan tidak boleh memuat tag <strong> nama produk');
    assert.ok(!dashboardCellHtml.includes('&bull;'), 'Kolom kebutuhan tidak boleh memuat separator bullet');

    // 2b. Inquiries Index Table Header & Content
    await page.goto(`${BASE_URL}/admin/inquiries`, { waitUntil: 'domcontentloaded' });
    const inquiriesHeader = await page.locator('table th').nth(3).textContent();
    assert.strictEqual(inquiriesHeader.trim(), 'Kebutuhan', 'Header kolom inquiries harus "Kebutuhan"');

    const inqCellHtml = await page.locator('tbody tr').first().locator('.td-req-text').innerHTML();
    console.log(`   - Inquiries req-text HTML: ${inqCellHtml.trim()}`);
    assert.ok(!inqCellHtml.includes('<strong>'), 'Kolom kebutuhan di inquiries tidak boleh memuat tag <strong>');
    assert.ok(!inqCellHtml.includes('&bull;'), 'Kolom kebutuhan di inquiries tidak boleh memuat bullet');
    console.log('  ✓ Bug 2 teratasi: Kolom kebutuhan hanya menampilkan teks kebutuhan saja.\n');

    // ─────────────────────────────────────────────────────────────
    // TEST 3: Dropdown Produk di Contact Page (Tanpa Kategori)
    // ─────────────────────────────────────────────────────────────
    console.log('[3] Memeriksa dropdown produk di halaman /contact (kategori dihapus)...');
    await page.goto(`${BASE_URL}/contact`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(150);

    const productOptions = await page.locator('#product_id option').allTextContents();
    console.log(`   - Pilihan opsi produk (sampel 3 pertama):`, productOptions.slice(1, 4));

    for (let i = 1; i < productOptions.length; i++) {
      const opt = productOptions[i];
      assert.ok(!opt.includes('(') && !opt.includes(')'), `Opsi produk "${opt}" tidak boleh memuat nama kategori dalam kurung`);
    }
    console.log('  ✓ Bug 3 teratasi: Seluruh opsi dropdown produk di /contact bersih tanpa kategori.\n');

    console.log('=== ALL T-269 BUG FIX TESTS PASSED SUCCESSFULLY! ===');
  } finally {
    await browser.close();
  }
})();

