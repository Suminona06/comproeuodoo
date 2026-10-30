Status: ACTIVE | Terakhir diverifikasi: 2026-10-21 | Kode: views/public/contact.ejs, views/partials/footer.ejs, views/partials/cta-global.ejs

# PRD: Modul Kontak, Footer & WhatsApp (Contact, Footer & WhatsApp)

## 1. Ringkasan & Ruang Lingkup
Modul Kontak & Footer menangani saluran komunikasi konversi prospek B2B, penanganan formulir Request for Quotation (RFQ), floating button WhatsApp, navigasi penutup footer, dan banner pre-footer call-to-action di seluruh situs.

---

## 2. Functional Requirements

### FR-14: Halaman Kontak Publik & Formulir RFQ (`/contact`)
- Sistem merender antarmuka kontak terpisah dua kolom di `/contact`:
  1. **Kolom Kiri - Formulir RFQ Terisolasi (`.cf-*`):**
     - Field input: Nama Lengkap (`name`, required, max 100), Nama Perusahaan (`company`, optional, max 100), Email Bisnis (`email`, required, email format), Nomor Telepon/WhatsApp (`phone`, required, min 7 max 30).
     - Pilihan Produk Terkait (`product_id` dropdown dengan opsi auto-select).
     - Estimasi Kuantitas Kebutuhan (`quantity`, misal "100.000 pcs / 5 ton").
     - Jenis Permintaan (`type`: Permintaan Penawaran / RFQ, Kemitraan Distributor, Pertanyaan Umum).
     - Pesan Detail / Spesifikasi Custom (`message`, required, max 2000).
     - Tombol Submit dengan indikator validasi interaktif dan proteksi anti-spam.
  2. **Kolom Kanan - Dual Lokasi Kantor & Peta Google Maps [PENDING T-241]:**
     - **Kartu Head Office Jakarta:** Alamat Palmerah Selatan Suite 02-07, telepon, fax, dan email kantor pusat. Ditampilkan kondisional jika setting `office_card_visible = '1'`.
     - **Kartu Factory Bandung:** Alamat Paralon II No. 21 Cijerah/Cigondewah, hotline pabrik, fax, email pabrik, dan jam operasional kerja. Ditampilkan kondisional jika setting `factory_card_visible = '1'`.
     - **Sematan Peta Google Maps Responsif (`.cf-maps-wrap`):** Iframe peta pabrik Cigondewah yang memuat interaktif (`loading="lazy"`). Jika kedua kartu alamat dinonaktifkan, peta mengambil ruang penuh secara proporsional tanpa kekosongan visual atau layout shift.

### FR-15: Floating Button WhatsApp & Pengaturan WA Global [PENDING T-242]
- Tombol mengambang persisten di sudut kanan bawah seluruh halaman publik (`views/partials/whatsapp-btn.ejs`).
- Mengarahkan pengunjung ke obrolan WhatsApp resmi (`https://wa.me/<nomor_terpilih>?text=<pesan>`) berbasis algoritma pemilihan acak berbobot di sisi server (SSR weighted rolling).
- Pesan pembuka otomatis tersinkronisasi dwibahasa (ID: konsultasi penawaran kantong ramah lingkungan; EN: consultation inquiry).
- Mendukung fallback otomatis ke nomor tunggal legacy jika pengaturan multi-nomor belum dikonfigurasi.

### FR-24: Kendali Visibilitas Kartu Alamat Dual Lokasi di Publik [PENDING T-241]
- Kartu alamat Head Office Jakarta dan Factory Bandung dikendalikan secara independen melalui konfigurasi CMS admin (`office_card_visible` dan `factory_card_visible`).
- Pada footer (`views/partials/footer.ejs`), kartu dirender kondisional. Apabila kedua kartu dinonaktifkan, pembungkus `.ft-offices` tidak dirender ke DOM untuk mencegah celah kosong atau pergeseran tata letak.

