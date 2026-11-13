# CHANGELOG: Riwayat Perubahan PT Euodoo

*Format: Tanggal (YYYY-MM-DD) | Ringkasan Perubahan | Nomor Task (T-xxx)*

- 2026-09-29 | Fondasi rilis awal website company profile, arsitektur database v1, CMS admin, dan SSR publik | T-01..T-25
- 2026-09-30 | Pembersihan UI anti-slop, CMS halaman Tentang Kami, dan copywriting profil perusahaan | T-26..T-35
- 2026-10-05 | Upgrade platform v2.0, skema database 12 tabel terpadu, storage driver, RBAC, dan audit SEO | T-36..T-60
- 2026-10-06 | Revisi Admin v1: fix CSRF multipart, CMS kontak, favicon, dual logo, custom slug 301, Turnstile | T-61..T-68
- 2026-10-06 | Revisi Admin v2: fix interaktivitas UI form admin dan integrasi Rich Text Editor TinyMCE | T-69..T-75
- 2026-10-07 | Revisi Home v1: standarisasi CSS token tombol CTA dan redesain floating button WhatsApp | T-76..T-79
- 2026-10-07 | Revisi Header Mobile v1: perbaikan offset hero overlap dan redesain drawer menu navigasi mobile | T-80..T-84
- 2026-10-09 | Revisi Home & Admin v3: media library universal picker modal, video banner YouTube, SweetAlert2 | T-85..T-90
- 2026-10-12 | Revisi Home & Admin v4: perbaikan display data merek, badge status admin, modal accessibility | T-91..T-95
- 2026-10-12 | Revisi Home v5: sistem dual-token background #FFFFFF & #F8FAFC, eliminasi total rona #FAF8FF | T-96..T-99
- 2026-10-12 | CMS Konten Homepage v1: manajemen tab intro, WCU, sertifikasi mutu, dan partial CTA global | T-100..T-107
- 2026-10-13 | Revisi About & Gallery v1: pembersihan data lokasi lama, statistik pabrik, timeline sejarah | T-108..T-121
- 2026-10-14 | Revisi Tentang Kami v2: Bento Mosaic Grid galeri berhalaman, animasi count-up, timeline hover | T-122..T-132
- 2026-10-14 | Revisi Tentang Kami v3: isolasi CSS galeri .abt-gal-*, engine transisi Anime.js, title_id nullable | T-133..T-139
- 2026-10-15 | Revisi Footer & Pengaturan v1: single source of truth alamat kontak dan visibilitas medsos dinamis | T-140..T-145
- 2026-10-15 | Revisi Kontak & Footer v1: hapus kartu WA di /contact, dual lokasi fax/email, form RFQ .cf-* | T-146..T-157
- 2026-10-17 | Rebrand Palet Hijau v1: migrasi seluruh palet biru ke hijau #00755A, #7CBE38, #00573F bebas rona biru | T-158..T-168
- 2026-10-19 | Homepage Major Update v1: 4 panel kategori primer .hcat-*, Why Choose Us .wcu-*, drop is_featured | T-169..T-181
- 2026-10-20 | Revisi Homepage CTA & Merek v1: Dual CTA banner hero slider dan strip marquee merek .brand-strip-* | T-182..T-191
- 2026-10-21 | Refaktor dokumentasi spesifikasi modular per domain, pemangkasan riwayat lama & workflow baru | -
- 2026-10-23 | Redesain Katalog Produk (PLP): sidebar kategori dinamis, debounced search, pengurutan, kartu potret minimalis .plp-*, load more AJAX | T-192..T-198
- 2026-10-23 | Redesain halaman detail produk: layout grid, gallery, tab deskripsi+tabel ukuran, admin field baru | T-199–T-203
- 2026-10-27 | Hapus field spesifikasi usang form admin produk & integrasi teks CTA kustom dwibahasa per produk | T-204..T-211
- 2026-10-27 | Tabel Ukuran Produk Dinamis: editor builder admin dinamis, migrasi SQL format JSON, API salin kolom, ekspor CSV gabungan, isolasi data, rendering publik responsif, dan QA E2E | T-212..T-219
- 2026-10-27 | Perbaikan Bug Ikon Tombol Close Modal Salin Kolom Admin: ganti entity &times; ke SVG simetris 14x14px | T-220
- 2026-10-27 | Perbaikan header: transisi blur top bar, animasi drawer mobile Anime.js, header solid putih detail produk & artikel, dan spacing offset | T-221..T-225
- 2026-10-28 | Redesain Modul Berita & Publikasi: breadcrumb unboxed G2, layout editorial detail G2, kartu bersama G4, headline slider G3 & mobile, filter tab Fetch API G4, share buttons domain euodoo.co.id, dan placeholder logo Euodoo putih | T-226..T-232
- 2026-10-28 | Revisi minor homepage: perapian header produk, transisi gradasi halus seksi, layout WCU mobile tanpa elemen penutup, penskalaan logo marquee mobile, dan centering kontrol slider hero laptop | T-233..T-237

