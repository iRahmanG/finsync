// Primary Developer Integration Component
export { FinSyncStatement } from './FinSyncStatement'

// Public Configuration & Data Types
export type {
  FinSyncLocale,
  FinSyncPresentationConfig,
  FinSyncRendererConfig,
  FinSyncStatementProps,
  FinSyncThemeOverrides,
} from './public-api'
export type { Statement, Transaction } from './types'

// Format-Specific Document Renderers
export {
  StatementPageDocument,
  StatementPagePreview,
  StatementEmailDocument,
  StatementEmail,
  PdfDocument,
  PdfStatement,
  CanvasDocument,
  CanvasSummary,
  HyperPreview,
} from './renderers'

// Export Utilities
export {
  exportPdf,
  exportPng,
  statementFilename,
  downloadBytes,
} from './export'

// Financial & Validation Utilities
export {
  validateStatement,
  getReconciliation,
  calculateTotals,
  calculateRunningBalances,
  formatCurrency,
  formatExportCurrency,
  formatDate,
  formatStatementPeriod,
  maskAccountNumber,
} from './financial'

// Theme & Primitives
export { createFinSyncTheme, theme, finsyncHyperTheme } from './theme'

// Shared Hyper Elements Component Layer
export * from './components'
