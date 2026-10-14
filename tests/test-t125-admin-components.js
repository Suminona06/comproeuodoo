import assert from 'assert';
import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  console.log('=== TEST T-125: STANDARISASI KOMPONEN ADMIN CMS TENTANG KAMI ===\n');

  const filePath = path.join(__dirname, '../views/admin/about/index.ejs');
  const template = fs.readFileSync(filePath, 'utf8');

  // 1. Verify EJS template compiles cleanly
  console.log('[1] Verifying EJS template compilation...');
  assert.doesNotThrow(() => {
    ejs.compile(template, { filename: filePath });
  }, 'Template must compile without syntax errors');
  console.log('  -> views/admin/about/index.ejs compiles with ZERO syntax errors.\n');

  // 2. Verify badge-status usage in stats, timeline, and gallery tables
  console.log('[2] Verifying badge-status classes in tables...');
  assert.ok(template.includes('<span class="badge-status active">Aktif</span>'), 'Must use .badge-status.active');
  assert.ok(template.includes('<span class="badge-status inactive">Nonaktif</span>'), 'Must use .badge-status.inactive');
  assert.ok(!template.includes('<span class="badge badge-success" style="font-size: 11px;">Aktif</span>'), 'Old inline badge-success must be removed');
  assert.ok(!template.includes('color: #64748b;">Nonaktif</span>'), 'Old inline styled nonaktif badge must be removed');
  console.log('  -> Badge status classes standardized to .badge-status.active / inactive.\n');

  // 3. Verify action buttons and wrapper
  console.log('[3] Verifying .btn-action and .table-actions...');
  assert.ok(template.includes('class="btn-action btn-action-edit"'), 'Edit buttons must use .btn-action.btn-action-edit');
  assert.ok(template.includes('class="btn-action btn-action-delete"'), 'Delete buttons must use .btn-action.btn-action-delete');
  assert.ok(template.includes('class="table-actions"'), 'Action wrappers must use .table-actions');

  // Check that no old button styling remains in action wrappers
  assert.ok(!template.includes('class="btn btn-secondary btn-sm" style="padding: 4px 8px;"'), 'Old styled secondary buttons must be removed');
  assert.ok(!template.includes('class="btn btn-danger btn-sm" style="padding: 4px 8px;"'), 'Old styled danger buttons must be removed');
  assert.ok(!template.includes('display: inline-flex; align-items: center; gap: 6px;'), 'Old inline wrapper must be removed');
  console.log('  -> Action buttons and wrappers standardized to .btn-action and .table-actions.\n');

  // 4. Verify that functional handlers are intact
  console.log('[4] Verifying onclick handlers and attributes...');
  assert.ok(template.includes('openStatsModal'), 'openStatsModal onclick handler must be preserved');
  assert.ok(template.includes('openTimelineModal'), 'openTimelineModal onclick handler must be preserved');
  assert.ok(template.includes('openGalleryModal'), 'openGalleryModal onclick handler must be preserved');
  assert.ok(template.includes('confirmDeleteAboutItem'), 'confirmDeleteAboutItem onclick handler must be preserved');
  console.log('  -> All functional handlers and data attributes verified.\n');

  console.log('=== ALL TESTS FOR T-125 PASSED SUCCESSFULLY! ===');
}

runTest().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