- 2026-10-30 | Revisi Footer, WA Filter & Hero Sub-Page: show/hide kartu alamat, SSR rolling WA multi-nomor berbobot, dynamic repeater admin, filter hero sub-page jernih, dan audit Playwright E2E | T-238..T-244
- 2026-10-30 | Revisi bug CMS & Beranda v1: fix TinyMCE media picker, live search admin, preview hidden class, arrow nav size table, dan eliminasi fallback beranda | T-245..T-249
- 2026-10-31 | Revisi Detail Produk & Lightbox Galeri: kartu produk terkait seragam katalog, sembunyikan tab deskripsi, tabel ukuran langsung, lightbox PhotoSwipe v5 self-hosted di PDP & Bento About, fix rasio aspek portrait/landscape, dan audit regresi | T-250..T-254
- 2026-11-02 | Polish UI Dashboard Admin & Favicon: tombol .adm-btn-*, slug 1 baris, generator favicon circular badge 1:1, validasi form inline, SweetAlert2 bertema, adaptasi viewport pendek/mobile, dan audit regresi Playwright | T-255..T-261
- 2026-11-03 | Komponen dropdown kustom terpadu .eu-dd-* (3 varian WAI-ARIA), penskalaan 2x marquee merek, audit kontras WCAG AA/AAA, dan perbaikan sinkronisasi status inquiry table | T-262..T-269
- 2026-11-03 | Konvensi kode terstandarisasi, flat ESLint, skrip lint-views & lint-i18n, perbaikan sintaks HTML, serta refaktor modular view admin settings | T-270..T-276
- 2026-11-05 | Refaktor & modularisasi menyeluruh 16 batch view admin (66 berkas EJS, eliminasi style/hex/komentar, pemecahan partials <=100 baris, namespace CSS semantik .adm-*), penegakan 100% strict lint views admin, dan verifikasi non-regresi publik Playwright | T-277..T-293
- 2026-11-07 | Redesain Seksi Budaya Kerja (Nilai T-I-C-K-E-T) Menjadi Accordion Interaktif: Accordion desktop horizontal & mobile vertikal beranimasi Anime.js v3, integrasi CMS admin Tab 3 dengan foto latar opsional, whitelist 6 ikon SVG, akronim otomatis, dan audit kontras WCAG AA | T-294..T-300
- 2026-11-10 | Revisi Bug Hover Footer, RFQ Dashboard & Paginasi Bersama Varian 1: Eliminasi efek hover & penguncian kontras WCAG AA kartu alamat footer, penyederhanaan tabel RFQ dashboard LIMIT 10, komponen paginasi bersama Varian 1 .pgn-* terintegrasi tanpa reload pada inquiries & produk admin, penghapusan horizontal scroller desktop/mobile dengan mobile stacked cards, dan audit Playwright multi-viewport | T-301..T-306
- 2026-11-11 | Latar selang-seling About & News, filter geser mobile, judul headline dinamis, dan paginasi terpadu .pgn-* | T-307..T-312
- 2026-11-12 | Redesain counter statistik 2x2 ber-notch, horizontal timeline slider, header linimasa admin, dan uji Playwright E2E | T-313..T-317

- 2026-11-13 | Refaktor & modularisasi view publik Products, Product Detail, News & News Detail (ekstraksi partials, lokalisasi, .nwd-prose, news-detail.js, kontras AA, serta pembaruan tes regresi) | T-318..T-322
