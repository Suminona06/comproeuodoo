import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { pool } from '../../config/database.js';
import logger from '../../utils/logger.js';

dotenv.config();

export async function runAboutHistoryGallerySeed() {
  logger.info('Starting seeding for About Page Gallery, History Stats, Timeline, and Headers (T-119)...');

  try {
    // 1. Seed Settings Headers
    const defaultSettings = [
      { key: 'about_gallery_kicker_id', value: 'Galeri Kami' },
      { key: 'about_gallery_kicker_en', value: 'Our Gallery' },
      { key: 'about_gallery_title_id', value: 'Di Dalam Operasional Kami' },
      { key: 'about_gallery_title_en', value: 'Inside Our Operations' },
      {
        key: 'about_gallery_body_id',
        value: 'Sepintas aktivitas produksi, lini ekstrusi film mutakhir, pengujian laboratorium, dan standar kebersihan manufaktur PT EUODOO.'
      },
      {
        key: 'about_gallery_body_en',
        value: 'A glimpse of our daily manufacturing, modern blown film extrusion lines, laboratory QA, and clean industrial standards at PT EUODOO.'
      },
      { key: 'about_story_kicker_id', value: 'Kisah Kami' },
      { key: 'about_story_kicker_en', value: 'Our Story' },
      { key: 'vision_image_url', value: '' },
      { key: 'mission_image_url', value: '' }
    ];

    for (const item of defaultSettings) {
      await pool.query(
        `INSERT INTO settings (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = IF(setting_value IS NULL OR setting_value = '', VALUES(setting_value), setting_value)`,
        [item.key, item.value]
      );
    }
    logger.info('[SEED] About settings headers verified/seeded.');

    // 2. Seed 7 Gallery Slides from public/images/
    const initialSlides = [
      {
        image_url: '/images/hero-factory.jpg',
        category_id: 'FASILITAS MANUFAKTUR',
        category_en: 'MANUFACTURING PLANT',
        title_id: 'Lini Produksi & Pergudangan Modern',
        title_en: 'Modern Production Lines & Warehouse',
        subtitle_id: 'Fasilitas terpadu berkapasitas tinggi di kawasan industri Bandung.',
        subtitle_en: 'High-capacity integrated plant in Bandung industrial area.',
        sort_order: 1,
        is_active: 1
      },
      {
        image_url: '/images/segment-industrial.jpg',
        category_id: 'TEKNOLOGI EKSTRUSI',
        category_en: 'EXTRUSION TECHNOLOGY',
        title_id: 'Ekstrusi Film Presisi Tinggi',
        title_en: 'High-Precision Blown Film Extrusion',
        subtitle_id: 'Mesin ekstrusi multi-layer modern dengan toleransi ketebalan mikro yang presisi.',
        subtitle_en: 'Modern multi-layer extrusion with tight micron thickness tolerance.',
        sort_order: 2,
        is_active: 1
      },
      {
        image_url: '/images/segment-retail.jpg',
        category_id: 'PRODUK RITEL',
        category_en: 'RETAIL SOLUTIONS',
        title_id: 'Kemasan Kantong Plastik Ritel',
        title_en: 'Retail Plastic Bag Packaging Solutions',
        subtitle_id: 'Pasokan terpercaya untuk jaringan ritel modern, supermarket, dan department store.',
        subtitle_en: 'Reliable supplies for modern supermarkets and retail stores across Indonesia.',
        sort_order: 3,
        is_active: 1
      },
      {
        image_url: '/images/segment-sustainability.jpg',
        category_id: 'INOVASI RAMAH LINGKUNGAN',
        category_en: 'ECO INNOVATION',
        title_id: 'Formulasi Degradable OXIUM',
        title_en: 'Certified OXIUM Degradable Formulas',
        subtitle_id: 'Teknologi ramah lingkungan tersertifikasi SNI dan ASTM yang aman bagi tanah.',
        subtitle_en: 'Certified degradable technology under official SNI and ASTM standards.',
        sort_order: 4,
        is_active: 1
      },
      {
        image_url: '/images/segment-traditional.jpg',
        category_id: 'KEMITRAAN PASAR',
        category_en: 'MARKET PARTNERSHIP',
        title_id: 'Jaringan Grosir & Pasar Tradisional',
        title_en: 'Wholesale Hubs & Traditional Markets',
        subtitle_id: 'Mendukung ribuan pedagang dan pelaku UMKM dengan pasokan kantong konsisten.',
        subtitle_en: 'Supporting thousands of MSMEs and merchants with reliable supply.',
        sort_order: 5,
        is_active: 1
      },
      {
        image_url: '/images/post-school-recycling.jpg',
        category_id: 'EDUKASI LINGKUNGAN',
        category_en: 'ECO EDUCATION',
        title_id: 'Kampanye Bijak Kelola Sampah',
        title_en: 'Responsible Plastic Usage Initiatives',
        subtitle_id: 'Inisiatif sosialisasi dan edukasi pengelolaan sampah plastik sejak dini.',
        subtitle_en: 'Promoting early recycling education and responsible plastic handling.',
        sort_order: 6,
        is_active: 1
      },
      {
        image_url: '/images/post-eco-community.jpg',
        category_id: 'KEBERLANJUTAN',
        category_en: 'SUSTAINABILITY',
        title_id: 'Inisiatif Komunitas Hijau',
        title_en: 'Green Community Collaboration',
        subtitle_id: 'Komitmen bersama mitra menjaga kelestarian lingkungan bebas mikroplastik.',
        subtitle_en: 'Collaborative community programs fostering a sustainable circular ecosystem.',
        sort_order: 7,
        is_active: 1
      }
    ];

    const [existingGallery] = await pool.query('SELECT COUNT(*) as count FROM about_gallery_slides');
    if (existingGallery[0].count === 0) {
      for (const slide of initialSlides) {
        await pool.query(
          `INSERT INTO about_gallery_slides
           (image_url, category_id, category_en, title_id, title_en, subtitle_id, subtitle_en, sort_order, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            slide.image_url,
            slide.category_id,
            slide.category_en,
            slide.title_id,
            slide.title_en,
            slide.subtitle_id,
            slide.subtitle_en,
            slide.sort_order,
            slide.is_active
          ]
        );
      }
      logger.info(`[SEED] ${initialSlides.length} initial gallery slides inserted.`);
    } else {
      logger.info(`[SEED] Gallery slides already exist (${existingGallery[0].count} items). Skipping insert.`);
    }

    // 3. Seed 4 History Stats
    const initialStats = [
      {
        stat_value: '30+',
        label_id: 'Tahun Pengalaman Manufaktur',
        label_en: 'Years Manufacturing Experience',
        sort_order: 1,
        is_active: 1
      },
      {
        stat_value: '5',
        label_id: 'Merek Terdaftar & Terpercaya',
        label_en: 'Registered Trusted Brands',
        sort_order: 2,
        is_active: 1
      },
      {
        stat_value: '4',
        label_id: 'Sertifikasi Mutu & Lingkungan',
        label_en: 'Official Quality Certifications',
        sort_order: 3,
        is_active: 1
      },
      {
        stat_value: '3',
        label_id: 'Segmen Pasar Nasional',
        label_en: 'National Market Segments',
        sort_order: 4,
        is_active: 1
      }
    ];

    const [existingStats] = await pool.query('SELECT COUNT(*) as count FROM about_stats');
    if (existingStats[0].count === 0) {
      for (const stat of initialStats) {
        await pool.query(
          `INSERT INTO about_stats
           (stat_value, label_id, label_en, sort_order, is_active)
           VALUES (?, ?, ?, ?, ?)`,
          [stat.stat_value, stat.label_id, stat.label_en, stat.sort_order, stat.is_active]
        );
      }
      logger.info(`[SEED] ${initialStats.length} initial statistics inserted.`);
    } else {
      logger.info(`[SEED] Stats already exist (${existingStats[0].count} items). Skipping insert.`);
    }

    // 4. Seed 4 History Milestones (Timeline)
    const initialTimeline = [
      {
        year_label_id: '1990 — Awal Berdiri',
        year_label_en: '1990 — Inception',
        title_id: 'Kelahiran PT Sahabat Baru & PT Pelita Baru',
        title_en: 'Founding of Sahabat Baru & Pelita Baru',
        description_id:
          'Bermula dari industri rumahan manufaktur plastik di Bandung dengan komitmen menghadirkan produk berkualitas dan harga terjangkau.',
        description_en:
          'Started as a plastic manufacturing operation in Bandung committed to quality and fair value.',
        sort_order: 1,
        is_active: 1
      },
      {
        year_label_id: '2000-an — Ekspansi',
        year_label_en: '2000s — Expansion',
        title_id: 'Modernisasi Fasilitas & Kantor Jakarta',
        title_en: 'Plant Modernization & Jakarta Office',
        description_id:
          'Ekspansi kapasitas mesin converting otomatis dan pembukaan kantor pemasaran di Palmerah Jakarta untuk memperluas jangkauan ke ritel modern.',
        description_en:
          'Expanded automated converting capacity and established Jakarta sales office for modern retail.',
        sort_order: 2,
        is_active: 1
      },
      {
        year_label_id: 'Era Inovasi Hijau',
        year_label_en: 'Green Innovation Era',
        title_id: 'Pionir Plastik Ramah Lingkungan OXIUM',
        title_en: 'Pioneering OXIUM Degradable Tech',
        description_id:
          'Menjadi pionir penerapan aditif ramah lingkungan OXIUM berstandar SNI 7188.7:2011 dan US ASTM D6954 untuk mengurangi dampak sampah plastik.',
        description_en:
          'Pioneered OXIUM degradable additives compliant with SNI 7188.7:2011 and ASTM D6954 standards.',
        sort_order: 3,
        is_active: 1
      },
      {
        year_label_id: 'Kini — Keberlanjutan',
        year_label_en: 'Present — Sustainable Reach',
        title_id: 'Standar Mutu Berkelanjutan & Skala Nasional',
        title_en: 'Sustainable Quality & National Scale',
        description_id:
          'Menyatukan seluruh operasional di bawah PT EUODOO dengan kapasitas ribuan ton per tahun melayani sektor ritel, industri, dan pasar tradisional.',
        description_en:
          'Consolidating all operations under PT EUODOO, serving retail, industrial, and traditional markets nationwide.',
        sort_order: 4,
        is_active: 1
      }
    ];

    const [existingTimeline] = await pool.query('SELECT COUNT(*) as count FROM about_timeline');
    if (existingTimeline[0].count === 0) {
      for (const item of initialTimeline) {
        await pool.query(
          `INSERT INTO about_timeline
           (year_label_id, year_label_en, title_id, title_en, description_id, description_en, sort_order, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.year_label_id,
            item.year_label_en,
            item.title_id,
            item.title_en,
            item.description_id,
            item.description_en,
            item.sort_order,
            item.is_active
          ]
        );
      }
      logger.info(`[SEED] ${initialTimeline.length} initial timeline items inserted.`);
    } else {
      logger.info(`[SEED] Timeline items already exist (${existingTimeline[0].count} items). Skipping insert.`);
    }

    logger.info('[SEED] About History and Gallery seeding completed successfully.');
    return true;
  } catch (err) {
    logger.error('runAboutHistoryGallerySeed error:', { message: err.message, stack: err.stack });
    throw err;
  } finally {
    try {
      await pool.end();
    } catch (e) {}
  }
}

runAboutHistoryGallerySeed()
  .then(() => {
    console.log('Seeding completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  });

