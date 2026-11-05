export const TICKET_ICONS = {
  'praying-hands': {
    key: 'praying-hands',
    label_id: 'Takut Tuhan (Tangan Berdoa)',
    label_en: 'Fear of God (Praying Hands)',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c-1.2 2.5-3 5.5-4 8.5-.7 2.1-.5 4.5.5 6.5.6 1.2 1.8 2 3.5 2h0c1.7 0 2.9-.8 3.5-2 1-2 1.2-4.4.5-6.5-1-3-2.8-6-4-8.5z"/><path d="M12 3v17"/><path d="M9.5 14.5c-.8 1.5-.8 3.5-.2 5"/><path d="M14.5 14.5c.8 1.5.8 3.5.2 5"/></svg>`
  },
  'shield-check': {
    key: 'shield-check',
    label_id: 'Integritas (Perisai & Centang)',
    label_en: 'Integrity (Shield & Check)',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`
  },
  'chat-dots': {
    key: 'chat-dots',
    label_id: 'Komunikasi (Gelembung Dialog Titik)',
    label_en: 'Communication (Chat Dots)',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/><circle cx="8.5" cy="11.5" r="0.75" fill="currentColor"/><circle cx="12" cy="11.5" r="0.75" fill="currentColor"/><circle cx="15.5" cy="11.5" r="0.75" fill="currentColor"/></svg>`
  },
  'heart': {
    key: 'heart',
    label_id: 'Kasih (Hati)',
    label_en: 'Love (Heart)',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`
  },
  'star': {
    key: 'star',
    label_id: 'Luar Biasa (Bintang)',
    label_en: 'Excellence (Star)',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
  },
  'handshake': {
    key: 'handshake',
    label_id: 'Taat (Jabat Tangan)',
    label_en: 'Obedience (Handshake)',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.6-4.6a1 1 0 0 0 0-1.4l-2-2"/><path d="m13 7-2-2a1 1 0 0 0-1.4 0L5 9.6a1 1 0 0 0 0 1.4l2 2"/><path d="m8.5 13.5 3 3"/><path d="m12.5 9.5 3 3"/><path d="M2 17l4-4"/><path d="M22 7l-4 4"/></svg>`
  }
};

export const TICKET_ICON_KEYS = Object.keys(TICKET_ICONS);

export function isValidTicketIconKey(key) {
  return typeof key === 'string' && Boolean(TICKET_ICONS[key]);
}

export function getTicketIconSvg(key, className = '') {
  const item = TICKET_ICONS[key] || TICKET_ICONS['praying-hands'];
  if (!className) return item.svg;
  return item.svg.replace('<svg ', `<svg class="${className}" `);
}

