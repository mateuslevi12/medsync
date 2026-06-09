const PRINT_STYLES = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: Inter, system-ui, sans-serif;
    color: #0f172a;
    background: #ffffff;
  }
  .print-page {
    width: 100%;
    max-width: 960px;
    margin: 0 auto;
    padding: 32px 28px 40px;
  }
  .print-header,
  .print-section,
  .print-card,
  .print-footer {
    border: 1px solid #dbe4ee;
    border-radius: 16px;
    background: #ffffff;
  }
  .print-header {
    padding: 24px;
    margin-bottom: 20px;
    background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  }
  .print-section {
    padding: 20px;
    margin-bottom: 16px;
  }
  .print-card {
    padding: 16px;
    margin-bottom: 12px;
  }
  .print-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
  }
  .print-label {
    display: block;
    margin-bottom: 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #64748b;
  }
  .print-value {
    font-size: 14px;
    line-height: 1.6;
    color: #0f172a;
    white-space: pre-wrap;
  }
  .print-title {
    margin: 0 0 8px;
    font-size: 26px;
    font-weight: 800;
  }
  .print-subtitle {
    margin: 0;
    font-size: 14px;
    color: #475569;
  }
  .print-section-title {
    margin: 0 0 12px;
    font-size: 18px;
    font-weight: 700;
  }
  .print-divider {
    height: 1px;
    margin: 16px 0;
    background: #e2e8f0;
  }
  .signature-line {
    margin-top: 36px;
    padding-top: 12px;
    border-top: 1px solid #94a3b8;
    max-width: 320px;
  }
  .print-footer {
    margin-top: 20px;
    padding: 14px 18px;
    font-size: 12px;
    color: #475569;
  }
  ul.print-list {
    margin: 0;
    padding-left: 18px;
  }
  ul.print-list li + li {
    margin-top: 8px;
  }
  @page {
    margin: 12mm;
  }
  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print-page {
      max-width: none;
      padding: 0;
    }
    .print-section,
    .print-card,
    .print-header,
    .print-footer {
      break-inside: avoid;
      box-shadow: none;
    }
  }
`;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function printHtmlDocument(title: string, html: string) {
  if (typeof window === "undefined") {
    throw new Error("Impressão indisponível neste ambiente.");
  }

  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1024,height=768");
  if (!printWindow) {
    throw new Error("Não foi possível abrir a janela de impressão.");
  }

  printWindow.document.open();
  printWindow.document.write(`
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>${PRINT_STYLES}</style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `);
  printWindow.document.close();

  const executePrint = () => {
    printWindow.focus();
    printWindow.print();
  };

  if (printWindow.document.readyState === "complete") {
    executePrint();
  } else {
    printWindow.onload = executePrint;
  }
}

export function printTextBlock(text?: string | null): string {
  return escapeHtml(String(text || "Não informado")).replaceAll("\n", "<br />");
}

export function printValue(value?: string | number | null, fallback = "Não informado"): string {
  const normalized = String(value ?? "").trim();
  return escapeHtml(normalized || fallback);
}
