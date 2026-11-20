Status: ACTIVE | Terakhir diverifikasi: 2026-11-16 | Kode: views/public/contact.ejs, views/partials/contact/status-alerts.ejs, views/partials/contact/rfq-form.ejs, views/partials/contact/locations-map.ejs, public/js/contact.js, controllers/public/contactController.js, services/publicContactService.js, views/partials/footer.ejs

# Tech Spec: Modul Kontak, Footer & WhatsApp

## 1. Arsitektur & Komponen
Menangani penerimaan prospek B2B melalui formulir RFQ (`inquiries`), notifikasi email via Nodemailer, dual lokasi, footer global, dan floating WhatsApp dengan arsitektur berlapis `contactController` -> `services/publicContactService.js` -> Model/Mailer `[PENDING T-372]`.

---

## 2. Rute & Controller

| Method | Path | Controller | Middleware | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/contact` | `contactController.index` (`publicContactService`) `[PENDING T-372]` | `seoMiddleware`, `i18nMiddleware` | Render halaman Kontak (`<= 40` baris/fungsi, fetch produk+hero & fallback di `publicContactService`, pesan via `t('contact.*')`) |
| `POST` | `/contact` | `contactController.submit` (`publicContactService`) `[PENDING T-372]` | `leadLimiter`, `csrfMiddleware` | Proses RFQ via `publicContactService` (honeypot, normalisasi & validasi `company` max 100 / `message` 10..3000, guard `product_id` DB via `resolveProductSelection`, Turnstile, `persistAndNotifyInquiry` mailer background non-blocking, respons redirect/JSON `t('contact.*')`) |
| `POST` | `/leads` | `contactController.submit` (`publicContactService`) `[PENDING T-372]` | `leadLimiter`, `csrfMiddleware` | Alias kompatibilitas formulir |
| `GET` | `/admin/contact` | `contactCmsController.index` | `requireAuth`, `roleMiddleware(['superadmin','admin'])` | CMS teks hero kontak |
| `POST` | `/admin/contact` | `contactCmsController.update` | `requireAuth`, `roleMiddleware` | Update teks hero kontak |

---

## 3. Skema Data Terkait

### A. Tabel `inquiries`
*Migrasi:* `001_create_initial_schema.sql`, `003_upgrade_v2_schema.sql`

| Kolom | Tipe | Nullable | Default | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | Auto Inc | Primary Key |
| `type` | `ENUM('inquiry','partnership','general')` | YES | `'inquiry'` | Kategori permintaan B2B |
| `name` | `VARCHAR(100)` | NO | - | Nama pengirim |
| `company` | `VARCHAR(100)` | YES | NULL | Nama perusahaan |
| `email` | `VARCHAR(100)` | NO | - | Email bisnis |
| `phone` | `VARCHAR(30)` | NO | - | Telepon / WhatsApp |
| `product_id` | `INT` | YES | NULL | FK ke `products.id` |
| `quantity` | `VARCHAR(100)` | YES | NULL | Estimasi kebutuhan |
| `message` | `TEXT` | YES | NULL | Rincian pesan & spesifikasi |
| `source` | `ENUM('contact_form','wa_product')` | YES | `'contact_form'` | Kanal asal |
| `status` | `ENUM('baru','dibaca','ditindaklanjuti','ditolak')` | YES | `'baru'` | Status sales |
| `admin_notes` | `TEXT` | YES | NULL | Catatan internal |
| `ip_address` | `VARCHAR(45)` | YES | NULL | IP audit log |
| `created_at` | `TIMESTAMP` | YES | Current Time | Waktu submisi |

### B. Kunci Pengaturan Kontak & Footer (`settings`)
*Migrasi:* `009`, `010`, `011`, `019`
- Head Office: `office_name_*`, `office_address`, `office_phone`, `office_fax`, `office_email`, `office_card_visible` (`'1'`/`'0'`).
- Factory: `factory_name_*`, `factory_address`, `factory_phone`, `factory_fax`, `factory_email`, `factory_working_hours_*`, `factory_card_visible` (`'1'`/`'0'`).
- Maps: `contact_maps_embed_url` / `google_maps_embed`.
- Footer: `footer_desc_*` (maks 350), `footer_nav_links_json` (0–4 item; lihat [tech/settings-footer.md](settings-footer.md)).
- Medsos: `social_{facebook,instagram,linkedin,youtube}_{url,visible}`.
- WhatsApp: `whatsapp_number`, `whatsapp_default_message`, `whatsapp_default_message_en`, `whatsapp_formatted_number`, `whatsapp_numbers_json` (`number`, `formatted`, `label`, `percentage`).
- Global CTA: `global_cta_{title,subtitle,btn1,btn2}_*`, `global_cta_pages_json`, `global_cta_is_active`.

---

## 4. Komponen Antarmuka & Prefix CSS
- **Arsitektur Thin Page & Partial:**
  - `views/public/contact.ejs` (`<= 100` baris, nesting `<= 2`): bebas komentar HTML, inline style, dan `<script>` inline; penutup `</div>` `.page-hero-content.cf-hero-content` utuh; hero dirender via `<img class="page-hero-bg-img" fetchpriority="high" decoding="async">` + `.page-hero-scrim[data-scrim-level]`.
  - Partial (`<= 100` baris, nesting `<= 2`): `views/partials/contact/status-alerts.ejs` (`#form-status`), `views/partials/contact/rfq-form.ejs` (`#rfqForm`, `.cf-honeypot`, `company` `maxlength="100"`, `message` `minlength="10" maxlength="3000"`, `data-loading-text="<%= t('contact.loading_text') %>"`), dan `views/partials/contact/locations-map.ejs` (fallback `t('contact.*')`).
  - Validasi progresif klien di `public/js/contact.js` (`defer`, `<= 40` baris/fungsi, update tombol via `textContent` pada `.cf-submit-label`).
- **Prefix CSS (`.cf-*`, seluruh warna via `public/css/tokens.css`):** `.cf-hero-content`, `.cf-honeypot`, `.cf-split-grid`, `.cf-card-box`, `.cf-section`, `.cf-form-*`, `.cf-label*`, `.cf-input`, `.cf-select`, `.cf-textarea`, `.cf-btn-submit`, `.cf-alert*`, `.cf-office-*`, `.cf-link-primary`, `.cf-link-inherit` (mengunci `color: inherit`), `.cf-maps-wrap`, `.cf-maps-iframe`.
- **Footer & WA:** `.site-footer`, `.ft-main`, `.ft-desc`, `.ft-nav`, `.ft-offices`, `.ft-office-card`, `.ft-phone-val` (detail di [tech/footer.md](footer.md)); `.wa-float-*`.
- **Hero Scrim Sub-Page:** `.page-hero-bg-img` & `.page-hero-scrim[data-scrim-level]` selaras dengan slide 2 beranda dan kontras WCAG AA (`>= 4.5:1` teks normal, `>= 3.0:1` teks besar).

---

## 5. Keamanan & Logika Khusus
- **Proteksi Form:** `leadLimiter` (10 req/IP/15m), CSRF, honeypot `hp_website`, verifikasi product ID di DB, Cloudflare Turnstile, sanitasi/trim, dan mailer asinkron (`utils/mailer.js`).
- **Rolling WA Server-Side:** Jika `whatsapp_numbers_json` valid dengan total `percentage === 100`, pilih acak integer $R \in [1, 100]$ terhadap akumulasi bobot dan render satu nomor terpilih saja; fallback ke nomor tunggal legacy bila kosong/invalid.
