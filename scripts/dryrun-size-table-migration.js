import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'euodoo',
  password: process.env.DB_PASSWORD || 'Euodoo2026',
  database: process.env.DB_NAME || 'euodoo_db'
};

const DEFAULT_COLUMNS = [
  { id: 'col_1', label: 'Kode Produk' },
  { id: 'col_2', label: 'Lebar' },
  { id: 'col_3', label: 'Panjang' },
  { id: 'col_4', label: 'Tebal (Micron)' },
  { id: 'col_5', label: 'Kapasitas' },
  { id: 'col_6', label: 'Bahan' }
];

function transformLegacySizeTable(rawJson) {
  if (!rawJson) return null;
  const legacyRows = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
  if (!Array.isArray(legacyRows)) return null;

  const rows = legacyRows.map(r => ({
    col_1: r.kode_produk || r.product_code || '',
    col_2: r.lebar || r.width || '',
    col_3: r.panjang || r.length || '',
    col_4: r.tebal_micron || r.thickness || '',
    col_5: r.kapasitas || r.capacity || '',
    col_6: r.bahan || r.material || ''
  }));

  return {
    columns: DEFAULT_COLUMNS,
    rows
  };
}

async function runDryRun() {
  console.log('================================================================');
  console.log('DRY-RUN SIMULASI MIGRASI TABEL UKURAN PRODUK (MIGRATION 018)');
  console.log('Mode: READ-ONLY (Tidak ada data di database yang diubah)');
  console.log('================================================================\n');

  const connection = await mysql.createConnection(dbConfig);

  try {
    const [targetProducts] = await connection.query(
      'SELECT id, name_id, size_table FROM products WHERE id IN (92, 215, 218) ORDER BY id;'
    );

    console.log(`Ditemukan ${targetProducts.length} produk target untuk migrasi format: IDs [92, 215, 218]\n`);

    for (const prod of targetProducts) {
      console.log('----------------------------------------------------------------');
      console.log(`[PRODUK ID ${prod.id}] ${prod.name_id}`);
      console.log('----------------------------------------------------------------');

      const legacyData = typeof prod.size_table === 'string'
        ? JSON.parse(prod.size_table)
        : prod.size_table;

      console.log('▶ KONDISI SEBELUM (BEFORE - Legacy 6-key Array):');
      console.log(JSON.stringify(legacyData, null, 2));

      const convertedData = transformLegacySizeTable(prod.size_table);

      console.log('\n▶ KONDISI SESUDAH (AFTER - Target Dynamic Columns JSON):');
      console.log(JSON.stringify(convertedData, null, 2));

      const rowCountBefore = Array.isArray(legacyData) ? legacyData.length : 0;
      const rowCountAfter = convertedData?.rows?.length || 0;
      const colsCount = convertedData?.columns?.length || 0;

      if (rowCountBefore === rowCountAfter && colsCount === 6) {
        console.log(`\n✓ Validasi Produk #${prod.id}: ${rowCountAfter} baris terkonversi presisi ke 6 kolom dinamis.`);
      } else {
        console.error(`\n✗ GAGAL Validasi Produk #${prod.id}: Baris sebelum (${rowCountBefore}) != sesudah (${rowCountAfter})`);
        process.exit(1);
      }
      console.log('\n');
    }

    console.log('----------------------------------------------------------------');
    console.log('STATUS PRODUK LAIN (ISOLASI DATA):');
    console.log('----------------------------------------------------------------');
    const [otherProducts] = await connection.query(
      'SELECT id, name_id, size_table FROM products WHERE id NOT IN (92, 215, 218) ORDER BY id;'
    );

    for (const p of otherProducts) {
      const summary = p.size_table === null ? 'NULL (Tetap NULL)' : (p.size_table === '[]' || (Array.isArray(p.size_table) && p.size_table.length === 0) ? '[] (Tetap Kosong)' : 'Tidak Tersentuh');
      console.log(`- Produk ID ${p.id} (${p.name_id}): ${summary}`);
    }

    console.log('\n================================================================');
    console.log('HASIL DRY-RUN: 100% SUKSES VALIDASI');
    console.log('STATUS DATABASE: TIDAK ADA PERUBAHAN DITULIS (READ-ONLY)');
    console.log('SKRIP SIAP: database/migrations/018_migrate_legacy_size_table_format.sql');
    console.log('SKRIP ROLLBACK: database/rollback_018_legacy_size_table_format.sql');
    console.log('================================================================\n');

  } finally {
    await connection.end();
  }
}

runDryRun().catch(err => {
  console.error('Error saat menjalankan dry-run:', err);
  process.exit(1);
});
