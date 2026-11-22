# FinSync Export Server & Artifact Verification Guide

This document explains how FinSync's export server generates print-ready PDF and high-resolution raster image artifacts, and how external applications can integrate these endpoints.

---

## 1. Running the Export Server

FinSync provides an export server built with Node.js, `@hyper-elements/react/pdf`, and `@hyper-elements/react/image`.

### Starting the Server

```bash
# Windows PowerShell
npm run export

# macOS / Linux (bash/zsh)
npm run export
```

The server listens on `127.0.0.1:4174` (configurable via `EXPORT_PORT` environment variable).

---

## 2. HTTP Export Endpoints

The export server provides two endpoints accepting `POST` requests with a JSON body containing `statement` (required) and `rendererConfig` (optional):

### A. PDF Export (`POST /api/export/pdf`)

Renders a print-ready vector PDF document sized to international A4 dimensions using `@hyper-elements/react/pdf`.

```bash
curl -X POST http://127.0.0.1:4174/api/export/pdf \
  -H "Content-Type: application/json" \
  -d '{"statement": {"accountHolder":"Maksud Rahman","accountNumber":"•••• 4821","accountType":"Savings Account","currency":"INR","statementPeriod":{"start":"2026-10-01","end":"2026-10-31"},"openingBalancePaise":14280000,"closingBalancePaise":18860000,"transactions":[]}}' \
  --output statement.pdf
```

- **Content-Type**: `application/pdf`
- **Typography**: Uses bundled SIL OFL-licensed `NotoSans-Regular.ttf` (weight 400) and `NotoSans-Bold.ttf` (weight 700) for portable vector glyph rendering without relying on host operating system fonts.

### B. PNG Image Export (`POST /api/export/png`)

Renders a 1200×630 high-resolution financial snapshot PNG (scaled 2x to 2400×1260) using `@hyper-elements/react/image`.

```bash
curl -X POST http://127.0.0.1:4174/api/export/png \
  -H "Content-Type: application/json" \
  -d '{"statement": {"accountHolder":"Maksud Rahman","accountNumber":"•••• 4821","accountType":"Savings Account","currency":"INR","statementPeriod":{"start":"2026-10-01","end":"2026-10-31"},"openingBalancePaise":14280000,"closingBalancePaise":18860000,"transactions":[]}}' \
  --output summary.png
```

- **Content-Type**: `image/png`
- **Output Dimensions**: 1200×630 logical pixels at 2x resolution (`2400×1260` physical pixels).

---

## 3. Client-Side Export Utilities

In browser React applications, import `exportPdf` and `exportPng` from `'../src'` (or your project's FinSync source directory / monorepo alias):

```tsx
import { exportPdf, exportPng, type Statement, type FinSyncRendererConfig } from '../src'

async function handleDownloadPdf(statement: Statement, config?: FinSyncRendererConfig) {
  // Sends request to http://127.0.0.1:4174/api/export/pdf and triggers browser download
  await exportPdf(null, statement, config)
}

async function handleDownloadPng(statement: Statement, config?: FinSyncRendererConfig) {
  // Sends request to http://127.0.0.1:4174/api/export/png and triggers browser download
  await exportPng(null, statement, config)
}
```

---

## 4. Production Security & Deployment Boundary

> [!WARNING]
> The included `server/export-server.ts` is a reference developer export template. It is designed for local development, internal microservice pipelines, and preview demonstration.
>
> It does not include authentication, authorization, rate limiting, or reverse proxy hardening. Before exposing export endpoints to the public internet, deploy them behind an authenticated API gateway with rate-limiting and input size quotas.
