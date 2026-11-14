const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
const YOUTUBE_URL_RE = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?/\s]{11})/;

export function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (YOUTUBE_ID_RE.test(trimmed)) return trimmed;

  const match = trimmed.match(YOUTUBE_URL_RE);
  return match && match[1].length === 11 ? match[1] : null;
}

export default { extractYouTubeId };
