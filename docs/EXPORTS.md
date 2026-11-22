# FinSync export verification

Start the browser preview:

```powershell
npm run dev -- --host 127.0.0.1
```

In another terminal, start the export server:

```powershell
npm run export
```

The export server listens on `127.0.0.1:4174` and accepts synthetic statement JSON for:

- `POST /api/export/pdf`
- `POST /api/export/png`

The PDF preview and export use the same Hyper Elements `Document` tree and `renderPdf()`.
The PNG preview and export use the same Hyper Elements `Canvas` tree and `renderImage()` at `2400x1260` for a `1200x630` logical canvas scaled by 2.
The email preview is generated from the Hyper Elements `Email` tree with `render()`.
The web statement content is generated from a Hyper Elements `Page` tree with `render()`; the surrounding application shell and interactive controls remain ordinary React DOM.

`public/fonts/FinSync-Regular.ttf` and `public/fonts/FinSync-Bold.ttf` are static SIL Open Font License files.
The source font license is stored at `public/fonts/OFL-FinSync.txt`.

Sample exports:

- `docs/exports/finsync-statement-20240601-20240630.pdf`
- `docs/exports/finsync-summary-20240601-20240630.png`

The export server is a template demonstration boundary, not a production hosting solution.

The bundled `public/fonts/NotoSans-Regular.ttf` is the portable Unicode font used for PDF and Canvas text. It is licensed under the SIL Open Font License 1.1; attribution and license text are included at `public/fonts/OFL-NotoSans.txt`.

Current generated artifacts include:

- `dist/exports/fin-sync-2025-09.png`
- `dist/exports/fin-sync-2026-10.pdf`
- `dist/exports/fin-sync-2026-10.html`
- `dist/exports/fin-sync-2025-09-email.html`
