import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// File atau direktori hasil refaktor yang wajib zero-error
const DEFAULT_STRICT_PATHS = [
  'views/admin/settings/',
  'views/admin/403.ejs',
  'views/admin/login.ejs',
  'views/admin/change-password.ejs',
  'views/admin/product-categories/',
  'views/admin/post-categories/',
  'views/admin/users/'
];

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

function lintLine(filePath, relativePath, line, lineNum, isStrict) {
  const issues = [];
  const sev = isStrict ? 'ERROR' : 'WARN';

  // 1. Inline style
  if (/style\s*=\s*["']/i.test(line)) {
    issues.push({ line: lineNum, sev, rule: 'no-inline-style', msg: 'Dilarang menggunakan atribut style="..." inline.' });
  }

  // 2. Hex colors
  const hexMatches = line.match(/#(?:[0-9a-fA-F]{3,4}){1,2}\b/g);
  if (hexMatches) {
    issues.push({ line: lineNum, sev, rule: 'no-raw-hex', msg: `Dilarang menggunakan kode warna hex langsung (${hexMatches.join(', ')}). Gunakan token CSS.` });
  }

  // 3. Inline script tag without src
  if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(line)) {
    issues.push({ line: lineNum, sev, rule: 'no-inline-script', msg: 'Dilarang menggunakan tag <script> inline. Pindahkan ke berkas JS eksternal.' });
  }

  // 4. HTML comments (skip conditional comments <!--[if)
  if (/<!--(?!\[if)[\s\S]*?-->/i.test(line) || /<!--(?!\[if)/.test(line)) {
    issues.push({ line: lineNum, sev, rule: 'no-html-comment', msg: 'Dilarang menggunakan komentar HTML <!-- ... -->. Hapus komentar di template frontend.' });
  }

  // 5. Inline event handlers
  if (/\bon[a-z]+\s*=\s*["']/i.test(line)) {
    issues.push({ line: lineNum, sev, rule: 'no-inline-handler', msg: 'Dilarang menggunakan inline handler on*=. Gunakan addEventListener.' });
  }

  return issues;
}

function runLint() {
  const args = process.argv.slice(2);
  const targetArg = args.find(a => !a.startsWith('--'));
  const isAllStrict = args.includes('--strict-all');
  
  let strictPaths = [...DEFAULT_STRICT_PATHS];
  const strictIndex = args.indexOf('--strict');
  if (strictIndex !== -1 && args[strictIndex + 1]) {
    strictPaths = args[strictIndex + 1].split(',').map(s => s.trim());
  }

  let ejsFiles = getFiles(path.join(rootDir, 'views'), '.ejs');
  let cssFiles = getFiles(path.join(rootDir, 'public', 'css'), '.css')
    .filter(f => !f.endsWith('tokens.css') && !f.includes('/vendor/'));

  if (targetArg) {
    const fullTarget = path.resolve(rootDir, targetArg);
    ejsFiles = ejsFiles.filter(f => f.startsWith(fullTarget));
    cssFiles = cssFiles.filter(f => f.startsWith(fullTarget));
    // Jika target spesifik diberikan, jadikan strict secara default
    strictPaths.push(targetArg.replace(/\\/g, '/'));
  }

  let totalErrors = 0;
  let totalWarnings = 0;
  const allIssues = [];

  for (const filePath of ejsFiles) {
    const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
    const isStrict = isAllStrict || strictPaths.some(p => relPath.startsWith(p) || relPath === p);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const issues = lintLine(filePath, relPath, line, lineNum, isStrict);
      if (issues.length > 0) {
        issues.forEach(iss => {
          if (iss.sev === 'ERROR') totalErrors++;
          else totalWarnings++;
          allIssues.push({ file: relPath, ...iss });
        });
      }
    });
  }

  for (const filePath of cssFiles) {
    const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
    const isStrict = isAllStrict || strictPaths.some(p => relPath.startsWith(p) || relPath === p);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const hexMatches = line.match(/#(?:[0-9a-fA-F]{3,4}){1,2}\b/g);
      if (hexMatches) {
        const sev = isStrict ? 'ERROR' : 'WARN';
        if (sev === 'ERROR') totalErrors++;
        else totalWarnings++;
        allIssues.push({
          file: relPath,
          line: lineNum,
          sev,
          rule: 'no-raw-hex-css',
          msg: `Warna hex langsung ditemukan (${hexMatches.join(', ')}). Rujuk ke token CSS di tokens.css.`
        });
      }
    });
  }

  if (allIssues.length > 0) {
    console.log(`\n=== HASIL LINT:VIEWS (${allIssues.length} temuan) ===\n`);
    // Tampilkan 40 temuan pertama jika terlalu banyak
    const displayList = allIssues.slice(0, 40);
    for (const item of displayList) {
      const color = item.sev === 'ERROR' ? '\x1b[31m[ERROR]\x1b[0m' : '\x1b[33m[WARN]\x1b[0m';
      console.log(`${item.file}:${item.line} - ${color} (${item.rule}) ${item.msg}`);
    }
    if (allIssues.length > 40) {
      console.log(`... dan ${allIssues.length - 40} temuan lainnya.`);
    }
  }

  console.log(`\nRingkasan: ${totalErrors} error, ${totalWarnings} warning.`);

  if (totalErrors > 0) {
    console.error(`\x1b[31mLint Views GAGAL: Ditemukan ${totalErrors} error pada berkas berstatus strict.\x1b[0m\n`);
    process.exit(1);
  } else {
    console.log(`\x1b[32mLint Views LULUS: 0 error pada berkas terverifikasi.\x1b[0m\n`);
    process.exit(0);
  }
}

runLint();
