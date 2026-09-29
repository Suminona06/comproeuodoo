import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { pool } from '../../config/database.js';
import logger from '../../utils/logger.js';

dotenv.config();

async function runSeed() {
  logger.info('Starting database seeding...');

  try {
    // 1. Seed Default Admin User
    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@euodoo.com';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'AdminEuodoo2026!';
    const adminName = process.env.ADMIN_DEFAULT_NAME || 'Super Administrator';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, failed_attempts, locked_until)
       VALUES (?, ?, ?, 'super_admin', 0, NULL)
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         role = 'super_admin',
         failed_attempts = 0,
         locked_until = NULL`,
      [adminEmail, passwordHash, adminName]
    );
    logger.info(`[SEED] Admin account seeded: ${adminEmail}`);

    // 2. Seed Default Settings
    const defaultSettings = [
      { key: 'company_name', value: 'PT Euodoo' },
      { key: 'company_tagline_id', value: 'Presisi Manufaktur Plastik Berkualitas Tinggi' },
      { key: 'company_tagline_en', value: 'High Precision Industrial Plastic Manufacturing' },
      { key: 'company_phone', value: '(021) 555-0199' },
      { key: 'company_email', value: 'info@euodoo.com' },
      { key: 'company_address', value: 'Kawasan Industri Terpadu, Blok B-12, Jawa Barat, Indonesia' },
      { key: 'whatsapp_number', value: '6281234567890' },
      {
        key: 'whatsapp_default_message',
        value: 'Halo PT Euodoo, saya ingin berkonsultasi mengenai permintaan penawaran (RFQ) manufaktur produk plastik.'
      },
      {
        key: 'meta_description_id',
        value: 'PT Euodoo memproduksi komponen plastik presisi tinggi dengan teknologi injection dan blow molding untuk sektor otomotif, kemasan industri, dan FMCG.'
      },
      {
        key: 'meta_description_en',
        value: 'PT Euodoo manufactures high-precision plastic components using injection and blow molding for automotive, industrial packaging, and FMCG sectors.'
      }
    ];

    for (const setting of defaultSettings) {
      await pool.query(
        `INSERT INTO settings (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [setting.key, setting.value]
      );
    }
    logger.info(`[SEED] Default settings seeded (${defaultSettings.length} entries).`);

    // 3. Seed Initial Categories
    const defaultCategories = [
      {
        name_id: 'Injection Molding Komponen Presisi',
        name_en: 'Precision Injection Molded Components',
        slug: 'injection-molding',
        description_id: 'Pencetakan komponen plastik presisi tinggi untuk sektor otomotif, elektronik, dan industri umum.',
        description_en: 'High-precision plastic component molding for automotive, electronics, and general industries.',
        sort_order: 1
      },
      {
        name_id: 'Blow Molding Kemasan Industri',
        name_en: 'Industrial Blow Molded Packaging',
        slug: 'blow-molding',
        description_id: 'Produksi wadah jerigen, botol kimia HDPE/PET, dan drum cairan kimia berdaya tahan tinggi.',
        description_en: 'Production of jerrycans, HDPE/PET chemical bottles, and high-durability chemical liquid containers.',
        sort_order: 2
      },
      {
        name_id: 'Custom Tooling & Desain Cetakan',
        name_en: 'Custom Tooling & Mold Design',
        slug: 'custom-tooling',
        description_id: 'Layanan desain mold CAD/CAM dan fabrikasi cetakan spesifik sesuai kebutuhan proyek mitra.',
        description_en: 'CAD/CAM mold design and custom tooling fabrication tailored to client project requirements.',
        sort_order: 3
      }
    ];

    for (const cat of defaultCategories) {
      await pool.query(
        `INSERT INTO categories (name_id, name_en, slug, description_id, description_en, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name_id = VALUES(name_id),
           name_en = VALUES(name_en),
           description_id = VALUES(description_id),
           description_en = VALUES(description_en),
           sort_order = VALUES(sort_order)`,
        [cat.name_id, cat.name_en, cat.slug, cat.description_id, cat.description_en, cat.sort_order]
      );
    }
    logger.info(`[SEED] Default categories seeded (${defaultCategories.length} categories).`);

    // 4. Seed Initial Capabilities
    const defaultCapabilities = [
      {
        title_id: 'Lini Mesin Injection Servo Elektrik',
        title_en: 'Electric Servo Injection Machine Line',
        machine_type: 'Injection Molding (80 Ton - 850 Ton)',
        capacity: '500.000 unit / bulan',
        description_id: 'Pencetakan berkecepatan tinggi dengan toleransi dimensi mikro dan efisiensi konsumsi daya listrik.',
        description_en: 'High-speed molding with micro dimension tolerance and optimal power efficiency.',
        sort_order: 1,
        is_active: 1
      },
      {
        title_id: 'Lini Mesin Extrusion Blow Molding',
        title_en: 'Extrusion Blow Molding Machine Line',
        machine_type: 'Blow Molding (50ml - 30 Liter)',
        capacity: '300.000 unit / bulan',
        description_id: 'Produksi botol dan jerigen dengan ketebalan dinding presisi dan uji kebocoran otomatis.',
        description_en: 'Production of bottles and jerrycans with precise wall distribution and automated leak testing.',
        sort_order: 2,
        is_active: 1
      },
      {
        title_id: 'Laboratorium Uji Mutu & Quality Assurance',
        title_en: 'Quality Assurance & Testing Laboratory',
        machine_type: 'Optical CMM & Melt Flow Indexer',
        capacity: 'Inspeksi 100% per batch produksi',
        description_id: 'Pengukuran dimensi digital dan uji ketahanan benturan sesuai standar sertifikasi mutu.',
        description_en: 'Digital dimensional inspection and impact resistance testing compliant with quality standards.',
        sort_order: 3,
        is_active: 1
      }
    ];

    for (const cap of defaultCapabilities) {
      await pool.query(
        `INSERT INTO capabilities (title_id, title_en, machine_type, capacity, description_id, description_en, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cap.title_id,
          cap.title_en,
          cap.machine_type,
          cap.capacity,
          cap.description_id,
          cap.description_en,
          cap.sort_order,
          cap.is_active
        ]
      );
    }
    logger.info(`[SEED] Default capabilities seeded (${defaultCapabilities.length} capabilities).`);

    // 5. Seed Initial Hero Banner
    await pool.query(
      `INSERT INTO banners (title_id, title_en, subtitle_id, subtitle_en, media_type, file_url, link_url, sort_order, is_active)
       VALUES (?, ?, ?, ?, 'image', '/images/hero-factory-precision.webp', '/contact', 1, 1)`,
      [
        'Solusi Rekayasa Komponen dan Kemasan Plastik Industri Berstandar Internasional',
        'High-Standard Engineering Solutions for Industrial Plastic Components and Packaging',
        'Teknologi injection dan blow molding berpresisi tinggi untuk memenuhi standar ketat manufaktur global.',
        'High-precision injection and blow molding technology meeting rigorous global manufacturing standards.'
      ]
    );
    logger.info('[SEED] Default hero banner seeded.');

    logger.info('Database seeding completed successfully.');
  } catch (err) {
    logger.error('Error during database seeding:', { message: err.message });
    throw err;
  } finally {
    await pool.end();
  }
}

runSeed().catch(err => {
  logger.error('Seed process terminated with error:', { message: err.message });
  process.exit(1);
});
