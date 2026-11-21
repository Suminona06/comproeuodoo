import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeVariantGroups,
  validateRawVariantGroups,
  matchSelectedVariantsWhitelist,
  formatSelectedVariantsText
} from '../services/productVariantService.js';
import {
  getContactPageData,
  resolveProductSelection,
  persistAndNotifyInquiry
} from '../services/publicContactService.js';
import { INQUIRY_CSV_COLUMNS } from '../services/inquiryService.js';

describe('T-389..T-394: Dynamic Product Variants & RFQ Whitelist', () => {
  it('1. normalizes legacy flat string arrays into a single Ukuran/Size group without duplicates', () => {
    const groups = normalizeVariantGroups(['25 x 35 cm', '25 x 35 cm', '<b>30 x 40 cm</b>']);
    assert.equal(groups.length, 1);
    assert.equal(groups[0].id, 'grp_ukuran');
    assert.equal(groups[0].name_id, 'Ukuran');
    assert.equal(groups[0].name_en, 'Size');
    assert.deepEqual(groups[0].options.map((o) => o.label_id), ['25 x 35 cm', '30 x 40 cm']);
  });

  it('2. enforces max 5 groups, 20 options, 40-char group name, and 50-char option label limits', () => {
    const sixGroups = Array.from({ length: 6 }, (_, i) => ({
      name_id: `Grup ${i + 1}`,
      options: [{ label_id: 'A' }]
    }));
    assert.match(validateRawVariantGroups(sixGroups).error, /Maksimal 5 grup/);

    const twentyOneOpts = [{
      name_id: 'Warna',
      options: Array.from({ length: 21 }, (_, i) => ({ label_id: `Opsi ${i}` }))
    }];
    assert.match(validateRawVariantGroups(twentyOneOpts).error, /Maksimal 20 opsi/);

    const longName = [{ name_id: 'X'.repeat(41), options: [{ label_id: 'A' }] }];
    assert.match(validateRawVariantGroups(longName).error, /maksimal 40 karakter/);

    const longOpt = [{ name_id: 'Warna', options: [{ label_id: 'Y'.repeat(51) }] }];
    assert.match(validateRawVariantGroups(longOpt).error, /maksimal 50 karakter/);
  });

  it('3. matches selected variants strictly against product whitelist and formats ID/EN summaries', () => {
    const productVariants = [
      {
        id: 'grp_warna',
        name_id: 'Warna',
        name_en: 'Color',
        options: [
          { id: 'opt_merah', label_id: 'Merah', label_en: 'Red' },
          { id: 'opt_custom', label_id: 'Custom', label_en: 'Custom' }
        ]
      },
      {
        id: 'grp_ukuran',
        name_id: 'Ukuran',
        name_en: 'Size',
        options: [{ id: 'opt_4060', label_id: '40x60', label_en: '40x60' }]
      }
    ];

    const matched = matchSelectedVariantsWhitelist(
      'grp_warna:opt_merah,opt_custom,opt_forged;grp_unknown:opt_1;grp_ukuran:opt_4060',
      productVariants
    );
    assert.equal(matched.length, 2);
    assert.equal(matched[0].options.length, 2);
    assert.equal(formatSelectedVariantsText(matched, 'id'), 'Warna: Merah, Custom; Ukuran: 40x60');
    assert.equal(formatSelectedVariantsText(matched, 'en'), 'Color: Red, Custom; Size: 40x60');
  });

  it('4. filters forged variants in contact GET and POST persistence + mailer payload', async () => {
    const product = {
      id: 92,
      slug: 'soft-loop',
      name_id: 'Kantong Soft Loop',
      name_en: 'Soft Loop Bag',
      variants: [
        {
          id: 'grp_ukuran',
          name_id: 'Ukuran',
          name_en: 'Size',
          options: [
            { id: 'opt_1', label_id: '25 x 35 cm', label_en: '25 x 35 cm' },
            { id: 'opt_2', label_id: '30 x 40 cm', label_en: '30 x 40 cm' }
          ]
        }
      ]
    };

    const pageData = await getContactPageData(
      { product: '92', variants: 'grp_ukuran:opt_1,opt_evil;grp_fake:opt_9' },
      { t: (k) => k, settings: {} },
      {
        productModel: { findAll: async () => [product] },
        pageHeroBannerModel: { getByPageKey: async () => null }
      }
    );
    assert.equal(pageData.selectedVariants.length, 1);
    assert.deepEqual(pageData.selectedVariants[0].options.map((o) => o.id), ['opt_1']);

    const resolved = await resolveProductSelection(
      '92',
      { t: (k) => k, currentLang: 'id' },
      { productModel: { findById: async () => product } }
    );
    assert.equal(resolved.valid, true);
    assert.ok(Array.isArray(resolved.productVariants));

    let savedRow = null;
    let mailedLead = null;
    await persistAndNotifyInquiry(
      {
        type: 'inquiry',
        name: 'Budi',
        company: 'PT Maju',
        email: 'budi@example.com',
        phone: '08123456789',
        quantity: '10000 pcs',
        message: 'Mohon penawaran harga untuk varian tersebut.',
        selectedVariantsRaw: JSON.stringify([{ group_id: 'grp_ukuran', option_ids: ['opt_2', 'opt_hack'] }])
      },
      resolved,
      '127.0.0.1',
      {
        inquiryModel: { create: async (row) => { savedRow = row; return 77; } },
        mailer: { sendLeadNotification: async (lead) => { mailedLead = lead; } },
        logger: { info: () => {}, warn: () => {} }
      }
    );

    assert.equal(savedRow.selected_variants.length, 1);
    assert.deepEqual(savedRow.selected_variants[0].options.map((o) => o.id), ['opt_2']);
    assert.equal(mailedLead.selected_variants_text, 'Ukuran: 30 x 40 cm');
  });

  it('5. exposes Varian Produk column in Admin RFQ CSV export', () => {
    const col = INQUIRY_CSV_COLUMNS.find((c) => c.label === 'Varian Produk');
    assert.ok(col, 'Varian Produk CSV column must exist');
    assert.equal(col.key({ selected_variants: [] }), '-');
    assert.equal(
      col.key({
        selected_variants: [{ group_name_id: 'Warna', options: [{ label_id: 'Merah' }] }]
      }),
      'Warna: Merah'
    );
  });
});
