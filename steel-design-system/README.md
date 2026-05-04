# Steel Design System (Born2Be Steel)

A web application for **structural steel member checks** aligned with **AISC 360** practice (LRFD-oriented helpers). The project pairs a **Node.js / Express** API with a **single-page dashboard** served as static assets: steel grades, section catalog, and interactive workbooks for tension, compression, bending, shear, tension rods, and section properties.

---

## Project overview

**Born2Be Steel** is an educational / professional-style calculator suite. The UI is organized as a fixed header and sidebar with multiple **content panels** (sections) in one large `index.html`. Users select ASTM steel grades, pick or reference AISC-style sections, enter loads and geometry, and view capacity, demand, and utilization where implemented.

The backend exposes **REST JSON** endpoints for core limit-state checks and a **tension rod design sheet** calculation. Section geometry is read from `frontend/data/aisc-sections.json` (with in-code fallbacks). Material data is distributed as `frontend/data/steel-grades.json`, often generated from the project Excel workbook via included scripts.

**Important:** Many checks are **simplified** (e.g., compact plastic moment, web shear yielding, flexural buckling only for compression). The code comments and API `notes` fields call out what is *not* modeled. Always verify against the full AISC 360 specification and project requirements.

---

## Features

| Area | Description |
|------|-------------|
| **Overview** | Landing content, module cards, navigation to other panels; CTA scroll to “Comprehensive Design Modules.” |
| **Steel grade database** | Browse/select ASTM designations, \(F_y\), \(F_u\), and related UI (material cards, table). Data from `steel-grades.json` / optional Excel export. |
| **AISC / section properties** | Section catalog from JSON; display and reporting of key properties; integration with analysis tools where wired in the UI. |
| **Tension members** | Gross-area yielding style check (`/api/calculations/tension`). |
| **Compression members** | Flexural buckling \(F_{cr}\) via AISC-style equations (E3); **no** torsional / flexural-torsional buckling in the API helper. |
| **Tension rods** | Net-area style rod check (`/api/calculations/tension-rod`) and **Tension Rod design sheet** (`POST /api/calculations/tension-rod-design`) for governing load and required diameter from DL/LL and \(F_u\). |
| **Bending** | Compact-section plastic moment \(M_n = F_y Z_x\) style check (`/api/calculations/bending`); LTB and flange local buckling **not** in the core API helper. |
| **Shear** | Web shear yielding \(V_n = 0.6 F_y A_w\) (`/api/calculations/shear`). |
| **Section properties report** | `POST /api/calculations/section-properties` merges optional manual inputs with catalog lookup by designation and derives \(r_x\), \(r_y\) when needed. |
| **Health** | `GET /api/health` for service checks. |

Standalone HTML files under `frontend/pages/` mostly **redirect** to `index.html` with hash targets (e.g. overview). The main experience is the SPA shell in `frontend/index.html`.

---

