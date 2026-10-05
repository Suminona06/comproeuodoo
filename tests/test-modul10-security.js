import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import userModel from '../models/userModel.js';
import { settingsMiddleware, formatWhatsAppNumber } from '../middleware/settingsMiddleware.js';
import { seoMiddleware } from '../middleware/seoMiddleware.js';

async function runModul10Tests() {
  console.log('--- STARTING MODUL 10 (SECURITY, AUTH, RBAC, SETTINGS, SEO) TESTS ---');

  // ==========================================
  // TEST 1: Role-Based Access Control (RBAC)
  // ==========================================
  console.log('\n[TEST 1] Testing roleMiddleware...');
  
  // 1a. Guest access
  let guestStatus = null;
  const mockGuestReq = { user: null, xhr: true, headers: { accept: 'application/json' }, originalUrl: '/admin/settings' };
  const mockGuestRes = {
    status(code) { guestStatus = code; return this; },
    json(data) { return data; }
  };
  roleMiddleware(['superadmin'])(mockGuestReq, mockGuestRes, () => {});
  if (guestStatus !== 401) throw new Error(`Expected 401 for guest, got ${guestStatus}`);
  console.log('  1a. Guest blocked with 401: PASSED');

  // 1b. Editor accessing superadmin-only route
  let editorStatus = null;
  const mockEditorReq = { user: { role: 'editor', email: 'editor@euodoo.com' }, xhr: true, headers: { accept: 'application/json' }, originalUrl: '/admin/settings' };
  const mockEditorRes = {
    status(code) { editorStatus = code; return this; },
    json(data) { return data; }
  };
  roleMiddleware(['superadmin'])(mockEditorReq, mockEditorRes, () => {});
  if (editorStatus !== 403) throw new Error(`Expected 403 for editor accessing superadmin route, got ${editorStatus}`);
  console.log('  1b. Editor blocked from superadmin route with 403: PASSED');

  // 1c. Admin accessing superadmin-only route
  let adminStatus = null;
  const mockAdminReq = { user: { role: 'admin', email: 'staff.admin@euodoo.com' }, xhr: true, headers: { accept: 'application/json' }, originalUrl: '/admin/settings' };
  const mockAdminRes = {
    status(code) { adminStatus = code; return this; },
    json(data) { return data; }
  };
  roleMiddleware(['superadmin'])(mockAdminReq, mockAdminRes, () => {});
  if (adminStatus !== 403) throw new Error(`Expected 403 for admin accessing superadmin route, got ${adminStatus}`);
  console.log('  1c. Admin blocked from superadmin route with 403: PASSED');

  // 1d. Superadmin accessing superadmin route
  let superadminNextCalled = false;
  const mockSuperReq = { user: { role: 'superadmin', email: 'admin@euodoo.com' }, originalUrl: '/admin/settings' };
  roleMiddleware(['superadmin'])(mockSuperReq, {}, () => { superadminNextCalled = true; });
  if (!superadminNextCalled) throw new Error('Expected next() called for superadmin');
  console.log('  1d. Superadmin allowed to access superadmin route: PASSED');

  // 1e. Editor accessing posts route
  let editorNextCalled = false;
  const mockEditorPostReq = { user: { role: 'editor', email: 'editor@euodoo.com' }, originalUrl: '/admin/posts' };
  roleMiddleware(['superadmin', 'admin', 'editor'])(mockEditorPostReq, {}, () => { editorNextCalled = true; });
  if (!editorNextCalled) throw new Error('Expected next() called for editor on posts route');
  console.log('  1e. Editor allowed to access posts route: PASSED');

  // ==========================================
  // TEST 2: Superadmin Protection & Brute Force
  // ==========================================
  console.log('\n[TEST 2] Testing User Security & Superadmin Protection...');
  const superadminUser = await userModel.findByEmail('admin@euodoo.com');
  if (!superadminUser) throw new Error('Default superadmin user not found in DB');

  const deleteCheck = await userModel.canDeleteUser(superadminUser.id);
  if (deleteCheck.canDelete) throw new Error('Security flaw: allowed deleting the only superadmin!');
  console.log('  2a. Protection of last superadmin deletion: PASSED (Blocked:', deleteCheck.message, ')');

  const demoteCheck = await userModel.canDemoteUser(superadminUser.id, 'editor');
  if (demoteCheck.canDemote) throw new Error('Security flaw: allowed demoting the only superadmin!');
  console.log('  2b. Protection of last superadmin demotion: PASSED (Blocked:', demoteCheck.message, ')');

  // ==========================================
  // TEST 3: Settings Middleware & WhatsApp Injector
  // ==========================================
  console.log('\n[TEST 3] Testing settingsMiddleware...');
  const formattedPhone = formatWhatsAppNumber('0812-3456-7890');
  if (formattedPhone !== '6281234567890') throw new Error(`Expected 6281234567890, got ${formattedPhone}`);
  console.log('  3a. formatWhatsAppNumber("0812-3456-7890") ->', formattedPhone, ': PASSED');

  const mockSettingsReq = {};
  const mockSettingsRes = { locals: {} };
  await settingsMiddleware(mockSettingsReq, mockSettingsRes, () => {});
  const injectedSettings = mockSettingsRes.locals.settings;

  if (!injectedSettings || !injectedSettings.whatsapp_url) {
    throw new Error('whatsapp_url was not generated in settings');
  }
  if (!injectedSettings.whatsapp_button_theme) {
    throw new Error('whatsapp_button_theme was not set');
  }
  console.log('  3b. WhatsApp floating button URL generated:', injectedSettings.whatsapp_url);
  console.log('  3c. WhatsApp floating button theme:', injectedSettings.whatsapp_button_theme, ': PASSED');
  console.log('  3d. Office address injected:', injectedSettings.office_address ? 'OK' : 'MISSING');

  // ==========================================
  // TEST 4: Dynamic SEO Middleware & JSON-LD
  // ==========================================
  console.log('\n[TEST 4] Testing seoMiddleware...');
  const mockSeoReq = {
    cookies: { euodoo_lang: 'id' },
    protocol: 'https',
    get: () => 'euodoo.co.id',
    originalUrl: '/',
    headers: {}
  };
  const mockSeoRes = { locals: {} };
  seoMiddleware(mockSeoReq, mockSeoRes, () => {});

  const seo = mockSeoRes.locals.seo;
  if (!seo || !seo.canonicalUrl || !seo.alternateUrls) {
    throw new Error('SEO data or alternate URLs not initialized');
  }
  console.log('  4a. Canonical URL:', seo.canonicalUrl);
  console.log('  4b. Alternate URLs ID:', seo.alternateUrls.id, '| EN:', seo.alternateUrls.en);

  const jsonLdOutput = seo.renderJsonLd();
  if (!jsonLdOutput.includes('Organization') || !jsonLdOutput.includes('PT Euodoo')) {
    throw new Error('Organization JSON-LD schema was not rendered properly on homepage');
  }
  console.log('  4c. JSON-LD Organization schema generated: PASSED');

  console.log('\n--- ALL MODUL 10 TESTS PASSED SUCCESSFULLY! ---');
  process.exit(0);
}

runModul10Tests().catch(err => {
  console.error('\nMODUL 10 TEST FAILED:', err);
  process.exit(1);
});
