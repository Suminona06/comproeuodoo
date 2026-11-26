import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ADMIN_CSS_DIR = path.resolve(__dirname, '../../public/css/admin');

export const ADMIN_CSS_FILES = [
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

export function readAdminTokensCss() {
  return fs.readFileSync(path.join(ADMIN_CSS_DIR, 'tokens.css'), 'utf8');
}

export function readAllAdminCss() {
  return ADMIN_CSS_FILES
    .map((file) => fs.readFileSync(path.join(ADMIN_CSS_DIR, file), 'utf8'))
    .join('\n');
}
