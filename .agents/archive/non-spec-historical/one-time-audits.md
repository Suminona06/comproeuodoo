# ARSIP: Hasil Audit Sekali Pakai (One-Time Audits)
**Sumber Asli:** `2-TECH-SPEC.md` (Bagian 8.7, 13.3, 15.5)  
**Tanggal Diarsipkan:** 2026-10-21  

---

## 1. Audit Dampak Data Lokasi (Tech Spec 8.7)
- **Tujuan:** Mengaudit dampak pembersihan lokasi operasional lama pada halaman Tentang Kami.
- **Hasil:** Data lokasi operasional lama pada tabel `about` tidak lagi dirender pada tampilan publik Tentang Kami. Informasi alamat fisik resmi dipusatkan pada dua lokasi legal: Head Office Palmerah (Jakarta Pusat) dan Factory Cigondewah (Bandung) via pengaturan situs global.

---

## 2. Audit Dependensi & Pembersihan Modul WhatsApp Kontak (Tech Spec 13.3)
- **Tujuan:** Memeriksa ketergantungan tampilan kartu WhatsApp di halaman `/contact`.
- **Hasil:** Kartu WhatsApp publik di sidebar `/contact` dihapus demi memfokuskan alur B2B RFQ form resmi. Komponen floating WhatsApp button (`views/partials/whatsapp-btn.ejs`) dan pengaturan nomor WA global (`settings`) tetap aktif untuk konsultasi cepat pengunjung di seluruh situs.

---

## 3. Audit Ketergantungan Flag Unggulan is_featured (Tech Spec 15.5)
- **Tujuan:** Menemukan seluruh query, model, view, dan controller yang bergantung pada kolom `products.is_featured`.
- **Hasil:** Homepage tidak lagi menampilkan kartu produk individual unggulan, melainkan beralih ke 4 Panel Kategori Primer (`.hcat-*`). Kolom `is_featured` dinyatakan obsolete dan di-drop via migrasi `011_drop_product_is_featured.sql`.
