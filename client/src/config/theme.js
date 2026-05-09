// ─── Design tokens — edit here to change the whole app ───────────────────────

export const t = {
  // Page wrapper — near-black background, vertically centered
  pageBg: 'min-h-screen bg-[#09090b] flex flex-col items-center justify-center px-4 py-12 gap-6',

  // Card — white, thin border, very subtle shadow
  card:   'bg-white border border-gray-200 rounded-2xl shadow-sm w-full',
  cardSm: 'max-w-[380px]',   // login, forgot, reset, verify
  cardMd: 'max-w-[440px]',   // signup (wider for name row)
  cardPadding: 'px-8 py-9',

  // Primary CTA button
  btn: 'w-full bg-blue-950 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-blue-900 active:bg-blue-950 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed',

  // Input field
  input:      'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-gray-400 transition-colors',
  inputError: 'border-red-300 focus:border-red-400',

  // Field label
  label: 'block text-xs font-medium text-gray-600 mb-1.5',

  // Error text under input
  fieldError: 'text-xs text-red-500 mt-1.5',

  // In-card text links (on white)
  link:     'text-blue-900 hover:text-blue-950 underline-offset-2 hover:underline transition-colors',
  linkMuted: 'text-xs text-gray-500 hover:text-gray-800 transition-colors',

  // Below-card links (on dark background)
  darkSubtext: 'text-xs text-white/40',
  darkLink:    'text-white/65 hover:text-white transition-colors font-medium',

  // Back arrow — absolute top-left on dark bg
  backLink: 'flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs font-medium transition-colors',

  // Back link inside card
  cardBackLink: 'flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 font-medium transition-colors mb-6',

  // OR divider
  divider: 'px-2 bg-white text-xs text-gray-400',

  // Full-width OAuth button (stacked, Vercel style)
  oauthBtn: 'flex items-center gap-3 w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors',

  // Status icon circles
  successIcon: 'w-11 h-11 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-4',
  errorIcon:   'w-11 h-11 bg-red-50   border border-red-200   rounded-full flex items-center justify-center mx-auto mb-4',
  infoIcon:    'w-11 h-11 bg-blue-50  border border-blue-200  rounded-full flex items-center justify-center mx-auto mb-4',
}
