import fs from 'node:fs/promises'
import path from 'node:path'
import React from 'react'
import { renderPdf, templateAssets as pdfAssets } from '@hyper-elements/react/pdf'
import { layoutImage, templateAssets as imageAssets } from '@hyper-elements/react/image'
import { PdfDocument } from '../src/renderers/PdfStatement'
import { CanvasDocument } from '../src/renderers/CanvasSummary'
import type { Statement } from '../src/types'

const statement = JSON.parse(await fs.readFile(path.join(process.cwd(), 'docs', 'exports', 'statement.json'), 'utf8')) as Statement
const regularFontBytes = await fs.readFile(path.join(process.cwd(), 'public', 'fonts', 'FinSync-Regular.ttf'))
const boldFontBytes = await fs.readFile(path.join(process.cwd(), 'public', 'fonts', 'FinSync-Bold.ttf'))
const regularFont = { family: 'FinSync Sans', src: regularFontBytes.buffer.slice(regularFontBytes.byteOffset, regularFontBytes.byteOffset + regularFontBytes.byteLength), weight: 400 }
const boldFont = { family: 'FinSync Sans', src: boldFontBytes.buffer.slice(boldFontBytes.byteOffset, boldFontBytes.byteOffset + boldFontBytes.byteLength), weight: 700 }

const pdf = React.createElement(PdfDocument, { statement })
const pdfAssetsFound = pdfAssets(pdf)
const pdfResult = await renderPdf(pdf, { fonts: [regularFont, boldFont] })
console.log(JSON.stringify({
  pdf: { bytes: pdfResult.pdf.byteLength, fonts: pdfAssetsFound.fonts.length, diagnostics: pdfResult.diagnostics },
}, null, 2))

const canvas = React.createElement(CanvasDocument, { statement })
const canvasAssetsFound = imageAssets(canvas)
const canvasLayout = await layoutImage(canvas, { fonts: [regularFont, boldFont] })
console.log(JSON.stringify({
  canvas: {
    width: canvasLayout.width,
    height: canvasLayout.height,
    fonts: canvasAssetsFound.fonts.length,
    diagnostics: canvasLayout.diagnostics,
    glyphs: canvasLayout.glyphs,
  },
}, null, 2))
