export const TICKET_ICONS = {
  'praying-hands': {
    key: 'praying-hands',
    label_id: 'Takut Tuhan (Tangan Berdoa)',
    label_en: 'Fear of God (Praying Hands)',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 20 3.8 17.2a2.5 2.5 0 0 1-.2-2.2L8.8 4.2a1.4 1.4 0 0 1 2.6.6v9.2l-2.6 2.8"/><path d="M8.8 16.8 6.8 19.5"/><path d="M18.5 20l1.7-2.8a2.5 2.5 0 0 0 .2-2.2L15.2 4.2a1.4 1.4 0 0 0-2.6.6v9.2l2.6 2.8"/><path d="m15.2 16.8 2 2.7"/></svg>`
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
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.5 3.5C6.36 3.5 3 6.41 3 10c0 1.63.7 3.12 1.85 4.26L3.5 17.5l3.65-1.15c1.02.42 2.15.65 3.35.65 4.14 0 7.5-2.91 7.5-6.5s-3.36-7-7.5-7z"/><path d="M17.2 10.8c2.2.72 3.8 2.52 3.8 4.7 0 1.18-.52 2.26-1.38 3.1L20.8 21l-2.75-.85c-.75.3-1.6.45-2.55.45-2.6 0-4.82-1.28-5.65-3.1"/><circle cx="7.75" cy="10.25" r="0.7" fill="currentColor"/><circle cx="10.5" cy="10.25" r="0.7" fill="currentColor"/><circle cx="13.25" cy="10.25" r="0.7" fill="currentColor"/></svg>`
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
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></svg>`
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

