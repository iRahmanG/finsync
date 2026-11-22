function getExportServerUrl(): string {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      if (import.meta.env.VITE_EXPORT_SERVER_URL) {
        return String(import.meta.env.VITE_EXPORT_SERVER_URL)
      }
      if (import.meta.env.DEV) {
        return 'http://127.0.0.1:4174'
      }
    }
  } catch {}
  return ''
}

const EXPORT_SERVER_URL = getExportServerUrl()

export function statementFilename(statementPeriod: { start: string; end: string }, extension: 'pdf' | 'png'): string {
  const start = statementPeriod.start.replaceAll('-', '')
  const end = statementPeriod.end.replaceAll('-', '')
  const subject = extension === 'pdf' ? 'statement' : 'summary'
  return `finsync-${subject}-${start}-${end}.${extension}`
}

export function downloadBytes(bytes: Uint8Array, filename: string, mimeType: string): void {
  const blob = new Blob([bytes.slice().buffer], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

async function requestExport(
  statement: import('./types').Statement,
  format: 'pdf' | 'png',
  rendererConfig?: import('./public-api').FinSyncRendererConfig,
): Promise<void> {
  const response = await fetch(`${EXPORT_SERVER_URL}/api/export/${format}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ statement, rendererConfig }),
  })
  if (!response.ok) {
    let message = `Export failed with status ${response.status}.`
    try {
      const body = await response.json() as { error?: string }
      if (body.error) message = body.error
    } catch {}
    throw new Error(message)
  }

  const bytes = new Uint8Array(await response.arrayBuffer())
  const extension = format === 'pdf' ? 'pdf' : 'png'
  const mimeType = format === 'pdf' ? 'application/pdf' : 'image/png'
  downloadBytes(bytes, statementFilename(statement.statementPeriod, extension), mimeType)
}

export async function exportPdf(_element: unknown, statement: import('./types').Statement, rendererConfig?: import('./public-api').FinSyncRendererConfig): Promise<void> {
  await requestExport(statement, 'pdf', rendererConfig)
}

export async function exportPng(_element: unknown, statement: import('./types').Statement, rendererConfig?: import('./public-api').FinSyncRendererConfig): Promise<void> {
  await requestExport(statement, 'png', rendererConfig)
}
