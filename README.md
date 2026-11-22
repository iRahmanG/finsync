# FinSync

FinSync is a polished React and TypeScript financial statement template built with `@hyper-elements/react@0.5.0`.

It demonstrates one synthetic account, Maksud Rahman, across five statement periods and four practical developer-facing formats: an interactive React shell with Hyper Elements web content, generated email HTML, a print-ready PDF, and a shareable canvas image.

It provides:

- Interactive responsive web statement.
- Hyper Elements email HTML preview and output.
- A4 Hyper Elements document preview and PDF export.
- 1200 × 630 Hyper Elements canvas preview and PNG export.
- Integer-paise calculations, reconciliation warnings, account masking, and running balances.

FinSync is a synthetic template, not a banking integration or a regulatory-compliant statement system.

## Synthetic profiles

The default application statement remains June 2024. The internal demonstration catalog also provides March 2025, September 2025, January 2026, and October 2026 statement periods for the same account:

- Account holder: Maksud Rahman
- Masked account number: •••• 4821
- Account type: Savings Account
- Currency model: INR

These profiles are synthetic renderer/export fixtures, not separate account holders or bank integrations.

## Install

```powershell
npm install
npm install @hyper-elements/react@0.5.0 @react-pdf/renderer satori @resvg/resvg-js
npm run dev -- --host 127.0.0.1
npm run export
```

Keep the Vite app and export server running separately for PDF and PNG downloads.

## Basic integration

```tsx
import { FinSyncStatement } from './src'
import type { Statement } from './src'

const statement: Statement = {
  accountHolder: 'Maksud Rahman',
  accountNumber: '•••• 4821',
  accountType: 'Savings Account',
  currency: 'INR',
  statementPeriod: { start: '2024-06-01', end: '2024-06-30' },
  openingBalancePaise: 18245000,
  closingBalancePaise: 18245000,
  transactions: [],
}

export function StatementPage() {
  return <FinSyncStatement statement={statement} initialView="web" />
}
```

For a complete example, see [docs/integration.example.tsx](docs/integration.example.tsx).

## Statement data

`Transaction` requires:

- `id`
- `date` as `YYYY-MM-DD`
- `description`
- `reference`
- `type`: `CREDIT` or `DEBIT`
- `amountPaise`: non-negative safe integer paise
- optional `balancePaise`

`Statement` requires:

- `accountHolder`
- `accountNumber`
- `accountType`
- `currency`: `INR`
- `statementPeriod`
- `openingBalancePaise`
- `closingBalancePaise`
- `transactions`

All money calculations use integer paise. Invalid types, impossible dates, unsafe amounts, duplicate IDs, and outside-period transactions are rejected or reported.

## Theme customization

```tsx
<FinSyncStatement
  statement={statement}
  config={{
    brandName: 'Northstar',
    theme: {
      primaryColor: '#175CD3',
      textColor: '#182A38',
      mutedColor: '#667085',
      surfaceColor: '#FFFFFF',
      subtleSurfaceColor: '#F7F9FC',
      borderColor: '#E4E7EC',
      borderRadius: 8,
    },
  }}
/>
```

Supported public theme keys are primary, text, muted, surface, subtle surface, border, border radius, body font, and mono font.

Supported locales are `en-IN` and `en-US`. The underlying statement model and calculations remain INR-only; arbitrary currency conversion is not implemented.

## Branding

```tsx
<FinSyncStatement
  statement={statement}
  config={{
    brandName: 'Northstar',
    logoUrl: '/northstar.svg',
    logoAlt: 'Northstar',
  }}
/>
```

Logo assets should be local and reliable for exports. Missing or invalid logos fall back to the text/initial brand mark.

## Screenshots

Add genuine application screenshots under [docs/screenshots](docs/screenshots).

The README should link:

- Desktop web statement.
- Mobile web statement.
- Email preview.
- PDF preview.
- Canvas preview.
- One custom-themed statement.

![Desktop web statement](docs/screenshots/web-desktop.png)
![Mobile web statement](docs/screenshots/web-mobile.png)
![Email preview](docs/screenshots/email-preview.png)
![PDF preview](docs/screenshots/pdf-preview.png)
![Canvas preview](docs/screenshots/canvas-preview.png)
![Custom-themed statement](docs/screenshots/custom-theme.png)

## Privacy

Account numbers are masked by default. Renderers do not expose a public opt-out. Use only synthetic demonstration data.

## Exports

- Web statement content: Hyper Elements `Page` rendered into the React shell with `render()`.
- Email: Hyper Elements `Email` rendered with `render()`.
- PDF: local export server with the same Hyper Elements `Document` tree and `renderPdf`.
- PNG: local export server with the same Hyper Elements `Canvas` tree and `renderImage`.
- Navigation, filtering, theme selection, and export controls remain ordinary React DOM controls.
- Export filenames include the statement period.
- Export failures produce visible error states.

See [docs/EXPORTS.md](docs/EXPORTS.md).

## Verification

```powershell
npm test
npm run lint
npm run build
npx tsx server/check-exports.ts
```
