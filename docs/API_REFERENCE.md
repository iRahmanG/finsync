# FinSync Public API Reference

This document provides a comprehensive technical reference for all public types, components, document renderers, and utilities exported from [`src/index.ts`](../src/index.ts).

---

## 1. Primary Component

### `FinSyncStatement`
The top-level interactive statement viewer component combining the React DOM application shell with Hyper Elements document rendering.

```tsx
import { FinSyncStatement } from './src'

<FinSyncStatement
  statement={statement}
  config={presentationConfig}
  initialView="web"
  onInvalidStatement={(errors) => console.error(errors)}
  themePreset={presetConfig}
/>
```

#### Props (`FinSyncStatementProps`)
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `statement` | `Statement` | *(Required)* | The financial statement data object. |
| `config` | `FinSyncPresentationConfig` | Default config | Branding, locale, theme overrides, and optional section toggles. |
| `initialView` | `'web' \| 'email' \| 'pdf' \| 'canvas'` | `'web'` | Active format tab on initial render. |
| `onInvalidStatement`| `(errors: string[]) => void` | `undefined` | Callback invoked when statement validation fails. |
| `themePreset` | `{ value: string; options: Array<{ value: string; label: string }>; onChange: (val: string) => void }` | `undefined` | Controlled state for interactive theme switcher dropdown. |

---

## 2. Core Data Models

### `Statement`
The authoritative financial statement interface.

```ts
export interface Statement {
  accountHolder: string
  accountNumber: string
  accountType: string
  currency: 'INR'
  statementPeriod: {
    start: string // YYYY-MM-DD
    end: string   // YYYY-MM-DD
  }
  openingBalancePaise: number
  closingBalancePaise: number
  transactions: Transaction[]
}
```

### `Transaction`
Individual ledger entry.

```ts
export interface Transaction {
  id: string
  date: string             // YYYY-MM-DD
  description: string
  reference: string
  type: 'CREDIT' | 'DEBIT'
  amountPaise: number      // Integer paise
  balancePaise?: number    // Snapshot running balance
}
```

---

## 3. Configuration Interfaces

### `FinSyncPresentationConfig`
Customization options for branding, formatting, and layout.

```ts
export interface FinSyncPresentationConfig {
  brandName?: string
  locale?: FinSyncLocale // 'en-IN' | 'en-US'
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
```

### `FinSyncThemeOverrides`
Design token overrides applied to the Hyper Elements theme.

```ts
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
```

### `FinSyncRendererConfig`
Normalized configuration passed to format-specific document builders.

```ts
export interface FinSyncRendererConfig {
  brandName: string
  locale: FinSyncLocale
  logoUrl?: string
  logoAlt?: string
  theme?: FinSyncThemeOverrides
  optionalSections?: FinSyncPresentationConfig['optionalSections']
}
```

---

## 4. Format-Specific Document Builders & Previews

### Web (`src/renderers/WebStatement.tsx`)
- **`StatementPageDocument(props: { statement: Statement; transactions: Transaction[]; rendererConfig: FinSyncRendererConfig })`**  
  *Returns:* Hyper Elements `<Page>` element.  
  *Usage:* Compile with `render()` to generate HTML with scoped CSS.
- **`StatementPagePreview(props: WebStatementProps)`**  
  *Returns:* React component rendering the compiled web statement HTML.

### Email (`src/renderers/StatementEmail.tsx`)
- **`StatementEmailDocument(props: { statement: Statement; statementUrl?: string; rendererConfig?: FinSyncRendererConfig })`**  
  *Returns:* Hyper Elements `<Email>` element (580px width).  
  *Usage:* Compile with `render()` to generate inlined-CSS table HTML.
- **`StatementEmail(props: StatementEmailProps)`**  
  *Returns:* React component rendering an isolated `<iframe>` preview of the email.

### PDF (`src/renderers/PdfStatement.tsx`)
- **`PdfDocument(props: { statement: Statement; locale?: FinSyncLocale; brandName?: string; rendererConfig?: FinSyncRendererConfig })`**  
  *Returns:* Hyper Elements `<Document>` element (ISO A4, 12 rows per page, embedded fonts).  
  *Usage:* Compile with `renderPdf()` to generate vector PDF binary bytes.
- **`PdfStatement(props: PdfStatementProps)`**  
  *Returns:* React component rendering toolbar actions and an interactive PDF preview.

### Canvas (`src/renderers/CanvasSummary.tsx`)
- **`CanvasDocument(props: CanvasSummaryProps)`**  
  *Returns:* Hyper Elements `<Canvas>` element (1200×630 dimensions).  
  *Usage:* Compile with `renderImage()` at 2× scale to generate high-resolution PNG bytes.
- **`CanvasSummary(props: CanvasSummaryProps)`**  
  *Returns:* React component rendering the canvas artboard preview and PNG download trigger.

