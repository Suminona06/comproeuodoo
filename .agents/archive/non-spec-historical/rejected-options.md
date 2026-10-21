# ARSIP: Komparasi Opsi Desain & Skema yang Ditolak
**Sumber Asli:** `2-TECH-SPEC.md` (Revisi V4, V5, V6, Bagian 15)  
**Tanggal Diarsipkan:** 2026-10-21  

---

## 1. Komparasi Skema Penyimpanan Data Konten Homepage (Tech Spec V6 B.1 Bagian 1)
- **Opsi A (Kolom JSON dalam tabel tunggal):** Ditolak karena menyulitkan pengindeksan parsial dan pencarian terjemahan teks secara langsung.
- **Opsi B (Tabel Relasional Terpisah per Section):** Ditolak karena menambah overhead join kueri yang berlebihan untuk data beranda yang bersifat semi-statis.
- **Opsi C (Key-Value dalam Tabel Settings - DIPILIH):** Menyimpan properti section (`home_intro_*`, `home_wcu_*`, `home_cert_*`) dalam tabel `settings`.

---

## 2. Komparasi Tata Letak Merek Beranda (Tech Spec V4 B.1 Bagian 3)
- **Opsi I (Grid Kartu Multi-Baris):** Ditolak karena memakan ruang vertikal berlebih pada beranda dan terasa statis kaku.
- **Opsi II (Continuous Seamless Logo Ribbon / Strip Marquee - DIPILIH):** Menampilkan deretan logo berjalan kontinu dengan duplikasi track dan pause on hover.

---

## 3. Komparasi Card Separation & Latar Belakang (Tech Spec V5 B.1 Bagian 3 & 4)
- **Opsi 1B (Border Tebal Kontras Tinggi):** Ditolak karena visual terasa berat dan tidak selaras dengan prinsip antarmuka industrial modern.
- **Opsi 2A (Soft Shadow + Surface Container Ringan - DIPILIH):** Pemisahan kartu halus menggunakan dual-token background `#FFFFFF` dan `#F8FAFC`.

---

## 4. Komparasi Arsitektur Homepage Major Update v1 (Tech Spec Bagian 15 B.1)
- **Opsi 1 s/d Opsi 4 (Penyusunan Ulang Hero / Reduksi Section Ekstrem):** Ditolak karena merusak hierarki konversi B2B perusahaan.
- **Opsi 5 Opsi B (4 Panel Kategori Primer + Editorial Why Choose Us - DIPILIH):** Menggantikan 3 pilar lama dan featured products dengan 4 panel kategori dan narasi material ramah lingkungan.
