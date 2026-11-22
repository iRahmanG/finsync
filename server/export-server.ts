import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import React from 'react'
import { renderPdf } from '@hyper-elements/react/pdf'
import { renderImage } from '@hyper-elements/react/image'
import { PdfDocument } from '../src/renderers/PdfStatement'
import { CanvasDocument } from '../src/renderers/CanvasSummary'
import { parseExportRequestJson, validateExportRequest } from './export-validation'

const port = Number(process.env.EXPORT_PORT ?? 4174)
const root = process.cwd()
const notoFontPath = path.join(root, 'public', 'fonts', 'NotoSans-Regular.ttf')

const sendJson = (response: http.ServerResponse, status: number, body: unknown) => {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'http://127.0.0.1:5173',
  })
  response.end(JSON.stringify(body))
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': 'http://127.0.0.1:5173',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    })
    response.end()
    return
  }
  if (request.method !== 'POST' || (request.url !== '/api/export/pdf' && request.url !== '/api/export/png')) {
    sendJson(response, 404, { error: 'Export endpoint not found.' })
    return
  }

  try {
    let body = ''
    for await (const chunk of request) body += chunk.toString()
    const parsedRequest = parseExportRequestJson(body)
    if (!parsedRequest.ok) {
      sendJson(response, 400, { error: 'Malformed JSON request.' })
      return
    }
    const requestBody = parsedRequest.value
    const validatedRequest = validateExportRequest(requestBody)
    if (!validatedRequest) {
      sendJson(response, 400, { error: 'Invalid export request.' })
      return
    }
    const { statement, rendererConfig } = validatedRequest
    const notoFontBytes = await fs.readFile(notoFontPath)
    const fonts: Array<{ family: string; src: ArrayBuffer; weight: number }> = [
      { family: 'Noto Sans', src: notoFontBytes.buffer.slice(notoFontBytes.byteOffset, notoFontBytes.byteOffset + notoFontBytes.byteLength), weight: 400 },
      { family: 'Noto Sans', src: notoFontBytes.buffer.slice(notoFontBytes.byteOffset, notoFontBytes.byteOffset + notoFontBytes.byteLength), weight: 700 },
    ]
    let resolvedRendererConfig = rendererConfig
    let images: Record<string, Uint8Array> | undefined
    if (rendererConfig?.logoUrl) {
      const logoPath = path.join(root, 'public', rendererConfig.logoUrl.slice(1))
      try {
        await fs.stat(logoPath)
        images = { [rendererConfig.logoUrl]: await fs.readFile(logoPath) }
      } catch {
        resolvedRendererConfig = { ...rendererConfig, logoUrl: undefined }
      }
    }

    if (request.url === '/api/export/pdf') {
      const result = await renderPdf(React.createElement(PdfDocument, { statement, rendererConfig: resolvedRendererConfig }), { fonts, images })
      response.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="finsync-statement-${statement.statementPeriod.start}-${statement.statementPeriod.end}.pdf"`,
        'Access-Control-Allow-Origin': 'http://127.0.0.1:5173',
      })
      response.end(Buffer.from(result.pdf))
      return
    }

    const result = await renderImage(React.createElement(CanvasDocument, { statement, rendererConfig: resolvedRendererConfig }), {
      fonts,
      images,
      format: 'png',
      scale: 2,
      strict: true,
    })
    response.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="finsync-summary-${statement.statementPeriod.start}-${statement.statementPeriod.end}.png"`,
      'Access-Control-Allow-Origin': 'http://127.0.0.1:5173',
    })
    response.end(Buffer.from(result.image))
  } catch {
    sendJson(response, 500, { error: 'Export failed.' })
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`FinSync export server listening at http://127.0.0.1:${port}`)
})
