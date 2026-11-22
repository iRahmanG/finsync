import { defineTheme, extendTheme, token } from '@hyper-elements/react'
import type { FinSyncThemeOverrides } from './public-api'

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
    body: "'DM Sans', 'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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

export const finsyncHyperTheme = defineTheme({
  colors: {
    ink: theme.colors.ink,
    muted: theme.colors.muted,
    line: theme.colors.line,
    surface: theme.colors.surface,
    surfaceSubtle: theme.colors.surfaceSubtle,
    primary: theme.colors.primary,
    primaryDark: theme.colors.primaryDark,
    primarySoft: theme.colors.primarySoft,
    debit: theme.colors.debit,
    debitSoft: theme.colors.debitSoft,
    warning: theme.colors.warning,
    warningSoft: theme.colors.warningSoft,
  },
  fonts: {
    body: "'DM Sans', 'Noto Sans', 'FinSync Sans', Arial, sans-serif",
    mono: "'DM Mono', monospace",
  },
  spacing: {
    xs: theme.spacing.xs,
    sm: theme.spacing.sm,
    md: theme.spacing.md,
    lg: theme.spacing.lg,
    xl: theme.spacing.xl,
  },
  radii: {
    sm: theme.radius.sm,
    md: theme.radius.md,
    pill: theme.radius.pill,
  },
})

export function createFinSyncTheme(overrides: FinSyncThemeOverrides = {}) {
  return extendTheme(finsyncHyperTheme, {
    colors: {
      primary: overrides.primaryColor ?? theme.colors.primary,
      ink: overrides.textColor ?? theme.colors.ink,
      muted: overrides.mutedColor ?? theme.colors.muted,
      surface: overrides.surfaceColor ?? theme.colors.surface,
      surfaceSubtle: overrides.subtleSurfaceColor ?? theme.colors.surfaceSubtle,
      line: overrides.borderColor ?? theme.colors.line,
    },
    fonts: {
      body: overrides.fontFamily ?? finsyncHyperTheme.fonts.body,
      mono: overrides.monoFontFamily ?? finsyncHyperTheme.fonts.mono,
    },
    spacing: Object.fromEntries(
      Object.entries(theme.spacing).map(([name, value]) => [
        name,
        `${parseInt(value, 10) * (overrides.spacingScale ?? 1)}px`,
      ]),
    ),
    radii: {
      sm: `${6 * (overrides.spacingScale ?? 1)}px`,
      md: `${(overrides.borderRadius ?? 9) * (overrides.spacingScale ?? 1)}px`,
      pill: theme.radius.pill,
    },
  })
}

export { token }
