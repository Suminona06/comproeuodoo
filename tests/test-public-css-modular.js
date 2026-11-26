import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import {
  PUBLIC_COMPONENT_CSS_FILES,
  readPublicTokensCss,
  readPublicComponentCss
} from './helpers/readPublicCss.js';

const PUBLIC_COMPONENTS_DIR = path.resolve('public/css/components');

const ZERO_BLUE_TOKENS = [
  ['--bg-base', '#ffffff'],
  ['--bg-subtle', '#f8fafc'],
  ['--bg-soft-green', '#f3f6f3'],
  ['--color-primary', '#00755a'],
  ['--color-primary-dark', '#00573f'],
  ['--color-primary-hover', '#009476'],
  ['--color-primary-bright', '#00906e'],
  ['--primary-subtle', '#e6f7f2'],
  ['--primary-border', '#a3e0d0'],
  ['--surface-dark-deep', '#071f17'],
  ['--surface-dark-surface', '#0b281e'],
  ['--surface-dark-footer', '#00573f'],
  ['--color-text-muted-light', '#94a3b8'],
  ['--plp-divider', '#e5e7eb'],
  ['--plp-btn-border', '#7c8fa6'],
  ['--color-warning-text', '#b45309'],
  ['--color-success-text-deep', '#14532d'],
  ['--color-success-border', '#bbf7d0'],
  ['--color-error-text-deep', '#7f1d1d'],
  ['--color-error-border', '#fecaca']
];

const PDP_REQUIRED_TOKENS = [
  '--pd-bg',
  '--pd-bg-soft',
  '--pd-surface',
  '--pd-surface-2',
  '--pd-ink',
  '--pd-ink-2',
  '--pd-ink-3',
  '--pd-line',
  '--pd-line-soft',
  '--pd-green',
  '--pd-green-hover',
  '--pd-green-bright',
  '--pd-green-deep',
  '--pd-sage',
  '--pd-sage-2',
  '--pd-radius-lg',
  '--pd-shadow'
];

const DEAD_SELECTORS = [
  '.showcase-card*',
  '.section-journey',
  '.metric-stat-*',
  '.news-asymmetric-grid',
  '.news-card-tall',
  '.news-card-horizontal',
  '.news-tag-date',
  '.news-title-overlay',
  '.footer-corp-*',
  '.social-icon*',
  '.btn-outline*',
  '.btn-ghost',
  '.btn-link',
  '.btn-white',
  '.btn-lg',
  '.btn-block',
  '.btn-pill-sky',
  '.card-header',
  '.card-metric',
  '.metric-label',
  '.metric-val',
  '.form-error',
  '.table-dense',
  '.table-responsive',
  '.th-neutral',
  '.breadcrumb',
  '.eco',
  '.news-headline-*',
  '.news-card-v2-excerpt',
  '.pill-filter',
  '.topic-chip*',
  '.share-btn-pill',
  '.office-info-card',
  '.pillar-card*',
  '.wcu-callout*',
  '.wcu-anchor-target',
  '.wcu-note',
  '.spec-table*',
  '.brand-tag-eco',
  '.media-overlay-pill',
  '.cf-field-error',
  '.cf-var-hint',
  '.plp-chevron',
  '.nwl-hidden',
  '.vm-list-text',
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

function hasDeadClassToken(selector, deadPattern) {
  if (deadPattern.endsWith('*')) {
    const prefix = deadPattern.slice(0, -1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-zA-Z0-9_-])${prefix}[a-zA-Z0-9_-]*`).test(selector);
  }
  const escaped = deadPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-zA-Z0-9_-])${escaped}(?=$|[^a-zA-Z0-9_-])`).test(selector);
}

function collectPublicComponentRefsFromHead(filePath) {
  const content = fs.readFileSync(path.resolve(filePath), 'utf8');
  const staticRefs = [...content.matchAll(/href="\/css\/components\/([a-z0-9-]+\.css)(?:\?[^"]*)?"/g)]
    .map((m) => m[1]);
  const pageStyleMatches = [...content.matchAll(/'([a-z0-9-]+\.css)'/g)]
    .map((m) => m[1]);
  return [...new Set([...staticRefs, ...pageStyleMatches])];
}