### Generic Preview (`src/renderers/HyperPreview.tsx`)
- **`HyperPreview(props: { title: string; element: React.ReactElement })`**  
  *Returns:* React component rendering an isolated preview iframe using Hyper Elements client renderer.

---

## 5. Shared Semantic Components (`src/components/`)

All shared components are exported from `src/index.ts` and can be used to compose custom document trees:

| Component | Props Interface | Key Variants | Description |
| :--- | :--- | :--- | :--- |
| **`BrandHeader`** | `BrandHeaderProps` | `variant`: `'standard' \| 'compact' \| 'email' \| 'canvas'` | Renders organization name, logo, eyebrow, and period. |
| **`AccountInformation`** | `AccountInformationProps` | `layout`: `'row' \| 'column' \| 'pdf' \| 'canvas'` | Displays account holder, masked account number, and period. |
| **`BalanceSummary`** | `BalanceSummaryProps` | `variant`: `'grid' \| 'stacked' \| 'horizontal' \| 'metrics'` | Renders opening/closing balances and calculated net cash flow. |
| **`TransactionSection`** | `TransactionSectionProps` | Configurable columns | Table container managing headers, rows, and empty states. |
| **`TransactionRow`** | `TransactionRowProps` | `showType`, `showRunningBalance` | Single ledger row with formatted amounts and credit/debit indicators. |
| **`ReconciliationBanner`**| `ReconciliationBannerProps`| `variant`: `'standard' \| 'compact' \| 'email'` | Anomaly alert rendered only when balance arithmetic mismatches. |
| **`StatementFooter`** | `StatementFooterProps` | `variant`: `'standard' \| 'web' \| 'pdf'`, `showPageNumber` | Legal notices, confidentiality marking, and PDF page counters. |
| **`StatementBody`** | `StatementBodyProps` | `variant`: `'web' \| 'email' \| 'pdf'` | High-level orchestrator applying `optionalSections` toggles. |

---

## 6. Financial & Validation Utilities (`src/financial.ts`)

### `validateStatement(statement: unknown): ValidationResult`
Validates schema types, date formats, non-negative integer paise amounts, and mathematical reconciliation.
```ts
const { valid, errors, totals, runningBalances } = validateStatement(statement)
```

### `getReconciliation(statement: Statement)`
Calculates total credits, debits, and verifies whether:
$$\text{Opening} + \text{Credits} - \text{Debits} == \text{Closing}$$
*Returns:* `{ valid: boolean; totalCreditsPaise: number; totalDebitsPaise: number; expectedClosingBalancePaise: number; discrepancyPaise: number }`

### `calculateTotals(transactions: Transaction[]): StatementTotals`
Calculates cumulative credits and debits in integer paise:
*Returns:* `{ totalCreditsPaise: number; totalDebitsPaise: number }`

### `calculateRunningBalances(statement: Statement): RunningBalance[]`
Computes the sequential ledger balance for each transaction chronologically:
*Returns:* `Array<{ transactionId: string; balancePaise: number }>`

### `maskAccountNumber(accountNumber: string): string`
Masks all but the last 4 digits:
```ts
maskAccountNumber('1234567890124821') // returns '•••• 4821'
```

### `formatCurrency(amountPaise: number, locale?: FinSyncLocale): string`
Formats integer paise into localized currency string (e.g. `14280000` $\to$ `'₹1,42,800.00'`).

### `formatExportCurrency(amountPaise: number, locale?: FinSyncLocale): string`
Formats currency using standard ASCII fallback symbols (`Rs.` or `INR`) for PDF engines without native rupee font glyphs.

### `formatDate(isoDate: string, locale?: FinSyncLocale): string`
Formats an ISO `YYYY-MM-DD` string into regional human-readable format (e.g. `'01 Oct 2026'`).

### `formatStatementPeriod(start: string, end: string, locale?: FinSyncLocale): string`
Formats a date range: `'01 Oct 2026 — 31 Oct 2026'`.

---

## 7. Export Utilities (`src/export.ts`)

### `exportPdf(element: unknown, statement: Statement, rendererConfig?: FinSyncRendererConfig): Promise<void>`
Sends an HTTP POST request to the export server (`/api/export/pdf`) and triggers a browser file download of the resulting A4 PDF.

### `exportPng(element: unknown, statement: Statement, rendererConfig?: FinSyncRendererConfig): Promise<void>`
Sends an HTTP POST request to the export server (`/api/export/png`) and triggers a browser file download of the resulting 2400×1260 PNG.

### `statementFilename(period: { start: string; end: string }, extension: 'pdf' | 'png'): string`
Generates standardized export filenames: `finsync-statement-20261001-20261031.pdf`.

### `downloadBytes(bytes: Uint8Array, filename: string, mimeType: string): void`
Browser helper creating a blob URL and simulating an anchor click for immediate file download.
