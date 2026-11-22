import type { Statement } from './types'

export interface FinSyncThemeOverrides {
  primaryColor?: string
  textColor?: string
  mutedColor?: string
  surfaceColor?: string
  subtleSurfaceColor?: string
  borderColor?: string
  borderRadius?: number
  fontFamily?: string
  monoFontFamily?: string
  spacingScale?: number
}

export type FinSyncLocale = 'en-IN' | 'en-US'

export interface FinSyncPresentationConfig {
  brandName?: string
  locale?: FinSyncLocale
  currency?: 'INR'
  logoUrl?: string
  logoAlt?: string
  optionalSections?: {
    accountDetails?: boolean
    financialSummary?: boolean
    transactions?: boolean
  }
  theme?: FinSyncThemeOverrides
}

export interface FinSyncStatementProps {
  statement: Statement
  config?: FinSyncPresentationConfig
  initialView?: 'web' | 'email' | 'pdf' | 'canvas'
  onInvalidStatement?: (errors: string[]) => void
  themePreset?: {
    value: string
    options: Array<{ value: string; label: string }>
    onChange: (value: string) => void
  }
}

export interface FinSyncRendererConfig {
  brandName: string
  locale: FinSyncLocale
  logoUrl?: string
  logoAlt?: string
  theme?: FinSyncThemeOverrides
  optionalSections?: FinSyncPresentationConfig['optionalSections']
}
