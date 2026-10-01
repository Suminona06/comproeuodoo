import settingModel from './settingModel.js';
import logger from '../utils/logger.js';

export const aboutModel = {
  /**
   * Return default fallback data based directly on authentic Company Profile
   */
  getDefaults() {
    return {
      founded_year: '1990',
      former_names: 'PT. Sahabat Baru & PT. Pelita Baru',
      history_title_id: 'Latar Belakang & Sejarah Perusahaan',
      history_title_en: 'Company Background & History',
      history_id:
        'PT. EUODOO adalah perusahaan yang bergerak di bidang manufaktur perdagangan kantong plastik HDPE dan LLDPE. Pabrik produksi kami terletak di Cigondewah, Bandung, Jawa Barat - Indonesia. Perusahaan ini didirikan pada tahun 1990 yang akrab dikenal sebagai PT. Sahabat Baru atau PT. Pelita Baru. Usaha kami dimulai dari melayani permintaan kantong plastik HDPE untuk pasar tradisional. Dalam perkembangannya, kami memperluas kapasitas produksi dan melayani kebutuhan kantong plastik untuk supermarket, toko retail modern, serta berbagai sektor industri dengan komitmen penuh pada penyediaan kantong plastik ramah lingkungan (100% degradable).',
      history_en:
        'PT. Euodoo manufactures and trades HDPE and LLDPE plastic bags. Our production plant is located in Cigondewah, Bandung, West Java, Indonesia. The company was incorporated in 1990, familiarly known as PT Sahabat Baru & PT Pelita Baru. We entered the business by serving HDPE plastic bag demands for traditional markets. Over the years, we expanded production to serve major supermarkets, modern retail stores, and specialized industrial sectors with an uncompromising commitment to 100% degradable plastic bags.',
      vision_id:
        'Menjadi perusahaan yang memberi dampak pada perubahan kualitas hidup yang lebih baik.',
      vision_en:
        'Continuous contribution to improve quality of life.',
      mission_id:
        'Membina moral dan karakter positif\nMenggali potensi manusia\nMengembangkan profesionalisme',
      mission_en:
        'Nurture positive morality and character building\nUnleash human potential\nDevelop professionalism',
      motto_id:
        'Perlakukan orang lain sama seperti kita ingin diperlakukan.\nBukan benar atau salah tetapi respon.\nKeterbukaan adalah awal dari pemulihan.',
      motto_en:
        'Treat others as we want to be treated.\nEncourage positive, helpful responses and discourage fault finding.\nRevealing your feeling is the start of healing.',
      slogan_id:
        'Semangat membangun kualitas hidup yang lebih baik.',
      slogan_en:
        'Passion to build a better quality of life in our community.',
      goal_id:
        'Agar setiap pribadi dapat mencapai kemaksimalan dalam hidupnya.',
      goal_en:
        'To help everyone reach their full potential.',
      eco_statement_id:
        'Mari selamatkan bumi kita! Kami memproduksi dan menyuplai 100% kantong plastik ramah lingkungan (degradable) untuk pelanggan kami.',
      eco_statement_en:
        'Let\'s save our earth! We supply 100% degradable plastic bags to our valuable customers.',
      office_address:
        'Karindra Building Jl. Palmerah Selatan 30 A Suite 02 - 07, Jakarta Pusat 10270',
      office_phone: '+6221-53668626',
      office_fax: '+6221-53668648',
      factory_address:
        'Jl. Paralon II No. 21 Cijerah Bandung 40214 - Indonesia',
      factory_phone: '+6222-6012519',
      factory_fax: '+6222-6074730',
      image_url: '/images/factory-plant.webp',
      values: [
        {
          letter: 'T',
          title_id: 'Takut Tuhan',
          title_en: 'Fear of God',
          desc_id: 'Menjadi dasar moral, etika, dan spiritual dalam setiap keputusan bisnis dan operasional perusahaan.',
          desc_en: 'The moral and spiritual cornerstone guiding every business decision and daily operation.'
        },
        {
          letter: 'I',
          title_id: 'Integritas',
          title_en: 'Integrity',
          desc_id: 'Kejujuran, konsistensi mutu, dan tanggung jawab penuh atas komitmen kepada pelanggan dan mitra.',
          desc_en: 'Honesty, consistent quality, and total accountability to customers and partners.'
        },
        {
          letter: 'C',
          title_id: 'Komunikasi',
          title_en: 'Communication',
          desc_id: 'Keterbukaan, respon yang membangun dan cepat, serta budaya mendengarkan tanpa mencari kesalahan.',
          desc_en: 'Openness, constructive responses, and an open culture of listening without fault-finding.'
        },
        {
          letter: 'K',
          title_id: 'Kasih',
          title_en: 'Love',
          desc_id: 'Kepedulian tulus terhadap kesejahteraan dan pendidikan karyawan, kepuasan pelanggan, serta kelestarian bumi.',
          desc_en: 'Genuine care for employee education and well-being, customer satisfaction, and planetary care.'
        },
        {
          letter: 'E',
          title_id: 'Luar Biasa',
          title_en: 'Excellence',
          desc_id: 'Dedikasi menghadirkan standar mutu plastik degradable terbaik dengan toleransi presisi tinggi.',
          desc_en: 'Dedication to delivering peak degradable plastic standards with tight precision tolerance.'
        },
        {
          letter: 'T',
          title_id: 'Taat',
          title_en: 'Obedience',
          desc_id: 'Kepatuhan terhadap standar keamanan, regulasi kelestarian lingkungan, dan sertifikasi resmi.',
          desc_en: 'Adherence to safety standards, environmental regulations, and official certifications.'
        }
      ],
      certifications: [
        {
          name: 'SNI 7188.7:2011',
          issuer: 'Badan Standardisasi Nasional',
          badge: 'Ekolabel Indonesia',
          desc_id: 'Standar mutu nasional Indonesia untuk kantong plastik belanja mudah terurai secara alami.',
          desc_en: 'Indonesian national standard for naturally degradable plastic shopping bags.'
        },
        {
          name: 'OXIUM',
          issuer: 'Oxium 100% Degradable',
          badge: '100% Degradable',
          desc_id: 'Teknologi aditif degradasi ramah lingkungan yang mempercepat penguraian plastik tanpa residu berbahaya.',
          desc_en: 'Eco-friendly degradable additive technology accelerating plastic degradation safely.'
        },
        {
          name: 'InSWA Green Label',
          issuer: 'Indonesia Solid Waste Association',
          badge: 'Program Monitoring',
          desc_id: 'Sertifikasi pemantauan dan pengelolaan limbah padat berkelanjutan berstandar hijau.',
          desc_en: 'Certified monitoring and sustainable solid waste management program.'
        }
      ]
    };
  },

  /**
   * Get all structured about data from settings, merged with defaults
   */
  async getAboutData() {
    try {
      const allSettings = await settingModel.getAll();
      const defaults = this.getDefaults();

      let values = defaults.values;
      if (allSettings.about_values_json) {
        try {
          const parsed = typeof allSettings.about_values_json === 'string'
            ? JSON.parse(allSettings.about_values_json)
            : allSettings.about_values_json;
          if (Array.isArray(parsed) && parsed.length > 0) {
            values = parsed;
          }
        } catch (e) {
          logger.warn('Failed to parse about_values_json, using defaults:', { error: e.message });
        }
      }

      let certifications = defaults.certifications;
      if (allSettings.about_certifications_json) {
        try {
          const parsed = typeof allSettings.about_certifications_json === 'string'
            ? JSON.parse(allSettings.about_certifications_json)
            : allSettings.about_certifications_json;
          if (Array.isArray(parsed) && parsed.length > 0) {
            certifications = parsed;
          }
        } catch (e) {
          logger.warn('Failed to parse about_certifications_json, using defaults:', { error: e.message });
        }
      }

      return {
        founded_year: allSettings.about_founded_year || defaults.founded_year,
        former_names: allSettings.about_former_names || defaults.former_names,
        history_title_id: allSettings.about_history_title_id || defaults.history_title_id,
        history_title_en: allSettings.about_history_title_en || defaults.history_title_en,
        history_id: allSettings.about_history_id || defaults.history_id,
        history_en: allSettings.about_history_en || defaults.history_en,
        vision_id: allSettings.about_vision_id || defaults.vision_id,
        vision_en: allSettings.about_vision_en || defaults.vision_en,
        mission_id: allSettings.about_mission_id || defaults.mission_id,
        mission_en: allSettings.about_mission_en || defaults.mission_en,
        motto_id: allSettings.about_motto_id || defaults.motto_id,
        motto_en: allSettings.about_motto_en || defaults.motto_en,
        slogan_id: allSettings.about_slogan_id || defaults.slogan_id,
        slogan_en: allSettings.about_slogan_en || defaults.slogan_en,
        goal_id: allSettings.about_goal_id || defaults.goal_id,
        goal_en: allSettings.about_goal_en || defaults.goal_en,
        eco_statement_id: allSettings.about_eco_statement_id || defaults.eco_statement_id,
        eco_statement_en: allSettings.about_eco_statement_en || defaults.eco_statement_en,
        office_address: allSettings.about_office_address || defaults.office_address,
        office_phone: allSettings.about_office_phone || defaults.office_phone,
        office_fax: allSettings.about_office_fax || defaults.office_fax,
        factory_address: allSettings.about_factory_address || defaults.factory_address,
        factory_phone: allSettings.about_factory_phone || defaults.factory_phone,
        factory_fax: allSettings.about_factory_fax || defaults.factory_fax,
        image_url: allSettings.about_image_url || defaults.image_url,
        values,
        certifications
      };
    } catch (err) {
      logger.error('aboutModel.getAboutData error:', { message: err.message });
      return this.getDefaults();
    }
  },

  /**
   * Save/update about settings in database
   */
  async updateAboutData(data = {}) {
    const updateObj = {};

    const stringFields = [
      'founded_year',
      'former_names',
      'history_title_id',
      'history_title_en',
      'history_id',
      'history_en',
      'vision_id',
      'vision_en',
      'mission_id',
      'mission_en',
      'motto_id',
      'motto_en',
      'slogan_id',
      'slogan_en',
      'goal_id',
      'goal_en',
      'eco_statement_id',
      'eco_statement_en',
      'office_address',
      'office_phone',
      'office_fax',
      'factory_address',
      'factory_phone',
      'factory_fax',
      'image_url'
    ];

    stringFields.forEach((field) => {
      if (data[field] !== undefined) {
        updateObj[`about_${field}`] = typeof data[field] === 'string' ? data[field].trim() : String(data[field]);
      }
    });

    if (data.values !== undefined) {
      updateObj['about_values_json'] = typeof data.values === 'string'
        ? data.values
        : JSON.stringify(data.values);
    }

    if (data.certifications !== undefined) {
      updateObj['about_certifications_json'] = typeof data.certifications === 'string'
        ? data.certifications
        : JSON.stringify(data.certifications);
    }

    await settingModel.updateMany(updateObj);
    logger.info('aboutModel: About settings updated successfully.');
  }
};

export default aboutModel;
