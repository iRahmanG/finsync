export const theme = {
  colors: {
    ink: '#1b2b24',
    muted: '#78827c',
    line: '#e6ebe7',
    surface: '#ffffff',
    surfaceSubtle: '#f7faf8',
    primary: '#2f7860',
    primaryDark: '#225b48',
    primarySoft: '#e9f4ef',
    credit: '#2f7860',
    creditSoft: '#e9f4ef',
    debit: '#c26b67',
    debitSoft: '#faeded',
    balance: '#947646',
    balanceSoft: '#fbf5e7',
  },
  typography: {
    body: "'DM Sans', sans-serif",
    mono: "'DM Mono', monospace",
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  radius: {
    sm: '6px',
    md: '9px',
    pill: '999px',
  },
} as const

export type FinSyncTheme = typeof theme
