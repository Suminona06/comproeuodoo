export const SNAPSHOT_TABLES = [
  {
    name: 'product_categories',
    orderBy: 'id ASC',
    columns: ['id', 'name_id', 'name_en', 'slug', 'description_id', 'description_en', 'image_url', 'sort_order', 'is_active'],
    updateIdOnDuplicate: true
  },
  {
    name: 'post_categories',
    orderBy: 'id ASC',
    columns: ['id', 'name_id', 'name_en', 'slug', 'type', 'sort_order'],
    updateIdOnDuplicate: true
  },
  {
    name: 'brands',
    orderBy: 'id ASC',
    columns: ['id', 'name', 'logo_url', 'description_id', 'description_en', 'sort_order', 'is_active']
  },
  {
    name: 'banners',
    orderBy: 'id ASC',
    columns: [
      'id', 'title_id', 'title_en', 'subtitle_id', 'subtitle_en', 'caption_id', 'caption_en',
      'media_type', 'file_url', 'poster_url', 'link_url', 'cta_text_id', 'cta_text_en', 'cta_url',
      'cta_secondary_text_id', 'cta_secondary_text_en', 'cta_secondary_url', 'sort_order', 'is_active'
    ]
  },
  {
    name: 'media',
    orderBy: 'id ASC',
    columns: ['id', 'filename', 'original_name', 'file_url', 'mime_type', 'file_size', 'storage_driver', 'alt_text']
  },
  {
    name: 'products',
    orderBy: 'id ASC',
    columns: [
      'id', 'category_id', 'name_id', 'name_en', 'slug', 'short_description_id', 'short_description_en',
      'description_id', 'description_en', 'cta_text_id', 'cta_text_en', 'variants', 'size_table',
      'main_image', 'gallery_images', 'status', 'meta_title_id', 'meta_title_en',
      'meta_description_id', 'meta_description_en', 'og_image', 'canonical_url', 'robots', 'jsonld',
      'is_active', 'sort_order'
    ],
    jsonColumns: ['variants', 'size_table', 'gallery_images', 'jsonld'],
    updateIdOnDuplicate: true
  },
  {
    name: 'product_variants',
    orderBy: 'id ASC',
    columns: ['id', 'product_id', 'name_id', 'name_en', 'sku', 'specs', 'sort_order'],
    jsonColumns: ['specs']
  },
  {
    name: 'posts',
    orderBy: 'id ASC',
    columns: [
      'id', 'category_id', 'type', 'title_id', 'title_en', 'slug', 'content_id', 'content_en',
      'excerpt_id', 'excerpt_en', 'cover_image', 'is_headline', 'status', 'published_at',
      'scheduled_at', 'meta_title_id', 'meta_title_en', 'meta_description_id',
      'meta_description_en', 'og_image', 'canonical_url', 'robots', 'jsonld'
    ],
    jsonColumns: ['jsonld'],
    dateColumns: ['published_at', 'scheduled_at'],
    updateIdOnDuplicate: true
  },
  {
    name: 'pages',
    orderBy: 'id ASC',
    columns: [
      'id', 'slug', 'title_id', 'title_en', 'content_id', 'content_en', 'hero_image',
      'meta_title_id', 'meta_title_en', 'meta_description_id', 'meta_description_en',
      'og_image', 'canonical_url', 'robots', 'jsonld'
    ],
    jsonColumns: ['jsonld'],
    updateIdOnDuplicate: true
  },
  {
    name: 'page_hero_banners',
    orderBy: 'id ASC',
    columns: [
      'page_key', 'title_id', 'title_en', 'subtitle_id', 'subtitle_en', 'image_url',
      'overlay_opacity', 'cta_text_id', 'cta_text_en', 'cta_url', 'is_active'
    ],
    conflictKey: 'page_key'
  },
  {
    name: 'about_gallery_slides',
    orderBy: 'id ASC',
    columns: [
      'id', 'image_url', 'category_id', 'category_en', 'title_id', 'title_en',
      'subtitle_id', 'subtitle_en', 'sort_order', 'is_active'
    ]
  },
  {
    name: 'about_stats',
    orderBy: 'id ASC',
    columns: ['id', 'stat_value', 'label_id', 'label_en', 'sort_order', 'is_active']
  },
  {
    name: 'about_timeline',
    orderBy: 'id ASC',
    columns: ['id', 'year_label_id', 'year_label_en', 'title_id', 'title_en', 'description_id', 'description_en', 'sort_order', 'is_active']
  },
  {
    name: 'capabilities',
    orderBy: 'id ASC',
    columns: ['id', 'title_id', 'title_en', 'machine_type', 'capacity', 'description_id', 'description_en', 'image_url', 'sort_order', 'is_active']
  },
  {
    name: 'settings',
    orderBy: 'setting_key ASC',
    columns: ['setting_key', 'setting_value'],
    conflictKey: 'setting_key'
  }
];

/**
 * Normalize a row value for JSON or SQL serialization.
 * @param {object} tableSpec
 * @param {string} column
 * @param {unknown} value
 * @returns {unknown}
 */
export function normalizeColumnValue(tableSpec, column, value) {
  if (value === undefined) return null;
  const isJson = tableSpec.jsonColumns?.includes(column);
  if (isJson && value !== null && typeof value !== 'string') {
    return JSON.stringify(value);
  }
  return value;
}

/**
 * Build parameterized INSERT ... ON DUPLICATE KEY UPDATE SQL for a snapshot table.
 * @param {object} tableSpec
 * @returns {string}
 */
export function buildUpsertSql(tableSpec) {
  const conflictCol = tableSpec.conflictKey || 'id';
  const quotedCols = tableSpec.columns.map((c) => `\`${c}\``).join(', ');
  const placeholders = tableSpec.columns.map(() => '?').join(', ');
  const updateCols = tableSpec.columns.filter((col) => col !== conflictCol || tableSpec.updateIdOnDuplicate);
  const assignments = updateCols.map((c) => `\`${c}\` = VALUES(\`${c}\`)`).join(', ');
  return `INSERT INTO \`${tableSpec.name}\` (${quotedCols}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${assignments}`;
}

export default { SNAPSHOT_TABLES, normalizeColumnValue, buildUpsertSql };
