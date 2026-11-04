/**
 * Immediate Sidebar State Restore (Anti-FOUC)
 */
function restoreSidebarState() {
  if (window.innerWidth <= 900) return;
  if (localStorage.getItem('admin_sidebar_collapsed') !== 'true') return;

  document.documentElement.classList.add('sidebar-collapsed-init');
  if (document.body) {
    document.body.classList.add('sidebar-collapsed');
    return;
  }
  window.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('sidebar-collapsed');
  });
}

try {
  restoreSidebarState();
} catch {
  // Safe fallback if localStorage is disabled
}
