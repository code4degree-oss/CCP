/**
 * Industry-standard iframe-based printing utility.
 * Renders HTML into a hidden iframe and prints only that iframe,
 * avoiding the fragile window.print() + CSS visibility hack approach.
 */

const PRINT_STYLES = `
  @page {
    size: A4;
    margin: 12mm 10mm;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    color: #111827;
    font-size: 11px;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  table { width: 100%; border-collapse: collapse; }
  .page-break { page-break-after: always; }
  .page-break:last-child { page-break-after: auto; }
  .avoid-break { page-break-inside: avoid; }
`

export function printHTML(htmlContent: string) {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.top = '-10000px'
  iframe.style.left = '-10000px'
  iframe.style.width = '210mm'
  iframe.style.height = '297mm'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) {
    document.body.removeChild(iframe)
    return
  }

  doc.open()
  doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${PRINT_STYLES}</style>
</head>
<body>${htmlContent}</body>
</html>`)
  doc.close()

  // Wait for images to load before printing
  const images = doc.querySelectorAll('img')
  const imagePromises = Array.from(images).map(
    (img) => new Promise<void>((resolve) => {
      if (img.complete) { resolve(); return }
      img.onload = () => resolve()
      img.onerror = () => resolve()
    })
  )

  Promise.all(imagePromises).then(() => {
    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      // Cleanup after print dialog closes
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 1000)
    }, 300)
  })
}
