/**
 * Test Suite: Kelompok C (UI Polish: T-150 s/d T-156)
 * Revisi Kontak & Footer v1
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import ejs from 'ejs';

const rootDir = process.cwd();

console.log('--- STARTING TESTS: KELOMPOK C (T-150 s/d T-156 UI POLISH) ---');

const contactEjsPath = path.join(rootDir, 'views/public/contact.ejs');
const contactEjsContent = fs.readFileSync(contactEjsPath, 'utf8');

const componentsCssPath = path.join(rootDir, 'public/css/components.css');
const componentsCssContent = fs.readFileSync(componentsCssPath, 'utf8');

// ----------------------------------------------------
// TEST 1: T-150 - Inline Style Elimination & Scoped .cf-*
// ----------------------------------------------------
console.log('\n[TEST 1] T-150: Inline Style Elimination & Scoped .cf-* Classes');

// Check style=" occurrence count in contact.ejs (MUST be exactly 1 for honeypot)
const styleMatches = contactEjsContent.match(/style="/g) || [];
assert.strictEqual(
  styleMatches.length,
  1,
  `FAIL: Expected exactly 1 'style="' occurrence in contact.ejs (honeypot only), found ${styleMatches.length}`
);

// Verify the only style=" is on the honeypot
const honeypotSnippet = '<div style="display: none !important;" aria-hidden="true">';
assert(
  contactEjsContent.includes(honeypotSnippet),
  'FAIL: The single style=" must be the anti-spam honeypot container'
);

// Verify NO inline handlers exist
const inlineHandlers = contactEjsContent.match(/\son(click|submit|error|load|change|blur|focus)=/i);
assert(!inlineHandlers, `FAIL: Found inline event handler: ${inlineHandlers}`);

// Verify .cf-* classes exist in components.css
const requiredCfClasses = [
  '.cf-section',
  '.cf-hero-cta',
  '.cf-alert',
  '.cf-alert-success',
  '.cf-alert-error',
  '.cf-header',
  '.cf-kicker',
  '.cf-title',
  '.cf-subtitle',
  '.cf-form-row',
  '.cf-form-group',
  '.cf-label',
  '.cf-label-required',
  '.cf-input',
  '.cf-select',
  '.cf-textarea',
  '.cf-btn-submit',
  '.cf-office-card',
  '.cf-office-header',
  '.cf-office-icon',
  '.cf-office-name',
  '.cf-office-addr',
  '.cf-office-detail',
  '.cf-maps-wrap'
];

for (const cls of requiredCfClasses) {
  assert(
    componentsCssContent.includes(cls),
    `FAIL: Required class ${cls} is missing from components.css`
  );
}

console.log('✅ PASS: T-150 inline styles eliminated to exactly 1 honeypot and .cf-* classes defined.');

// ----------------------------------------------------
// TEST 2: T-151 - Form Component States (Hover, Focus, Invalid, Loading)
// ----------------------------------------------------
console.log('\n[TEST 2] T-151: Form Component States (Hover, Focus, Invalid, Loading)');

// 44px min-height
assert(
  componentsCssContent.includes('min-height: 44px;'),
  'FAIL: Controls must have min-height 44px'
);

// Focus ring 3px
assert(
  componentsCssContent.includes('box-shadow: 0 0 0 3px rgba(0, 85, 184, 0.15);'),
  'FAIL: Focus ring must be 3px rgba(0, 85, 184, 0.15)'
);

// Invalid state
assert(
  componentsCssContent.includes('.cf-input.is-invalid'),
  'FAIL: .cf-input.is-invalid state missing'
);

// Submit button loading disabled state
assert(
  componentsCssContent.includes('.cf-btn-submit:disabled'),
  'FAIL: .cf-btn-submit:disabled state missing'
);

console.log('✅ PASS: T-151 form input states (min-height, focus ring, invalid, loading) verified.');

// ----------------------------------------------------
// TEST 3: T-152 - Consistent Accessible Dropdown
// ----------------------------------------------------
console.log('\n[TEST 3] T-152: Consistent Accessible Dropdown (CSS-only Opsi A)');

assert(
  componentsCssContent.includes('appearance: none;'),
  'FAIL: .cf-select must use appearance: none'
);
assert(
  componentsCssContent.includes('background-image: url("data:image/svg+xml'),
  'FAIL: .cf-select must have custom SVG chevron'
);
assert(
  contactEjsContent.includes('<select id="product_id" name="product_id" class="cf-select">'),
  'FAIL: product select must maintain native select element'
);
assert(
  contactEjsContent.includes('<select id="inquiry_type" name="type" class="cf-select">'),
  'FAIL: inquiry_type select must maintain native select element'
);

console.log('✅ PASS: T-152 native accessible dropdown with SVG chevron verified.');

// ----------------------------------------------------
// TEST 4: T-153 - Mobile & Responsive Layout
// ----------------------------------------------------
console.log('\n[TEST 4] T-153: Mobile & Responsive Layout (320px - Desktop)');

assert(
  componentsCssContent.includes('@media (max-width: 768px)'),
  'FAIL: Media query for 768px breakpoint missing'
);
assert(
  componentsCssContent.includes('@media (max-width: 480px)'),
  'FAIL: Media query for 480px breakpoint missing'
);
assert(
  componentsCssContent.includes('grid-template-columns: 1fr;'),
  'FAIL: .cf-form-row must reflow to 1 column on mobile'
);

console.log('✅ PASS: T-153 responsive breakpoints (768px, 480px) verified.');

// ----------------------------------------------------
// TEST 5: T-154 - Color Tokens Alignment (DESIGN.md)
// ----------------------------------------------------
console.log('\n[TEST 5] T-154: Color Tokens Alignment (DESIGN.md)');

// Kicker color must be neutral var(--text-muted) per Opsi A
assert(
  componentsCssContent.includes('color: var(--text-muted, #64748B);'),
  'FAIL: .cf-kicker must use var(--text-muted, #64748B) per Option A decision'
);

console.log('✅ PASS: T-154 neutral kicker color & DESIGN.md color tokens verified.');

// ----------------------------------------------------
// TEST 6: T-155 & T-156 - Footer & End-to-End Security Verification
// ----------------------------------------------------
console.log('\n[TEST 6] T-155 & T-156: Footer & End-to-End Security Verification');

const footerEjsPath = path.join(rootDir, 'views/partials/footer.ejs');
const footerEjsContent = fs.readFileSync(footerEjsPath, 'utf8');

// Check white bold style in footer
assert(
  footerEjsContent.includes('class="ft-phone-val"'),
  'FAIL: footer must style phone, fax, and email links with ft-phone-val'
);

// Check XSS safety (no unescaped user inputs)
const dangerousUnescaped = contactEjsContent.match(/<%-\s*(name|company|email|phone|quantity|message|errorMsg)\b/g);
assert(!dangerousUnescaped, 'FAIL: Dangerous unescaped user variables found in contact.ejs');

// Check CSRF token included
assert(
  contactEjsContent.includes('<input type="hidden" name="_csrf" value="<%= csrfToken %>">'),
  'FAIL: CSRF token input missing from contact form'
);

console.log('✅ PASS: T-155 & T-156 footer styling & end-to-end security compliance verified.');

console.log('\n🎉 ALL KELOMPOK C TESTS PASSED SUCCESSFULLY! 🎉\n');
