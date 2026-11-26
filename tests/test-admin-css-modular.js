import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

const ADMIN_CSS_DIR = path.resolve('public/css/admin');
const EXPECTED_CSS_FILES = [
  'tokens.css',
  'base-shell.css',
  'buttons.css',
  'tables-badges.css',
  'forms-inputs.css',
  'modals-overlays.css',
  'tabs-toggles.css',
  'dropdown.css',
  'pagination.css',
  'responsive-viewport.css',
  'media-picker.css',
  'media-picker-upload.css',
  'page-auth.css',
  'page-dashboard-inquiries.css',
  'page-catalog.css',
  'page-product-editors.css',
  'page-content-cms.css',
  'page-org-contact.css',
  'page-home.css',
  'page-about.css',
  'page-settings.css'
];

const ZERO_BLUE_TOKENS = [
  ['--primary', '#00755a'],
  ['--primary-hover', '#00573f'],
  ['--primary-subtle', '#e6f7f2'],
  ['--primary-border', '#a3e0d0'],
  ['--border-focus', '#00755a'],
  ['--st-diproses-bg', '#e6f7f2'],
  ['--st-diproses-text', '#00573f'],
  ['--st-diproses-border', '#a3e0d0']
];

const DEAD_SELECTORS = [
  '.alert-warning',
  '.btn',
  '.btn-primary',
  '.btn-secondary',
  '.btn-danger',
  '.btn-sm',
  '.adm-btn-ghost',
  '.adm-btn-lg',
  '.adm-btn-spinner',
  '.swal2-custom-confirm-btn',
  '.swal2-custom-cancel-btn',
  '.text-danger',
  '.counter-danger',
  '.prod-variant-row-item',
  '.table-responsive:has(.eu-dd.is-open)',
  '.adm-inq-pagination',
  '.eu-dd-trigger.is-focused',
  '.eu-dd-error-msg'
];

function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function findBraceEnd(css, openIdx) {
  let depth = 1;
  let i = openIdx + 1;
  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') depth--;
    i++;
  }
  return i - 1;
}

function collectSelectorEntries(css, context = 'root', out = []) {
  let i = 0;
  while (i < css.length) {
    const openIdx = css.indexOf('{', i);
    if (openIdx === -1) break;
    const header = css.slice(i, openIdx).replace(/\s+/g, ' ').trim();
    const closeIdx = findBraceEnd(css, openIdx);
    const body = css.slice(openIdx + 1, closeIdx);
    if (header.startsWith('@media') || header.startsWith('@supports')) {
      collectSelectorEntries(body, header, out);
    } else if (header && !header.startsWith('@keyframes')) {
      for (const sel of header.split(',')) {
        const clean = sel.trim();
        if (clean) out.push({ context, selector: clean });
      }
    }
    i = closeIdx + 1;
  }
  return out;
}

function hasDeadClassToken(selector, deadClass) {
  if (deadClass.includes(':')) return selector.includes(deadClass);
  const escaped = deadClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-zA-Z0-9_-])${escaped}(?=$|[^a-zA-Z0-9_-])`).test(selector);
}

function collectCssRefsFromTemplate(filePath) {
  const content = fs.readFileSync(path.resolve(filePath), 'utf8');
  const staticRefs = [...content.matchAll(/href="\/css\/admin\/([a-z0-9-]+\.css)(?:\?[^"]*)?"/g)]
    .map((m) => m[1]);
  const pageStyleMatches = [...content.matchAll(/'([a-z0-9-]+\.css)'/g)]
    .map((m) => m[1]);
  return [...new Set([...staticRefs, ...pageStyleMatches])];
}

describe('Admin CSS Modular Architecture (T-430)', () => {
  it('a) all 21 admin CSS files exist and stay within 620 lines', () => {
    const actualFiles = fs.readdirSync(ADMIN_CSS_DIR).filter((f) => f.endsWith('.css')).sort();
    assert.deepEqual(actualFiles, [...EXPECTED_CSS_FILES].sort());
    assert.equal(fs.existsSync(path.resolve('public/css/admin.css')), false, 'monolith admin.css must stay deleted');

    for (const file of EXPECTED_CSS_FILES) {
      const lineCount = fs.readFileSync(path.join(ADMIN_CSS_DIR, file), 'utf8').split('\n').length;
      assert.ok(lineCount <= 620, `${file} has ${lineCount} lines (max 620)`);
    }
  });

  it('b) zero raw hex colors outside public/css/admin/tokens.css', () => {
    const hexRegex = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
    for (const file of EXPECTED_CSS_FILES) {
      if (file === 'tokens.css') continue;
      const css = fs.readFileSync(path.join(ADMIN_CSS_DIR, file), 'utf8');
      const matches = css.match(hexRegex);
      assert.equal(matches, null, `Raw hex found in ${file}: ${matches?.join(', ')}`);
    }
  });

  it('c) zero duplicate selectors within the same @media/root context', () => {
    const seen = new Map();
    const duplicates = [];
    for (const file of EXPECTED_CSS_FILES) {
      const cleanCss = stripCssComments(fs.readFileSync(path.join(ADMIN_CSS_DIR, file), 'utf8'));
      for (const entry of collectSelectorEntries(cleanCss)) {
        const key = `${entry.context}::${entry.selector}`;
        if (seen.has(key)) duplicates.push(`${key} (${seen.get(key)} & ${file})`);
        else seen.set(key, file);
      }
    }
    assert.deepEqual(duplicates, [], `Duplicate selectors found:\n${duplicates.join('\n')}`);
  });

  it('d) 8 required zero-blue tokens are present in admin/tokens.css', () => {
    const tokensCss = fs.readFileSync(path.join(ADMIN_CSS_DIR, 'tokens.css'), 'utf8');
    for (const [token, expectedHex] of ZERO_BLUE_TOKENS) {
      const pattern = new RegExp(`${token}\\s*:\\s*${expectedHex}`, 'i');
      assert.ok(pattern.test(tokensCss), `Missing or mismatched token ${token}: ${expectedHex}`);
    }
  });

  it('e) none of the 18 removed dead classes are present in admin CSS', () => {
    const found = [];
    for (const file of EXPECTED_CSS_FILES) {
      const cleanCss = stripCssComments(fs.readFileSync(path.join(ADMIN_CSS_DIR, file), 'utf8'));
      for (const entry of collectSelectorEntries(cleanCss)) {
        for (const dead of DEAD_SELECTORS) {
          if (hasDeadClassToken(entry.selector, dead)) found.push(`${dead} in ${file} (${entry.selector})`);
        }
      }
    }
    assert.deepEqual(found, [], `Dead selectors found:\n${found.join('\n')}`);
  });

  it('f) all /css/admin/*.css links in admin-header.ejs, login.ejs, and 403.ejs point to valid files', () => {
    const templates = [
      'views/partials/admin-header.ejs',
      'views/admin/login.ejs',
      'views/admin/403.ejs'
    ];
    for (const tpl of templates) {
      const refs = collectCssRefsFromTemplate(tpl);
      assert.ok(refs.length > 0, `No /css/admin/ references found in ${tpl}`);
      for (const cssFile of refs) {
        const fullPath = path.join(ADMIN_CSS_DIR, cssFile);
        assert.equal(fs.existsSync(fullPath), true, `Missing referenced CSS ${cssFile} from ${tpl}`);
      }
    }
  });
});
