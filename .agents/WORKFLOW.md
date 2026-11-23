# ALUR KERJA PERUBAHAN SPESIFIKASI PT EUODOO

Ikuti 5 langkah berurutan untuk setiap perubahan fitur atau perilaku. Tahap 3, tiap task di Tahap 4, dan Tahap 5 dijalankan pada **sesi/conversation terpisah** untuk menjaga kebersihan konteks.

1. **PROPOSE (High Tier — Read-Only Kode & Spek):** Buat `changes/<YYYY-MM-DD>_<slug>.md` berisi:
   - Konteks singkat (maksimal 3 baris).
   - Delta spesifikasi per modul (hanya bagian yang berubah, tanpa hex — rujuk token).
   - Keputusan terbuka untuk Azis (opsi + rekomendasi singkat; agent dilarang berasumsi).
   - Rencana task atomik (**Medium-Ready**, lanjutkan nomor aktif dari `3-TASKS.md`):
     - Maksimal **2–4 file** per task (pisahkan layer Backend/i18n, Logic JS/EJS, CSS/Polish, dan E2E Test).
     - Wajib tag `[Tier: Hydrogen Medium]`, `[Tier: Argon Medium]`, atau `[Tier: High]`.
     - Deskripsi wajib **daftar bernomor** (bila >3 langkah) + **Kontrak Data Eksplisit** (field/payload/class/key i18n/HTTP status).
     - Wajib sebutkan **Referensi Pola** (1 file/fungsi existing), **Batasan Negatif**, maks **1–2 skill** relevan, dan perintah **Verifikasi Deterministik**.
   - _Catatan: Modul di `prd/`, `tech/`, `3-TASKS.md`, dan kode BELUM boleh diedit pada tahap ini._

2. **APPROVE:** Tunggu jawaban Azis atas keputusan terbuka. Setelah dijawab, perbarui proposal di tempat lalu tunggu persetujuan final sebelum lanjut ke Tahap 3.

3. **MERGE KE SPEC (Sesi Terpisah — Tanpa Edit Kode):** Baru boleh dijalankan setelah persetujuan final Azis.
   - Edit modul `prd/` dan `tech/` terkait **DI TEMPAT** (timpa kondisi lama, tanpa narasi riwayat). Tandai bagian baru dengan `[PENDING T-xxx]`.
   - Daftarkan seluruh task (lengkap dengan Tag Tier, langkah bernomor, kontrak data, referensi pola, batasan, skill, dan verifikasi) ke `3-TASKS.md`.
   - **BERHENTI** setelah daftar task selesai ditulis; jangan langsung mengerjakan kode.

4. **IMPLEMENT (1 Conversation Baru = 1 Task Atomik):** Kerjakan **hanya 1 task (`T-xxx`)** per sesi sesuai Tag Tier-nya.
   - Baca hanya `T-xxx` di `3-TASKS.md`, bagian terkait di `tech/` + `conventions.md`, file terdampak, dan referensi pola.
   - Jalankan seluruh perintah verifikasi pada task (`npm run lint`, `npm run lint:views`, `npm run lint:i18n`, unit/Playwright test sesuai scope).
   - **Batas Retry:** jika verifikasi gagal, perbaiki **maksimal 2 iterasi**. Jika masih gagal, **BERHENTI** dan laporkan error mentah tanpa mengubah file di luar scope.
   - Jika lulus 100%, tandai `T-xxx` sebagai `[DONE]` di `3-TASKS.md`, lalu **BERHENTI** (dilarang lanjut ke task berikutnya atau menjalankan Close).

5. **QA REGRESI & CLOSE (Sesi Terpisah — Setelah Seluruh Task `[DONE]`):**
   - Jalankan gerbang kualitas penuh (`npm run lint`, `npm run lint:views`, `npm run lint:i18n`, unit test & Playwright terkait). Jika ada error, berhenti dan laporkan sebelum Close.
   - Hapus penanda `[PENDING T-xxx]` di modul `prd/` dan `tech/` terkait.
   - Pindahkan berkas proposal dari `changes/` ke `archive/`.
   - Pindahkan task selesai dari `3-TASKS.md` ke `archive/tasks-index-full.md`.
   - Perbarui tanggal verifikasi di modul terkait dan `INDEX.md`.
   - Tambahkan 1 baris entri di `CHANGELOG.md` (`tanggal | ringkas | T-xxx`).

### Aturan Berdasarkan Jenis Perubahan

- **Bug Fix (tanpa ubah spek):**
  - _Tahap 1 (Read-Only):_ Investigasi akar masalah dan susun draf task atomik (2–4 file, tag Tier, verifikasi), tunggu persetujuan Azis.
  - _Tahap 2 (Sesi Baru):_ Daftarkan ke `3-TASKS.md`, perbaiki hanya file terdampak, verifikasi (maks 2 retry), lalu Close ke `archive/tasks-index-full.md` & `CHANGELOG.md`.
  - Jika investigasi menunjukkan spek harus berubah, hentikan dan beralih ke alur Propose.
- **Ubah Perilaku Fitur:** Alur Propose &rarr; Approve &rarr; Merge &rarr; Implement (per task) &rarr; Close.
- **Fitur Baru:** Propose &rarr; Approve &rarr; Tambah seksi di modul (atau modul baru + update `INDEX.md`).
- **Fitur Dihapus:** Pindahkan seksi spek terkait ke `archive/` (bukan menandai deprecated).
- **Batas Ukuran:** File modul maksimal ~8KB, `INDEX.md` maksimal 60 baris. Lewat batas &rarr; wajib dipecah.
