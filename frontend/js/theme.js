/**
 * CareerForge AI — Theme & Instrument Controller
 * Handles anti-flash theme toggling, Presenter Mode (Shift+P), and tool keyboard shortcuts.
 */

const THEME_STORAGE_KEY = 'careerforge_theme';
const root = document.documentElement;

// Theme Controller
function getStoredTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  updateThemeButton(theme);
}

function updateThemeButton(theme) {
  const btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;
  btn.textContent = theme === 'light' ? '🌙' : '☀️';
  btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
  btn.setAttribute('title', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
}

// Global Toast Utility
window.showToast = function(message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(4px)';
    toast.style.transition = 'all var(--d-fast) var(--ease)';
    setTimeout(() => toast.remove(), 150);
  }, 2800);
};

// Presenter Mode Toggle (Shift + P)
function togglePresenterMode() {
  const isPresenter = document.body.classList.toggle('presenter-mode');
  window.showToast(isPresenter ? 'Presenter mode enabled (18px text, reinforced borders)' : 'Presenter mode disabled');
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const currentTheme = root.getAttribute('data-theme') || getStoredTheme();
  applyTheme(currentTheme);

  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const active = root.getAttribute('data-theme') || 'dark';
      applyTheme(active === 'dark' ? 'light' : 'dark');
    });
  }

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // Ignore shortcuts when typing inside form inputs or textareas
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea' || e.target.isContentEditable) {
      return;
    }

    // Shift + P: Presenter Mode
    if (e.shiftKey && (e.key === 'P' || e.key === 'p')) {
      e.preventDefault();
      togglePresenterMode();
      return;
    }

    // G: Generate Roadmap
    if (e.key === 'g' || e.key === 'G') {
      const genBtn = document.getElementById('generate-roadmap-btn');
      if (genBtn && !genBtn.disabled) {
        e.preventDefault();
        genBtn.click();
      }
    }

    // L: Log a Score (Assessment Modal)
    if (e.key === 'l' || e.key === 'L') {
      e.preventDefault();
      const triggerBtn = document.getElementById('rail-log-score-btn');
      if (triggerBtn) triggerBtn.click();
    }

    // /: Focus Add Skill Input
    if (e.key === '/') {
      const skillInput = document.getElementById('add-skill-input');
      if (skillInput) {
        e.preventDefault();
        skillInput.focus();
      }
    }

    // ?: Shortcut Sheet
    if (e.key === '?') {
      e.preventDefault();
      window.showToast('Shortcuts: G (Generate), L (Log score), / (Focus skills), Shift+P (Presenter mode)');
    }
  });
});
