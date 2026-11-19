export const theme = {
  colors: {
    ink: '#182A38',
    muted: '#667085',
    line: '#E4E9E6',
    surface: '#ffffff',
    surfaceSubtle: '#F7F9F8',
    primary: '#236F54',
    primaryDark: '#195744',
    primarySoft: '#E9F3EE',
    credit: '#236F54',
    creditSoft: '#E9F3EE',
    debit: '#B44E4B',
    debitSoft: '#FAEEEE',
    balance: '#945F32',
    balanceSoft: '#F7F1E8',
    warning: '#9A6700',
    warningSoft: '#FFF4CC',
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
