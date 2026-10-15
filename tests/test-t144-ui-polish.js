import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('--- STARTING TEST FOR T-144 (UI POLISH FOOTER & DESIGN.MD) ---');

// 1. Verify layout.css footer styling
const cssPath = path.resolve('public/css/layout.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

console.log('\n[TEST 1] Verifying Zero Blue in layout.css for Footer (T-144)...');

// Extract footer section from layout.css
const footerStart = cssContent.indexOf('PT Euodoo Prototype v2 Footer Layout');
const footerEnd = cssContent.indexOf('Responsive Media Queries for Header & Footer');
assert(footerStart !== -1, 'Must find PT Euodoo Prototype v2 Footer Layout in layout.css');
assert(footerEnd !== -1, 'Must find end of main footer block in layout.css');

const footerCss = cssContent.substring(footerStart, footerEnd);

// Check that no --sky or #38bdf8 exists in the footer section
assert(!footerCss.includes('var(--sky'), 'Footer must not use var(--sky)');
assert(!footerCss.includes('#38bdf8'), 'Footer must not use #38bdf8');
assert(!footerCss.includes('#0055b8'), 'Footer must not use #0055b8');
console.log('  1a. Complete elimination of blue tints in footer CSS: PASSED');

// Check specific element styles
assert(footerCss.includes('.ft-office-label {\n  font-size: 11px;\n  font-weight: 700;\n  color: #ffffff;'), '.ft-office-label must be #ffffff and bold');
assert(footerCss.includes('.ft-office-dot {\n  width: 6px;\n  height: 6px;\n  background: #ffffff;'), '.ft-office-dot must be 6px circle with #ffffff background');
assert(footerCss.includes('.ft-office-addr {\n  font-size: 13px;\n  color: #ffffff;\n  font-weight: 700;'), '.ft-office-addr must be #ffffff and bold');
assert(footerCss.includes('.ft-phone-val {\n  color: #ffffff;\n  font-weight: 700;'), '.ft-phone-val must be #ffffff and bold');
assert(footerCss.includes('.ft-phone-val:hover {\n  text-decoration: underline;'), '.ft-phone-val:hover must have underline affordance');
assert(footerCss.includes('.ft-nav-arrow {\n  color: #ffffff;\n  font-weight: 700;'), '.ft-nav-arrow must be #ffffff and bold');
assert(footerCss.includes('.ft-bottom {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding-top: 28px;\n  font-size: 13px;\n  color: rgba(255, 255, 255, 0.65);'), '.ft-bottom text must have high contrast >= 0.65 opacity');
console.log('  1b. Typography hierarchy, pure white colors, and click affordances: PASSED');

// Check accessibility & motion
assert(footerCss.includes('.ft-nav-link:focus-visible'), 'Navigation links must support :focus-visible');
assert(footerCss.includes('.ft-phone-val:focus-visible'), 'Phone links must support :focus-visible');
assert(footerCss.includes('.ft-legal-link:focus-visible'), 'Legal links must support :focus-visible');
assert(footerCss.includes('.social-btn:focus-visible'), 'Social buttons must support :focus-visible');
assert(footerCss.includes('@media (prefers-reduced-motion: reduce)'), 'Footer must respect prefers-reduced-motion');
console.log('  1c. Keyboard accessibility focus outlines and motion reduction: PASSED');

// 2. Verify DESIGN.md documentation
console.log('\n[TEST 2] Verifying Design/DESIGN.md rules for Footer (T-144)...');
const designPath = path.resolve('Design/DESIGN.md');
const designContent = fs.readFileSync(designPath, 'utf8');

assert(designContent.includes('Aturan Sistem Warna, Tipografi & Isolasi Footer (`.site-footer`)'), 'DESIGN.md must contain footer rules section');
assert(designContent.includes('Eliminasi Total Warna Biru pada Teks Footer'), 'DESIGN.md must document blue elimination rule');
assert(designContent.includes('Hierarki Visual Berbasis Bobot (Font-Weight) & Opasitas (Opacity)'), 'DESIGN.md must document visual hierarchy rule');
assert(designContent.includes('Keterbacaan & Aksesibilitas WCAG AA'), 'DESIGN.md must document WCAG AA contrast rules');
assert(designContent.includes('Aturan Isolasi CSS Footer (Footer Scoping Policy)'), 'DESIGN.md must document CSS isolation policy');
console.log('  2a. DESIGN.md documentation complete and aligned: PASSED');

console.log('\n--- ALL T-144 TESTS PASSED SUCCESSFULLY! ---');
