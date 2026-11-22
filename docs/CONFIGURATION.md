# FinSync Configuration Guide

This guide explains how external developers can configure and customize FinSync for their applications without modifying internal renderer implementations.

FinSync is architected to allow complete brand, color, typography, locale, and structural customization through typed configuration objects that apply consistently across all four output formats: **Web (`Page`)**, **Email (`Email`)**, **PDF (`Document`)**, and **Canvas (`Canvas`)**.

---

## 1. Basic Configuration

FinSync is structured as a **source-level developer template** (`"private": true`) rather than a standalone package published to the npm registry. External applications consume FinSync by importing from `./src` directly (or by path mapping `finsync` in `tsconfig.json` / workspace configuration).

When integrating FinSync, the primary entry point is the `<FinSyncStatement />` component. If no configuration object is supplied, FinSync applies default branding and formatting:

```tsx
import { FinSyncStatement, type Statement } from '../src'

export function MyStatementView({ customerStatement }: { customerStatement: Statement }) {
  // Uses sensible defaults: brandName="FinSync", locale="en-IN", default theme
  return <FinSyncStatement statement={customerStatement} />
}
```

### Default Values

| Configuration Field | Default Value | Description |
| :--- | :--- | :--- |
| `brandName` | `'FinSync'` | Display name rendered in header and footers |
| `locale` | `'en-IN'` | Locale used for date and currency formatting |
| `currency` | `'INR'` | Currency representation (integers in paise) |
| `initialView` | `'web'` | Initial active tab (`'web'`, `'email'`, `'pdf'`, `'canvas'`) |
| `theme` | Default FinSync Fintech Palette | Pine green (`#236F54`), ink (`#182A38`), clean surfaces |
| `optionalSections` | All enabled (`true`) | Account details, financial summary, and transactions table |

---

## 2. Custom Branding

To adapt FinSync to your organization, pass a `config` object conforming to `FinSyncPresentationConfig`:

```tsx
import { FinSyncStatement, type FinSyncPresentationConfig, type Statement } from '../src'

const organizationConfig: FinSyncPresentationConfig = {
  brandName: 'Acme Finance',
  logoUrl: '/acme-logo.svg',
  logoAlt: 'Acme Finance Logo',
  theme: {
    primaryColor: '#0F52BA', // Sapphire Blue brand color
  },
}

export function BrandedStatement({ statement }: { statement: Statement }) {
  return <FinSyncStatement statement={statement} config={organizationConfig} />
}
```

### Brand Logo Resolution

- `logoUrl`: Absolute or relative path to a local raster (`.png`, `.jpg`) or vector (`.svg`) asset.
- In Web and Email HTML, the asset renders via standard `<img>` / `<Image>`.
- In server PDF and Canvas exports, the server reads local public paths (e.g., `public/acme-logo.svg`).
- If an image fails to load or is omitted, FinSync automatically falls back to an initial monogram badge.

---

## 3. Themes and Colors

FinSync uses `@hyper-elements/react` tokenized theme architecture. You can customize colors, border radii, typography, and spacing scales through `theme` overrides:

```tsx
const customThemeConfig: FinSyncPresentationConfig = {
  brandName: 'Aura Wealth',
  theme: {
    primaryColor: '#7C3AED',       // Main brand accent (buttons, credit indicators, active tabs)
    textColor: '#1E1B4B',          // Main ink text color
    mutedColor: '#6B7280',         // Secondary and metadata text
    surfaceColor: '#FFFFFF',       // Card and sheet background
    subtleSurfaceColor: '#F5F3FF', // Subtle background tint (summary metrics, table headers)
    borderColor: '#E5E7EB',        // Border lines and dividers
    borderRadius: 12,              // Card and badge corner radius (in pixels)
    spacingScale: 1.05,            // Multiplier for padding and gaps
    fontFamily: "'Inter', sans-serif",
    monoFontFamily: "'JetBrains Mono', monospace",
  },
}
```

### Built-in Preset Switching

FinSync supports dynamic theme preset switching via the `themePreset` prop:

```tsx
const [themeName, setThemeName] = useState<'fintech' | 'violet'>('fintech')

<FinSyncStatement
  statement={statement}
  themePreset={{
    value: themeName,
    options: [
      { value: 'fintech', label: 'Fintech Default' },
      { value: 'violet', label: 'Violet Custom' },
    ],
    onChange: (val) => setThemeName(val as 'fintech' | 'violet'),
  }}
  config={themeName === 'violet' ? violetConfig : defaultConfig}
/>
```

---

## 4. Locale & Financial Formatting

FinSync is designed for integer paise financial calculations, guaranteeing exact arithmetic without JavaScript floating-point errors:

- **Currency**: `INR` (Indian Rupee), rendered using the `₹` symbol.
- **Integer Paise**: All monetary amounts (`openingBalancePaise`, `closingBalancePaise`, `amountPaise`) are integer paise (e.g. `10000 paise = ₹100.00`).
- **Locales**:
  - `en-IN` (Default): Uses standard Indian number formatting (e.g., `₹1,88,600.00`) and DD MMM YYYY dates.
  - `en-US`: Uses international formatting while retaining the INR synthetic currency context.

```tsx
const usConfig: FinSyncPresentationConfig = {
  locale: 'en-US',
  brandName: 'Global INR Services',
}
```

---

## 5. Optional Statement Sections

You can selectively toggle major statement sections using `optionalSections`. This is useful for summary-only views or privacy-restricted modes:

```tsx
const summaryOnlyConfig: FinSyncPresentationConfig = {
  optionalSections: {
    accountDetails: true,    // Show account holder & masked number
    financialSummary: true,  // Show opening/closing balances & totals
    transactions: false,     // Hide detailed transaction ledger
  },
}
```

### Cross-Format Effect of Section Flags

| Section | Web (`Page`) | Email (`Email`) | PDF (`Document`) | Canvas (`Canvas`) |
| :--- | :--- | :--- | :--- | :--- |
| `accountDetails: false` | Hides customer metadata card | Hides account details block | Hides top account strip | Renders period only |
| `financialSummary: false`| Hides 4-metric grid | Hides stacked balance card | Hides metric bar & closing summary | Hides 3-card metric row |
| `transactions: false` | Hides transaction table & filters | Hides transaction list | Hides transaction ledger table | N/A (Canvas is summary) |

---

## 6. Customization Boundaries

FinSync draws a clear line between what is configurable via props and what requires adapting components:

### Configurable via Props (Zero Source Code Edits)
- Brand name, title, and logo
- Primary brand accent and ink colors
- Background, surface, and border colors
- Border radius and layout spacing scale
- Currency formatting locale (`en-IN`, `en-US`)
- Section visibility toggles (`optionalSections`)
- Initial format view (`web`, `email`, `pdf`, `canvas`)

### Requires Extending Shared Components
- Adding new statement metadata fields (e.g. branch IFSC code, tax identification numbers).
- Introducing different table columns (e.g. transaction category icon, merchant logo).
- Multi-currency conversion engines (FinSync enforces integer-paise INR arithmetic).

To customize structure, import FinSync's shared Hyper Elements components from `'finsync'` and compose your own document tree:

```tsx
import { BrandHeader, BalanceSummary, TransactionSection } from 'finsync'
import { Document } from '@hyper-elements/react'

export function CustomStatementDocument({ statement, config }) {
  return (
    <Document size="A4">
      <BrandHeader brandName={config.brandName} />
      <BalanceSummary statement={statement} variant="horizontal" />
      <TransactionSection transactions={statement.transactions} />
    </Document>
  )
}
```
