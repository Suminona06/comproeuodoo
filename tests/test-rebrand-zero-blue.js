
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('=== TEST SUITE: T-167 REBRAND PALET HIJAU V1 ZERO-BLUE AUDIT & TOKEN VALIDATION ===\n');

// 1. Token Validation in public/css/tokens.css
console.log('[STEP 1] Validating Core Brand Tokens in public/css/tokens.css...');
const tokensCssPath = path.join(ROOT_DIR, 'public', 'css', 'tokens.css');
assert(fs.existsSync(tokensCssPath), 'tokens.css must exist');
const tokensCssContent = fs.readFileSync(tokensCssPath, 'utf8');

const requiredTokens = [
  { key: '--color-primary', expected: '#00755a' },
  { key: '--color-primary-dark', expected: '#00573f' },
  { key: '--color-primary-bright', expected: '#00906e' },
  { key: '--color-primary-hover', expected: '#009476' },
  { key: '--color-leaf', expected: '#7cbe38' },
  { key: '--surface-dark-footer', expected: '#00573f' },
  { key: '--status-info', expected: '#334155' },
  { key: '--status-info-bg', expected: '#f1f5f9' },
  { key: '--status-info-border', expected: '#cbd5e1' }
];

for (const t of requiredTokens) {
  const regex = new RegExp(`${t.key}\\s*:\\s*${t.expected}`, 'i');
  assert(regex.test(tokensCssContent), `Token ${t.key} must be set to ${t.expected} in tokens.css`);
  console.log(`  ✓ ${t.key}: ${t.expected}`);
}

// 2. Admin Token Validation in public/css/admin.css
console.log('\n[STEP 2] Validating Admin CMS Tokens in public/css/admin.css...');
const adminCssPath = path.join(ROOT_DIR, 'public', 'css', 'admin.css');
assert(fs.existsSync(adminCssPath), 'admin.css must exist');
const adminCssContent = fs.readFileSync(adminCssPath, 'utf8');

const requiredAdminTokens = [
  { key: '--primary', expected: '#00755a' },
  { key: '--primary-hover', expected: '#00573f' },
  { key: '--primary-subtle', expected: '#e6f7f2' },
  { key: '--primary-border', expected: '#a3e0d0' },
  { key: '--border-focus', expected: '#00755a' },
  { key: '--st-diproses-bg', expected: '#e6f7f2' },
  { key: '--st-diproses-text', expected: '#00573f' },
  { key: '--st-diproses-border', expected: '#a3e0d0' }
];

for (const t of requiredAdminTokens) {
  const regex = new RegExp(`${t.key}\\s*:\\s*${t.expected}`, 'i');
  assert(regex.test(adminCssContent), `Admin token ${t.key} must be set to ${t.expected} in admin.css`);
  console.log(`  ✓ ${t.key}: ${t.expected}`);
}

// 3. Mathematical WCAG Contrast Calculations
console.log('\n[STEP 3] Verifying WCAG 2.1 AA / AAA Mathematical Contrast Ratios...');

function parseHex(hex) {
  const h = hex.replace('#', '').trim();
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16)
  };
}

function getLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function calculateContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(parseHex(hex1));
  const lum2 = getLuminance(parseHex(hex2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

const contrastPairs = [
  { fg: '#ffffff', bg: '#00755a', minRatio: 4.5, tier: 'AA', desc: 'White text on Primary (#00755a)' },
  { fg: '#ffffff', bg: '#00573f', minRatio: 7.0, tier: 'AAA', desc: 'White text on Primary-Dark / Footer (#00573f)' },
  { fg: '#00573f', bg: '#ffffff', minRatio: 7.0, tier: 'AAA', desc: 'Primary-Dark text on White (#ffffff)' },
  { fg: '#00755a', bg: '#ffffff', minRatio: 4.5, tier: 'AA', desc: 'Primary link on White (#ffffff)' },
  { fg: '#0f172a', bg: '#7cbe38', minRatio: 7.0, tier: 'AAA', desc: 'Dark text on Leaf accent (#7cbe38)' },
  { fg: '#334155', bg: '#f1f5f9', minRatio: 7.0, tier: 'AAA', desc: 'Slate neutral text on info bg' },
  { fg: '#00573f', bg: '#e6f7f2', minRatio: 7.0, tier: 'AAA', desc: 'Admin diproses status badge' }
];

for (const pair of contrastPairs) {
  const ratio = calculateContrastRatio(pair.fg, pair.bg);
  assert(
    ratio >= pair.minRatio,
    `Contrast failure for ${pair.desc}: got ${ratio.toFixed(2)}:1, expected at least ${pair.minRatio}:1 (${pair.tier})`
  );
  console.log(`  ✓ ${pair.desc}: ${ratio.toFixed(2)}:1 (Lolos ${pair.tier})`);
}

// 4. Critical Rules Check
console.log('\n[STEP 4] Verifying Critical Anti-Slop & Access Rules...');
const whiteOnLeafRatio = calculateContrastRatio('#ffffff', '#7cbe38');
assert(whiteOnLeafRatio < 3.0, 'White on leaf is confirmed < 3.0:1 (forbidden for text in DESIGN.md)');
console.log(`  ✓ Confirmation: White on Leaf ratio is ${whiteOnLeafRatio.toFixed(2)}:1 (< 3.0:1, strictly prohibited in design tokens)`);

// 5. Zero-Blue Full Source Code Scanning
console.log('\n[STEP 5] Performing Comprehensive Zero-Blue Source Code Scan...');

const targetDirectories = [
  path.join(ROOT_DIR, 'public', 'css'),
  path.join(ROOT_DIR, 'public', 'js'),
  path.join(ROOT_DIR, 'views'),
  path.join(ROOT_DIR, 'middleware'),
  path.join(ROOT_DIR, 'config')
];

const forbiddenHexRegexes = [
  /#0055b8/i,
  /#003f8b/i,
  /#003e85/i,
  /#004294/i,
  /#1d4ed8/i,
  /#2563eb/i,
  /#38bdf8/i,
  /#0284c7/i,
  /#eff6ff/i,
  /#bfdbfe/i,
  /#dbeafe/i,
  /#1e40af/i,
  /#0369a1/i,
  /#0c4a6e/i,
  /#bae6fd/i,
  /#c3d4fe/i,
  /#aec6ff/i,
  /#bcd0ff/i,
  /#93c5fd/i,
  /#60a5fa/i,
  /#3b82f6/i,
  /#1e3a8a/i,
  /#e0f2fe/i,
  /#0a192f/i,
  /#0d2040/i,
  /#182147/i
];

const forbiddenRgbaRegexes = [
  /rgba\(\s*0\s*,\s*85\s*,\s*184/i,
  /rgba\(\s*0\s*,\s*63\s*,\s*139/i,
  /rgba\(\s*29\s*,\s*78\s*,\s*216/i,
  /rgba\(\s*10\s*,\s*25\s*,\s*47/i,
  /rgba\(\s*13\s*,\s*32\s*,\s*64/i
];

const matchedViolations = [];
let totalFilesScanned = 0;

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (!['.css', '.js', '.ejs', '.html', '.svg'].includes(ext)) {
        continue;
      }
      totalFilesScanned++;
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        for (const regex of forbiddenHexRegexes) {
          if (regex.test(line)) {
            matchedViolations.push({
              file: path.relative(ROOT_DIR, fullPath),
              line: index + 1,
              content: line.trim(),
              pattern: regex.toString()
            });
          }
        }
        for (const regex of forbiddenRgbaRegexes) {
          if (regex.test(line)) {
            matchedViolations.push({
              file: path.relative(ROOT_DIR, fullPath),
              line: index + 1,
              content: line.trim(),
              pattern: regex.toString()
            });
          }
        }
      });
    }
  }
}

for (const dir of targetDirectories) {
  scanDir(dir);
}

console.log(`  Total active source files scanned: ${totalFilesScanned}`);

if (matchedViolations.length > 0) {
  console.error('\n❌ ZERO-BLUE AUDIT FAILED! The following forbidden blue/navy patterns were found:');
  matchedViolations.forEach(v => {
    console.error(`  - [${v.file}:${v.line}] Matches ${v.pattern}: "${v.content}"`);
  });
  process.exit(1);
} else {
  console.log('  ✓ 0 forbidden blue/navy occurrences detected across all target directories.');
}

console.log('\n=== ALL T-167 ASSERTIONS PASSED! ZERO-BLUE STATUS CONFIRMED (100% CLEAN) ===\n');
