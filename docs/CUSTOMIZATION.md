# FinSync Customization & Theming Guide

This guide explains how to adapt FinSync's branding, color palette, typography, privacy controls, and section layouts without modifying internal rendering logic.

---

## 1. Brand Identity Customization

You can adapt FinSync to any external organization by supplying custom branding through `FinSyncPresentationConfig`:

```tsx
import { FinSyncStatement, type FinSyncPresentationConfig, type Statement } from './src'

const customBranding: FinSyncPresentationConfig = {
  brandName: 'Acme Finance',
  logoUrl: '/acme-logo.svg',      // Path to vector or raster logo
  logoAlt: 'Acme Finance Logo',
}

export function BrandedStatement({ statement }: { statement: Statement }) {
  return <FinSyncStatement statement={statement} config={customBranding} />
}
```

### Fallback Behavior
If `logoUrl` is omitted or fails to load, `BrandHeader` automatically falls back to rendering a styled monogram badge derived from `brandName[0]`.

---

## 2. Theme Tokens & Palette Overrides

FinSync uses `@hyper-elements/react` token architecture. You can customize colors, corner radii, and spacing scales via the `theme` field in `FinSyncPresentationConfig`:

```tsx
const customTheme: FinSyncPresentationConfig = {
  brandName: 'Sapphire Wealth',
  theme: {
    primaryColor: '#0F52BA',        // Sapphire Blue (active tabs, credit badges, CTA buttons)
    textColor: '#0B1A2C',           // Deep navy text
    mutedColor: '#5A6E85',          // Slate secondary metadata
    surfaceColor: '#FFFFFF',        // Card and container background
    subtleSurfaceColor: '#F0F5FA',  // Soft tint for summary metrics & table headers
    borderColor: '#D4E2EE',         // Table dividers and container borders
    borderRadius: 10,               // Pixel radius for cards and badges
    spacingScale: 1.05,             // Multiplier for margins and padding
  },
}
```

### Color Contrast & Financial Readability
When customizing colors:
- Keep `surfaceColor` light and `textColor` dark to ensure WCAG AA contrast.
- In financial tables, credit indicators automatically use the tokenized primary/green accent, while debit indicators use a high-contrast crimson tint (`#DC2626`).

---

## 3. Account Details & Privacy Masking

### Automatic Masking
By default, FinSync masks all but the final 4 digits of the account number using `maskAccountNumber()`:

```ts
import { maskAccountNumber } from './src'

maskAccountNumber('1234567890124821') // Result: '•••• 4821'
```

### Section Visibility Controls
You can selectively show or hide major document sections using `optionalSections`:

```tsx
const privacyConfig: FinSyncPresentationConfig = {
  optionalSections: {
    accountDetails: false,    // Omit account holder name and number
    financialSummary: true,   // Show opening, closing, and net totals
    transactions: true,       // Show ledger table
  },
}
```

### How Section Toggles Behave Across Output Formats

| Section Flag | Web (`Page`) | Email (`Email`) | PDF (`Document`) | Canvas (`Canvas`) |
| :--- | :--- | :--- | :--- | :--- |
| `accountDetails: false` | Hides customer card | Hides account block | Hides top account bar | Shows statement period only |
| `financialSummary: false`| Hides 4-card metric grid | Hides balance summary | Hides metric bar & closing box | Hides 3 financial driver cards |
| `transactions: false` | Hides ledger table & filter toolbar | Hides email transactions | Hides multi-page tables | *(Omitted by default on Canvas)* |

---

## 4. Multi-Locale Support

FinSync supports localized date and number formatting via `locale`:
- `'en-IN'` (Default): Indian numbering system (e.g. `₹1,88,600.00`) with `DD MMM YYYY` dates.
- `'en-US'`: International thousands grouping (e.g. `₹188,600.00`) with `MMM DD, YYYY` dates.

```tsx
const usLocaleConfig: FinSyncPresentationConfig = {
  locale: 'en-US',
  brandName: 'International Banking Corp',
}
```

---

## 5. Walkthrough: The Acme Finance Customization Example

FinSync includes a full enterprise customization reference implementation in [`examples/acme-finance.tsx`](../examples/acme-finance.tsx).

Here is how the default theme was transformed into the Acme Finance corporate design:

```tsx
import React from 'react'
import {
  FinSyncStatement,
  StatementPageDocument,
  StatementEmailDocument,
  PdfDocument,
  CanvasDocument,
  type Statement,
  type FinSyncPresentationConfig,
  type FinSyncRendererConfig,
} from './src'

// 1. Define complete Acme Finance presentation configuration
export const acmeConfig: FinSyncPresentationConfig = {
  brandName: 'Acme Finance',
  logoUrl: '/acme-logo.svg',
  logoAlt: 'Acme Finance Logo',
  locale: 'en-IN',
  theme: {
    primaryColor: '#0F52BA',        // Sapphire brand accent
    textColor: '#0B1A2C',           // Navy text
    mutedColor: '#5A6E85',          // Slate secondary
    surfaceColor: '#FFFFFF',        // Pure white
    subtleSurfaceColor: '#F0F5FA',  // Ice blue tint
    borderColor: '#D4E2EE',         // Light steel border
    borderRadius: 10,
    spacingScale: 1.05,
  },
}

export const acmeRendererConfig: FinSyncRendererConfig = {
  brandName: acmeConfig.brandName!,
  locale: acmeConfig.locale!,
  logoUrl: acmeConfig.logoUrl,
  logoAlt: acmeConfig.logoAlt,
  theme: acmeConfig.theme,
}

// 2. Interactive statement component for customer portal
export function AcmeInteractiveStatement({ statement }: { statement: Statement }) {
  return (
    <FinSyncStatement
      statement={statement}
      config={acmeConfig}
      initialView="web"
    />
  )
}

// 3. Headless document factory for server-side PDF exports
export function createAcmePdfDocument(statement: Statement) {
  return React.createElement(PdfDocument, {
    statement,
    rendererConfig: acmeRendererConfig,
  })
}
```
