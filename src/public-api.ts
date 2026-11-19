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

export interface FinSyncPresentationConfig {
  brandName?: string
  locale?: 'en-IN'
  currency?: 'INR'
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
}
