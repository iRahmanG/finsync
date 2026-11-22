import fs from 'node:fs/promises'
import path from 'node:path'
import React from 'react'
import { formatDiagnostics, outline, render, validate } from '@hyper-elements/react'
import { inspect } from '@hyper-elements/react/inspect'
import { renderPdf, templateAssets as pdfAssets } from '@hyper-elements/react/pdf'
import { renderImage, templateAssets as imageAssets } from '@hyper-elements/react/image'
import { PdfDocument } from '../src/renderers/PdfStatement'
import { CanvasDocument } from '../src/renderers/CanvasSummary'
import { reconciledStatement } from '../src/test-fixtures'
import { statementProfiles } from '../src/data/statement'
import { StatementPageDocument } from '../src/renderers/WebStatement'
import { StatementEmailDocument } from '../src/renderers/StatementEmail'

const statement = reconciledStatement
const notoRegularBytes = await fs.readFile(path.join(process.cwd(), 'public', 'fonts', 'NotoSans-Regular.ttf'))
const notoBoldBytes = await fs.readFile(path.join(process.cwd(), 'public', 'fonts', 'NotoSans-Bold.ttf'))
const regularFont = {
  family: 'Noto Sans',
  src: notoRegularBytes.buffer.slice(notoRegularBytes.byteOffset, notoRegularBytes.byteOffset + notoRegularBytes.byteLength),
  weight: 400,
}
const boldFont = {
  family: 'Noto Sans',
  src: notoBoldBytes.buffer.slice(notoBoldBytes.byteOffset, notoBoldBytes.byteOffset + notoBoldBytes.byteLength),
  weight: 700,
}
const exportFonts = [regularFont, boldFont]

// 1. Hyper Elements Tree Validation & Inspection
const sampleRendererConfig = { brandName: 'FinSync', locale: 'en-IN' as const }
const webTree = StatementPageDocument({
  statement,
  transactions: statement.transactions,
  rendererConfig: sampleRendererConfig,
})
const emailTree = StatementEmailDocument({
  statement,
  rendererConfig: sampleRendererConfig,
})
const pdfTree = React.createElement(PdfDocument, { statement, rendererConfig: sampleRendererConfig })
const canvasTree = React.createElement(CanvasDocument, { statement, rendererConfig: sampleRendererConfig })

const webInspection = inspect(webTree)
const emailInspection = inspect(emailTree)
const pdfInspection = inspect(pdfTree)
const canvasInspection = inspect(canvasTree)

const webValidation = validate(webTree)
const emailValidation = validate(emailTree)
const pdfValidation = validate(pdfTree)
const canvasValidation = validate(canvasTree)

const treeValidations = [
  { name: 'Web (Page)', result: webValidation },
  { name: 'Email (Email)', result: emailValidation },
  { name: 'PDF (Document)', result: pdfValidation },
  { name: 'Canvas (Image)', result: canvasValidation },
]

for (const { name, result } of treeValidations) {
  if (!result.valid) {
    console.error(`Validation failed for ${name}:\n${formatDiagnostics(result.diagnostics)}`)
    throw new Error(`Hyper Elements validation failed for ${name}`)
  }
}

console.log(JSON.stringify({
  hyperElementsInspection: {
    web: { root: webInspection.root, valid: webInspection.valid, nodes: webInspection.nodes.length, diagnostics: webInspection.diagnostics },
    email: { root: emailInspection.root, valid: emailInspection.valid, nodes: emailInspection.nodes.length, diagnostics: emailInspection.diagnostics },
    pdf: { root: pdfInspection.root, valid: pdfInspection.valid, nodes: pdfInspection.nodes.length, diagnostics: pdfInspection.diagnostics },
    canvas: { root: canvasInspection.root, valid: canvasInspection.valid, nodes: canvasInspection.nodes.length, diagnostics: canvasInspection.diagnostics },
  },
}, null, 2))

// 2. Render PDF and Canvas Exports
const pdfAssetsFound = pdfAssets(pdfTree)
const pdfResult = await renderPdf(pdfTree, { fonts: exportFonts })
console.log(JSON.stringify({
  pdf: {
    bytes: pdfResult.pdf.byteLength,
    fonts: pdfAssetsFound.fonts.length,
    diagnostics: pdfResult.diagnostics,
    outlineSample: outline(pdfTree).split('\n').slice(0, 5).join(' | '),
  },
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
