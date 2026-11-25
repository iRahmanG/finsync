# FinSync Developer Integration Guide

This guide walks through integrating, customizing, and rendering FinSync financial statements in an existing React and TypeScript application.

---

## 1. Prerequisites & Environment Requirements

FinSync requires the following environment versions:
- **Node.js**: `v20.x` or `v22.x`
- **React**: `v19.x` (`react@^19.3.1`, `react-dom@^19.3.1`)
- **TypeScript**: `v5.8.x` or compatible with `tsconfig.json` `target: ES2022`
- **Hyper Elements**: `@hyper-elements/react@^0.5.0`

---

## 2. Source-Level Setup

> [!NOTE]
> FinSync is distributed as an **in-tree source template** (`"private": true` in `package.json`), not as an independently published npm package. External projects integrate FinSync by adding the `src/` directory to their project or mapping a workspace path alias.

### Option A: Monorepo or Path Alias Setup
In your host application's `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/finsync": ["./src/index.ts"],
      "@/finsync/*": ["./src/*"]
    }
  }
}
```

### Option B: Direct Relative Import
If FinSync resides in a subdirectory of your workspace:

```tsx
import { FinSyncStatement, type Statement } from '../finsync/src'
```

---

## 3. First Integration Example

Here is a minimal, complete TypeScript example that imports the public API, defines a valid customer statement, and renders the interactive multi-format statement viewer:

```tsx
import React from 'react'
import {
  FinSyncStatement,
  type Statement,
  type FinSyncPresentationConfig,
} from './src'

// 1. Define customer statement data (integer paise arithmetic)
const myStatement: Statement = {
  accountHolder: 'Maksud Rahman',
  accountNumber: '•••• 4821',
  accountType: 'Savings Account',
  currency: 'INR',
  statementPeriod: {
    start: '2026-10-01',
    end: '2026-10-31',
  },
  openingBalancePaise: 14_280_000, // ₹1,42,800.00
  closingBalancePaise: 18_860_000, // ₹1,88,600.00
  transactions: [
    {
      id: 'txn-01',
      date: '2026-10-05',
      description: 'Consulting services fee credit',
      reference: 'TXN-2026-004821',
      type: 'CREDIT',
      amountPaise: 6_500_000,        // ₹65,000.00
      balancePaise: 20_780_000,
    },
    {
      id: 'txn-02',
      date: '2026-10-14',
      description: 'Health insurance premium debit',
      reference: 'TXN-2026-004822',
      type: 'DEBIT',
      amountPaise: 1_920_000,        // ₹19,200.00
      balancePaise: 18_860_000,
    },
  ],
}

// 2. Configure organization branding and theme
const presentationConfig: FinSyncPresentationConfig = {
  brandName: 'Acme Finance',
  logoUrl: '/acme-logo.svg',
  locale: 'en-IN',
  theme: {
    primaryColor: '#0F52BA',
    borderRadius: 10,
  },
}

// 3. Render the statement component
export function CustomerPortal() {
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAF9' }}>
      <FinSyncStatement
        statement={myStatement}
        config={presentationConfig}
        initialView="web"
      />
    </div>
  )
}
```

---

## 4. Financial Data Structure & Validation Rules

### 4.1 Statement Properties

| Field | Type | Required | Description | Example |
| :--- | :--- | :---: | :--- | :--- |
| `accountHolder` | `string` | **Yes** | Full legal name of the account holder. | `'Maksud Rahman'` |
| `accountNumber` | `string` | **Yes** | Masked or raw account identifier. | `'•••• 4821'` |
| `accountType` | `string` | **Yes** | Classification of account. | `'Savings Account'` |
| `currency` | `'INR'` | **Yes** | Must strictly be `'INR'`. | `'INR'` |
| `statementPeriod.start` | `string` | **Yes** | ISO-8601 start date (`YYYY-MM-DD`). | `'2026-10-01'` |
| `statementPeriod.end` | `string` | **Yes** | ISO-8601 end date (`YYYY-MM-DD`). | `'2026-10-31'` |
| `openingBalancePaise` | `number` | **Yes** | Starting balance in non-negative integer paise. | `14280000` |
| `closingBalancePaise` | `number` | **Yes** | Ending balance in non-negative integer paise. | `18860000` |
| `transactions` | `Transaction[]` | **Yes** | Ordered array of ledger entries. | `[...]` |

### 4.2 Transaction Properties

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `id` | `string` | **Yes** | Unique entry identifier. |
| `date` | `string` | **Yes** | Transaction date in `YYYY-MM-DD` format. |
| `description` | `string` | **Yes** | Narrative description of payee or transaction source. |
| `reference` | `string` | **Yes** | Audit or banking reference code (e.g. `'TXN-2026-004821'`). |
| `type` | `'CREDIT' \| 'DEBIT'` | **Yes** | Direction of money flow. |
| `amountPaise` | `number` | **Yes** | Non-negative integer value in paise (`10000 = ₹100.00`). |
| `balancePaise` | `number` | No | Running ledger balance after transaction execution. |

### 4.3 Validation & Reconciliation Engine
You can validate statement payloads programmatically before rendering:

```tsx
import { validateStatement, getReconciliation } from './src'

