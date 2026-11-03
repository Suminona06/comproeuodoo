import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function getNestedKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(getNestedKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getFiles(dir, ext) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      files = files.concat(getFiles(fullPath, ext));
    } else if (fullPath.endsWith(ext)) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractMissingKeys(filePath, idKeys) {
  const content = fs.readFileSync(filePath, 'utf8');
  const tKeyRegex = /\b(?:t|__)\(\s*['"]([a-zA-Z0-9_.-]+)['"]/g;
  const missing = [];
  let match;
  while ((match = tKeyRegex.exec(content)) !== null) {
    const key = match[1];
    if (!idKeys.has(key)) missing.push(key);
  }
  return missing;
}

function runAudit() {
  const idPath = path.join(rootDir, 'locales', 'id.json');
  const enPath = path.join(rootDir, 'locales', 'en.json');

  if (!fs.existsSync(idPath) || !fs.existsSync(enPath)) {
    console.error('Kamus bahasa tidak ditemukan di locales/id.json atau locales/en.json');
    process.exit(1);
  }

  const idLocale = JSON.parse(fs.readFileSync(idPath, 'utf8'));
  const enLocale = JSON.parse(fs.readFileSync(enPath, 'utf8'));

  const idKeys = new Set(getNestedKeys(idLocale));
  const enKeys = new Set(getNestedKeys(enLocale));

  console.log(`\n=== AUDIT KAMUS I18N (ID vs EN) ===`);
  console.log(`Total kunci ID: ${idKeys.size}`);
  console.log(`Total kunci EN: ${enKeys.size}`);

  let errors = 0;

  // 1. Cek asimetri kunci ID -> EN
  const missingInEn = [...idKeys].filter(k => !enKeys.has(k));
  if (missingInEn.length > 0) {
    console.error(`\n\x1b[31m[ERROR]\x1b[0m Ditemukan ${missingInEn.length} kunci ada di id.json tapi hilang di en.json:`);
    missingInEn.forEach(k => console.error(`  - ${k}`));
    errors += missingInEn.length;
  }

  // 2. Cek asimetri kunci EN -> ID
  const missingInId = [...enKeys].filter(k => !idKeys.has(k));
  if (missingInId.length > 0) {
    console.error(`\n\x1b[31m[ERROR]\x1b[0m Ditemukan ${missingInId.length} kunci ada di en.json tapi hilang di id.json:`);
    missingInId.forEach(k => console.error(`  - ${k}`));
    errors += missingInId.length;
  }

  // 3. Cek referensi t('...') di view publik
  const publicDirs = [
    path.join(rootDir, 'views', 'public'),
    path.join(rootDir, 'views', 'partials')
  ];

  let ejsFiles = [];
  publicDirs.forEach(d => {
    ejsFiles = ejsFiles.concat(getFiles(d, '.ejs'));
  });

  const missingInDict = [];
  for (const file of ejsFiles) {
    const relFile = path.relative(rootDir, file).replace(/\\/g, '/');
    const missingKeys = extractMissingKeys(file, idKeys);
    missingKeys.forEach(key => missingInDict.push({ file: relFile, key }));
  }

  if (missingInDict.length > 0) {
    console.error(`\n\x1b[31m[ERROR]\x1b[0m Kunci yang dipanggil di template view tapi tidak terdaftar di kamus:`);
    missingInDict.forEach(item => {
      console.error(`  - ${item.file}: '${item.key}'`);
    });
    errors += missingInDict.length;
  }

  console.log(`\nRingkasan Audit i18n: ${errors} error.`);

  if (errors > 0) {
    console.error(`\x1b[31mAudit i18n GAGAL: Terdeteksi ketidakcocokan kunci kamus bahasa.\x1b[0m\n`);
    process.exit(1);
  } else {
    console.log(`\x1b[32mAudit i18n LULUS: Kamus ID dan EN 100% simetris & seluruh kunci view terdaftar.\x1b[0m\n`);
    process.exit(0);
  }
}

runAudit();
