import type { Statement } from '../src/types'
import type { FinSyncRendererConfig } from '../src/public-api'
import { normalizeStatement, validateStatement, type StatementInput } from '../src/financial'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isSafeLogoPath = (value: string): boolean =>
  value.startsWith('/') &&
  !value.includes('..') &&
  /^\/[A-Za-z0-9._/-]+$/.test(value)

const isStatement = (value: unknown): value is Statement => {
  if (!isRecord(value) || !isRecord(value.statementPeriod) || !Array.isArray(value.transactions)) return false
  if (!value.transactions.every((transaction) => isRecord(transaction))) return false
  try {
    const normalized = normalizeStatement(value as StatementInput)
    const validation = validateStatement(normalized)
    const structuralErrors = validation.errors.filter((error) => !error.startsWith('Closing balance mismatch:'))
    return structuralErrors.length === 0
  } catch {
    return false
  }
}

const isValidRendererConfig = (value: unknown): value is FinSyncRendererConfig => {
  if (!isRecord(value)) return false
  if (typeof value.brandName !== 'string' || value.brandName.trim() === '' || value.brandName.length > 100) return false
  if (value.locale !== 'en-IN' && value.locale !== 'en-US') return false
  if (value.logoUrl !== undefined && (typeof value.logoUrl !== 'string' || !isSafeLogoPath(value.logoUrl))) return false
  if (value.logoAlt !== undefined && (typeof value.logoAlt !== 'string' || value.logoAlt.length > 200)) return false
  if (value.optionalSections !== undefined) {
    if (!isRecord(value.optionalSections) ||
      Object.values(value.optionalSections).some((section) => typeof section !== 'boolean') ||
      Object.keys(value.optionalSections).some((section) => !['accountDetails', 'financialSummary', 'transactions'].includes(section))) return false
  }
  if (value.theme !== undefined) {
    if (!isRecord(value.theme)) return false
    const theme = value.theme
    const colorKeys = ['primaryColor', 'textColor', 'mutedColor', 'surfaceColor', 'subtleSurfaceColor', 'borderColor']
    if (colorKeys.some((key) => theme[key] !== undefined && (typeof theme[key] !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(theme[key] as string)))) return false
    if (theme.fontFamily !== undefined && typeof theme.fontFamily !== 'string') return false
    if (theme.monoFontFamily !== undefined && typeof theme.monoFontFamily !== 'string') return false
    if (theme.borderRadius !== undefined && (typeof theme.borderRadius !== 'number' || !Number.isFinite(theme.borderRadius) || theme.borderRadius < 0 || theme.borderRadius > 100)) return false
    if (theme.spacingScale !== undefined && (typeof theme.spacingScale !== 'number' || !Number.isFinite(theme.spacingScale) || theme.spacingScale <= 0 || theme.spacingScale > 10)) return false
  }
  return true
}

export function validateExportRequest(value: unknown): { statement: Statement; rendererConfig?: FinSyncRendererConfig } | undefined {
  if (!isRecord(value)) return undefined
  const isEnvelope = 'statement' in value
  const statementValue = isEnvelope ? value.statement : value
  const rendererConfigValue = isEnvelope ? value.rendererConfig : undefined
  if (!isStatement(statementValue) || (rendererConfigValue !== undefined && !isValidRendererConfig(rendererConfigValue))) return undefined
  return {
    statement: statementValue,
    rendererConfig: rendererConfigValue as FinSyncRendererConfig | undefined,
  }
}

export function parseExportRequestJson(body: string):
  | { ok: true; value: unknown }
  | { ok: false } {
  try {
    const cleanBody = body.charCodeAt(0) === 0xfeff ? body.slice(1) : body
    return { ok: true, value: JSON.parse(cleanBody) }
  } catch {
    return { ok: false }
  }
}

export { isSafeLogoPath }
