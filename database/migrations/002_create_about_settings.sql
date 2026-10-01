-- ========================================================
-- MIGRATION: 002_create_about_settings.sql
-- PT Euodoo - Default Data Halaman Tentang Kami (Company Profile)
-- Sumber Acuan: Company Profile PT. EUODOO (1).pdf
-- ========================================================

INSERT INTO settings (setting_key, setting_value)
VALUES
  ('about_founded_year', '1990'),
  ('about_former_names', 'PT. Sahabat Baru & PT. Pelita Baru'),
  ('about_history_title_id', 'Latar Belakang & Sejarah Perusahaan'),
  ('about_history_title_en', 'Company Background & History'),
  ('about_history_id', 'PT. EUODOO adalah perusahaan yang bergerak di bidang manufaktur perdagangan kantong plastik HDPE dan LLDPE. Pabrik produksi kami terletak di Cigondewah, Bandung, Jawa Barat - Indonesia. Perusahaan ini didirikan pada tahun 1990 yang akrab dikenal sebagai PT. Sahabat Baru atau PT. Pelita Baru. Usaha kami dimulai dari melayani permintaan kantong plastik HDPE untuk pasar tradisional. Dalam perkembangannya, kami memperluas kapasitas produksi dan melayani kebutuhan kantong plastik untuk supermarket, toko retail modern, serta berbagai sektor industri dengan komitmen penuh pada penyediaan kantong plastik ramah lingkungan (100% degradable).'),
  ('about_history_en', 'PT. Euodoo manufactures and trades HDPE and LLDPE plastic bags. Our production plant is located in Cigondewah, Bandung, West Java, Indonesia. The company was incorporated in 1990, familiarly known as PT Sahabat Baru & PT Pelita Baru. We entered the business by serving HDPE plastic bag demands for traditional markets. Over the years, we expanded production to serve major supermarkets, modern retail stores, and specialized industrial sectors with an uncompromising commitment to 100% degradable plastic bags.'),
  ('about_vision_id', 'Menjadi perusahaan yang memberi dampak pada perubahan kualitas hidup yang lebih baik.'),
  ('about_vision_en', 'Continuous contribution to improve quality of life.'),
  ('about_mission_id', 'Membina moral dan karakter positif\nMenggali potensi manusia\nMengembangkan profesionalisme'),
  ('about_mission_en', 'Nurture positive morality and character building\nUnleash human potential\nDevelop professionalism'),
  ('about_motto_id', 'Perlakukan orang lain sama seperti kita ingin diperlakukan.\nBukan benar atau salah tetapi respon.\nKeterbukaan adalah awal dari pemulihan.'),
  ('about_motto_en', 'Treat others as we want to be treated.\nEncourage positive, helpful responses and discourage fault finding.\nRevealing your feeling is the start of healing.'),
  ('about_slogan_id', 'Semangat membangun kualitas hidup yang lebih baik.'),
  ('about_slogan_en', 'Passion to build a better quality of life in our community.'),
  ('about_goal_id', 'Agar setiap pribadi dapat mencapai kemaksimalan dalam hidupnya.'),
  ('about_goal_en', 'To help everyone reach their full potential.'),
  ('about_eco_statement_id', 'Mari selamatkan bumi kita! Kami memproduksi dan menyuplai 100% kantong plastik ramah lingkungan (degradable) untuk pelanggan kami.'),
  ('about_eco_statement_en', 'Let\'s save our earth! We supply 100% degradable plastic bags to our valuable customers.'),
  ('about_office_address', 'Karindra Building Jl. Palmerah Selatan 30 A Suite 02 - 07, Jakarta Pusat 10270'),
  ('about_office_phone', '+6221-53668626'),
  ('about_office_fax', '+6221-53668648'),
  ('about_factory_address', 'Jl. Paralon II No. 21 Cijerah Bandung 40214 - Indonesia'),
  ('about_factory_phone', '+6222-6012519'),
  ('about_factory_fax', '+6222-6074730'),
  ('about_image_url', '/images/factory-plant.webp'),
  ('about_values_json', '[{"letter":"T","title_id":"Takut Tuhan","title_en":"Fear of God","desc_id":"Menjadi dasar moral, etika, dan spiritual dalam setiap keputusan bisnis dan operasional perusahaan.","desc_en":"The moral and spiritual cornerstone guiding every business decision and daily operation."},{"letter":"I","title_id":"Integritas","title_en":"Integrity","desc_id":"Kejujuran, konsistensi mutu, dan tanggung jawab penuh atas komitmen kepada pelanggan dan mitra.","desc_en":"Honesty, consistent quality, and total accountability to customers and partners."},{"letter":"C","title_id":"Komunikasi","title_en":"Communication","desc_id":"Keterbukaan, respon yang membangun dan cepat, serta budaya mendengarkan tanpa mencari kesalahan.","desc_en":"Openness, constructive responses, and an open culture of listening without fault-finding."},{"letter":"K","title_id":"Kasih","title_en":"Love","desc_id":"Kepedulian tulus terhadap kesejahteraan dan pendidikan karyawan, kepuasan pelanggan, serta kelestarian bumi.","desc_en":"Genuine care for employee education and well-being, customer satisfaction, and planetary care."},{"letter":"E","title_id":"Luar Biasa","title_en":"Excellence","desc_id":"Dedikasi menghadirkan standar mutu plastik degradable terbaik dengan toleransi presisi tinggi.","desc_en":"Dedication to delivering peak degradable plastic standards with tight precision tolerance."},{"letter":"T","title_id":"Taat","title_en":"Obedience","desc_id":"Kepatuhan terhadap standar keamanan, regulasi kelestarian lingkungan, dan sertifikasi resmi.","desc_en":"Adherence to safety standards, environmental regulations, and official certifications."}]'),
  ('about_certifications_json', '[{"name":"SNI 7188.7:2011","issuer":"Badan Standardisasi Nasional","badge":"Ekolabel Indonesia","desc_id":"Standar mutu nasional Indonesia untuk kantong plastik belanja mudah terurai secara alami.","desc_en":"Indonesian national standard for naturally degradable plastic shopping bags."},{"name":"OXIUM","issuer":"Oxium 100% Degradable","badge":"100% Degradable","desc_id":"Teknologi aditif degradasi ramah lingkungan yang mempercepat penguraian plastik tanpa residu berbahaya.","desc_en":"Eco-friendly degradable additive technology accelerating plastic degradation safely."},{"name":"InSWA Green Label","issuer":"Indonesia Solid Waste Association","badge":"Program Monitoring","desc_id":"Sertifikasi pemantauan dan pengelolaan limbah padat berkelanjutan berstandar hijau.","desc_en":"Certified monitoring and sustainable solid waste management program."}]')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
