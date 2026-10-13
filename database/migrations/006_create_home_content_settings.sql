-- Migration: 006_create_home_content_settings.sql
-- PT Euodoo - Default Data CMS Konten Homepage v1 (Locked Decisions)

INSERT INTO settings (setting_key, setting_value)
VALUES
  -- 1. Section Intro
  ('home_intro_eyebrow_id', 'TENTANG PT EUODOO'),
  ('home_intro_eyebrow_en', 'ABOUT PT EUODOO'),
  ('home_intro_title_id', 'Dedikasi Manufaktur Plastik Berkualitas Sejak 1990'),
  ('home_intro_title_en', 'Over Three Decades of Plastic Film Manufacturing Excellence'),
  ('home_intro_paragraph_1_id', 'Sejak berdiri pada tahun 1990 di Bandung, Jawa Barat (bermula dari PT Sahabat Baru dan PT Pelita Baru), PT EUODOO telah memproduksi kantong plastik HDPE dan LLDPE berkualitas tinggi untuk jaringan ritel modern, pasar grosir tradisional, dan sektor industri nasional.'),
  ('home_intro_paragraph_1_en', 'Since our founding in 1990 in Bandung, West Java (originating from PT Sahabat Baru and PT Pelita Baru), PT EUODOO has been producing high-grade HDPE and LLDPE plastic bags for modern retail chains, traditional wholesale hubs, and industrial sectors.'),
  ('home_intro_paragraph_2_id', 'Dengan fasilitas produksi berkapasitas tinggi di Cigondewah dan kantor manajemen di Palmerah Jakarta, kami menggabungkan teknologi ekstrusi film mutakhir, formula ramah lingkungan 100% degradable berstandar SNI, serta ketelitian presisi demi kepuasan mitra usaha di seluruh Indonesia.'),
  ('home_intro_paragraph_2_en', 'With high-capacity production facilities in Cigondewah and corporate offices in Palmerah Jakarta, we integrate advanced blown film extrusion lines, certified 100% degradable formulations under SNI standards, and strict quality control for partners across Indonesia.'),
  ('home_intro_image_url', ''),
  ('home_intro_is_active', '1'),

  -- 2. Section 3 Pilar Keunggulan
  ('home_pillars_title_id', 'Tiga Pilar Keunggulan Kami'),
  ('home_pillars_title_en', 'Three Pillars of Manufacturing Excellence'),
  ('home_pillars_subtitle_id', 'Komitmen menyeluruh dalam menghadirkan standar mutu plastik terdepan bagi mitra B2B.'),
  ('home_pillars_subtitle_en', 'Our unwavering commitment to precision, production capacity, and environmental sustainability.'),
  ('home_pillars_is_active', '1'),
  ('home_pillars_json', '[{"icon":"factory","title_id":"Teknologi & Kapasitas Produksi","title_en":"High-Volume Production Capacity","desc_id":"Didukung deretan mesin ekstrusi multi-layer modern dan converting line berkecepatan tinggi di Cigondewah untuk menjamin ketepatan jadwal pasokan skala besar.","desc_en":"Equipped with multi-layer blown film extruders, automated precision bag-making lines, and multi-color flexographic printing machines.","sort_order":1,"is_active":1},{"icon":"shield","title_id":"Standar Mutu & Presisi Konsisten","title_en":"Consistent Quality & Precision","desc_id":"Penerapan kontrol kualitas berkala meliputi uji ketahanan jatuh (drop-test), segel anti-bocor star-seal, dan ketebalan mikron yang konsisten di setiap batch.","desc_en":"Rigorous quality control protocols verifying tensile elongation, drop-impact resistance, seal integrity, and micron uniformity.","sort_order":2,"is_active":1},{"icon":"leaf","title_id":"Solusi Ramah Lingkungan OXIUM","title_en":"Sustainable OXIUM® Degradable","desc_id":"Pionir penerapan aditif OXIUM teruji 100% terdegradasi menjadi biomassa dan air tanpa menyisakan mikroplastik berbahaya, berstandar resmi SNI.","desc_en":"Certified 100% degradable technology tested under US ASTM D6954 standards and Indonesian Green Label SNI 7188.7:2011.","sort_order":3,"is_active":1}]'),

  -- 3. Section Sertifikasi Mutu
  ('home_cert_title_id', 'Sertifikasi Mutu & Komitmen Lingkungan'),
  ('home_cert_title_en', 'Verified Quality & Eco-Certifications'),
  ('home_cert_body_id', 'Standar produksi kami didukung sertifikasi resmi nasional dan pengujian laboratorium terakreditasi, memastikan setiap produk aman digunakan, kuat, dan memenuhi regulasi ramah lingkungan.'),
  ('home_cert_body_en', 'Our manufacturing processes strictly comply with national standards and certified laboratory testing, ensuring packaging safety, durability, and full regulatory compliance.'),
  ('home_cert_btn_text_id', 'Pelajari Detail Sertifikasi'),
  ('home_cert_btn_text_en', 'Learn More About Certifications'),
  ('home_cert_btn_url', '/about#sertifikasi'),
  ('home_cert_show_btn', '1'),
  ('home_cert_is_active', '1'),
  ('home_cert_items_json', '[{"name":"SNI 7188.7:2011","desc_id":"Standar Nasional Indonesia untuk kantong belanja mudah terurai","desc_en":"Indonesian National Standard for degradable shopping bags","logo_url":"","sort_order":1,"is_active":1},{"name":"OXIUM® Technology","desc_id":"Formula degradasi alami berstandar internasional ASTM D6954","desc_en":"US ASTM D6954 certified oxo-biodegradable formulation","logo_url":"","sort_order":2,"is_active":1},{"name":"InSWA Eco Label","desc_id":"Sertifikasi Resmi Asosiasi Pengelolaan Sampah Indonesia","desc_en":"Endorsed by Indonesia Solid Waste Association","logo_url":"","sort_order":3,"is_active":1},{"name":"Virgin Food-Grade Contact","desc_id":"Bahan baku murni higienis aman untuk produk pangan dan retail","desc_en":"Pure non-recycled polymers safe for food contact","logo_url":"","sort_order":4,"is_active":1}]'),

  -- 4. Section CTA Global (dengan konfigurasi visibilitas 9 halaman publik)
  ('global_cta_title_id', 'Mulai Kemitraan Manufaktur Bersama PT. EUODOO'),
  ('global_cta_title_en', 'Start Your Manufacturing Partnership with PT. EUODOO'),
  ('global_cta_subtitle_id', 'Konsultasikan kebutuhan spesifikasi kantong plastik, ukuran kustom, dan volume pesanan bisnis Anda bersama tim teknis dan pemasaran kami.'),
  ('global_cta_subtitle_en', 'Consult with our experienced production and engineering team to develop custom plastic bag packaging tailored to your brand, strength parameters, and delivery schedules.'),
  ('global_cta_btn1_title_id', 'Hubungi Tim Pemasaran'),
  ('global_cta_btn1_title_en', 'Contact Sales & Engineering'),
  ('global_cta_btn1_sub_id', 'Formulir penawaran harga dan konsultasi'),
  ('global_cta_btn1_sub_en', 'Submit RFQ form and technical inquiries'),
  ('global_cta_btn1_url', '/contact'),
  ('global_cta_btn2_title_id', 'Kirim Pesan WhatsApp'),
  ('global_cta_btn2_title_en', 'Direct WhatsApp Consultation'),
  ('global_cta_btn2_sub_id', 'Respon cepat dari tim sales kami'),
  ('global_cta_btn2_sub_en', 'Fast response from our customer support'),
  ('global_cta_btn2_url', ''),
  ('global_cta_pages_json', '{"home":1,"about":1,"products":1,"product_detail":1,"capabilities":1,"news":1,"news_detail":1,"contact":0,"404":0}'),
  ('global_cta_is_active', '1')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
