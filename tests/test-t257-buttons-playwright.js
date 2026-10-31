/**
 * Test Suite: T-257 Admin Button Design System (.adm-btn-*)
 * Standarisasi Komponen Tombol Admin Terpadu & Kontras WCAG AA/AAA
 */

import { chromium } from 'playwright';
import assert from 'assert';
import fs from 'fs';
import { execSync } from 'child_process';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Helper: Calculate Relative Luminance for WCAG Contrast
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function parseRgb(colorStr) {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return [0, 0, 0];
  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

function calculateContrast(fgStr, bgStr) {
  const [r1, g1, b1] = parseRgb(fgStr);
  const [r2, g2, b2] = parseRgb(bgStr);
  const l1 = getLuminance(r1, g1, b1);
  const l2 = getLuminance(r2, g2, b2);
  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (brighter + 0.05) / (darker + 0.05);
}

async function runTestSuite() {
  console.log('=== TEST SUITE T-257: Playwright Admin Button (.adm-btn-*) Audit ===\n');

  // 1. Verifikasi AC-5: public/css/components.css tetap utuh
  console.log('[1] Memeriksa integritas public/css/components.css (AC-5)...');
  const diffOutput = execSync('git diff public/css/components.css', { encoding: 'utf-8' });
  assert.strictEqual(diffOutput.trim(), '', 'public/css/components.css HARUS 100% utuh tanpa modifikasi!');
  console.log('  ✓ public/css/components.css terverifikasi 100% utuh tanpa modifikasi.');

  // 2. Launch browser & setup test environment
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // Muat halaman mock yang meng-include css/tokens.css dan css/admin.css dari server
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <link rel="stylesheet" href="${BASE_URL}/css/tokens.css">
        <link rel="stylesheet" href="${BASE_URL}/css/admin.css">
      </head>
      <body style="padding: 24px; background: #f8fafc;">
        <div id="btn-container" style="display: flex; flex-direction: column; gap: 16px;">
          <!-- Primary -->
          <button id="btn-primary" class="adm-btn adm-btn-primary">
            <svg class="adm-btn-icon adm-btn-icon-save" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            </svg>
            Simpan
          </button>

          <!-- Secondary (Acuan Tabel Ukuran) -->
          <button id="btn-secondary" class="adm-btn adm-btn-secondary">
            <svg class="adm-btn-icon adm-btn-icon-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Tambah Kolom
          </button>

          <!-- Neutral -->
          <a id="btn-neutral" href="#" class="adm-btn adm-btn-neutral">
            <svg class="adm-btn-icon adm-btn-icon-back" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Batal
          </a>

          <!-- Danger -->
          <button id="btn-danger" class="adm-btn adm-btn-danger">
            <svg class="adm-btn-icon adm-btn-icon-trash" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Hapus
          </button>

          <!-- Modifiers -->
          <button id="btn-sm" class="adm-btn adm-btn-secondary adm-btn-sm">Aksi Sm</button>
          <button id="btn-disabled" class="adm-btn adm-btn-primary" disabled>Terkunci</button>
          <button id="btn-loading" class="adm-btn adm-btn-primary is-loading">
            <span class="adm-btn-spinner"></span>
            Menyimpan...
          </button>
        </div>
      </body>
      </html>
    `, { waitUntil: 'networkidle' });

    // Pastikan stylesheet admin.css dan tokens.css sudah diaplikasikan browser
    await page.waitForFunction(() => {
      const btn = document.getElementById('btn-primary');
      if (!btn) return false;
      const comp = window.getComputedStyle(btn);
      // CSS tokens.css dan admin.css harus mengubah background bukan default user-agent
      return comp.backgroundColor !== 'rgb(239, 239, 239)';
    });

    // ─────────────────────────────────────────────────────────────
    // TEST 2: Kontras Warna & Kepatuhan WCAG AA / AAA (AC-1 & AC-2)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[2] Memeriksa rasio kontras WCAG AA/AAA untuk seluruh varian...');

    const styles = await page.evaluate(() => {
      const getBtnData = (id) => {
        const el = document.getElementById(id);
        const comp = window.getComputedStyle(el);
        return {
          bg: comp.backgroundColor,
          color: comp.color,
          borderColor: comp.borderColor,
          fontSize: comp.fontSize,
          fontWeight: comp.fontWeight,
          borderRadius: comp.borderRadius
        };
      };
      return {
        primary: getBtnData('btn-primary'),
        secondary: getBtnData('btn-secondary'),
        neutral: getBtnData('btn-neutral'),
        danger: getBtnData('btn-danger')
      };
    });

    // Primary: #D1ECB9 dengan teks gelap #071F17 (harus >= 13:1, AAA)
    const primaryContrast = calculateContrast(styles.primary.color, styles.primary.bg);
    console.log(`  - Primary (.adm-btn-primary): BG ${styles.primary.bg}, Text ${styles.primary.color} -> Contrast: ${primaryContrast.toFixed(2)}:1`);
    assert.ok(primaryContrast >= 7.0, `Primary contrast (${primaryContrast.toFixed(2)}:1) wajib lulus WCAG AAA (>= 7.0:1)`);
    assert.ok(primaryContrast >= 13.0, `Primary contrast (${primaryContrast.toFixed(2)}:1) sesuai ekspektasi (~13.5:1)`);

    // Secondary: Teks hijau #00755A di atas latar #FFFFFF (harus >= 4.5:1, AA)
    const secondaryContrast = calculateContrast(styles.secondary.color, styles.secondary.bg);
    console.log(`  - Secondary (.adm-btn-secondary): BG ${styles.secondary.bg}, Text ${styles.secondary.color} -> Contrast: ${secondaryContrast.toFixed(2)}:1`);
    assert.ok(secondaryContrast >= 4.5, `Secondary contrast (${secondaryContrast.toFixed(2)}:1) wajib lulus WCAG AA (>= 4.5:1)`);

    // Neutral: Teks slate #334155 di atas latar #FFFFFF (harus >= 7.0:1, AAA)
    const neutralContrast = calculateContrast(styles.neutral.color, styles.neutral.bg);
    console.log(`  - Neutral (.adm-btn-neutral): BG ${styles.neutral.bg}, Text ${styles.neutral.color} -> Contrast: ${neutralContrast.toFixed(2)}:1`);
    assert.ok(neutralContrast >= 7.0, `Neutral contrast (${neutralContrast.toFixed(2)}:1) wajib lulus WCAG AAA (>= 7.0:1)`);

    // Danger: Teks merah #991B1B di atas latar #FEE2E2 (harus >= 7.0:1, AAA)
    const dangerContrast = calculateContrast(styles.danger.color, styles.danger.bg);
    console.log(`  - Danger (.adm-btn-danger): BG ${styles.danger.bg}, Text ${styles.danger.color} -> Contrast: ${dangerContrast.toFixed(2)}:1`);
    assert.ok(dangerContrast >= 7.0, `Danger contrast (${dangerContrast.toFixed(2)}:1) wajib lulus WCAG AAA (>= 7.0:1)`);

    console.log('  ✓ Seluruh varian tombol terbukti lulus standar kontras WCAG AA/AAA tanpa warna biru.');

    // ─────────────────────────────────────────────────────────────
    // TEST 3: Animasi Mikro & Interaksi Hover Desktop (AC-3)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[3] Memeriksa animasi mikro & transisi hover desktop...');

    // Hover pada btn-secondary (ikon plus rotasi 90deg)
    await page.hover('#btn-secondary');
    await page.waitForTimeout(250); // tunggu transisi selesai
    const secondaryHover = await page.evaluate(() => {
      const btn = document.getElementById('btn-secondary');
      const icon = btn.querySelector('.adm-btn-icon-plus');
      return {
        btnTransform: window.getComputedStyle(btn).transform,
        iconTransform: window.getComputedStyle(icon).transform
      };
    });
    console.log(`  - Secondary Hover btnTransform: ${secondaryHover.btnTransform}, iconTransform: ${secondaryHover.iconTransform}`);
    assert.ok(secondaryHover.btnTransform.includes('matrix'), 'Tombol harus mengalami translateY saat di-hover');
    assert.ok(secondaryHover.iconTransform.includes('matrix'), 'Ikon plus harus berotasi saat di-hover');

    // Hover pada btn-neutral (ikon back translateX)
    await page.hover('#btn-neutral');
    await page.waitForTimeout(250);
    const neutralHover = await page.evaluate(() => {
      const icon = document.querySelector('#btn-neutral .adm-btn-icon-back');
      return window.getComputedStyle(icon).transform;
    });
    console.log(`  - Neutral Hover iconTransform: ${neutralHover}`);
    assert.ok(neutralHover.includes('matrix'), 'Ikon back harus translasi saat di-hover');

    // Hover pada btn-primary (ikon save scale)
    await page.hover('#btn-primary');
    await page.waitForTimeout(250);
    const primaryHover = await page.evaluate(() => {
      const icon = document.querySelector('#btn-primary .adm-btn-icon-save');
      return window.getComputedStyle(icon).transform;
    });
    console.log(`  - Primary Hover iconTransform: ${primaryHover}`);
    assert.ok(primaryHover.includes('matrix'), 'Ikon save harus scale saat di-hover');

    console.log('  ✓ Seluruh animasi mikro kontekstual (rotasi plus, geser panah, skala simpan) terverifikasi.');

    // ─────────────────────────────────────────────────────────────
    // TEST 4: Aksesibilitas prefers-reduced-motion (AC-3)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[4] Memeriksa prefers-reduced-motion: reduce...');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.hover('#btn-secondary');
    await page.waitForTimeout(250);

    const reducedMotionStyles = await page.evaluate(() => {
      const btn = document.getElementById('btn-secondary');
      const icon = btn.querySelector('.adm-btn-icon-plus');
      return {
        btnTransition: window.getComputedStyle(btn).transition,
        btnTransform: window.getComputedStyle(btn).transform,
        iconTransform: window.getComputedStyle(icon).transform
      };
    });

    console.log(`  - Reduced Motion btnTransform: ${reducedMotionStyles.btnTransform}`);
    assert.strictEqual(reducedMotionStyles.btnTransform, 'none', 'Transform tombol harus none saat prefers-reduced-motion aktif');
    assert.strictEqual(reducedMotionStyles.iconTransform, 'none', 'Transform ikon harus none saat prefers-reduced-motion aktif');
    console.log('  ✓ Mode prefers-reduced-motion mematikan animasi transform 100%.');

    // Reset media
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    // ─────────────────────────────────────────────────────────────
    // TEST 5: Target Sentuh Mobile >= 44px (AC-4)
    // ─────────────────────────────────────────────────────────────
    console.log('\n[5] Memeriksa target sentuh minimal 44px di mobile viewport (<= 768px)...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(100);

    const mobileHeights = await page.evaluate(() => {
      const ids = ['btn-primary', 'btn-secondary', 'btn-neutral', 'btn-danger'];
      return ids.map(id => {
        const el = document.getElementById(id);
        const rect = el.getBoundingClientRect();
        return { id, height: rect.height };
      });
    });

    for (const item of mobileHeights) {
      console.log(`  - Mobile Height #${item.id}: ${item.height}px`);
      assert.ok(item.height >= 44, `Tombol #${item.id} harus memiliki tinggi >= 44px di mobile (aktual: ${item.height}px)`);
    }
    console.log('  ✓ Seluruh tombol admin memenuhi standar target sentuh mobile minimal 44px.');

    // ─────────────────────────────────────────────────────────────
    // TEST 6: State Disabled & Loading
    // ─────────────────────────────────────────────────────────────
    console.log('\n[6] Memeriksa state :disabled dan .is-loading...');
    const states = await page.evaluate(() => {
      const dis = document.getElementById('btn-disabled');
      const load = document.getElementById('btn-loading');
      return {
        disabledPointer: window.getComputedStyle(dis).pointerEvents,
        disabledOpacity: parseFloat(window.getComputedStyle(dis).opacity),
        loadingPointer: window.getComputedStyle(load).pointerEvents,
        hasSpinner: Boolean(load.querySelector('.adm-btn-spinner'))
      };
    });

    assert.strictEqual(states.disabledPointer, 'none', 'Disabled button pointer-events harus none');
    assert.ok(states.disabledOpacity <= 0.65, 'Disabled button opacity harus <= 0.65');
    assert.strictEqual(states.loadingPointer, 'none', 'Loading button pointer-events harus none');
    assert.strictEqual(states.hasSpinner, true, 'Loading button harus memuat spinner');
    console.log('  ✓ State disabled dan is-loading terverifikasi mencegah klik ganda.');

    // ─────────────────────────────────────────────────────────────
    // TEST 7: Console Errors
    // ─────────────────────────────────────────────────────────────
    console.log('\n[7] Memeriksa console error browser...');
    assert.strictEqual(consoleErrors.length, 0, `Nol console errors, ditemukan: ${JSON.stringify(consoleErrors)}`);
    console.log('  ✓ Nol console error browser.');

  } finally {
    await browser.close();
  }

  console.log('\n======================================================');
  console.log('🎉 SEMUA TEST PLAYWRIGHT T-257 BERHASIL LULUS 100%! 🎉');
  console.log('======================================================\n');
}

runTestSuite().catch(err => {
  console.error('\n❌ TEST GAGAL:', err);
  process.exit(1);
});
