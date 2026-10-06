import sanitizeHtml from 'sanitize-html';

const ALLOWED_ARTICLE_TAGS = [
  'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'strong', 'em', 'u', 's', 'strike',
  'ul', 'ol', 'li', 'blockquote',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'code', 'pre', 'hr', 'br', 'span', 'sub', 'sup'
];

const SANITIZE_OPTIONS = {
  allowedTags: ALLOWED_ARTICLE_TAGS,
  allowedAttributes: {
    'a': ['href', 'target', 'rel', 'title'],
    'img': ['src', 'alt', 'width', 'height', 'loading', 'class'],
    'table': ['border', 'cellpadding', 'cellspacing', 'class'],
    'th': ['colspan', 'rowspan', 'scope', 'class'],
    'td': ['colspan', 'rowspan', 'class'],
    '*': ['class']
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {
    img: ['data', 'http', 'https']
  },
  transformTags: {
    'a': sanitizeHtml.simpleTransform('a', {
      rel: 'noopener noreferrer'
    })
  }
};

/**
 * Sanitize article rich text to prevent stored XSS attacks.
 * Discards script, iframe, form, and inline handler attributes.
 * @param {string} dirtyHtml
 * @returns {string} clean HTML
 */
export const sanitizeArticleHtml = (dirtyHtml) => {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') {
    return '';
  }
  return sanitizeHtml(dirtyHtml, SANITIZE_OPTIONS).trim();
};

export default {
  sanitizeArticleHtml
};
