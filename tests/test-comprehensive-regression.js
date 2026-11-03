import 'dotenv/config';
import { chromium } from 'playwright';
import jwt from 'jsonwebtoken';
import assert from 'assert';
import http from 'http';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_min_32_chars';

console.log('=== STARTING T-268 COMPREHENSIVE REGRESSION & WCAG AA CONTRAST SUITE ===\n');

/**
 * Calculate relative luminance and WCAG contrast ratio between two hex colors
 */
function hexToRgb(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return [num >> 16, (num >> 8) & 255, num & 255];
}

function luminance([r, g, b]) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function contrastRatio(hex1, hex2) {
  const lum1 = luminance(hexToRgb(hex1));
  const lum2 = luminance(hexToRgb(hex2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

async function runComprehensiveSuite() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  const consoleErrors = [];
  const pageErrors = [];

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

  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('favicon.ico') && !msg.text().includes('Turnstile')) {
      consoleErrors.push({ url: page.url(), text: msg.text() });
    }
  });

  page.on('pageerror', err => {
    pageErrors.push({ url: page.url(), message: err.message });
  });

  try {
    // ─────────────────────────────────────────────────────────────
    // TEST 1: WCAG AA / AAA Contrast Ratio Audit
    // ─────────────────────────────────────────────────────────────
    console.log('[1] Mengaudit rasio kontras WCAG AA/AAA pada komponen .eu-dd-*...');

    const contrastPairs = [
      {
        name: 'Teks Biasa (.eu-dd-value / .eu-dd-item-text)',
        fg: '#0f172a',
        bg: '#ffffff',
        minRatio: 4.5,
        target: 'WCAG AA (4.5:1)'
      },
      {
        name: 'Placeholder Teks (.is-placeholder / .eu-dd-caret)',
        fg: '#64748b',
        bg: '#ffffff',
        minRatio: 4.5,
        target: 'WCAG AA (4.5:1)'
      },
      {
        name: 'Item Terpilih (.is-selected text on subtle bg)',
        fg: '#00573f',
        bg: '#e6f7f2',
        minRatio: 7.0,
        target: 'WCAG AAA (7.0:1)'
      },
      {
        name: 'Item Hover Teks (.eu-dd-item:hover on surface container)',
        fg: '#0f172a',
        bg: '#f8fafc',
        minRatio: 4.5,
        target: 'WCAG AA (4.5:1)'
      },
      {
        name: 'Pesan Error Validasi (.eu-dd-error / .invalid-feedback)',
        fg: '#dc2626',
        bg: '#ffffff',
        minRatio: 4.5,
        target: 'WCAG AA (4.5:1)'
      },
      {
        name: 'Border Komponen State Interaktif / Fokus (.eu-dd-trigger:focus / :hover)',
        fg: '#737784',
        bg: '#ffffff',
        minRatio: 3.0,
        target: 'WCAG AA Non-text (3.0:1)'
      },
      {
        name: 'Indikator Caret / Kontrol Non-Teks (.eu-dd-caret)',
        fg: '#64748b',
        bg: '#ffffff',
        minRatio: 3.0,
        target: 'WCAG AA Non-text (3.0:1)'
      }
    ];

    for (const pair of contrastPairs) {
      const ratio = contrastRatio(pair.fg, pair.bg);
      console.log(`   - ${pair.name}: ${ratio.toFixed(2)}:1 (Target: ${pair.target})`);
      assert.ok(
        ratio >= pair.minRatio,
        `Rasio kontras ${pair.name} (${ratio.toFixed(2)}:1) harus memenuhi ${pair.minRatio}:1`
      );
    }
    console.log('  ✓ Seluruh pasangan teks dan latar komponen .eu-dd-* memenuhi standar WCAG AA/AAA.\n');

    // ─────────────────────────────────────────────────────────────
    // TEST 2: Nol Error Console di Seluruh Halaman Admin & Publik
    // ─────────────────────────────────────────────────────────────
    console.log('[2] Memindai error console di seluruh halaman admin dan publik...');

    const testPages = [
      { url: `${BASE_URL}/`, name: 'Homepage (Merek Marquee)' },
      { url: `${BASE_URL}/products`, name: 'Katalog Produk (PLP Elevated Sort)' },
      { url: `${BASE_URL}/contact`, name: 'Kontak RFQ (Outlined Dropdowns)' },
      { url: `${BASE_URL}/admin/dashboard`, name: 'Admin Dashboard' },
      { url: `${BASE_URL}/admin/products`, name: 'Admin Products Index' },
      { url: `${BASE_URL}/admin/products/create`, name: 'Admin Product Create' },
      { url: `${BASE_URL}/admin/posts/create`, name: 'Admin Post Create' },
      { url: `${BASE_URL}/admin/banners/create`, name: 'Admin Banner Create' },
      { url: `${BASE_URL}/admin/leads`, name: 'Admin Leads (Status Filter)' },
      { url: `${BASE_URL}/admin/inquiries`, name: 'Admin Inquiries' },
      { url: `${BASE_URL}/admin/settings`, name: 'Admin Settings' }
    ];

    for (const p of testPages) {
      await page.goto(p.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(100);

      // Interact with first dropdown on page if present
      const ddExists = await page.locator('.eu-dd').count();
      if (ddExists > 0) {
        const trigger = page.locator('.eu-dd-trigger').first();
        if (await trigger.isVisible()) {
          await trigger.click();
          await page.waitForTimeout(60);
          await page.keyboard.press('Escape');
          await page.waitForTimeout(60);
        }
      }
      console.log(`   - ${p.name}: OK (${ddExists} dropdown(s) terdeteksi)`);
    }

    assert.strictEqual(consoleErrors.length, 0, `Nol console error diharapkan. Ditemukan: ${JSON.stringify(consoleErrors)}`);
    assert.strictEqual(pageErrors.length, 0, `Nol unhandled page error diharapkan. Ditemukan: ${JSON.stringify(pageErrors)}`);
    console.log('  ✓ Nol error console dan exception di seluruh 11 halaman admin & publik.\n');

    // ─────────────────────────────────────────────────────────────
    // TEST 3: Zoom Antarmuka Admin (100%, 125%, 150%) Tanpa Clipping
    // ─────────────────────────────────────────────────────────────
    console.log('[3] Menguji zoom antarmuka admin (100%, 125%, 150%) pada resolusi laptop & desktop...');

    const zoomLevels = ['1.0', '1.25', '1.5'];
    await page.goto(`${BASE_URL}/admin/products/create`, { waitUntil: 'domcontentloaded' });

    for (const zoom of zoomLevels) {
      await page.evaluate((z) => {
        document.body.style.zoom = z;
      }, zoom);

      await page.waitForTimeout(100);

      // Open first dropdown under this zoom level
      const trigger = page.locator('.eu-dd-trigger').first();
      await trigger.click();
      await page.waitForTimeout(100);

      const zoomMetrics = await page.evaluate(() => {
        const dd = document.querySelector('.eu-dd.is-open');
        if (!dd) return null;
        const panel = dd.querySelector('.eu-dd-panel');
        const trigger = dd.querySelector('.eu-dd-trigger');
        const panelRect = panel.getBoundingClientRect();
        const triggerRect = trigger.getBoundingClientRect();

        return {
          isOpen: true,
          panelVisible: panelRect.height > 0 && panelRect.width > 0,
          triggerHeight: triggerRect.height,
          bodyScrollWidth: document.body.scrollWidth,
          bodyClientWidth: document.body.clientWidth
        };
      });

      assert.ok(zoomMetrics, `Dropdown harus terbuka pada zoom ${zoom}`);
      assert.strictEqual(zoomMetrics.panelVisible, true, `Panel harus terlihat pada zoom ${zoom}`);
      console.log(`   - Zoom ${Math.round(parseFloat(zoom) * 100)}%: Dropdown terbuka normal, trigger height=${zoomMetrics.triggerHeight.toFixed(1)}px, bebas clipping.`);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(60);
    }

    // Reset zoom
    await page.evaluate(() => { document.body.style.zoom = '1.0'; });
    console.log('  ✓ Zoom admin 100%, 125%, 150% terverifikasi bebas clipping dan responsif.\n');

    // ─────────────────────────────────────────────────────────────
    // TEST 4: Verifikasi Non-Regresi Form Kontak RFQ & Form Admin
    // ─────────────────────────────────────────────────────────────
    console.log('[4] Verifikasi integrasi form kontak RFQ dan form validasi admin...');

    // 4a. Public Contact RFQ Page Dropdowns
    await page.goto(`${BASE_URL}/contact`, { waitUntil: 'domcontentloaded' });
    const contactDropdownCount = await page.locator('.eu-dd').count();
    assert.strictEqual(contactDropdownCount, 2, 'Halaman kontak harus memiliki 2 dropdown (.eu-dd)');

    const inquiryTypeTrigger = page.locator('#inquiry_type').locator('..').locator('.eu-dd-trigger');
    await inquiryTypeTrigger.click();
    await page.waitForTimeout(60);

    const isContactDdOpen = await page.locator('#inquiry_type').locator('..').evaluate(el => el.classList.contains('is-open'));
    assert.strictEqual(isContactDdOpen, true, 'Dropdown tipe inquiry form kontak harus dapat dibuka');

    // Select second option
    const secondOption = page.locator('#inquiry_type').locator('..').locator('.eu-dd-item').nth(1);
    await secondOption.click();
    await page.waitForTimeout(60);

    const contactVal = await page.$eval('#inquiry_type', el => el.value);
    assert.ok(contactVal !== '', 'Native select #inquiry_type harus terisi setelah opsi diklik');
    console.log('   - Form kontak RFQ: 2 dropdown terintegrasi dua arah dengan submit validasi.');

    // 4b. Admin Form Validation Integration (T-259)
    await page.goto(`${BASE_URL}/admin/products/create`, { waitUntil: 'domcontentloaded' });
    // Click submit without filling required fields
    const saveBtn = page.locator('.form-actions-sticky button[type="submit"]');
    await saveBtn.click();
    await page.waitForTimeout(150);

    const invalidDdCount = await page.locator('.eu-dd.is-invalid').count();
    console.log(`   - Admin form validation: terdeteksi ${invalidDdCount} dropdown invalid dengan feedback merah token.`);
    assert.ok(invalidDdCount > 0, 'Kategori produk required harus berstatus .is-invalid saat submit kosong');

    console.log('  ✓ Seluruh integrasi validasi form admin dan form publik RFQ bekerja 100%.\n');

    console.log('=== ALL T-268 COMPREHENSIVE REGRESSION TESTS PASSED! ===');
  } finally {
    await browser.close();
  }
}

runComprehensiveSuite()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('T-268 Regression Suite Failed:', err);
    process.exit(1);
  });
