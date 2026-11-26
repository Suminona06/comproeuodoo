import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_CSS_DIR = path.resolve(__dirname, '../../public/css');
const PUBLIC_COMPONENTS_DIR = path.join(PUBLIC_CSS_DIR, 'components');

export const PUBLIC_COMPONENT_CSS_FILES = [
  'primitives.css',
  'whatsapp-float.css',
  'cta-reveal.css',
  'page-hero.css',
  'dropdown.css',
  'pagination.css',
  'product-cards.css',
  'news-cards.css',
  'home-hero.css',
  'home-intro-categories.css',
  'home-why-choose-us.css',
  'home-cert-brands.css',
  'home-news-carousel.css',
  'products-catalog.css',
  'product-detail-core.css',
  'product-detail-specs.css',
  'about-story.css',
  'about-timeline.css',
  'about-vision-mission.css',
  'about-ticket.css',
  'about-gallery.css',
  'news-listing.css',
  'news-detail.css',
  'contact-page.css',
  'contact-variants.css'
];

export function readPublicTokensCss() {
  return fs.readFileSync(path.join(PUBLIC_CSS_DIR, 'tokens.css'), 'utf8');
}

export function readPublicComponentCss(file) {
  return fs.readFileSync(path.join(PUBLIC_COMPONENTS_DIR, file), 'utf8');
}

export function readAllPublicComponentsCss() {
  return PUBLIC_COMPONENT_CSS_FILES
    .map((file) => readPublicComponentCss(file))
    .join('\n');
}
