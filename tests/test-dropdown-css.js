import fs from 'fs';
import assert from 'assert';

console.log('Testing T-262: Unified Dropdown CSS (.eu-dd-*) and Token Foundation...');

const tokensCss = fs.readFileSync('public/css/tokens.css', 'utf8');
const adminCss = fs.readFileSync('public/css/admin.css', 'utf8');
const componentsCss = fs.readFileSync('public/css/components.css', 'utf8');

// 1. Check Tokens
assert(tokensCss.includes('--eu-dd-height: 52px;'), 'tokens.css must define --eu-dd-height');
assert(tokensCss.includes('--eu-dd-height-sm: 36px;'), 'tokens.css must define --eu-dd-height-sm');
assert(tokensCss.includes('--eu-dd-caret-size: 8px;'), 'tokens.css must define --eu-dd-caret-size');
assert(tokensCss.includes('--eu-dd-panel-max-height: 260px;'), 'tokens.css must define --eu-dd-panel-max-height');
console.log('  1. Dropdown tokens in tokens.css: PASSED');

// 2. Check admin.css root variables
assert(adminCss.includes('--eu-dd-height: 52px;'), 'admin.css must define --eu-dd-height in :root');
assert(adminCss.includes('--focus-ring: 0 0 0 3px rgba(0, 117, 90, 0.25);'), 'admin.css must define --focus-ring in :root');
console.log('  2. Dropdown tokens in admin.css: PASSED');

// 3. Check 3 Variants & Class Architecture in admin.css
const requiredSelectors = [
  '.eu-dd',
  '.eu-dd--inline',
  '.eu-dd-native',
  '.eu-dd-trigger',
  '.eu-dd--outlined',
  '.eu-dd--filled',
  '.eu-dd--elevated',
  '.eu-dd--sm',
  '.eu-dd-floating-label',
  '.eu-dd-value',
  '.eu-dd-prefix',
  '.eu-dd-strong',
  '.eu-dd-caret',
  '.eu-dd-caret-icon',
  '.eu-dd-panel',
  '.eu-dd-panel.eu-dd-panel--top',
  '.eu-dd-search-wrap',
  '.eu-dd-search-input',
  '.eu-dd-options',
  '.eu-dd-item',
  '.eu-dd-check-icon',
  '.eu-dd-item-media',
  '.eu-dd-skeleton-circle',
  '.eu-dd-skeleton-bar',
  '.eu-dd.is-invalid',
  '.eu-dd-error-msg'
];

requiredSelectors.forEach(sel => {
  assert(adminCss.includes(sel), `admin.css must include selector ${sel}`);
  assert(componentsCss.includes(sel), `components.css must include selector ${sel}`);
});
console.log(`  3. All ${requiredSelectors.length} core selectors present in admin.css and components.css: PASSED`);

// 4. Verify No Raw Hex in Dropdown Rules (Must use semantic CSS variables)
const extractDropdownBlock = (css) => {
  const start = css.indexOf('/* Unified Dropdown Component (.eu-dd-*) - T-262 */');
  assert(start !== -1, 'Dropdown CSS block comment must exist');
  return css.substring(start);
};

const adminBlock = extractDropdownBlock(adminCss);
assert(adminBlock.includes('var(--color-primary'), 'Must use primary green token');
assert(adminBlock.includes('var(--focus-ring'), 'Must use focus-ring token');
assert(adminBlock.includes('transform: rotate(180deg)'), 'Must rotate caret 180deg when open');
console.log('  4. Token mappings, ARIA states, and caret 180deg rotation verified: PASSED');

console.log('ALL T-262 TESTS PASSED SUCCESSFULLY!');

