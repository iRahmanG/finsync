import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import React from 'react'
import { renderPdf } from '@hyper-elements/react/pdf'
import { renderImage } from '@hyper-elements/react/image'
import { PdfDocument } from '../src/renderers/PdfStatement'
import { CanvasDocument } from '../src/renderers/CanvasSummary'
import { statementFilename } from '../src/export'
import { parseExportRequestJson, validateExportRequest } from './export-validation'

const port = Number(process.env.EXPORT_PORT ?? 4174)
const root = process.cwd()
const MAX_PAYLOAD_BYTES = 2 * 1024 * 1024 // 2 MB reasonable request body limit
const notoRegularFontPath = path.join(root, 'public', 'fonts', 'NotoSans-Regular.ttf')
const notoBoldFontPath = path.join(root, 'public', 'fonts', 'NotoSans-Bold.ttf')

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
    let totalBytes = 0
    for await (const chunk of request) {
      totalBytes += chunk.length
      if (totalBytes > MAX_PAYLOAD_BYTES) {
        sendJson(response, 413, { error: 'Payload too large.' })
        return
      }
      body += chunk.toString()
    }
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
    const [notoRegularBytes, notoBoldBytes] = await Promise.all([
      fs.readFile(notoRegularFontPath),
      fs.readFile(notoBoldFontPath),
    ])
    const fonts: Array<{ family: string; src: ArrayBuffer; weight: number }> = [
      { family: 'Noto Sans', src: notoRegularBytes.buffer.slice(notoRegularBytes.byteOffset, notoRegularBytes.byteOffset + notoRegularBytes.byteLength), weight: 400 },
      { family: 'Noto Sans', src: notoBoldBytes.buffer.slice(notoBoldBytes.byteOffset, notoBoldBytes.byteOffset + notoBoldBytes.byteLength), weight: 700 },
    ]
    let resolvedRendererConfig = rendererConfig
    let images: Record<string, Uint8Array> | undefined
    if (rendererConfig?.logoUrl) {
      const publicDir = path.resolve(root, 'public')
      const logoPath = path.resolve(publicDir, rendererConfig.logoUrl.slice(1))
      if (logoPath.startsWith(publicDir)) {
        try {
          await fs.stat(logoPath)
          images = { [rendererConfig.logoUrl]: await fs.readFile(logoPath) }
        } catch {
          resolvedRendererConfig = { ...rendererConfig, logoUrl: undefined }
        }
      } else {
        resolvedRendererConfig = { ...rendererConfig, logoUrl: undefined }
      }
    }

    if (request.url === '/api/export/pdf') {
      const result = await renderPdf(React.createElement(PdfDocument, { statement, rendererConfig: resolvedRendererConfig }), { fonts, images })
      const filename = statementFilename(statement.statementPeriod, 'pdf')
      response.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
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
    const filename = statementFilename(statement.statementPeriod, 'png')
    response.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${filename}"`,
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
