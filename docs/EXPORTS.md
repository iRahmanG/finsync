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

The PDF uses Hyper Elements `Document` and `renderPdf()`.
The PNG uses Hyper Elements `Canvas` and `renderImage()` at `2400x1260` for a `1200x630` logical canvas scaled by 2.

`public/fonts/FinSync-Regular.ttf` and `public/fonts/FinSync-Bold.ttf` are static SIL Open Font License files.
The source font license is stored at `public/fonts/OFL-FinSync.txt`.

Sample exports:

- `docs/exports/finsync-statement-20240601-20240630.pdf`
- `docs/exports/finsync-summary-20240601-20240630.png`

The export server is a template demonstration boundary, not a production hosting solution.
