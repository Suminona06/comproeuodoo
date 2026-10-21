# ARSIP: Acceptance Criteria & Checklist QA per Revisi
**Sumber Asli:** `1-PRD.md` (11.7, 12.8, 13.3, 14.4, 15.5, 16.3) & `2-TECH-SPEC.md` (V6 C.2)  
**Tanggal Diarsipkan:** 2026-10-21  

---

## 1. Acceptance Criteria CMS Konten Homepage v1 (PRD 11.7 / Tech V6 C.2)
- Form CMS Konten Homepage beroperasi dengan tab dinamis (Intro, WCU, Sertifikasi).
- Validasi server side dan CSRF protection terverifikasi aktif pada endpoint POST `/admin/home-content`.
- Tampilan publik beranda merender data dari database dengan fallback aman saat data kosong.

---

## 2. Acceptance Criteria Revisi Tentang Kami & Galeri v1-v3 (PRD 12.8)
- Paginasi galeri mosaik bento berjalan mulus di desktop (6 tile) dan mobile (4 tile).
- Nilai statistik menampilkan animasi count-up saat memasuki viewport.
- Hover timeline sejarah memberikan transisi kartu interaktif.
- Judul galeri bersifat opsional (`title_id` nullable via migrasi `008`).

---

## 3. Acceptance Criteria Revisi Footer & Pengaturan v1 (PRD 13.3)
- Ikon media sosial footer dapat diaktifkan/dinonaktifkan secara independen via pengaturan CMS.
- Alamat Head Office dan Factory tersinkronisasi dari satu sumber pengaturan.
- Rona warna footer selaras dengan standar palet hijau gelap `#00573F`.

---

## 4. Acceptance Criteria Revisi Kontak & Footer v1 (PRD 14.4)
- Kartu WhatsApp di `/contact` berhasil dihapus tanpa merusak floating button WA global.
- Formulir kontak RFQ menggunakan class isolasi `.cf-*` dengan validasi bilingual.
- Informasi nomor fax dan email terpisah per kantor (Head Office & Factory).

---

## 5. Acceptance Criteria Homepage Major Update v1 (PRD 15.5)
- 4 Panel Kategori Primer (`.hcat-*`) tampil proporsional dan memiliki deep-link filter ke `/products?category=<slug>`.
- Section Why Choose Us (`.wcu-*`) merender teks editorial, kicker chip, dan visual SVG statis bebas layout shift.
- Kolom `is_featured` terhapus tanpa error pada katalog produk admin dan publik.

---

## 6. Acceptance Criteria Dual CTA Hero & Marquee Merek v1 (PRD 16.3)
- Slider hero banner mendukung tombol sekunder opsional dengan tautan aman (HTTP/HTTPS/relatif/tel/mailto/wa.me).
- Marquee merek bergulir kontinu dengan duplikasi track dan pause on hover/focus.
- Lightbox preview zoom merek (`#brandPreviewModal`) tetap berfungsi penuh via klik logo atau keyboard Space/Enter.