describe('Public CSS Modular Architecture (T-449)', () => {
  it('a) all 25 public component CSS files exist and stay within 620 lines', () => {
    assert.equal(PUBLIC_COMPONENT_CSS_FILES.length, 25);
    const actualFiles = fs.readdirSync(PUBLIC_COMPONENTS_DIR).filter((f) => f.endsWith('.css')).sort();
    assert.deepEqual(actualFiles, [...PUBLIC_COMPONENT_CSS_FILES].sort());
    assert.equal(fs.existsSync(path.resolve('public/css/components.css')), false, 'monolith components.css must stay deleted');

    for (const file of PUBLIC_COMPONENT_CSS_FILES) {
      const lineCount = readPublicComponentCss(file).split('\n').length;
      assert.ok(lineCount <= 620, `${file} has ${lineCount} lines (max 620)`);
    }
  });

  it('b) zero raw hex colors outside public/css/tokens.css', () => {
    const hexRegex = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
    for (const file of PUBLIC_COMPONENT_CSS_FILES) {
      const css = readPublicComponentCss(file);
      const matches = css.match(hexRegex);
      assert.equal(matches, null, `Raw hex found in ${file}: ${matches?.join(', ')}`);
    }
  });

  it('c) zero duplicate (context, selector) across all 25 component CSS files', () => {
    const seen = new Map();
    const duplicates = [];
    for (const file of PUBLIC_COMPONENT_CSS_FILES) {
      const cleanCss = stripCssComments(readPublicComponentCss(file));
      for (const entry of collectSelectorEntries(cleanCss)) {
        const key = `${entry.context}::${entry.selector}`;
        if (seen.has(key)) duplicates.push(`${key} (${seen.get(key)} & ${file})`);
        else seen.set(key, file);
      }
    }
    assert.deepEqual(duplicates, [], `Duplicate selectors found:\n${duplicates.join('\n')}`);
  });

  it('d) zero-blue green palette and consolidated PDP tokens are intact in public/css/tokens.css', () => {
    const tokensCss = readPublicTokensCss();
    for (const [token, expectedHex] of ZERO_BLUE_TOKENS) {
      const pattern = new RegExp(`${token}\\s*:\\s*${expectedHex}`, 'i');
      assert.ok(pattern.test(tokensCss), `Missing or mismatched token ${token}: ${expectedHex}`);
    }
    for (const token of PDP_REQUIRED_TOKENS) {
      const pattern = new RegExp(`${token}\\s*:`);
      assert.ok(pattern.test(tokensCss), `Missing PDP token ${token}`);
    }
  });

  it('e) none of the 70 dead classes exist in public component CSS', () => {
    const found = [];
    for (const file of PUBLIC_COMPONENT_CSS_FILES) {
      const cleanCss = stripCssComments(readPublicComponentCss(file));
      for (const entry of collectSelectorEntries(cleanCss)) {
        for (const dead of DEAD_SELECTORS) {
          if (hasDeadClassToken(entry.selector, dead)) {
            found.push(`${dead} in ${file} (${entry.selector})`);
          }
        }
      }
    }
    assert.deepEqual(found, [], `Dead selectors found:\n${found.join('\n')}`);
  });

  it('f) all CSS refs in head.ejs are valid and zero /css/components.css refs in head.ejs, login.ejs, 403.ejs', () => {
    const headRefs = collectPublicComponentRefsFromHead('views/partials/head.ejs');
    assert.ok(headRefs.length > 0, 'No /css/components/ references found in views/partials/head.ejs');
    for (const cssFile of headRefs) {
      const fullPath = path.join(PUBLIC_COMPONENTS_DIR, cssFile);
      assert.equal(fs.existsSync(fullPath), true, `Missing referenced CSS ${cssFile} from views/partials/head.ejs`);
    }

    const noMonolithTemplates = [
      'views/partials/head.ejs',
      'views/admin/login.ejs',
      'views/admin/403.ejs'
    ];
    for (const tpl of noMonolithTemplates) {
      const content = fs.readFileSync(path.resolve(tpl), 'utf8');
      assert.equal(
        content.includes('/css/components.css'),
        false,
        `Legacy /css/components.css reference still present in ${tpl}`
      );
    }
  });
});
