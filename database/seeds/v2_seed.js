import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { pool } from '../../config/database.js';
import logger from '../../utils/logger.js';

dotenv.config();

async function runV2Seed() {
  logger.info('Starting database seeding v2.0 with structured entities...');

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Seed Users (Superadmin, Admin, Editor)
    logger.info('Seeding default system users with 3 role levels...');
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'AdminEuodoo2026!';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

    const defaultUsers = [
      {
        email: process.env.ADMIN_DEFAULT_EMAIL || 'admin@euodoo.com',
        full_name: process.env.ADMIN_DEFAULT_NAME || 'Super Administrator',
        role: 'superadmin'
      },
      {
        email: 'staff.admin@euodoo.com',
        full_name: 'Operations Admin',
        role: 'admin'
      },
      {
        email: 'editor@euodoo.com',
        full_name: 'Content Editor',
        role: 'editor'
      }
    ];

    for (const u of defaultUsers) {
      await connection.query(
        `INSERT INTO users (email, password_hash, full_name, role, failed_attempts, locked_until)
         VALUES (?, ?, ?, ?, 0, NULL)
         ON DUPLICATE KEY UPDATE
           full_name = VALUES(full_name),
           role = VALUES(role),
           failed_attempts = 0,
           locked_until = NULL`,
        [u.email, passwordHash, u.full_name, u.role]
      );
    }
    logger.info(`[SEED v2] Seeded ${defaultUsers.length} system users.`);

    // 2. Seed Product Categories
    logger.info('Seeding product categories...');
    const productCategories = [
      {
        name_id: 'Kantong Belanja HDPE',
        name_en: 'HDPE Shopping Bags',
        slug: 'hdpe-bags',
        description_id: 'Tas belanja plastik High-Density Polyethylene untuk supermarket, retail, dan toko modern. Kuat, tahan beban, dan 100% degradable.',
        description_en: 'High-Density Polyethylene shopping bags for supermarkets, retail, and modern shops. Strong, high load capacity, and 100% degradable.',
        sort_order: 1
      },
      {
        name_id: 'Kemasan Industri LLDPE',
        name_en: 'LLDPE Industrial Packaging',
        slug: 'lldpe-packaging',
        description_id: 'Kemasan film plastik Linear Low-Density Polyethylene untuk pelindung jok otomotif, drum liner, dan komponen elektronika anti-statis.',
        description_en: 'Linear Low-Density Polyethylene packaging films for automotive seat protectors, drum liners, and anti-static electronics.',
        sort_order: 2
      },
      {
        name_id: 'Karung Woven & Kantong PP',
        name_en: 'PP Woven Sacks & Bags',
        slug: 'pp-woven-bags',
        description_id: 'Karung anyaman Polypropylene tahan sobek dan kantong bening untuk beras, pakan ternak, dan komoditas industri.',
        description_en: 'Tear-resistant Polypropylene woven sacks and clear bags for rice, animal feed, and industrial commodities.',
        sort_order: 3
      },
      {
        name_id: 'Biodegradable & OXIUM Series',
        name_en: 'Biodegradable & OXIUM Series',
        slug: 'biodegradable-oxium',
        description_id: 'Lini kantong ramah lingkungan bersertifikasi Ekolabel Indonesia SNI 7188.7:2011 dengan akselerator degradasi OXIUM teruji.',
        description_en: 'Eco-friendly shopping bag line certified with Indonesian Eco-label SNI 7188.7:2011 with verified OXIUM degradation technology.',
        sort_order: 4
      }
    ];

    const categoryIdMap = {};
    for (const cat of productCategories) {
      await connection.query(
        `INSERT INTO product_categories (name_id, name_en, slug, description_id, description_en, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name_id = VALUES(name_id),
           name_en = VALUES(name_en),
           description_id = VALUES(description_id),
           description_en = VALUES(description_en),
           sort_order = VALUES(sort_order)`,
        [cat.name_id, cat.name_en, cat.slug, cat.description_id, cat.description_en, cat.sort_order]
      );
      const [rows] = await connection.query('SELECT id FROM product_categories WHERE slug = ?', [cat.slug]);
      if (rows.length > 0) {
        categoryIdMap[cat.slug] = rows[0].id;
      }
    }
    logger.info(`[SEED v2] Seeded ${productCategories.length} product categories.`);

    // 3. Seed Post Categories
    logger.info('Seeding post categories...');
    const postCategories = [
      {
        name_id: 'Berita Perusahaan',
        name_en: 'Company News',
        slug: 'berita-perusahaan',
        type: 'berita',
        sort_order: 1
      },
      {
        name_id: 'Industri & Keberlanjutan',
        name_en: 'Industry & Sustainability',
        slug: 'industri-keberlanjutan',
        type: 'berita',
        sort_order: 2
      },
      {
        name_id: 'Wawasan Lingkungan & OXIUM',
        name_en: 'Eco Insights & OXIUM',
        slug: 'wawasan-lingkungan',
        type: 'blog',
        sort_order: 1
      },
      {
        name_id: 'Panduan Kemasan B2B',
        name_en: 'B2B Packaging Guide',
        slug: 'panduan-kemasan-b2b',
        type: 'blog',
        sort_order: 2
      }
    ];

    const postCatIdMap = {};
    for (const pcat of postCategories) {
      await connection.query(
        `INSERT INTO post_categories (name_id, name_en, slug, type, sort_order)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name_id = VALUES(name_id),
           name_en = VALUES(name_en),
           type = VALUES(type),
           sort_order = VALUES(sort_order)`,
        [pcat.name_id, pcat.name_en, pcat.slug, pcat.type, pcat.sort_order]
      );
      const [prows] = await connection.query('SELECT id FROM post_categories WHERE slug = ?', [pcat.slug]);
      if (prows.length > 0) {
        postCatIdMap[pcat.slug] = prows[0].id;
      }
    }
    logger.info(`[SEED v2] Seeded ${postCategories.length} post categories.`);

    // 4. Seed Registered Brands (Our Brands)
    logger.info('Seeding registered brands...');
    const brands = [
      {
        name: 'Pelita Baru (PB)',
        logo_url: '/images/brands/brand-pb.webp',
        description_id: 'Merek kantong plastik terpercaya sejak 1990 untuk retail dan pasar tradisional berstandar mutu tinggi.',
        description_en: 'Trusted plastic bag brand since 1990 catering to retail and traditional markets with strict quality standards.',
        sort_order: 1,
        is_active: 1
      },
      {
        name: 'Berkah',
        logo_url: '/images/brands/brand-berkah.webp',
        description_id: 'Lini produk kantong daur ulang ramah lingkungan yang ekonomis dan memiliki kekuatan mekanik teruji.',
        description_en: 'Cost-effective recycled eco-friendly bag product line with proven mechanical strength.',
        sort_order: 2,
        is_active: 1
      },
      {
        name: 'Euodoo Eco-Pack',
        logo_url: '/images/brands/brand-euodoo.webp',
        description_id: 'Merek premium kantong plastik 100% degradable berteknologi OXIUM untuk supermarket dan rantai ritel modern.',
        description_en: 'Premium 100% degradable OXIUM plastic bag brand engineered for modern supermarket and retail chains.',
        sort_order: 3,
        is_active: 1
      }
    ];

    for (const b of brands) {
      await connection.query(
        `INSERT INTO brands (name, logo_url, description_id, description_en, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           logo_url = VALUES(logo_url),
           description_id = VALUES(description_id),
           description_en = VALUES(description_en),
           sort_order = VALUES(sort_order),
           is_active = VALUES(is_active)`,
        [b.name, b.logo_url, b.description_id, b.description_en, b.sort_order, b.is_active]
      );
    }
    logger.info(`[SEED v2] Seeded ${brands.length} corporate brands.`);

    // 5. Seed Homepage Hero Banners
    logger.info('Seeding hero banners...');
    const banners = [
      {
        title_id: 'Manufaktur Kantong Plastik Ramah Lingkungan Sejak 1990',
        title_en: 'Eco-Friendly Plastic Bag Manufacturing Since 1990',
        caption_id: 'Solusi kemasan plastik HDPE & LLDPE berstandar industri dengan teknologi 100% degradable OXIUM untuk retail modern dan pasar skala nasional.',
        caption_en: 'Industrial-grade HDPE & LLDPE plastic packaging solutions with 100% degradable OXIUM technology for modern retail and nationwide markets.',
        media_type: 'image',
        file_url: '/images/hero-factory-precision.webp',
        poster_url: '/images/hero-factory-precision.webp',
        link_url: '/products',
        cta_text_id: 'Jelajahi Produk',
        cta_text_en: 'Explore Products',
        cta_url: '/products',
        sort_order: 1,
        is_active: 1
      },
      {
        title_id: 'Kapasitas Produksi Presisi & Skalabilitas B2B',
        title_en: 'High-Precision Production Capacity & B2B Scalability',
        caption_id: 'Didukung mesin blowing ekstrusi otomatis berkapasitas 500 ton per bulan serta laboratorium kendali mutu terverifikasi SNI.',
        caption_en: 'Powered by automated blown extrusion machinery with 500 tons/month capacity and SNI-accredited quality assurance lab.',
        media_type: 'image',
        file_url: '/images/hero-factory-precision.webp',
        poster_url: '/images/hero-factory-precision.webp',
        link_url: '/contact',
        cta_text_id: 'Hubungi Kami',
        cta_text_en: 'Contact Us',
        cta_url: '/contact',
        sort_order: 2,
        is_active: 1
      }
    ];

    for (const bn of banners) {
      await connection.query(
        `INSERT INTO banners (
           title_id, title_en, caption_id, caption_en, media_type,
           file_url, poster_url, link_url, cta_text_id, cta_text_en,
           cta_url, sort_order, is_active
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           caption_id = VALUES(caption_id),
           caption_en = VALUES(caption_en),
           media_type = VALUES(media_type),
           file_url = VALUES(file_url),
           poster_url = VALUES(poster_url),
           cta_text_id = VALUES(cta_text_id),
           cta_text_en = VALUES(cta_text_en),
           cta_url = VALUES(cta_url),
           sort_order = VALUES(sort_order),
           is_active = VALUES(is_active)`,
        [
          bn.title_id, bn.title_en, bn.caption_id, bn.caption_en, bn.media_type,
          bn.file_url, bn.poster_url, bn.link_url, bn.cta_text_id, bn.cta_text_en,
          bn.cta_url, bn.sort_order, bn.is_active
        ]
      );
    }
    logger.info(`[SEED v2] Seeded ${banners.length} hero banners.`);

    // 6. Seed Dynamic Settings
    logger.info('Seeding dynamic site settings...');
    const settingsList = [
      { key: 'company_name', value: 'PT. EUODOO' },
      { key: 'company_tagline_id', value: 'Semangat Membangun Kualitas Hidup yang Lebih Baik' },
      { key: 'company_tagline_en', value: 'Passion To Build A Better Quality of Life' },
      { key: 'office_address', value: 'Karindra Building Jl. Palmerah Selatan 30 A Suite 02 - 07, Jakarta Pusat 10270' },
      { key: 'office_phone', value: '+6221-53668626' },
      { key: 'office_fax', value: '+6221-53668648' },
      { key: 'factory_address', value: 'Jl. Paralon II No. 21 Cijerah Bandung 40214 - Indonesia' },
      { key: 'factory_phone', value: '+6222-6012519' },
      { key: 'factory_fax', value: '+6222-6074730' },
      { key: 'company_email', value: 'info@euodoo.com' },
      { key: 'whatsapp_number', value: '6281234567890' },
      {
        key: 'whatsapp_default_message',
        value: 'Halo PT Euodoo, saya ingin berkonsultasi mengenai pemesanan kantong plastik ramah lingkungan (100% degradable).'
      },
      { key: 'whatsapp_button_theme', value: 'corporate' },
      {
        key: 'google_maps_embed',
        value: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.7788487771615!2d107.5614945!3d-6.9289551!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e5ffb6c00001%3A0x7d0a0b0c0d0e0f10!2sJl.%20Paralon%20II%20No.21%2C%20Cijerah%2C%20Bandung!5e0!3m2!1sid!2sid!4v1700000000000" width="100%" height="320" style="border:0;" allowfullscreen="" loading="lazy"></iframe>'
      },
      { key: 'social_facebook', value: 'https://facebook.com/euodoo' },
      { key: 'social_instagram', value: 'https://instagram.com/euodoo' },
      { key: 'social_linkedin', value: 'https://linkedin.com/company/euodoo' },
      { key: 'meta_title_id', value: 'PT Euodoo - Manufaktur Kantong Plastik Ramah Lingkungan 100% Degradable' },
      { key: 'meta_title_en', value: 'PT Euodoo - 100% Degradable Eco-Friendly Plastic Bag Manufacturer' },
      {
        key: 'meta_description_id',
        value: 'PT. EUODOO memproduksi kantong plastik HDPE dan LLDPE 100% degradable ramah lingkungan sejak 1990 untuk retail modern, supermarket, dan sektor industri.'
      },
      {
        key: 'meta_description_en',
        value: 'PT. Euodoo manufactures 100% degradable HDPE and LLDPE eco-friendly plastic bags since 1990 for modern retail, supermarkets, and industrial sectors.'
      }
    ];

    for (const st of settingsList) {
      await connection.query(
        `INSERT INTO settings (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [st.key, st.value]
      );
    }
    logger.info(`[SEED v2] Seeded ${settingsList.length} settings records.`);

    // 7. Seed Sample Products with Technical Specs and Variants (Strictly NO price)
    logger.info('Seeding sample products with variants and technical specifications...');
    const products = [
      {
        category_slug: 'hdpe-bags',
        name_id: 'Soft Loop Handle Shopping Bag',
        name_en: 'Soft Loop Handle Shopping Bag',
        slug: 'soft-loop-handle-shopping-bag',
        description_id: 'Tas belanja retail premium dengan pegangan pita lembut yang nyaman digenggam. Dibuat dengan virgin HDPE murni dan aditif degradasi OXIUM untuk ketahanan lingkungan maksimal.',
        description_en: 'Premium retail shopping bag featuring ergonomic soft loop handles for comfortable carrying. Engineered with pure virgin HDPE and OXIUM degradation additive for maximum eco-compliance.',
        material_specs: JSON.stringify({
          resin: 'Virgin HDPE + OXIUM Additive',
          certification: 'SNI 7188.7:2011',
          degradability: '100% Oxo-biodegradable (24-36 bulan)'
        }),
        technical_specs: JSON.stringify({
          tensile_strength: '≥ 25 MPa',
          elongation: '≥ 350%',
          sealing_type: 'High-Integrity Bottom Heat Seal',
          printing: 'Flexographic up to 8 colors'
        }),
        main_image: '/images/products/soft-loop-bag.webp',
        gallery_images: JSON.stringify([
          '/images/products/soft-loop-bag.webp',
          '/images/hero-factory-precision.webp'
        ]),
        status: 'published',
        is_featured: 1,
        sort_order: 1,
        variants: [
          { name_id: 'Ukuran S (25 x 35 cm)', name_en: 'Size S (25 x 35 cm)', sku: 'SLB-HD-S', specs: { thickness: '40 micron', capacity: '5 kg' } },
          { name_id: 'Ukuran M (30 x 40 cm)', name_en: 'Size M (30 x 40 cm)', sku: 'SLB-HD-M', specs: { thickness: '45 micron', capacity: '8 kg' } },
          { name_id: 'Ukuran L (35 x 45 cm)', name_en: 'Size L (35 x 45 cm)', sku: 'SLB-HD-L', specs: { thickness: '50 micron', capacity: '12 kg' } }
        ]
      },
      {
        category_slug: 'hdpe-bags',
        name_id: 'Patch Handle Shopping Bag',
        name_en: 'Patch Handle Shopping Bag',
        slug: 'patch-handle-shopping-bag',
        description_id: 'Kantong plastik lubang plong dengan penguat lapisan ganda pada area pegangan. Ideal untuk butik pakaian, kosmetik, dan ritel buku.',
        description_en: 'Die-cut handle shopping bag reinforced with inner patch lining at handle area. Ideal for apparel boutiques, cosmetics, and bookstores.',
        material_specs: JSON.stringify({
          resin: 'HDPE High Molecular Weight',
          reinforcement: 'Double Layer Handle Patch',
          degradability: 'OXIUM Eco-Additive'
        }),
        technical_specs: JSON.stringify({
          load_capacity: 'Hingga 12 kg',
          thickness_range: '35 - 60 micron',
          side_gusset: 'Opsional (3 - 6 cm)'
        }),
        main_image: '/images/products/patch-handle-bag.webp',
        gallery_images: JSON.stringify(['/images/products/patch-handle-bag.webp']),
        status: 'published',
        is_featured: 1,
        sort_order: 2,
        variants: [
          { name_id: 'Medium (28 x 38 cm)', name_en: 'Medium (28 x 38 cm)', sku: 'PHB-HD-M', specs: { thickness: '40 micron', capacity: '6 kg' } },
          { name_id: 'Large (35 x 48 cm)', name_en: 'Large (35 x 48 cm)', sku: 'PHB-HD-L', specs: { thickness: '50 micron', capacity: '10 kg' } }
        ]
      },
      {
        category_slug: 'lldpe-packaging',
        name_id: 'Heavy Duty Industrial LLDPE Liner',
        name_en: 'Heavy Duty Industrial LLDPE Liner',
        slug: 'heavy-duty-industrial-lldpe-liner',
        description_id: 'Plastik liner drum dan cover palet berspesifikasi industri tinggi dengan ketahanan tusuk dan kelembaban ekstra.',
        description_en: 'Industrial heavy-duty drum liner and pallet shroud featuring superior puncture resistance and moisture barrier performance.',
        material_specs: JSON.stringify({
          resin: '100% Pure LLDPE Resin',
          puncture_resistance: 'Ultra High Impact',
          moisture_barrier: 'Waterproof & Dustproof'
        }),
        technical_specs: JSON.stringify({
          tear_resistance: 'MD/TD Balanced',
          thickness: '80 - 150 micron',
          application: 'Drum Liner, Pallet Cover, Automotive Cover'
        }),
        main_image: '/images/products/industrial-lldpe-liner.webp',
        gallery_images: JSON.stringify(['/images/products/industrial-lldpe-liner.webp']),
        status: 'published',
        is_featured: 1,
        sort_order: 3,
        variants: [
          { name_id: 'Drum Liner 200 Liter', name_en: 'Drum Liner 200 Liters', sku: 'LNR-LL-200L', specs: { diameter: '60 cm', height: '100 cm', thickness: '100 micron' } },
          { name_id: 'Pallet Hood 120 x 120 cm', name_en: 'Pallet Hood 120 x 120 cm', sku: 'LNR-LL-PL120', specs: { width: '120 cm', length: '120 cm', height: '150 cm', thickness: '120 micron' } }
        ]
      },
      {
        category_slug: 'pp-woven-bags',
        name_id: 'Karung Woven PP Beras & Komoditas',
        name_en: 'PP Woven Sacks for Rice & Commodities',
        slug: 'karung-woven-pp-beras-komoditas',
        description_id: 'Karung anyaman Polypropylene berkekuatan tinggi untuk distribusi beras, hasil bumi, dan bahan kimia industri.',
        description_en: 'Heavy-duty Polypropylene woven bags for rice packaging, agricultural produce, and industrial minerals.',
        material_specs: JSON.stringify({
          material: 'Woven Polypropylene',
          coating: 'BOPP Laminated Coating',
          ventilation: 'Micro-perforation optional'
        }),
        technical_specs: JSON.stringify({
          weave_density: '10 x 10 mesh',
          burst_strength: 'High Load Endurance',
          uv_stabilizer: 'Tersedia opsi outdoor UV protector'
        }),
        main_image: '/images/products/karung-woven-pp.webp',
        gallery_images: JSON.stringify(['/images/products/karung-woven-pp.webp']),
        status: 'published',
        is_featured: 1,
        sort_order: 4,
        variants: [
          { name_id: 'Kapasitas 25 kg (45 x 75 cm)', name_en: 'Capacity 25 kg (45 x 75 cm)', sku: 'PPW-25K', specs: { capacity: '25 kg', mesh: '10x10' } },
          { name_id: 'Kapasitas 50 kg (56 x 90 cm)', name_en: 'Capacity 50 kg (56 x 90 cm)', sku: 'PPW-50K', specs: { capacity: '50 kg', mesh: '10x10' } }
        ]
      }
    ];

    for (const p of products) {
      const categoryId = categoryIdMap[p.category_slug] || 1;
      await connection.query(
        `INSERT INTO products (
           category_id, name_id, name_en, slug, description_id, description_en,
           material_specs, technical_specs, main_image, gallery_images, status,
           is_featured, is_active, sort_order
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
         ON DUPLICATE KEY UPDATE
           category_id = VALUES(category_id),
           name_id = VALUES(name_id),
           name_en = VALUES(name_en),
           description_id = VALUES(description_id),
           description_en = VALUES(description_en),
           material_specs = VALUES(material_specs),
           technical_specs = VALUES(technical_specs),
           main_image = VALUES(main_image),
           gallery_images = VALUES(gallery_images),
           status = VALUES(status),
           is_featured = VALUES(is_featured),
           sort_order = VALUES(sort_order)`,
        [
          categoryId, p.name_id, p.name_en, p.slug, p.description_id, p.description_en,
          p.material_specs, p.technical_specs, p.main_image, p.gallery_images, p.status,
          p.is_featured, p.sort_order
        ]
      );

      const [pRows] = await connection.query('SELECT id FROM products WHERE slug = ?', [p.slug]);
      if (pRows.length > 0) {
        const productId = pRows[0].id;
        let vOrder = 1;
        for (const v of p.variants) {
          await connection.query(
            `INSERT INTO product_variants (product_id, name_id, name_en, sku, specs, sort_order)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               name_id = VALUES(name_id),
               name_en = VALUES(name_en),
               specs = VALUES(specs),
               sort_order = VALUES(sort_order)`,
            [productId, v.name_id, v.name_en, v.sku, JSON.stringify(v.specs), vOrder++]
          );
        }
      }
    }
    logger.info(`[SEED v2] Seeded ${products.length} products with technical specifications and variants.`);

    // 8. Seed Sample Posts (News, Press Release, Blog)
    logger.info('Seeding sample posts for 3 content tabs...');
    const posts = [
      {
        category_slug: 'berita-perusahaan',
        type: 'berita',
        title_id: 'PT Euodoo Raih Sertifikasi Ekolabel Indonesia SNI 7188.7:2011 untuk Seluruh Lini Kantong Belanja',
        title_en: 'PT Euodoo Achieves Indonesian Eco-Label SNI 7188.7:2011 Certification Across All Shopping Bag Lines',
        slug: 'pt-euodoo-raih-sertifikasi-ekolabel-indonesia-sni-7188',
        content_id: '<p>Sebagai wujud komitmen berkelanjutan terhadap kelestarian lingkungan dan kepatuhan regulasi industri, PT EUODOO secara resmi meraih sertifikasi Ekolabel Indonesia SNI 7188.7:2011 dari Badan Standardisasi Nasional.</p><p>Sertifikasi ini memvalidasi seluruh produk kantong belanja plastik mudah terurai secara alami tanpa meninggalkan residu mikroplastik berbahaya bagi ekosistem tanah maupun air.</p>',
        content_en: '<p>Demonstrating our enduring commitment to environmental sustainability and industrial compliance, PT EUODOO has officially received the Indonesian Eco-label SNI 7188.7:2011 certification from the National Standardization Agency.</p><p>This certification validates our plastic shopping bags degradability standards without generating harmful microplastic residues.</p>',
        excerpt_id: 'Komitmen nyata manufaktur plastik berkelanjutan dengan sertifikasi resmi standar nasional kantong belanja mudah terurai.',
        excerpt_en: 'Concrete commitment to sustainable plastic manufacturing with official national accreditation for degradable bags.',
        cover_image: '/images/hero-factory-precision.webp',
        is_headline: 1,
        status: 'published',
        published_at: new Date('2026-09-15 09:00:00')
      },
      {
        category_slug: 'industri-keberlanjutan',
        type: 'berita',
        title_id: 'Modernisasi Lini Ekstrusi Film di Pabrik Cigondewah Tingkatkan Kapasitas Produksi 500 Ton',
        title_en: 'Film Extrusion Line Modernization at Cigondewah Plant Boosts Production Capacity to 500 Tons',
        slug: 'modernisasi-lini-ekstrusi-film-pabrik-cigondewah',
        content_id: '<p>PT EUODOO merampungkan instalasi mesin blowing ekstrusi film otomatis generasi terbaru di fasilitas pabrik Cigondewah, Bandung. Investasi ini meningkatkan total kapasitas produksi bulanan mencapai 500 ton untuk memenuhi lonjakan permintaan mitra ritel modern nasional.</p>',
        content_en: '<p>PT EUODOO has finalized the commissioning of advanced blown film extrusion lines at our Cigondewah manufacturing plant in Bandung, expanding monthly capacity to 500 metric tons to meet growing national retail demands.</p>',
        excerpt_id: 'Peningkatan kapasitas produksi bulanan untuk menunjang kebutuhan mitra ritel modern dan sektor industri skala besar.',
        excerpt_en: 'Expanding monthly production capacity to serve modern retail partners and large-scale industrial sectors.',
        cover_image: '/images/hero-factory-precision.webp',
        is_headline: 0,
        status: 'published',
        published_at: new Date('2026-09-20 10:30:00')
      },
      {
        category_slug: null,
        type: 'pers',
        title_id: 'Siaran Pers Resmi: Komitmen Pasokan Kemasan Ramah Lingkungan PT Euodoo Menyambut Regulasi Baru 2026',
        title_en: 'Official Press Release: PT Euodoo Eco-Packaging Supply Readiness Supporting 2026 Regulations',
        slug: 'siaran-pers-komitmen-pasokan-kemasan-ramah-lingkungan-2026',
        content_id: '<p>Jakarta, PT EUODOO menegaskan kesiapan penuh rantai pasok dalam mendukung peraturan pembatasan kantong plastik sekali pakai melalui penyediaan kantong 100% degradable berstandar Ekolabel Indonesia untuk seluruh mitra pasar modern.</p>',
        content_en: '<p>Jakarta, PT EUODOO reaffirms full supply chain readiness supporting national single-use plastic reduction policies through certified 100% degradable packaging for modern retail partners.</p>',
        excerpt_id: 'Kesiapan pasokan kantong degradable terstandarisasi untuk mendukung inisiatif pengurangan sampah plastik nasional.',
        excerpt_en: 'Standardized degradable bag supply readiness supporting national plastic waste reduction initiatives.',
        cover_image: '/images/hero-factory-precision.webp',
        is_headline: 0,
        status: 'published',
        published_at: new Date('2026-09-25 14:00:00')
      },
      {
        category_slug: 'wawasan-lingkungan',
        type: 'blog',
        title_id: 'Mengenal Teknologi OXIUM: Solusi Kantong Plastik Oxo-Biodegradable untuk Retail Berkelanjutan',
        title_en: 'Understanding OXIUM Technology: Oxo-Biodegradable Plastic Solutions for Sustainable Retail',
        slug: 'mengenal-teknologi-oxium-plastik-biodegradable',
        content_id: '<p>Teknologi aditif degradasi OXIUM memungkinkan rantai polimer plastik terurai secara fotooksidasi dan biodegradasi alami dalam kurun waktu 24 hingga 36 bulan, tanpa mengorbankan daya tahan beban saat digunakan oleh konsumen.</p>',
        content_en: '<p>OXIUM degradable additive technology facilitates photo-oxidation and natural biodegradation of plastic polymer chains within 24 to 36 months, preserving high mechanical tensile strength during consumer usage.</p>',
        excerpt_id: 'Ulasan ilmiah mengenai cara kerja aditif OXIUM dalam mempercepat penguraian kantong belanja secara aman dan higienis.',
        excerpt_en: 'Scientific breakdown of how OXIUM additives accelerate plastic bag degradation safely and hygienically.',
        cover_image: '/images/hero-factory-precision.webp',
        is_headline: 1,
        status: 'published',
        published_at: new Date('2026-09-28 11:15:00')
      }
    ];

    for (const post of posts) {
      const categoryId = post.category_slug ? (postCatIdMap[post.category_slug] || null) : null;
      await connection.query(
        `INSERT INTO posts (
           category_id, type, title_id, title_en, slug, content_id, content_en,
           excerpt_id, excerpt_en, cover_image, is_headline, status, published_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           category_id = VALUES(category_id),
           type = VALUES(type),
           title_id = VALUES(title_id),
           title_en = VALUES(title_en),
           content_id = VALUES(content_id),
           content_en = VALUES(content_en),
           excerpt_id = VALUES(excerpt_id),
           excerpt_en = VALUES(excerpt_en),
           cover_image = VALUES(cover_image),
           is_headline = VALUES(is_headline),
           status = VALUES(status),
           published_at = VALUES(published_at)`,
        [
          categoryId, post.type, post.title_id, post.title_en, post.slug, post.content_id,
          post.content_en, post.excerpt_id, post.excerpt_en, post.cover_image, post.is_headline,
          post.status, post.published_at
        ]
      );
    }
    logger.info(`[SEED v2] Seeded ${posts.length} posts across news, press release, and blog.`);

    // 9. Seed Static Pages (About Us)
    logger.info('Seeding static pages content...');
    await connection.query(
      `INSERT INTO pages (
         slug, title_id, title_en, content_id, content_en, hero_image,
         meta_title_id, meta_title_en, meta_description_id, meta_description_en, robots
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'index')
       ON DUPLICATE KEY UPDATE
         title_id = VALUES(title_id),
         title_en = VALUES(title_en),
         hero_image = VALUES(hero_image),
         meta_title_id = VALUES(meta_title_id),
         meta_title_en = VALUES(meta_title_en),
         meta_description_id = VALUES(meta_description_id),
         meta_description_en = VALUES(meta_description_en)`,
      [
        'about',
        'Tentang PT Euodoo - Profil, Visi, Misi & Dedikasi Manufaktur',
        'About PT Euodoo - Profile, Vision, Mission & Manufacturing Dedication',
        'PT. EUODOO adalah perusahaan manufaktur kantong plastik HDPE dan LLDPE terkemuka yang berbasis di Cigondewah Bandung sejak 1990 dengan komitmen pada produk ramah lingkungan.',
        'PT. EUODOO is a leading manufacturer of HDPE and LLDPE plastic bags based in Cigondewah Bandung since 1990, dedicated to eco-friendly 100% degradable solutions.',
        '/images/hero-factory-precision.webp',
        'Tentang Kami | PT Euodoo Manufaktur Plastik Ramah Lingkungan',
        'About Us | PT Euodoo Eco-Friendly Plastic Manufacturer',
        'Profil lengkap PT Euodoo, produsen kantong plastik ramah lingkungan 100% degradable sejak 1990 dengan pabrik di Cigondewah Bandung.',
        'Comprehensive profile of PT Euodoo, 100% degradable eco-friendly plastic bag manufacturer since 1990 based in Cigondewah Bandung.'
      ]
    );
    logger.info('[SEED v2] Seeded static pages.');

    await connection.commit();
    logger.info('Database seeding v2.0 completed successfully with all entities populated.');
  } catch (err) {
    await connection.rollback();
    logger.error('Error during database seeding v2.0:', { message: err.message });
    throw err;
  } finally {
    connection.release();
    await pool.end();
  }
}

runV2Seed().catch(err => {
  logger.error('Seed v2 process terminated with error:', { message: err.message });
  process.exit(1);
});
