import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const runScript = (scriptName) => {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(rootDir, 'tests', scriptName);
    const child = spawn('node', [fullPath], { stdio: 'inherit' });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Test script ${scriptName} exited with status ${code}`));
      }
    });
  });
};

async function runAllRevisiV2Tests() {
  console.log('========================================================================');
  console.log('RUNNING FULL REVISI ADMIN V2 TEST SUITE (KELOMPOK A, B, C)');
  console.log('========================================================================\n');

  console.log('>>> [PHASE 1] Executing Kelompok A (T-69, T-70, T-71, T-72)...');
  await runScript('test-revisi-admin-v2-kelompok-a.js');

  console.log('\n>>> [PHASE 2] Executing Kelompok B (T-73, T-74)...');
  await runScript('test-revisi-admin-v2-kelompok-b.js');

  console.log('\n>>> [PHASE 3] Executing Kelompok C (T-75)...');
  await runScript('test-revisi-admin-v2-kelompok-c.js');

  console.log('\n========================================================================');
  console.log('🏆 ALL REVISI ADMIN V2 TASKS (T-69 s/d T-75) PASSED 100% SUCCESSFULLY!');
  console.log('========================================================================\n');
  process.exit(0);
}

runAllRevisiV2Tests().catch((err) => {
  console.error('\n❌ REVISI ADMIN V2 TEST SUITE FAILED:', err.message);
  process.exit(1);
});
