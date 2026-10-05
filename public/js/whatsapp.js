/**
 * WhatsApp Floating Button Client Interactivity
 * PT Euodoo - Website Company Profile v2.0
 */

document.addEventListener('DOMContentLoaded', () => {
  const waBtn = document.getElementById('floatingWhatsAppBtn');
  if (!waBtn) return;

  // Track click interaction
  waBtn.addEventListener('click', () => {
    try {
      if (typeof window.dataLayer !== 'undefined' && Array.isArray(window.dataLayer)) {
        window.dataLayer.push({
          event: 'whatsapp_click',
          action: 'floating_button_click',
          url: waBtn.getAttribute('href')
        });
      }
    } catch {
      // Non-blocking telemetry
    }
  });
});
