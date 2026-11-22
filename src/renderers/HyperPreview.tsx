import { useEffect, useState, type ReactElement } from 'react'
import { render } from '@hyper-elements/react'

export function HyperPreview({ element, title }: { element: ReactElement; title: string }) {
  const [html, setHtml] = useState<string>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    render(element)
      .then((result) => {
        if (active) {
          setError(undefined)
          setHtml(result.html)
        }
      })
      .catch((renderError: unknown) => {
        if (active) setError(renderError instanceof Error ? renderError.message : 'Preview rendering failed.')
      })
    return () => { active = false }
  }, [element])

  if (error) return <p className="export-message error" role="alert">{error}</p>
  if (!html) return <p className="export-message" role="status">Preparing preview…</p>
  return <iframe className="hyper-preview-frame" title={title} srcDoc={html} />
}
