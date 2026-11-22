import fs from 'node:fs/promises'
import path from 'node:path'
import React from 'react'
import { render } from '@hyper-elements/react'
import { renderPdf, templateAssets as pdfAssets } from '@hyper-elements/react/pdf'
import { renderImage, templateAssets as imageAssets } from '@hyper-elements/react/image'
import { PdfDocument } from '../src/renderers/PdfStatement'
import { CanvasDocument } from '../src/renderers/CanvasSummary'

import { reconciledStatement } from '../src/test-fixtures'
import { statementProfiles } from '../src/data/statement'
import { StatementPageDocument } from '../src/renderers/WebStatement'
import { StatementEmailDocument } from '../src/renderers/StatementEmail'
const statement = reconciledStatement
const notoFontBytes = await fs.readFile(path.join(process.cwd(), 'public', 'fonts', 'NotoSans-Regular.ttf'))
const regularFont = { family: 'Noto Sans', src: notoFontBytes.buffer.slice(notoFontBytes.byteOffset, notoFontBytes.byteOffset + notoFontBytes.byteLength), weight: 400 }
const boldFont = { family: 'Noto Sans', src: notoFontBytes.buffer.slice(notoFontBytes.byteOffset, notoFontBytes.byteOffset + notoFontBytes.byteLength), weight: 700 }
const exportFonts = [regularFont, boldFont]

const pdf = React.createElement(PdfDocument, { statement })
const pdfAssetsFound = pdfAssets(pdf)
const pdfResult = await renderPdf(pdf, { fonts: exportFonts })
console.log(JSON.stringify({
  pdf: { bytes: pdfResult.pdf.byteLength, fonts: pdfAssetsFound.fonts.length, diagnostics: pdfResult.diagnostics },
}, null, 2))

const selected2025 = statementProfiles.find((profile) => profile.id === '2025-09')!.statement
const selected2026 = statementProfiles.find((profile) => profile.id === '2026-10')!.statement
await fs.mkdir(path.join(process.cwd(), 'dist', 'exports'), { recursive: true })
const canvas2025 = React.createElement(CanvasDocument, { statement: selected2025 })
const canvas2025Assets = imageAssets(canvas2025)
const canvas2025Result = await renderImage(canvas2025, { fonts: exportFonts, format: 'png', scale: 2, strict: false })
await fs.writeFile(path.join(process.cwd(), 'dist', 'exports', 'fin-sync-2025-09.png'), Buffer.from(canvas2025Result.image))
const pdf2026 = React.createElement(PdfDocument, { statement: selected2026 })
const pdf2026Result = await renderPdf(pdf2026, { fonts: exportFonts })
await fs.writeFile(path.join(process.cwd(), 'dist', 'exports', 'fin-sync-2026-10.pdf'), Buffer.from(pdf2026Result.pdf))
const web2026 = await render(StatementPageDocument({
  statement: selected2026,
  transactions: selected2026.transactions,
  rendererConfig: { brandName: 'FinSync', locale: 'en-IN' },
}))
await fs.writeFile(path.join(process.cwd(), 'dist', 'exports', 'fin-sync-2026-10.html'), web2026.html)
const email2025 = await render(StatementEmailDocument({
  statement: selected2025,
  rendererConfig: { brandName: 'FinSync', locale: 'en-IN' },
}))
await fs.writeFile(path.join(process.cwd(), 'dist', 'exports', 'fin-sync-2025-09-email.html'), email2025.html)
console.log(JSON.stringify({
  canvas: {
    width: 1200,
    height: 630,
    fonts: canvas2025Assets.fonts.length,
    diagnostics: canvas2025Result.diagnostics,
    glyphs: canvas2025Result.diagnostics,
  },
  inspectedProfiles: ['2025-09', '2026-10'],
  artifacts: [
    'dist/exports/fin-sync-2025-09.png',
    'dist/exports/fin-sync-2026-10.pdf',
    'dist/exports/fin-sync-2026-10.html',
    'dist/exports/fin-sync-2025-09-email.html',
  ],
}, null, 2))
