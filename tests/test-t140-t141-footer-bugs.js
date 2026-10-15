import assert from 'assert';
import fs from 'fs';
import path from 'path';
import ejs from 'ejs';

console.log('--- STARTING TEST FOR T-140 & T-141 (FOOTER SOCIAL BUGS) ---');

// 1. Verify CSS rules in public/css/layout.css
const cssPath = path.resolve('public/css/layout.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

console.log('\n[TEST 1] Verifying CSS in layout.css for Bug A.2 (T-141)...');
assert(cssContent.includes('.social-btn'), 'CSS must define .social-btn');
assert(cssContent.includes('color: #ffffff !important'), '.social-btn must enforce color: #ffffff !important to beat a:hover cascade');
assert(cssContent.includes('@media (hover: hover)'), '.social-btn:hover must be isolated inside @media (hover: hover)');
assert(cssContent.includes('.social-btn:focus-visible'), '.social-btn must have :focus-visible rule');
assert(cssContent.includes('@media (prefers-reduced-motion: reduce)'), '.social-btn must honor prefers-reduced-motion');
console.log('  1a. CSS rules for high contrast, touch isolation, focus-visible, and reduced-motion: PASSED');

// 2. Verify footer template rendering for Bug A.1 (T-140)
console.log('\n[TEST 2] Verifying views/partials/footer.ejs template for Bug A.1 (T-140)...');
const footerPath = path.resolve('views/partials/footer.ejs');
const footerContent = fs.readFileSync(footerPath, 'utf8');

// Check that hardcoded fallback URLs are removed
assert(!footerContent.includes(": 'https://facebook.com'"), 'Hardcoded fallback to https://facebook.com must be removed');
assert(!footerContent.includes(": 'https://instagram.com'"), 'Hardcoded fallback to https://instagram.com must be removed');
assert(!footerContent.includes(": 'https://linkedin.com'"), 'Hardcoded fallback to https://linkedin.com must be removed');
console.log('  2a. Eliminasi fallback hardcode URL: PASSED');

// Test rendering with EJS
// Mock dummy include for cta-global and whatsapp-btn
const mockFooterTemplate = footerContent
  .replace(/<%- include\(['"]cta-global['"]\)(?:;)? %>/g, '<!-- mock cta -->')
  .replace(/<%- include\(['"]whatsapp-btn['"]\)(?:;)? %>/g, '<!-- mock wa -->')
  .replace(/<%- include\(['"].\/(?:whatsapp-btn)['"]\)(?:;)? %>/g, '<!-- mock wa -->');

// Case A: All socials populated including YouTube
const mockSettingsAll = {
  social_linkedin_url: 'https://linkedin.com/company/pteuodoo-test',
  social_instagram_url: 'https://instagram.com/pteuodoo-test',
  social_facebook_url: 'https://facebook.com/pteuodoo-test',
  social_youtube_url: 'https://youtube.com/@pteuodoo-test',
  currentLang: 'id',
  currentYear: 2026
};

const renderedAll = ejs.render(mockFooterTemplate, {
  settings: mockSettingsAll,
  currentLang: 'id',
  currentYear: 2026
});

assert(renderedAll.includes('https://youtube.com/@pteuodoo-test'), 'Footer must render custom YouTube URL');
assert(renderedAll.includes('https://facebook.com/pteuodoo-test'), 'Footer must render custom Facebook URL');
assert(renderedAll.includes('https://instagram.com/pteuodoo-test'), 'Footer must render custom Instagram URL');
assert(renderedAll.includes('https://linkedin.com/company/pteuodoo-test'), 'Footer must render custom LinkedIn URL');
assert(renderedAll.includes('aria-label="YouTube PT Euodoo"'), 'YouTube button must have accessible aria-label');
assert(renderedAll.includes('rel="noopener noreferrer"'), 'Social links must include rel="noopener noreferrer"');
assert(renderedAll.includes('target="_blank"'), 'Social links must include target="_blank"');
console.log('  2b. Rendering all socials including YouTube with security attributes: PASSED');

// Case B: YouTube populated, others empty
const mockSettingsYtOnly = {
  social_youtube_url: 'https://youtube.com/@pteuodoo_only',
  social_facebook_url: '',
  social_instagram_url: '',
  social_linkedin_url: ''
};

const renderedYtOnly = ejs.render(mockFooterTemplate, {
  settings: mockSettingsYtOnly,
  currentLang: 'id',
  currentYear: 2026
});

assert(renderedYtOnly.includes('https://youtube.com/@pteuodoo_only'), 'YouTube must be rendered');
assert(!renderedYtOnly.includes('facebook.com'), 'Facebook must NOT be rendered when empty');
assert(!renderedYtOnly.includes('instagram.com'), 'Instagram must NOT be rendered when empty');
assert(!renderedYtOnly.includes('linkedin.com'), 'LinkedIn must NOT be rendered when empty');
console.log('  2c. Rendering YouTube only without ghost/fallback links: PASSED');

// Case C: All empty -> social-row should not be rendered
const mockSettingsEmpty = {
  social_youtube_url: '',
  social_facebook_url: '',
  social_instagram_url: '',
  social_linkedin_url: ''
};

const renderedEmpty = ejs.render(mockFooterTemplate, {
  settings: mockSettingsEmpty,
  currentLang: 'id',
  currentYear: 2026
});

assert(!renderedEmpty.includes('class="social-row"'), 'Empty socials must not render social-row container');
console.log('  2d. Zero socials leaves no blank container: PASSED');

console.log('\n--- ALL T-140 & T-141 TESTS PASSED SUCCESSFULLY! ---');
