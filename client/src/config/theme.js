// Design tokens — all colors come from CSS custom properties in index.css :root {}
// This file provides Tailwind class strings for shared components.
// Auth pages (Login, Signup) use the .auth-* CSS classes directly.

export const t = {
  pageBg:      'auth-page',
  card:        'auth-card',
  cardSm:      'auth-card-sm',
  cardMd:      'auth-card-md',
  cardPadding: 'auth-card-body',

  btn:         'auth-btn',
  input:       'auth-input',
  inputError:  'error',
  label:       'auth-label',
  fieldError:  'auth-field-error',

  link:        'text-[var(--color-action)] hover:text-[var(--color-action-hover)] transition-colors',
  linkMuted:   'text-xs text-[var(--color-text-low)] hover:text-[var(--color-text-high)] transition-colors',
  darkSubtext: 'text-xs text-[var(--color-text-muted)]',
  darkLink:    'text-[var(--color-text-low)] hover:text-[var(--color-text-high)] transition-colors font-medium',
  backLink:    'flex items-center gap-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-low)] text-xs font-medium transition-colors',
  cardBackLink:'flex items-center gap-1.5 text-xs text-[var(--color-text-low)] hover:text-[var(--color-text-high)] font-medium transition-colors mb-6',
  divider:     'auth-divider',

  successIcon: 'status-icon-success',
  errorIcon:   'status-icon-error',
  infoIcon:    'status-icon-success',
}