### FR-25: Distribusi Rolling Floating WhatsApp Multi-Nomor Berbasis Persentase [PENDING T-242]
- Sistem mendistribusikan beban prospek B2B ke multi-nomor sales/CS berdasarkan persentase bobot integer kumulatif (total wajib 100%).
- Pemilihan nomor dilakukan secara berbobot saat server merender halaman (SSR). Hanya nomor terpilih yang dicetak ke markup HTML publik; nomor lain tidak terekspos. Tooltip publik tetap menggunakan teks standar dwibahasa tanpa membocorkan label internal.

### FR-26: Standardisasi Filter/Overlay Hero Banner Sub-Page [PENDING T-243]
- Tampilan filter overlay gelap pekat pada hero banner sub-page (Products, News, Contact, dan About) diselaraskan secara visual dengan estetika hero banner beranda slide ke-2 (slide gambar pabrik).
- Gambar latar belakang fasilitas pabrik terlihat jernih dan nyata, aksen hijau brand (`var(--color-primary-dark)` / `var(--color-primary)`) berbaur secara lembut, dan seluruh teks judul, subjudul, serta remah roti (*breadcrumb*) memenuhi batas rasio kontras aksesibilitas WCAG AA (minimal 4.5:1 untuk teks normal dan 3.0:1 untuk teks tebal/besar).

### Global Pre-Footer Call to Action (`.sec-cta`)
- Komponen banner ajakan bertindak sebelum footer (`views/partials/cta-global.ejs`).
- Menampilkan headline ajakan konsultasi B2B dan 2 tombol aksi:
  - Tombol 1: Jelajahi Katalog Produk (`/products`).
  - Tombol 2: Hubungi Sales via WhatsApp.
- Dapat diaktifkan/dinonaktifkan per halaman melalui konfigurasi CMS `global_cta_pages_json`.

### Master Site Footer (`.site-footer`)
- Footer global bernuansa hijau gelap (`#00573F`) dengan komponen:
  1. Identitas perusahaan, deskripsi singkat, dan logo footer.
  2. Tautan cepat navigasi situs (Beranda, Tentang Kami, Produk, Kapabilitas, Berita, Kontak).
  3. Informasi kontak dual lokasi (Palmerah & Cigondewah) dengan nomor fax dan email yang dapat diklik langsung (`tel:`, `mailto:`).
  4. Deretan ikon media sosial resmi dengan visibilitas dinamis yang dikendalikan dari CMS (Facebook, Instagram, LinkedIn, YouTube).
  5. Hak cipta hukum dan penandaan standar ramah lingkungan.

---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan | Alasan 1 Kalimat | Tanggal |
| :--- | :--- | :--- |
| **Penghapusan Kartu WhatsApp di Body `/contact`** | Mencegah kanibalisasi formulir RFQ resmi dan memastikan data prospek tersimpan rapi di database. | 2026-10-15 |
| **Penyajian Fax & Email Dual Lokasi Terpisah** | Memperjelas jalur korespondensi administratif (Head Office Jakarta) vs jalur logistik pabrik (Factory Bandung). | 2026-10-15 |
| **Isolasi CSS Form Kontak (`.cf-*`)** | Mencegah kebocoran styling antara formulir kontak dengan halaman beranda dan admin. | 2026-10-15 |
| **Single Source of Truth Alamat & Kontak Global** | Mengeliminasi inkonsistensi nomor kontak antara halaman Kontak, footer, dan floating WhatsApp. | 2026-10-15 |
| **Kendali Visibilitas Kartu Alamat Terpisah [PENDING T-241]** | Memungkinkan penyembunyian kartu kantor atau pabrik secara independen tanpa menimbulkan celah kosong atau pergeseran tata letak. | 2026-10-29 |
| **Rotasi Rolling WA Server-Side Berbobot [PENDING T-242]** | Membagi beban konversi sales secara proporsional sekaligus melindungi privasi kontak tanpa membocorkan daftar nomor ke DOM publik. | 2026-10-29 |
| **Standardisasi Filter Hero Sub-Page Jernih [PENDING T-243]** | Menyeragamkan visual hero sub-page dengan slide gambar pabrik beranda sehingga aset visual tampil jernih dengan aksen hijau lembut. | 2026-10-29 |
