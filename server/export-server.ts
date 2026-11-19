import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import React from 'react'
import { renderPdf } from '@hyper-elements/react/pdf'
import { renderImage } from '@hyper-elements/react/image'
import { PdfDocument } from '../src/renderers/PdfStatement'
import { CanvasDocument } from '../src/renderers/CanvasSummary'
import type { Statement } from '../src/types'

const port = Number(process.env.EXPORT_PORT ?? 4174)
const root = process.cwd()
const regularFontPath = path.join(root, 'public', 'fonts', 'FinSync-Regular.ttf')
const boldFontPath = path.join(root, 'public', 'fonts', 'FinSync-Bold.ttf')

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
    const statement = JSON.parse(body) as Statement
    const regularFontBytes = await fs.readFile(regularFontPath)
    const boldFontBytes = await fs.readFile(boldFontPath)
    const fonts = [
      { family: 'FinSync Sans', src: regularFontBytes.buffer.slice(regularFontBytes.byteOffset, regularFontBytes.byteOffset + regularFontBytes.byteLength), weight: 400 },
      { family: 'FinSync Sans', src: boldFontBytes.buffer.slice(boldFontBytes.byteOffset, boldFontBytes.byteOffset + boldFontBytes.byteLength), weight: 700 },
    ]

    if (request.url === '/api/export/pdf') {
      const result = await renderPdf(React.createElement(PdfDocument, { statement }), { fonts })
      response.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="finsync-statement-${statement.statementPeriod.start}-${statement.statementPeriod.end}.pdf"`,
        'Access-Control-Allow-Origin': 'http://127.0.0.1:5173',
      })
      response.end(Buffer.from(result.pdf))
      return
    }

    const result = await renderImage(React.createElement(CanvasDocument, { statement }), {
      fonts,
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
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : 'Export failed.',
    })
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`FinSync export server listening at http://127.0.0.1:${port}`)
})
