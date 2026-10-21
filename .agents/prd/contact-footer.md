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
  2. **Kolom Kanan - Dual Lokasi Kantor & Peta Google Maps:**
     - **Kartu Head Office Jakarta:** Alamat Palmerah Selatan Suite 02-07, telepon, fax, dan email kantor pusat.
     - **Kartu Factory Bandung:** Alamat Paralon II No. 21 Cijerah/Cigondewah, hotline pabrik, fax, email pabrik, dan jam operasional kerja.
     - **Google Maps Embed Responsif (`.cf-maps-wrap`):** Iframe peta pabrik Cigondewah yang memuat interaktif tanpa memperlambat First Contentful Paint (`loading="lazy"`).

### FR-15: Floating Button WhatsApp & Pengaturan WA Global
- Tombol mengambang persisten di sudut kanan bawah seluruh halaman publik (`views/partials/whatsapp-btn.ejs`).
- Mengarahkan pengunjung ke obrolan WhatsApp resmi (`https://wa.me/<nomor>?text=<pesan>`).
- Pesan pembuka otomatis tersinkronisasi dwibahasa (ID: konsultasi penawaran kantong ramah lingkungan; EN: consultation inquiry).

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
