import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { pool } from '../../config/database.js';
import logger from '../../utils/logger.js';

dotenv.config();

async function runSeed() {
  logger.info('Starting database seeding with authentic Company Profile data...');

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

    // 2. Seed Default Settings from Company Profile PDF
    const defaultSettings = [
      { key: 'company_name', value: 'PT. EUODOO' },
      { key: 'company_tagline_id', value: 'Semangat Membangun Kualitas Hidup yang Lebih Baik' },
      { key: 'company_tagline_en', value: 'Passion To Build A Better Quality of Life' },
      { key: 'company_phone', value: '+6222-6012519' },
      { key: 'company_email', value: 'info@euodoo.com' },
      { key: 'company_address', value: 'Jl. Paralon II No. 21 Cijerah Bandung 40214 - Indonesia' },
      { key: 'whatsapp_number', value: '6281234567890' },
      {
        key: 'whatsapp_default_message',
        value: 'Halo PT EUODOO, saya ingin berkonsultasi mengenai pemesanan kantong plastik ramah lingkungan (100% degradable).'
      },
      {
        key: 'meta_description_id',
        value: 'PT. EUODOO memproduksi kantong plastik HDPE dan LLDPE 100% degradable ramah lingkungan sejak 1990 untuk retail modern, sektor industri, dan pasar tradisional.'
      },
      {
        key: 'meta_description_en',
        value: 'PT. Euodoo manufactures 100% degradable HDPE and LLDPE eco-friendly plastic bags since 1990 for retailers, industries, and traditional markets.'
      },
      { key: 'about_founded_year', value: '1990' },
      { key: 'about_former_names', value: 'PT. Sahabat Baru & PT. Pelita Baru' },
      { key: 'about_history_title_id', value: 'Latar Belakang & Sejarah Perusahaan' },
      { key: 'about_history_title_en', value: 'Company Background & History' },
      {
        key: 'about_history_id',
        value: 'PT. EUODOO adalah perusahaan yang bergerak di bidang manufaktur perdagangan kantong plastik HDPE dan LLDPE. Pabrik produksi kami terletak di Cigondewah, Bandung, Jawa Barat - Indonesia. Perusahaan ini didirikan pada tahun 1990 yang akrab dikenal sebagai PT. Sahabat Baru atau PT. Pelita Baru. Usaha kami dimulai dari melayani permintaan kantong plastik HDPE untuk pasar tradisional. Dalam perkembangannya, kami memperluas kapasitas produksi dan melayani kebutuhan kantong plastik untuk supermarket, toko retail modern, serta berbagai sektor industri dengan komitmen penuh pada penyediaan kantong plastik ramah lingkungan (100% degradable).'
      },
      {
        key: 'about_history_en',
        value: 'PT. Euodoo manufactures and trades HDPE and LLDPE plastic bags. Our production plant is located in Cigondewah, Bandung, West Java, Indonesia. The company was incorporated in 1990, familiarly known as PT Sahabat Baru & PT Pelita Baru. We entered the business by serving HDPE plastic bag demands for traditional markets. Over the years, we expanded production to serve major supermarkets, modern retail stores, and specialized industrial sectors with an uncompromising commitment to 100% degradable plastic bags.'
      },
      {
        key: 'about_vision_id',
        value: 'Menjadi perusahaan yang memberi dampak pada perubahan kualitas hidup yang lebih baik.'
      },
      {
        key: 'about_vision_en',
        value: 'Continuous contribution to improve quality of life.'
      },
      {
        key: 'about_mission_id',
        value: 'Membina moral dan karakter positif\nMenggali potensi manusia\nMengembangkan profesionalisme'
      },
      {
        key: 'about_mission_en',
        value: 'Nurture positive morality and character building\nUnleash human potential\nDevelop professionalism'
      },
      {
        key: 'about_slogan_id',
        value: 'Semangat membangun kualitas hidup yang lebih baik.'
      },
      {
        key: 'about_slogan_en',
        value: 'Passion to build a better quality of life in our community.'
      },
      {
        key: 'about_motto_id',
        value: 'Perlakukan orang lain sama seperti kita ingin diperlakukan.\nBukan benar atau salah tetapi respon.\nKeterbukaan adalah awal dari pemulihan.'
      },
      {
        key: 'about_motto_en',
        value: 'Treat others as we want to be treated.\nEncourage positive, helpful responses and discourage fault finding.\nRevealing your feeling is the start of healing.'
      },
      {
        key: 'about_goal_id',
        value: 'Agar setiap pribadi dapat mencapai kemaksimalan dalam hidupnya.'
      },
      {
        key: 'about_goal_en',
        value: 'To help everyone reach their full potential.'
      },
      {
        key: 'about_eco_statement_id',
        value: 'Mari selamatkan bumi kita! Kami memproduksi dan menyuplai 100% kantong plastik ramah lingkungan (degradable) untuk pelanggan kami.'
      },
      {
        key: 'about_eco_statement_en',
        value: 'Let\'s save our earth! We supply 100% degradable plastic bags to our valuable customers.'
      },
      {
        key: 'about_office_address',
        value: 'Karindra Building Jl. Palmerah Selatan 30 A Suite 02 - 07, Jakarta Pusat 10270'
      },
      { key: 'about_office_phone', value: '+6221-53668626' },
      { key: 'about_office_fax', value: '+6221-53668648' },
      {
        key: 'about_factory_address',
        value: 'Jl. Paralon II No. 21 Cijerah Bandung 40214 - Indonesia'
      },
      { key: 'about_factory_phone', value: '+6222-6012519' },
      { key: 'about_factory_fax', value: '+6222-6074730' },
      { key: 'about_image_url', value: '/images/factory-plant.webp' }
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

    // 3. Seed Initial Categories based on authentic Segments from Company Profile
    const defaultCategories = [
      {
        name_id: 'Retail Modern & Pedagang Eceran',
        name_en: 'Retailers & Modern Shopping Bags',
        slug: 'retailers',
        description_id: 'Tas belanja desain khusus untuk supermarket, butik, kafe, dan restoran. Meliputi soft loop handle bags, patch handle bags, dan rolls.',
        description_en: 'Custom designed shopping bags for supermarkets, boutiques, cafes, and restaurants, including soft loop, patch handle, and roll bags.',
        sort_order: 1
      },
      {
        name_id: 'Kemasan Sektor Industri',
        name_en: 'Industrial Specialized Packaging',
        slug: 'industrials',
        description_id: 'Kemasan komponen elektronika anti statis, cover pelindung jok otomotif, dan kemasan food grade dengan standar kendali mutu ketat.',
        description_en: 'Anti-static electronic component packaging, automobile seat covers, and food grade packaging with strict quality compliance.',
        sort_order: 2
      },
      {
        name_id: 'Pasar Tradisional & Daur Ulang',
        name_en: 'Traditional Market & Recycled Bags',
        slug: 'traditional-market',
        description_id: 'Kantong plastik sampah, recycle t-shirt bag, bottom sealed HDPE dan LDPE untuk pasar tradisional dengan merek terpercaya PB dan Berkah.',
        description_en: 'Garbage bags, recycled t-shirt bags, and bottom sealed HDPE/LDPE bags for traditional markets, under trusted brands PB and Berkah.',
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

    // 4. Seed Initial Capabilities based on Manufacturing Plant
    const defaultCapabilities = [
      {
        title_id: 'Lini Mesin Blowing Ekstrusi Film HDPE & LLDPE',
        title_en: 'HDPE & LLDPE Film Blown Extrusion Line',
        machine_type: 'Film Blowing Extruder',
        capacity: '500 Ton / bulan',
        description_id: 'Ekstrusi film plastik presisi tinggi dengan teknologi pencampuran aditif degradable OXIUM untuk kantong ramah lingkungan.',
        description_en: 'High-precision plastic film extrusion integrating OXIUM degradable additives for eco-friendly bags.',
        sort_order: 1,
        is_active: 1
      },
      {
        title_id: 'Lini Cutting, Sealing & Bag Making Otomatis',
        title_en: 'Automated Cutting, Sealing & Bag Converting Line',
        machine_type: 'Bag Making & Sealing Machines',
        capacity: '10.000.000 lembar / bulan',
        description_id: 'Pembuatan kantong soft loop, patch handle, roll bags, dan bottom seal dengan daya tahan beban teruji.',
        description_en: 'Fabrication of soft loop, patch handle, rolls, and bottom sealed bags with verified weight endurance.',
        sort_order: 2,
        is_active: 1
      },
      {
        title_id: 'Laboratorium Uji Mutu & Standar Ekolabel Indonesia',
        title_en: 'Quality Testing & Indonesian Eco-Label Laboratory',
        machine_type: 'Tensile Tester & Degradability Verification',
        capacity: 'Inspeksi 100% per batch produksi',
        description_id: 'Pengujian kekuatan tarik, drop test, dan kepatuhan standar mutu SNI 7188.7:2011 dan Green Label Indonesia InSWA.',
        description_en: 'Tensile strength, drop testing, and compliance verification with SNI 7188.7:2011 and InSWA Green Label Indonesia.',
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
        'Manufaktur Kantong Plastik Ramah Lingkungan 100% Degradable Sejak 1990',
        '100% Degradable Eco-Friendly Plastic Bag Manufacturing Since 1990',
        'Menyediakan kantong plastik belanja retail modern, kemasan spesifikasi industri, dan pasar tradisional dengan standar mutu terverifikasi.',
        'Supplying modern retail shopping bags, industrial-grade packaging, and traditional market bags with verified quality standards.'
      ]
    );
    logger.info('[SEED] Default hero banner seeded.');

    logger.info('Database seeding completed successfully with authentic Company Profile data.');
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