## System architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (static SPA: index.html + JS + CSS + JSON data)     │
└───────────────────────────┬─────────────────────────────────┘
                            │ fetch same-origin /api/* 
                            │ (or localhost:3040 when static dev server)
┌───────────────────────────▼─────────────────────────────────┐
│  Express (server.js)                                         │
│  • helmet, cors, morgan, rate limit on /api/                 │
│  • JSON body (limit 100kb)                                   │
│  • Mount: backend/routes/api.js                              │
│  • Static: express.static(frontend)                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
  steelController    calculationController   validation
  (sections)         (calculators)           middleware
        │                   │
        ▼                   ▼
  steelData.js        calculators.js
  (aisc-sections.json) (pure math helpers)
```

- **Initialization:** `node server.js` loads `dotenv`, configures middleware, registers `/api`, then serves `frontend/` at `/`.
- **Data flow:** The UI collects inputs; `frontend/js/api.js` defines `SteelAPI` / `SteelCalculator` wrappers that `POST` JSON to `/api/calculations/*`. Section lists use `GET /api/steel/sections` and `GET /api/steel/sections/:designation`.
- **Port behavior:** Default **3040**. On `EADDRINUSE`, the server increments the port up to `PORT_TRY_COUNT` attempts (default 15) unless `PORT` is set.

---

## Technologies used

| Layer | Stack |
|-------|--------|
| **Runtime** | Node.js |
| **Server** | Express 4 |
| **Security / ops** | Helmet (CSP disabled in code), CORS, `express-rate-limit`, Morgan |
| **Config** | dotenv |
| **Frontend** | Plain HTML, CSS (`style.css`, `responsive.css`), vanilla JavaScript modules (IIFE / global namespaces such as `SteelAPI`, `SteelCalculator`) |
| **Data** | JSON files under `frontend/data/` |
| **Tooling** | nodemon (dev); xlsx (dev) for Excel export scripts |

---

## Installation

Prerequisites: **Node.js** (LTS recommended) and **npm**.

1. Clone or copy the repository.
2. Open the application directory (the folder that contains `package.json` and `server.js`):

   ```bash
   cd steel-design-system
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Optional: copy or create `.env` (see [Configuration](#configuration)). The app runs without a `.env` file using defaults.

---

## Usage

### Run the full stack (recommended)

```bash
npm start
```

Or with auto-restart during development:

```bash
npm run dev
```

Open the URL printed in the console (default **`http://localhost:3040`**). The API and the static UI share this origin, so `SteelAPI` calls use **same-origin** `/api/...` paths.

### Static frontend with separate API (development)

If you serve only `frontend/` with another tool on a different port (e.g. port 3000), `api.js` may direct **`tensionRodDesign`** requests to `http://localhost:3040` when the page host is localhost and the port is not 3040. Start the Express server on 3040 in parallel so those calls succeed.

### API smoke test

```bash
curl -s http://localhost:3040/api/health
```

Example calculation:

```bash
curl -s -X POST http://localhost:3040/api/calculations/tension ^
  -H "Content-Type: application/json" ^
  -d "{\"Fy\":50,\"Ag\":5,\"Pu\":100}"
```

(PowerShell users can use `curl.exe` or `Invoke-RestMethod` with the same JSON body.)

### NPM scripts (maintenance)

| Script | Purpose |
|--------|---------|
| `export:steel-grades` | Regenerate `frontend/data/steel-grades.json` from the Excel workbook (requires `xlsx` and the expected `.xlsx` path in the script). |
| `export:aisc-sections` | Regenerate AISC section JSON. |
| `export:shear-design-order` | Export shear design ordering data. |
| `export:tension-angles` | Export tension angle capacity data. |
| `export:bending-capacity-benchmarks` | Extract bending benchmarks to JSON. |
| `test:bending-design` / `test:bending-analysis` / `test:shear-design` / `test:shear-analysis` | Node regression scripts for workbook parity checks. |

---

## File structure (key paths)

```
steel-design-system/
├── server.js                 # Express entry; static frontend + /api
├── package.json
├── .env                      # Optional local config (not committed by default)
├── backend/
│   ├── routes/
│   │   ├── api.js            # /api/health, /steel/*, mounts calculations
│   │   └── calculations.js   # POST routes for member checks
│   ├── controllers/
│   │   ├── steelController.js
│   │   └── calculationController.js
│   ├── middleware/
│   │   └── validation.js     # Request body validation
│   ├── models/
│   │   └── steelData.js      # Loads section catalog from frontend JSON
│   └── utils/
│       └── calculators.js    # AISC-style helpers
├── frontend/
│   ├── index.html            # Main SPA shell (large single file)
│   ├── css/
│   │   ├── style.css
│   │   └── responsive.css
│   ├── js/
│   │   ├── main.js           # Dashboard: grades, nav, hash sections
│   │   ├── api.js            # SteelAPI fetch helpers
│   │   ├── calculator.js     # SteelCalculator → /api/calculations/*
│   │   ├── *-ui.js, *-workbook.js  # Feature-specific UI and workbook logic
│   │   └── utils.js
│   ├── data/
│   │   ├── steel-grades.json
│   │   ├── aisc-sections.json
│   │   ├── compression-capacity.json
│   │   ├── tension-capacity-angles.json
│   │   └── shear-design-order.json
│   ├── assets/               # Images, overview art, steel-grade cards
│   └── pages/                # Thin redirects to index.html#...
└── scripts/                  # Export and regression Node scripts
```

---

## Configuration

Environment variables (read by `server.js` via `dotenv`):

| Variable | Purpose | Default / notes |
|----------|---------|------------------|
| `PORT` | HTTP listen port | `3040` |
| `PORT_TRY_COUNT` | Retries if port in use | `15`; increments port each try |
| `NODE_ENV` | Production vs dev | Affects Morgan format and 500 error detail |
| `CORS_ORIGIN` | CORS `origin` | Default allows flexible origin (`true` in cors package) |
| `RATE_LIMIT_MAX` | Max requests per IP per 15 min window for `/api/` | `300` |

Request body size limit: **100 kb** (`express.json`).

---

## UI description

- **Header:** Branding, institutional references, and quick links that scroll or switch panels (e.g., overview, design sections).
- **Sidebar / navigation:** Switches visible **content panels** (`overviewSection`, `steelGradeSection`, `sectionPropsSection`, `tensionSection`, `compressionSection`, `tensionRodSection`, `bendingSection`, `shearSection`).
- **Steel grades:** Table and selectors with \(F_y\) / \(F_u\) and visual material cards where assets exist.
- **Workbooks:** Spreadsheet-inspired layouts (yellow input cells, computed outputs) for tension rod design and other modules.
- **Theming:** Sky-blue / steel palette, fixed chrome with scrollable main regions; responsive rules in `responsive.css`.

---

## Contributors / authors

Project branding and academic attribution appear in the application UI (e.g., footer on the overview). The `package.json` **author** field is empty in the current repository; add names there or in this README when publishing.

---

## Additional notes

- **Simplified engineering scope:** The API implements explicit formulas documented in `backend/utils/calculators.js`. Use professional judgment and complete AISC checks where the simplified path is insufficient.
- **Excel integration:** Export scripts expect a Born2BeSteel workbook filename as coded in each script (for example `Born2BeSteel Final (2).xlsx`). If your file name differs, adjust the script constant or symlink/copy accordingly before running `npm run export:*`.
- **404 behavior:** Unmatched routes return JSON `{ error: "Not Found", path: ... }` (API-style), even for unknown non-file paths under the static host.
- **Tests:** Regression scripts under `scripts/` are invoked via `npm run test:*`; they are not a full CI harness unless wired in your pipeline.

---

## License

MIT (see `package.json`).