const result = validateStatement(myStatement)
if (!result.valid) {
  console.error('Validation errors:', result.errors)
}

const audit = getReconciliation(myStatement)
console.log('Is mathematically reconciled:', audit.valid)
console.log('Expected closing balance:', audit.expectedClosingBalancePaise)
```

---

## 5. Output Rendering Options

FinSync offers two integration levels: **Full Interactive UI Shell** and **Headless Document Builders**.

### Level 1: Interactive Application Component (`<FinSyncStatement />`)
Renders the complete responsive experience with tab switching, transaction search, date filtering, and live preview frames:

```tsx
<FinSyncStatement
  statement={myStatement}
  config={presentationConfig}
  initialView="web" // 'web' | 'email' | 'pdf' | 'canvas'
/>
```

### Level 2: Headless Document Builders
If your application generates documents on a server, in an API worker, or in email dispatch jobs:

#### 1. Web Document (`StatementPageDocument`)
```tsx
import { StatementPageDocument } from './src'
import { render } from '@hyper-elements/react'

const pageTree = StatementPageDocument({
  statement: myStatement,
  transactions: myStatement.transactions,
  rendererConfig: { brandName: 'Acme Finance', locale: 'en-IN' },
})

const { html } = await render(pageTree)
```

#### 2. Email HTML (`StatementEmailDocument`)
```tsx
import { StatementEmailDocument } from './src'
import { render } from '@hyper-elements/react'

const emailTree = StatementEmailDocument({
  statement: myStatement,
  statementUrl: 'https://acme.example.com/statements/october-2026',
  rendererConfig: { brandName: 'Acme Finance', locale: 'en-IN' },
})

const { html } = await render(emailTree)
// Send `html` via SendGrid, Postmark, AWS SES, or Nodemailer
```

#### 3. Vector PDF Document (`PdfDocument`)
```tsx
import React from 'react'
import { PdfDocument } from './src'
import { renderPdf } from '@hyper-elements/react/pdf'

const pdfTree = React.createElement(PdfDocument, {
  statement: myStatement,
  rendererConfig: { brandName: 'Acme Finance', locale: 'en-IN' },
})

const { pdf } = await renderPdf(pdfTree)
// `pdf` is a Uint8Array containing binary A4 PDF bytes
```

#### 4. Raster Canvas Image (`CanvasDocument`)
```tsx
import React from 'react'
import { CanvasDocument } from './src'
import { renderImage } from '@hyper-elements/react/image'

const canvasTree = React.createElement(CanvasDocument, {
  statement: myStatement,
  rendererConfig: { brandName: 'Acme Finance', locale: 'en-IN' },
})

const { image } = await renderImage(canvasTree, { format: 'png', scale: 2 })
// `image` is a Uint8Array containing 2400x1260 PNG bytes
```

---

## 6. Client-Side Export Downloads

To trigger instant browser downloads of PDF or PNG files using FinSync's export server:

```tsx
import { exportPdf, exportPng } from './src'

// Trigger PDF download
await exportPdf(null, myStatement, presentationConfig)

// Trigger PNG snapshot download
await exportPng(null, myStatement, presentationConfig)
```

---

## 7. Practical Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **"Currency must be INR"** | `statement.currency` was omitted or set to USD/EUR. | FinSync's arithmetic model strictly validates `'INR'`. Ensure `currency: 'INR'` is set. |
| **"Invalid amount: must be non-negative integer paise"** | Floating-point rupee numbers (e.g. `142.50`) passed to `amountPaise`. | Multiply rupees by 100 to pass integer paise: `Math.round(rupees * 100)`. |
| **"Arithmetic mismatch" warning callout** | $\text{Opening} + \text{Credits} - \text{Debits} \neq \text{Closing}$. | Audit the transaction list totals. Ensure closing balance matches the arithmetic sum. |
| **PDF export server returns 404/ECONNREFUSED** | Export server is not running on port 4174. | Run `npm run export` in a background terminal, or set `VITE_EXPORT_SERVER_URL` in `.env`. |
| **Missing glyphs in PDF render** | Custom font was not registered with font registry. | Use the bundled `Noto Sans` fonts in `public/fonts/` which are pre-registered in `check-exports.ts`. |
