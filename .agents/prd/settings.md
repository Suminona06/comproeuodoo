Status: ACTIVE | Terakhir diverifikasi: 2026-11-03 | Kode: controllers/admin/settingController.js, views/admin/settings/, models/settingModel.js

# PRD: Modul Pengaturan Situs (Site Settings)

## 1. Ringkasan & Ruang Lingkup
Modul Pengaturan Situs berfungsi sebagai pusat kendali variabel global aplikasi yang mengatur identitas korporat, aset branding, kontak resmi dual lokasi, tautan dan visibilitas media sosial, serta parameter WhatsApp.

---

## 2. Functional Requirements

### FR-22: Pengelolaan Pengaturan Global di CMS
- Dikelola melalui antarmuka khusus di `/admin/settings` (khusus peran Superadmin).
- Fitur konfigurasi terbagi dalam 4 kelompok:
  1. **Identitas & Branding Perusahaan:**
     - Nama Perusahaan (`company_name`), Tagline Perusahaan dwibahasa (`company_tagline_id`, `company_tagline_en`).
     - Unggah/Pilih Favicon Situs (`site_favicon`): kolom unggah/pilih khusus **simbol logo persegi `1:1` tanpa teks** yang terpisah dari Logo Utama, dengan fallback otomatis ke Logo Utama bila Favicon khusus dikosongkan. Sistem wajib mempertahankan proporsi asli simbol (`fit: 'contain'`, latar transparan, padding seimbang) tanpa distorsi/gepeng, serta menghasilkan paket ukuran ikon standar (`16x16`, `32x32`, `180x180` Apple Touch Icon, `192x192`, dan `512x512` PNG) untuk halaman publik maupun dashboard admin.
     - Unggah Logo Header (`site_logo_header`): logo berlatar transparan untuk bilah navigasi atas.
     - Unggah Logo Footer (`site_logo_footer`): logo dengan kontras tinggi untuk latar belakang hijau gelap footer.
  2. **Kontak & Alamat Dual Lokasi Resmi:**
     - **Head Office Jakarta:** Nama kantor (`office_name_*`), alamat lengkap (`office_address`), telepon (`office_phone`), fax (`office_fax`), email (`office_email`). Toggle switch visibilitas kartu alamat di footer & kontak publik (`office_card_visible`, default: aktif `'1'`).
     - **Factory Bandung:** Nama pabrik (`factory_name_*`), alamat pabrik (`factory_address`), telepon hotline (`factory_phone`), fax (`factory_fax`), email pabrik (`factory_email`), jam operasional kerja (`factory_working_hours_*`). Toggle switch visibilitas kartu alamat di footer & kontak publik (`factory_card_visible`, default: aktif `'1'`).
     - URL Embed Google Maps resmi (`google_maps_embed` / `contact_maps_embed_url`).
  3. **Visibilitas Media Sosial Dinamis:**
     - Konfigurasi URL dan toggle aktif/nonaktif independen untuk 4 platform: Facebook (`social_facebook_url`, `social_facebook_visible`), Instagram (`social_instagram_url`, `social_instagram_visible`), LinkedIn (`social_linkedin_url`, `social_linkedin_visible`), dan YouTube (`social_youtube_url`, `social_youtube_visible`).
     - Ikon media sosial di footer hanya tampil jika toggle visibilitas bernilai aktif (`1`).
  4. **Pengaturan Layanan WhatsApp:**
     - Nomor resmi WhatsApp (`whatsapp_number`), format nomor internasional (`whatsapp_formatted_number`).
     - Dynamic repeater multi-nomor WhatsApp rolling (`whatsapp_numbers_json`) dengan alokasi bobot persentase total wajib 100%, input nomor telepon, dan label internal admin.
     - Pesan salam pembuka default (`whatsapp_default_message`, `whatsapp_default_message_en`).
     - Tema tampilan tombol (`whatsapp_button_theme`).

### FR-23: Manajemen Konten Footer Publik (`/admin/settings`) `[PENDING T-324]`
- Menambahkan kartu konfigurasi ke-5/6 berjudul **Konten Footer Publik** pada `/admin/settings` (khusus Superadmin) dengan antarmuka Bahasa Indonesia baku:
  1. **Deskripsi Footer Dwibahasa:** Input teks deskripsi Bahasa Indonesia (`footer_desc_id`) dan Bahasa Inggris (`footer_desc_en`) dengan batas maksimal `350` karakter per bahasa dan penghitung karakter langsung, terpisah sepenuhnya dari `meta_description_*` SEO global.
  2. **Repeater Menu Footer Kanan (`0–4` Item):** Pengelola daftar tautan dinamis (`footer_nav_links_json`) sebanyak `0` hingga maksimal `4` item dengan field **Label (ID)** (`<= 80` char), **Label (EN)** (`<= 80` char), **URL Tujuan** (`<= 255` char; mendukung path internal `/...` / `#...` maupun URL eksternal `https://...` / `http://...`), kontrol **Naik/Turun** urutan, tombol **Hapus**, state kosong informatif saat `0` item, serta penonaktifan tombol **Tambah Menu** saat sudah mencapai `4` item.

---

## 3. Keputusan Desain & Fungsional Terkunci

| Keputusan | Alasan 1 Kalimat | Tanggal |
| :--- | :--- | :--- |
| **Favicon Simbol Logo Persegi 1:1 & Fallback Otomatis** | Memastikan ikon tab browser tampil tajam dan proporsional tanpa terdistorsi oleh teks logo horizontal. | 2026-11-02 |
| **Pemisahan Berkas Logo Header & Logo Footer** | Menjamin keterbacaan logo di atas bilah navigasi terang maupun di atas permukaan footer hijau gelap. | 2026-10-06 |
| **Toggle Visibilitas Media Sosial per Akun** | Memungkinkan penyembunyian tautan akun media sosial yang sedang dalam tahap kurasi konten tanpa menghapus URL yang tersimpan. | 2026-10-15 |
| **Akses Terbatas Khusus Superadmin** | Melindungi integritas legalitas kontak korporat dari modifikasi yang tidak diotorisasi. | 2026-10-05 |
| **Toggle Switch Kustom Alamat Dual Lokasi** | Mempertahankan konsistensi UX admin yang seirama dengan toggle switch media sosial yang sudah ada. | 2026-10-30 |
| **Repeater WhatsApp Dinamis & Validasi Total 100%** | Memastikan pembagian beban rotasi kontak terdistribusi secara presisi tanpa risiko persentase parsial atau berlebih. | 2026-10-30 |
| **Pemisahan `footer_desc_*` & Repeater 0–4 Menu Footer `[PENDING T-323]` `[PENDING T-324]`** | Menjaga pengaturan footer terpusat di `/admin/settings` tanpa mengubah metadata SEO `meta_description_*` dan aman lewat whitelist URL ketat. | 2026-11-13 |
