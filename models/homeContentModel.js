import settingModel from './settingModel.js';
import { clearSettingsCache } from '../middleware/settingsMiddleware.js';
import logger from '../utils/logger.js';

export const homeContentModel = {
  getDefaults() {
    return {
      intro: {
        eyebrow_id: 'TENTANG PT EUODOO',
        eyebrow_en: 'ABOUT PT EUODOO',
        title_id: 'Dedikasi Manufaktur Plastik Berkualitas Sejak 1990',
        title_en: 'Over Three Decades of Plastic Film Manufacturing Excellence',
        paragraph_1_id: 'Sejak berdiri pada tahun 1990 di Bandung, Jawa Barat (bermula dari PT Sahabat Baru dan PT Pelita Baru), PT EUODOO telah memproduksi kantong plastik HDPE dan LLDPE berkualitas tinggi untuk jaringan ritel modern, pasar grosir tradisional, dan sektor industri nasional.',
        paragraph_1_en: 'Since our founding in 1990 in Bandung, West Java (originating from PT Sahabat Baru and PT Pelita Baru), PT EUODOO has been producing high-grade HDPE and LLDPE plastic bags for modern retail chains, traditional wholesale hubs, and industrial sectors.',
        paragraph_2_id: 'Dengan fasilitas produksi berkapasitas tinggi di Cigondewah dan kantor manajemen di Palmerah Jakarta, kami menggabungkan teknologi ekstrusi film mutakhir, formula ramah lingkungan 100% degradable berstandar SNI, serta ketelitian presisi demi kepuasan mitra usaha di seluruh Indonesia.',
        paragraph_2_en: 'With high-capacity production facilities in Cigondewah and corporate offices in Palmerah Jakarta, we integrate advanced blown film extrusion lines, certified 100% degradable formulations under SNI standards, and strict quality control for partners across Indonesia.',
        image_url: '',
        is_active: 1
      },
      pillars: {
        title_id: 'Tiga Pilar Keunggulan Kami',
        title_en: 'Three Pillars of Manufacturing Excellence',
        subtitle_id: 'Komitmen menyeluruh dalam menghadirkan standar mutu plastik terdepan bagi mitra B2B.',
        subtitle_en: 'Our unwavering commitment to precision, production capacity, and environmental sustainability.',
        is_active: 1,
        items: [
          {
            icon: 'factory',
            title_id: 'Teknologi & Kapasitas Produksi',
            title_en: 'High-Volume Production Capacity',
            desc_id: 'Didukung deretan mesin ekstrusi multi-layer modern dan converting line berkecepatan tinggi di Cigondewah untuk menjamin ketepatan jadwal pasokan skala besar.',
            desc_en: 'Equipped with multi-layer blown film extruders, automated precision bag-making lines, and multi-color flexographic printing machines.',
            sort_order: 1,
            is_active: 1
          },
          {
            icon: 'shield',
            title_id: 'Standar Mutu & Presisi Konsisten',
            title_en: 'Consistent Quality & Precision',
            desc_id: 'Penerapan kontrol kualitas berkala meliputi uji ketahanan jatuh (drop-test), segel anti-bocor star-seal, dan ketebalan mikron yang konsisten di setiap batch.',
            desc_en: 'Rigorous quality control protocols verifying tensile elongation, drop-impact resistance, seal integrity, and micron uniformity.',
            sort_order: 2,
            is_active: 1
          },
          {
            icon: 'leaf',
            title_id: 'Solusi Ramah Lingkungan OXIUM',
            title_en: 'Sustainable OXIUM® Degradable',
            desc_id: 'Pionir penerapan aditif OXIUM teruji 100% terdegradasi menjadi biomassa dan air tanpa menyisakan mikroplastik berbahaya, berstandar resmi SNI.',
            desc_en: 'Certified 100% degradable technology tested under US ASTM D6954 standards and Indonesian Green Label SNI 7188.7:2011.',
            sort_order: 3,
            is_active: 1
          }
        ]
      },
      certifications: {
        title_id: 'Sertifikasi Mutu & Komitmen Lingkungan',
        title_en: 'Verified Quality & Eco-Certifications',
        body_id: 'Standar produksi kami didukung sertifikasi resmi nasional dan pengujian laboratorium terakreditasi, memastikan setiap produk aman digunakan, kuat, dan memenuhi regulasi ramah lingkungan.',
        body_en: 'Our manufacturing processes strictly comply with national standards and certified laboratory testing, ensuring packaging safety, durability, and full regulatory compliance.',
        btn_text_id: 'Pelajari Detail Sertifikasi',
        btn_text_en: 'Learn More About Certifications',
        btn_url: '/about#sertifikasi',
        show_btn: 1,
        is_active: 1,
        items: [
          {
            name: 'SNI 7188.7:2011',
            desc_id: 'Standar Nasional Indonesia untuk kantong belanja mudah terurai',
            desc_en: 'Indonesian National Standard for degradable shopping bags',
            logo_url: '',
            sort_order: 1,
            is_active: 1
          },
          {
            name: 'OXIUM® Technology',
            desc_id: 'Formula degradasi alami berstandar internasional ASTM D6954',
            desc_en: 'US ASTM D6954 certified oxo-biodegradable formulation',
            logo_url: '',
            sort_order: 2,
            is_active: 1
          },
          {
            name: 'InSWA Eco Label',
            desc_id: 'Sertifikasi Resmi Asosiasi Pengelolaan Sampah Indonesia',
            desc_en: 'Endorsed by Indonesia Solid Waste Association',
            logo_url: '',
            sort_order: 3,
            is_active: 1
          },
          {
            name: 'Virgin Food-Grade Contact',
            desc_id: 'Bahan baku murni higienis aman untuk produk pangan dan retail',
            desc_en: 'Pure non-recycled polymers safe for food contact',
            logo_url: '',
            sort_order: 4,
            is_active: 1
          }
        ]
      },
      cta: {
        title_id: 'Mulai Kemitraan Manufaktur Bersama PT. EUODOO',
        title_en: 'Start Your Manufacturing Partnership with PT. EUODOO',
        subtitle_id: 'Konsultasikan kebutuhan spesifikasi kantong plastik, ukuran kustom, dan volume pesanan bisnis Anda bersama tim teknis dan pemasaran kami.',
        subtitle_en: 'Consult with our experienced production and engineering team to develop custom plastic bag packaging tailored to your brand, strength parameters, and delivery schedules.',
        btn1_title_id: 'Hubungi Tim Pemasaran',
        btn1_title_en: 'Contact Sales & Engineering',
        btn1_sub_id: 'Formulir penawaran harga dan konsultasi',
        btn1_sub_en: 'Submit RFQ form and technical inquiries',
        btn1_url: '/contact',
        btn2_title_id: 'Kirim Pesan WhatsApp',
        btn2_title_en: 'Direct WhatsApp Consultation',
        btn2_sub_id: 'Respon cepat dari tim sales kami',
        btn2_sub_en: 'Fast response from our customer support',
        btn2_url: '',
        pages: {
          home: 1,
          about: 1,
          products: 1,
          product_detail: 1,
          capabilities: 1,
          news: 1,
          news_detail: 1,
          contact: 0,
          404: 0
        },
        is_active: 1
      }
    };
  },

  async getHomeContentData() {
    try {
      const allSettings = await settingModel.getAll();
      const defaults = this.getDefaults();

      const parseJsonSafe = (raw, fallback) => {
        if (!raw) return fallback;
        try {
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          return Array.isArray(parsed) ? (parsed.length > 0 ? parsed : fallback) : (typeof parsed === 'object' && parsed !== null ? parsed : fallback);
        } catch {
          return fallback;
        }
      };

      const intro = {
        eyebrow_id: allSettings.home_intro_eyebrow_id ?? defaults.intro.eyebrow_id,
        eyebrow_en: allSettings.home_intro_eyebrow_en ?? defaults.intro.eyebrow_en,
        title_id: allSettings.home_intro_title_id || defaults.intro.title_id,
        title_en: allSettings.home_intro_title_en || defaults.intro.title_en,
        paragraph_1_id: allSettings.home_intro_paragraph_1_id || defaults.intro.paragraph_1_id,
        paragraph_1_en: allSettings.home_intro_paragraph_1_en || defaults.intro.paragraph_1_en,
        paragraph_2_id: allSettings.home_intro_paragraph_2_id || defaults.intro.paragraph_2_id,
        paragraph_2_en: allSettings.home_intro_paragraph_2_en || defaults.intro.paragraph_2_en,
        image_url: allSettings.home_intro_image_url || '',
        is_active: allSettings.home_intro_is_active !== undefined ? Number(allSettings.home_intro_is_active) : defaults.intro.is_active
      };

      const pillars = {
        title_id: allSettings.home_pillars_title_id || defaults.pillars.title_id,
        title_en: allSettings.home_pillars_title_en || defaults.pillars.title_en,
        subtitle_id: allSettings.home_pillars_subtitle_id || defaults.pillars.subtitle_id,
        subtitle_en: allSettings.home_pillars_subtitle_en || defaults.pillars.subtitle_en,
        is_active: allSettings.home_pillars_is_active !== undefined ? Number(allSettings.home_pillars_is_active) : defaults.pillars.is_active,
        items: parseJsonSafe(allSettings.home_pillars_json, defaults.pillars.items)
      };

      const certifications = {
        title_id: allSettings.home_cert_title_id || defaults.certifications.title_id,
        title_en: allSettings.home_cert_title_en || defaults.certifications.title_en,
        body_id: allSettings.home_cert_body_id || defaults.certifications.body_id,
        body_en: allSettings.home_cert_body_en || defaults.certifications.body_en,
        btn_text_id: allSettings.home_cert_btn_text_id ?? defaults.certifications.btn_text_id,
        btn_text_en: allSettings.home_cert_btn_text_en ?? defaults.certifications.btn_text_en,
        btn_url: allSettings.home_cert_btn_url || defaults.certifications.btn_url,
        show_btn: allSettings.home_cert_show_btn !== undefined ? Number(allSettings.home_cert_show_btn) : defaults.certifications.show_btn,
        is_active: allSettings.home_cert_is_active !== undefined ? Number(allSettings.home_cert_is_active) : defaults.certifications.is_active,
        items: parseJsonSafe(allSettings.home_cert_items_json, defaults.certifications.items)
      };

      const cta = {
        title_id: allSettings.global_cta_title_id || defaults.cta.title_id,
        title_en: allSettings.global_cta_title_en || defaults.cta.title_en,
        subtitle_id: allSettings.global_cta_subtitle_id || defaults.cta.subtitle_id,
        subtitle_en: allSettings.global_cta_subtitle_en || defaults.cta.subtitle_en,
        btn1_title_id: allSettings.global_cta_btn1_title_id || defaults.cta.btn1_title_id,
        btn1_title_en: allSettings.global_cta_btn1_title_en || defaults.cta.btn1_title_en,
        btn1_sub_id: allSettings.global_cta_btn1_sub_id || defaults.cta.btn1_sub_id,
        btn1_sub_en: allSettings.global_cta_btn1_sub_en || defaults.cta.btn1_sub_en,
        btn1_url: allSettings.global_cta_btn1_url || defaults.cta.btn1_url,
        btn2_title_id: allSettings.global_cta_btn2_title_id || defaults.cta.btn2_title_id,
        btn2_title_en: allSettings.global_cta_btn2_title_en || defaults.cta.btn2_title_en,
        btn2_sub_id: allSettings.global_cta_btn2_sub_id || defaults.cta.btn2_sub_id,
        btn2_sub_en: allSettings.global_cta_btn2_sub_en || defaults.cta.btn2_sub_en,
        btn2_url: allSettings.global_cta_btn2_url || '',
        pages: parseJsonSafe(allSettings.global_cta_pages_json, defaults.cta.pages),
        is_active: allSettings.global_cta_is_active !== undefined ? Number(allSettings.global_cta_is_active) : defaults.cta.is_active
      };

      return { intro, pillars, certifications, cta };
    } catch (err) {
      logger.error('Failed to load home content data, using defaults', { message: err.message });
      return this.getDefaults();
    }
  },

  async updateHomeContent(payload) {
    const settingsMap = {};

    if (payload.intro) {
      const i = payload.intro;
      if (i.eyebrow_id !== undefined) settingsMap.home_intro_eyebrow_id = i.eyebrow_id;
      if (i.eyebrow_en !== undefined) settingsMap.home_intro_eyebrow_en = i.eyebrow_en;
      if (i.title_id !== undefined) settingsMap.home_intro_title_id = i.title_id;
      if (i.title_en !== undefined) settingsMap.home_intro_title_en = i.title_en;
      if (i.paragraph_1_id !== undefined) settingsMap.home_intro_paragraph_1_id = i.paragraph_1_id;
      if (i.paragraph_1_en !== undefined) settingsMap.home_intro_paragraph_1_en = i.paragraph_1_en;
      if (i.paragraph_2_id !== undefined) settingsMap.home_intro_paragraph_2_id = i.paragraph_2_id;
      if (i.paragraph_2_en !== undefined) settingsMap.home_intro_paragraph_2_en = i.paragraph_2_en;
      if (i.image_url !== undefined) settingsMap.home_intro_image_url = i.image_url;
      if (i.is_active !== undefined) settingsMap.home_intro_is_active = String(i.is_active);
    }

    if (payload.pillars) {
      const p = payload.pillars;
      if (p.title_id !== undefined) settingsMap.home_pillars_title_id = p.title_id;
      if (p.title_en !== undefined) settingsMap.home_pillars_title_en = p.title_en;
      if (p.subtitle_id !== undefined) settingsMap.home_pillars_subtitle_id = p.subtitle_id;
      if (p.subtitle_en !== undefined) settingsMap.home_pillars_subtitle_en = p.subtitle_en;
      if (p.is_active !== undefined) settingsMap.home_pillars_is_active = String(p.is_active);
      if (p.items !== undefined) settingsMap.home_pillars_json = JSON.stringify(p.items);
    }

    if (payload.certifications) {
      const c = payload.certifications;
      if (c.title_id !== undefined) settingsMap.home_cert_title_id = c.title_id;
      if (c.title_en !== undefined) settingsMap.home_cert_title_en = c.title_en;
      if (c.body_id !== undefined) settingsMap.home_cert_body_id = c.body_id;
      if (c.body_en !== undefined) settingsMap.home_cert_body_en = c.body_en;
      if (c.btn_text_id !== undefined) settingsMap.home_cert_btn_text_id = c.btn_text_id;
      if (c.btn_text_en !== undefined) settingsMap.home_cert_btn_text_en = c.btn_text_en;
      if (c.btn_url !== undefined) settingsMap.home_cert_btn_url = c.btn_url;
      if (c.show_btn !== undefined) settingsMap.home_cert_show_btn = String(c.show_btn);
      if (c.is_active !== undefined) settingsMap.home_cert_is_active = String(c.is_active);
      if (c.items !== undefined) settingsMap.home_cert_items_json = JSON.stringify(c.items);
    }

    if (payload.cta) {
      const a = payload.cta;
      if (a.title_id !== undefined) settingsMap.global_cta_title_id = a.title_id;
      if (a.title_en !== undefined) settingsMap.global_cta_title_en = a.title_en;
      if (a.subtitle_id !== undefined) settingsMap.global_cta_subtitle_id = a.subtitle_id;
      if (a.subtitle_en !== undefined) settingsMap.global_cta_subtitle_en = a.subtitle_en;
      if (a.btn1_title_id !== undefined) settingsMap.global_cta_btn1_title_id = a.btn1_title_id;
      if (a.btn1_title_en !== undefined) settingsMap.global_cta_btn1_title_en = a.btn1_title_en;
      if (a.btn1_sub_id !== undefined) settingsMap.global_cta_btn1_sub_id = a.btn1_sub_id;
      if (a.btn1_sub_en !== undefined) settingsMap.global_cta_btn1_sub_en = a.btn1_sub_en;
      if (a.btn1_url !== undefined) settingsMap.global_cta_btn1_url = a.btn1_url;
      if (a.btn2_title_id !== undefined) settingsMap.global_cta_btn2_title_id = a.btn2_title_id;
      if (a.btn2_title_en !== undefined) settingsMap.global_cta_btn2_title_en = a.btn2_title_en;
      if (a.btn2_sub_id !== undefined) settingsMap.global_cta_btn2_sub_id = a.btn2_sub_id;
      if (a.btn2_sub_en !== undefined) settingsMap.global_cta_btn2_sub_en = a.btn2_sub_en;
      if (a.btn2_url !== undefined) settingsMap.global_cta_btn2_url = a.btn2_url;
      if (a.pages !== undefined) settingsMap.global_cta_pages_json = JSON.stringify(a.pages);
      if (a.is_active !== undefined) settingsMap.global_cta_is_active = String(a.is_active);
    }

    await settingModel.updateMany(settingsMap);
    clearSettingsCache();
  }
};

export default homeContentModel;
