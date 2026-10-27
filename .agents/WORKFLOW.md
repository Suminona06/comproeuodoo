# ALUR KERJA PERUBAHAN SPESIFIKASI PT EUODOO

Ikuti 5 langkah berurutan untuk setiap perubahan fitur atau perilaku:

1. **PROPOSE:** Buat `changes/<YYYY-MM-DD>_<slug>.md` berisi:
   - Konteks singkat (maksimal 3 baris).
   - Delta spesifikasi per modul (hanya bagian yang berubah, bukan salin ulang).
   - Keputusan terbuka untuk Azis (jika ada ambigu, agent wajib bertanya).
   - Rencana nomor task (lanjutkan penomoran aktif dari `3-TASKS.md`).
     _Catatan: Modul di `prd/` dan `tech/` BELUM diedit pada tahap ini._
2. **APPROVE:** Tunggu persetujuan Azis dan jawaban atas keputusan terbuka.
3. **MERGE KE SPEC:** Baru boleh merge setelah konfirmasi dan persetujuan Azis. Edit modul PRD/Tech terkait **DI TEMPAT** (timpa kondisi lama). Tandai bagian baru dengan `[PENDING T-xxx]`. Daftarkan task baru ke `3-TASKS.md`.
4. **IMPLEMENT:** Baru boleh implement setelah konfirmasi dan persetujuan Azis. Kerjakan kode aplikasi dan centang task yang tuntas.
5. **CLOSE (Sesi yang Sama):**
   - Hapus penanda `[PENDING T-xxx]` di modul terkait.
   - Pindahkan berkas proposal dari `changes/` ke `archive/`.
   - Pindahkan task selesai dari `3-TASKS.md` ke `archive/tasks-index-full.md`.
   - Perbarui tanggal verifikasi di modul terkait dan `INDEX.md`.
   - Tambahkan 1 baris entri di `CHANGELOG.md` (`tanggal | ringkas | T-xxx`).

### Aturan Berdasarkan Jenis Perubahan

- **Bug Fix (tanpa ubah spek):** Langsung buat task di `3-TASKS.md`, spek tidak diedit.
- **Ubah Perilaku Fitur:** Alur Propose &rarr; Approve &rarr; Timpa modul terkait di tempat.
- **Fitur Baru:** Propose &rarr; Approve &rarr; Tambah seksi di modul (atau modul baru + update `INDEX.md`).
- **Fitur Dihapus:** Pindahkan seksi spek terkait ke `archive/` (bukan menandai deprecated).
- **Batas Ukuran:** File modul maksimal ~8KB, `INDEX.md` maksimal 60 baris. Lewat batas &rarr; wajib dipecah.
