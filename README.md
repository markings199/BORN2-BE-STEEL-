# Born2Be Steel - Structural Design System

Production-ready structural steel design and analysis platform with spreadsheet-style engineering workflows, JSON/Excel-backed datasets, and a Node/Express API.

## Production Deployment

- Live system: [https://born-2-be-steel.vercel.app](https://born-2-be-steel.vercel.app)
- This is the official production deployment for the current application version.

## Repository Layout

This repository has a deployment wrapper at the root and the main app in a nested folder.

```text
/
├─ api/                         # Vercel function entrypoint
├─ vercel.json                  # Vercel runtime + rewrites
├─ package.json                 # Root deployment wrapper scripts
└─ steel-design-system/         # Main application (frontend + backend)
   ├─ app.js
   ├─ server.js
   ├─ package.json
   ├─ backend/
   ├─ frontend/
   └─ scripts/
```

## Project Overview

Born2Be Steel provides module-based calculators for steel design/analysis workflows:

- Steel Grade database and material selection
- Section Properties lookup/reference
- Tension module (Design, Analysis Non-Staggered, Analysis Staggered, Capacity & Demand)
- Compression module (Design, Analysis, Capacity)
- Bending module (Design, Analysis, Capacity)
- Shear module (Design, Analysis, Capacity)
- Tension Rod design/check workflows

The UI follows workbook-inspired behavior (yellow input cells, computed result cells) and uses front-end calculation pipelines aligned with project Excel models.

## Architecture Summary

### Frontend

- Main UI shell: `steel-design-system/frontend/index.html`
- SPA-style section switching via module scripts in `steel-design-system/frontend/js/`
- Data-driven controls from JSON catalogs in `steel-design-system/frontend/data/`
- Workbook-aligned logic modules (for example `*-workbook.js`) used by UI pages

### Backend

- Express app initialization: `steel-design-system/app.js`
- HTTP server entry: `steel-design-system/server.js`
- API routing:
  - `GET /api/health`
  - `GET /api/steel/sections`
  - `GET /api/steel/sections/:designation`
  - Calculation endpoints under `/api/calculations/*`
- Core calculation handlers:
  - `steel-design-system/backend/controllers/calculationController.js`
  - `steel-design-system/backend/utils/calculators.js`
- Input validation middleware:
  - `steel-design-system/backend/middleware/validation.js`

### Deployment Runtime (Vercel)

- Vercel entrypoint exports nested Express app: `api/index.js`
- Vercel includes nested frontend static assets via `vercel.json`
- Global rewrite routes requests to `/api`, and Express serves API + static app.

## Module and Feature Coverage

### Tension

- Design calculator
- Analysis calculator:
  - Non-staggered
  - Staggered
- Capacity and demand analysis
- Shear lag factors, net/effective area, yielding/fracture, block shear, governing capacity checks

### Compression

- Design calculator
- Analysis calculator
- Capacity database workflows
- Slenderness, buckling stress, critical stress, nominal/design strength paths

### Bending

- Design calculator
- Analysis calculator
- Capacity analysis modes:
  - Without considering deflection
  - Considering deflection

### Shear

- Design calculator
- Analysis calculator
- Capacity analysis modes:
  - Without considering deflection
  - Considering deflection
- Web coefficient factors (`Cv`, LRFD/ASD factors), nominal and design shear strength outputs

### Tension Rod

- Dedicated tension rod design calculations and API-backed checks

## Calculation Engine and Data Flow

The system uses a mixed calculation model:

- Backend API formulas for core engineering checks (`backend/utils/calculators.js`)
- Frontend workbook-aligned computation modules (for example:
  - `frontend/js/tension-page-ui.js`
  - `frontend/js/bending-design-workbook.js`
  - `frontend/js/shear-design-workbook.js`
  - `frontend/js/shear-analysis-ui.js`)
- Catalog/material datasets loaded from:
  - `frontend/data/steel-grades.json`
  - `frontend/data/aisc-sections.json`
  - `frontend/data/compression-capacity.json`
  - `frontend/data/tension-capacity-angles.json`
  - `frontend/data/shear-design-order.json`

Excel export/refresh scripts in `steel-design-system/scripts/` are used to regenerate runtime JSON artifacts when workbook data changes.

## Inputs and Outputs Behavior

- User-editable engineering inputs (loads, dimensions, methods, connection assumptions) drive live recomputation.
- Computed outputs include demand, capacity, governing values, and safety status.
- Method switching (LRFD/ASD) updates labels, factors, and formulas in real time where implemented.
- Section selection drives geometry-dependent outputs and derived capacities.

## Installation and Setup

### Prerequisites

- Node.js (LTS recommended)
- npm

### Install

```bash
cd steel-design-system/steel-design-system
npm install
```

### Run Locally

```bash
npm start
```

Default local URL:

- `http://localhost:3040`

## Development

Run in auto-reload mode:

```bash
cd steel-design-system/steel-design-system
npm run dev
```

## Build/Export and Regression Scripts

In `steel-design-system/steel-design-system/package.json`:

- `export:steel-grades`
- `export:aisc-sections`
- `export:shear-design-order`
- `export:tension-angles`
- `export:bending-capacity-benchmarks`
- `test:bending-design`
- `test:bending-analysis`
- `test:shear-design`
- `test:shear-analysis`

Root wrapper script:

- `npm start` (runs nested app server through deployment wrapper)

## API Surface (Current)

- `GET /api/health`
- `GET /api/steel/sections`
- `GET /api/steel/sections/:designation`
- `GET /api/calculations/tension-rod-design` (method description)
- `POST /api/calculations/tension-rod-design`
- `POST /api/calculations/tension`
- `POST /api/calculations/compression`
- `POST /api/calculations/tension-rod`
- `POST /api/calculations/bending`
- `POST /api/calculations/shear`
- `POST /api/calculations/section-properties`

## System Constraints and Rules

- Engineering logic is intentionally formula-driven and workbook-aligned where implemented.
- Some backend helper paths are simplified engineering checks and should be reviewed for project-specific design responsibility.
- Request validation and API rate-limiting are enforced at runtime.
- Keep JSON/Excel export artifacts synchronized when workbook source data changes.

## Additional Notes

- Main app documentation (module-level details) is also available at:
  - `steel-design-system/README.md`
- If deployment behavior changes, update:
  - `vercel.json`
  - `api/index.js`
  - this README deployment section
