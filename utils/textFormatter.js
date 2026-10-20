import escapeHtml from 'escape-html';

/**
 * Server-side delimiter parser to format text with safe semantic tags.
 * Input is strictly HTML-escaped before safe delimiter tokens are replaced.
 * @param {string} rawText
 * @returns {string} safe HTML
 */
export function formatInlineText(rawText) {
  if (!rawText) return '';

  let safe = escapeHtml(String(rawText).trim());

  safe = safe
    .replace(/\[strong\](.*?)\[\/strong\]/gi, '<strong>$1</strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[mark\](.*?)\[\/mark\]/gi, '<mark class="wcu-mark">$1</mark>')
    .replace(/==(.*?)==/g, '<mark class="wcu-mark">$1</mark>')
    .replace(/\[accent\](.*?)\[\/accent\]/gi, '<span class="wcu-accent">$1</span>');

  return safe;
}

export default {
  formatInlineText
};
