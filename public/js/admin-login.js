/**
 * Script Penanganan Fallback Logo Header Halaman Login Admin
 */
document.addEventListener('DOMContentLoaded', () => {
  const logoImg = document.querySelector('.brand-logo-header');
  if (logoImg) {
    logoImg.addEventListener('error', () => {
      logoImg.classList.add('is-hidden');
      const fallback = logoImg.nextElementSibling;
      if (fallback) {
        fallback.classList.add('is-visible');
      }
    });
  }
});
