# FinSync Code Examples

A collection of copyable TypeScript examples demonstrating how to use FinSync's public APIs across common financial scenarios.

For step-by-step setup instructions, see the **[Developer Integration Guide](DEVELOPER_GUIDE.md)** and **[API Reference](API_REFERENCE.md)**.

---

## 1. Minimal Valid Statement

Renders a basic statement with opening and closing balances without intermediate transactions:

```tsx
import React from 'react'
import { FinSyncStatement, type Statement } from './src'

const minimalStatement: Statement = {
  accountHolder: 'Maksud Rahman',
  accountNumber: '•••• 4821',
  accountType: 'Savings Account',
  currency: 'INR',
  statementPeriod: {
    start: '2026-10-01',
    end: '2026-10-31',
  },
  openingBalancePaise: 5_000_000, // ₹50,000.00
  closingBalancePaise: 5_000_000, // ₹50,000.00 (Reconciled with 0 transactions)
  transactions: [],
}

export function MinimalStatementExample() {
  return <FinSyncStatement statement={minimalStatement} />
}
```

---

## 2. Multi-Transaction Statement with Credits & Debits

A full statement with multiple credits and debits showing running ledger balances:

```tsx
import React from 'react'
import { FinSyncStatement, type Statement } from './src'

const multiTxnStatement: Statement = {
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
      description: 'Client invoice payment credit',
      reference: 'INV-2026-0089',
      type: 'CREDIT',
      amountPaise: 6_500_000,       // +₹65,000.00
      balancePaise: 20_780_000,      // Running: ₹2,07,800.00
    },
    {
      id: 'txn-02',
      date: '2026-10-12',
      description: 'Office lease rent debit',
      reference: 'RENT-OCT-2026',
      type: 'DEBIT',
      amountPaise: 1_200_000,       // -₹12,000.00
      balancePaise: 19_580_000,      // Running: ₹1,95,800.00
    },
    {
      id: 'txn-03',
      date: '2026-10-18',
      description: 'Cloud infrastructure subscription',
      reference: 'AWS-2026-10',
      type: 'DEBIT',
      amountPaise: 720_000,         // -₹7,200.00
      balancePaise: 18_860_000,      // Running: ₹1,88,600.00
    },
  ],
}

export function MultiTransactionExample() {
  return <FinSyncStatement statement={multiTxnStatement} />
}
```

---

## 3. Custom Theming (Emerald Forest Palette)

Applies custom corporate branding with emerald accents and tailored spacing:

```tsx
import React from 'react'
import {
  FinSyncStatement,
  type Statement,
  type FinSyncPresentationConfig,
} from './src'

const emeraldThemeConfig: FinSyncPresentationConfig = {
  brandName: 'Verdant Wealth',
  logoUrl: '/brands/verdant-logo.svg',
  locale: 'en-IN',
  theme: {
    primaryColor: '#059669',        // Emerald green
    textColor: '#064E3B',           // Deep forest green text
    mutedColor: '#047857',          // Medium emerald metadata
    surfaceColor: '#FFFFFF',        // Pure white
    subtleSurfaceColor: '#ECFDF5',  // Mint tint for summary cards
    borderColor: '#A7F3D0',         // Soft emerald borders
    borderRadius: 8,
    spacingScale: 1.0,
  },
}

export function ThemedStatementExample({ statement }: { statement: Statement }) {
  return <FinSyncStatement statement={statement} config={emeraldThemeConfig} />
}
```

---

## 4. Privacy & Masked Account Information

Enforces customer privacy by masking account numbers and disabling customer detail cards:

```tsx
import React from 'react'
import {
  FinSyncStatement,
  maskAccountNumber,
  type Statement,
  type FinSyncPresentationConfig,
} from './src'

const privacyConfig: FinSyncPresentationConfig = {
  optionalSections: {
    accountDetails: false,   // Hides customer identity and account numbers
    financialSummary: true,  // Shows balance metrics
    transactions: true,      // Shows transaction ledger
  },
}

export function PrivacyModeExample({ rawStatement }: { rawStatement: Statement }) {
  // Ensure the account number is masked before passing down
  const safeStatement: Statement = {
    ...rawStatement,
    accountNumber: maskAccountNumber(rawStatement.accountNumber),
  }

  return <FinSyncStatement statement={safeStatement} config={privacyConfig} />
}
```

---

## 5. Mathematical Reconciliation Verification

Demonstrates how FinSync detects ledger discrepancies and renders visual anomaly warnings:

```tsx
import { validateStatement, getReconciliation, type Statement } from './src'

// 1. Correct Statement
const correctStatement: Statement = {
  accountHolder: 'Maksud Rahman',
  accountNumber: '•••• 4821',
  accountType: 'Savings Account',
  currency: 'INR',
  statementPeriod: { start: '2026-10-01', end: '2026-10-31' },
  openingBalancePaise: 10_000_000,  // ₹1,00,000.00
  closingBalancePaise: 15_000_000,  // ₹1,50,000.00
  transactions: [
    {
      id: 'tx-1',
      date: '2026-10-10',
      description: 'Consulting revenue',
      reference: 'CR-101',
      type: 'CREDIT',
      amountPaise: 5_000_000,      // +₹50,000.00
    },
  ],
}

console.log(getReconciliation(correctStatement).valid) // true
// ReconciliationBanner will remain invisible

// 2. Mismatched Statement (Closing balance should be ₹1,50,000, but is ₹1,60,000)
const mismatchedStatement: Statement = {
  ...correctStatement,
  closingBalancePaise: 16_000_000,
}

const audit = getReconciliation(mismatchedStatement)
console.log(audit.valid)                      // false
console.log(audit.discrepancyPaise)           // 1000000 (₹10,000 discrepancy)

// When rendered, FinSync will display a prominent red ReconciliationBanner
// detailing the arithmetic discrepancy of ₹10,000.00.
```

---

## 6. Direct Headless Document Generation

Generate HTML, PDF bytes, or image bytes directly on a server without the React DOM viewer:

```tsx
import React from 'react'
import {
  StatementPageDocument,
  StatementEmailDocument,
  PdfDocument,
  CanvasDocument,
  type Statement,
  type FinSyncRendererConfig,
} from './src'
import { render } from '@hyper-elements/react'
import { renderPdf } from '@hyper-elements/react/pdf'
import { renderImage } from '@hyper-elements/react/image'

const config: FinSyncRendererConfig = {
  brandName: 'FinSync',
  locale: 'en-IN',
}

// 1. Generate Web HTML
export async function generateWebHtml(statement: Statement): Promise<string> {
  const tree = StatementPageDocument({
    statement,
    transactions: statement.transactions,
    rendererConfig: config,
  })
  const { html } = await render(tree)
  return html
}

// 2. Generate Transactional Email HTML
export async function generateEmailHtml(statement: Statement): Promise<string> {
  const tree = StatementEmailDocument({
    statement,
    statementUrl: 'https://portal.example.com/statements',
    rendererConfig: config,
  })
  const { html } = await render(tree)
  return html
}

// 3. Generate Vector PDF Buffer
export async function generatePdfBytes(statement: Statement): Promise<Uint8Array> {
  const tree = React.createElement(PdfDocument, { statement, rendererConfig: config })
  const { pdf } = await renderPdf(tree)
  return pdf
}

// 4. Generate PNG Snapshot Buffer
export async function generatePngBytes(statement: Statement): Promise<Uint8Array> {
  const tree = React.createElement(CanvasDocument, { statement, rendererConfig: config })
  const { image } = await renderImage(tree, { format: 'png', scale: 2 })
  return image
}
```
