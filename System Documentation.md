# System Documentation

## 1) System Overview

### System Name
- **Born2Be Steel - Steel Design System**

### Purpose
- Web-based structural steel design and analysis calculator system.
- Provides engineering computation workflows for academic and professional use.
- Implements workbook-style calculators where engineering outputs must match Excel source models.

### Core Functional Summary
- Multi-module calculator platform with:
  - Design calculators
  - Analysis calculators
  - Capacity/demand workflows
- Integrates section/property catalogs, steel grade properties, and engineering formulas.
- Produces demand, capacity, governing values, and safety outcomes.

### Modules
- **Compression**
- **Tension**
- **Shear**
- **Bending**
- **Analysis calculators** (module-specific analysis pages, including tension non-staggered/staggered, compression analysis, bending analysis, shear analysis)

### Primary Dependency
- Engineering computation source of truth is Excel workbook logic and values.

### Target Users
- Structural engineers
- Engineering students
- Designers/checkers using workbook-aligned calculation workflows

---

## 2) System Architecture

### Repository Structure
- Root wrapper (deployment entry):
  - `api/index.js`
  - `vercel.json`
  - root `package.json`
- Main runnable application:
  - `steel-design-system/`
    - `app.js`, `server.js`
    - `backend/` (API routes, controllers, validation, calculators)
    - `frontend/` (SPA UI, module scripts, data files)
    - `scripts/` (export/regression utilities)

### Frontend Architecture
- Main UI shell: `steel-design-system/frontend/index.html`
- Section-based SPA navigation controlled by JS.
- Module-specific UI + workbook logic scripts under:
  - `steel-design-system/frontend/js/`
- Runtime datasets under:
  - `steel-design-system/frontend/data/`

### Backend Architecture
- Express app in `steel-design-system/app.js`
- Server bootstrap in `steel-design-system/server.js`
- API routes:
  - `backend/routes/api.js`
  - `backend/routes/calculations.js`
- Computation handlers:
  - `backend/controllers/calculationController.js`
  - `backend/utils/calculators.js`
- Validation:
  - `backend/middleware/validation.js`

### Excel Integration Layer
- Excel is used to define formulas/defaults/logic reference.
- Workbook-derived data is exported to JSON via scripts in `steel-design-system/scripts/`.
- Frontend workbook modules mirror Excel calculation chains per module.

### Input -> Processing -> Output Flow
- User inputs (UI fields) + selected catalog rows -> computation functions -> computed outputs.
- For API-backed flows: frontend payload -> `/api/calculations/*` -> controller -> calculator util -> JSON response -> UI rendering.
- For workbook-style frontend flows: JS workbook functions compute in-browser and render immediately.

### Real-Time Computation Behavior
- Inputs/events (`input`, `change`, section selection, method toggles) trigger recomputation.
- Method switch (LRFD/ASD) updates labels, factors, and outputs.
- Dependent outputs cascade from base inputs and selected section properties.

### Synchronization Strategy
- UI state mirrors active formula state.
- Catalog data + steel grade data + workbook logic are synchronized per recompute cycle.
- Default initialization is set from workbook-referenced values per module/page.

---

## 3) Excel as the Source of Truth

### Official Excel Reference
- `C:\Users\Asus\OneDrive\Desktop\steel-design-system\steel-design-system\Born2BeSteel Final (6).xlsx`

### Governance Rules
- Excel governs:
  - Engineering formulas
  - Constants and factors
  - Default values
  - Conditional branches and output logic
- System outputs are required to match workbook results for equivalent inputs.
- Code changes to formulas must trace directly to workbook logic.

### Mapping Strategy
- **Excel cells -> system variables**:
  - Workbook cell-driven defaults map to UI initialization constants.
  - Section/material values map to runtime fields from dataset services.
- **Excel formulas -> computation functions**:
  - Workbook equations are implemented in module workbook JS and/or backend calculator functions.

### Rule Enforcement
- No manual logic path should intentionally override workbook-computed outputs for validated production workflows.
- UI-only styling or layout changes must not alter computation behavior.

### Excel Version Updates
- On workbook revision:
  1. Re-export affected datasets.
  2. Re-check formula mappings.
  3. Re-run regression tests.
  4. Validate defaults and key snapshot outputs.

---

## 4) Module Breakdown

## Compression Module
- **Purpose:** Column/member compression capacity and analysis checks.
- **Pages:** Design Calculator, Analysis Calculator, Capacity views.
- **Inputs:** Method, loads, slenderness/boundary conditions, section selection, steel grade/material values.
- **Outputs:** Compactness/slenderness metrics, Fe/Fcr/Pn, governing design capacity, safety status.
- **Core calculations:** Buckling-related stress/capacity chains and governing strength checks.
- **Excel references:** `Compression-Design`, `Compression-Analysis`, `Compression-Capacity`.

## Tension Module
- **Purpose:** Tension member strength analysis/design (including stagger effects and block shear pathways).
- **Pages:** Design Calculator, Analysis Calculator Non-Staggered, Analysis Calculator Staggered, Capacity & Demand analysis.
- **Inputs:** Method, steel grade/Fy/Fu, loads, length, bolt/hole settings, gage/fastener layout, connection type, plate dimensions.
- **Outputs:** Demand, net/effective area values, yielding/fracture/block shear capacities, governing capacity, safe/unsafe status.
- **Core calculations:** Yield/fracture equations, shear lag factors (U), critical net area paths, block shear capacities.
- **Excel references:** `Tension Design`, `NS -Tension Analysis`, `S -Tension Analysis`, `Tension(Capacity and Demand )`, `Tension-pivot`, `Sheet2`.

## Shear Module
- **Purpose:** Shear design and shear analysis capacity checks.
- **Pages:** Design Calculator, Analysis Calculator, Capacity Analysis.
- **Inputs:** Method, steel grade/Fy, modulus E, section geometry (tw, d, h/tw), load values.
- **Outputs:** Vn, Cv, LRFD/ASD factor values, design/allowable shear strength, governing outputs.
- **Core calculations:** Web shear capacity chains, coefficient factors, method-dependent strength formulation.
- **Excel references:** `SHEAR DESIGN`, `SHEAR ANALYSIS`, `Shear-Capacity`, `Sheet3`.

## Bending Module
- **Purpose:** Flexural design/analysis and capacity selection workflows.
- **Pages:** Design Calculator, Analysis Calculator, Capacity Analysis (with/without deflection).
- **Inputs:** Method, DL/LL/span, section/material properties, deflection options, beam-weight inclusion.
- **Outputs:** Governing load/moment, required Ix, selected lightest safe section, capacity status.
- **Core calculations:** Moment demand/capacity chains and mode-dependent selection logic.
- **Excel references:** `Bending Design`, `Bending Analysis`, `Bending Capacity no deflection`, `Bending Capacity w deflection`.

## Analysis Calculator Module (Cross-Cutting)
- **Purpose:** Provides per-discipline analysis pages with workbook-aligned detailed state.
- **Scope includes:** Tension Non-Staggered/Staggered, Compression Analysis, Bending Analysis, Shear Analysis.
- **Behavior:** Analysis pages expose more intermediate factors/coefficients and condition-based outputs than summary design pages.

---

## 5) Calculation Logic Documentation

### Computation Pattern
- Read active inputs + section/material values.
- Apply method branch (`LRFD` or `ASD`).
- Compute intermediate terms (areas, coefficients, factors).
- Compute capacities and governing values.
- Evaluate safety (`SAFE`/`UNSAFE`) using workbook-equivalent comparisons.

### Load Combination Behavior
- Method-specific demand equations are applied per module workbook logic.
- Labels and displayed equations update with method selection.

### Safety Factors and Assumptions
- Factors are workbook-driven per module and branch.
- Branch constants are mapped from workbook tables/sheets where applicable.

### Unit System (Current Implementation)
- Primary runtime units in current system are **imperial** (for example: `kips`, `ksi`, `in`, `ft`, `lb/ft`).
- Units are displayed per field and retained consistently per module workflow.

### Dependency Relationships
- Inputs -> section geometry/material lookup -> intermediate factors -> capacities -> governing status.
- Plate use/non-use, connection type, and fastener layout alter tension pathways.
- Deflection/beam-weight toggles alter bending and shear design selection pathways where implemented.

### Real-Time Recalculation
- Triggered by input changes, method switches, tab/mode switches, and section selection.
- Active UI page state is recalculated and mirrored to output controls.

---

## 6) Data Dictionary

Representative key fields (not exhaustive, but implementation-focused for active production modules):

| Field | Description | Unit | Source | Validation | Dependencies |
|---|---|---:|---|---|---|
| `method` | Design method (`LRFD`/`ASD`) | - | User input / Excel default | enum | Governs load combos, factors, output labels |
| `steelGrade` | ASTM designation | - | User input / Excel default | must exist in grade list | Drives `Fy`, `Fu` |
| `Fy` | Yield stress | ksi | Excel/data service/computed from grade | > 0 | Used in most capacities |
| `Fu` | Ultimate stress | ksi | Excel/data service/computed from grade | > 0 | Used in fracture/block shear |
| `E` | Modulus of elasticity | ksi | User input / Excel default | > 0 | Buckling/deflection/web factors |
| `DL`, `LL` | Dead/Live load | kips or kips/ft (page-dependent) | User input / Excel default | >= 0 | Demand equations |
| `L` | Member length/span | ft or in (field-specific) | User input / Excel default | > 0 | Slenderness, moment/shear demand |
| `Ag` | Gross area | in^2 | Section/plate derived | >= 0 | Yielding, fracture, block shear |
| `An` | Net area | in^2 | Computed | >= 0 | Fracture |
| `Ae` | Effective net area | in^2 | Computed | >= 0 | Fracture strength |
| `Cv` | Web factor | - | Computed from workbook logic | >= 0 | Shear strength |
| `Vn` | Nominal shear strength | kips | Computed | finite | Method branch strength |
| `Tu`/`Ta` | Factored/allowable tension demand | kips | Computed | finite | Governing checks |
| `Mu`/`Ma` | Factored/allowable moment | kips-ft | Computed | finite | Bending/shear design paths |
| `safetyStatus` | Safety result | text | Computed | enum | Demand vs governing capacity |

---

## 7) Default Values System

### Initialization Behavior
- Each module/page has workbook-aligned default constants in UI initialization code.
- On first load or first tab activation, defaults are applied and recomputed.

### UI Initialization Process
- Load required catalog/material services.
- Populate selectors.
- Apply workbook default inputs.
- Trigger recompute.

### Reset Behavior
- Module/page reset behavior follows current UI controls and initialization rules.
- Default-driven recalculation restores workbook-reference startup state where reset is implemented.

### Module-Specific Defaults
- Stored in module scripts (for example tension/sheer/compression/bending UI initializers).
- Updated when workbook baseline changes.

---

## 8) UI and Component Structure

### Page Structure
- Header + sidebar + content-panel model.
- Module pages are section panels in `frontend/index.html`.
- Analysis/design/capacity subviews are mode-specific blocks within module panels.

### Input/Output Containers
- Input groups: method, materials, loads, geometry, connection/plate settings.
- Output groups: demand, capacities, intermediate factors, governing/safety status.

### Computed Field Indicators
- UI uses style classes to distinguish user-editable and formula-driven controls.
- Readonly outputs are updated by recomputation logic and mirror workbook states.

### Conditional Behaviors
- Method selection changes formulas and labels.
- Tab/mode switches (for example tension non-staggered/staggered) synchronize shared fields and recompute outputs.
- Section selection updates geometry-dependent calculations.

---

## 9) Backend Logic Rules

### Standards
- Functions implement explicit engineering formulas with clear input/output boundaries.
- Validation occurs before calculations on API routes.
- Calculation responses return values and notes suitable for UI rendering.

### Naming and Strategy
- API routes grouped by module/function purpose under `/api/calculations/*`.
- Frontend workbook scripts encapsulate workbook-specific computation branches.
- Backend calculator utilities provide reusable formula implementations for API-backed checks.

### Recompute Rules
- On valid input change, recompute synchronously on frontend or via API call depending on page flow.

### Error Handling
- Invalid inputs return validation errors from middleware.
- UI shows safe fallback values/status for incomplete states.

---

## 10) Validation and Error Handling

### Input Validation
- Numeric fields validated for finite values and bounds (for example `> 0`, `>= 0`) as defined by route schema or UI guards.
- Enum-style fields validated against allowed options (`LRFD`/`ASD`, connection type, etc.).

### Null/Missing Input Handling
- Computation branches guard against null/NaN values.
- Incomplete data yields fallback output markers (`--`, empty, or guarded branch result).

### Unit and State Safety
- UI labels include units to prevent misuse.
- Method-dependent labels/formulas are synchronized to reduce interpretation errors.

### Edge Cases
- Geometry/denominator checks protect against invalid divisions.
- Capacity comparison logic avoids false safe states when demand/capacity invalid.

---

## 11) System Constraints

- No intentional deviation from workbook logic for production engineering outputs.
- Formula changes must trace to workbook updates.
- UI styling changes must not alter calculation logic.
- Module updates must preserve cross-page synchronization behavior.
- Computation behavior must remain deterministic for a given input set.

---

## 12) Change Management and Maintenance

### Update Workflow
1. Update/receive workbook revision.
2. Export updated datasets if needed (`scripts/export:*`).
3. Update formula/default mappings in module code.
4. Validate key snapshots against workbook.
5. Run regression scripts (`test:*`).
6. Verify production-like behavior before deployment.

### Regression Strategy
- Use script-based regression checks for bending/shear flows.
- Add/maintain additional module regressions as workbook coverage expands.

### Version Control
- Track formula/default changes in commits tied to workbook revision references.
- Keep docs and module notes synchronized with implementation.

---

## 13) Deployment and Environment

### Production
- Live deployment: [https://born-2-be-steel.vercel.app](https://born-2-be-steel.vercel.app)

### Environment Overview
- **Development:** local Node/Express server + local frontend static assets.
- **Production:** Vercel function entry (`api/index.js`) serving nested Express app and frontend assets.

### Build/Run Flow
- Root wrapper starts nested app.
- Nested app runs Express API + static frontend delivery.
- Vercel rewrites route traffic to `/api` and serves the application through Express.

---

## 14) Implementation References

- Excel source (logic reference):
  - `C:\Users\Asus\OneDrive\Desktop\steel-design-system\steel-design-system\Born2BeSteel Final (6).xlsx`
- Main app:
  - `steel-design-system/`
- Frontend shell:
  - `steel-design-system/frontend/index.html`
- Key module logic scripts:
  - `steel-design-system/frontend/js/tension-page-ui.js`
  - `steel-design-system/frontend/js/compression-design-ui.js`
  - `steel-design-system/frontend/js/bending-design-ui.js`
  - `steel-design-system/frontend/js/bending-analysis-ui.js`
  - `steel-design-system/frontend/js/shear-design-ui.js`
  - `steel-design-system/frontend/js/shear-analysis-ui.js`
  - `steel-design-system/frontend/js/shear-design-workbook.js`
- Backend:
  - `steel-design-system/backend/routes/api.js`
  - `steel-design-system/backend/routes/calculations.js`
  - `steel-design-system/backend/controllers/calculationController.js`
  - `steel-design-system/backend/utils/calculators.js`
  - `steel-design-system/backend/middleware/validation.js`

---

## 15) Documentation Ownership Note

This file is the authoritative technical reference for architecture, computation governance, and maintenance workflow.  
When workbook logic or module behavior changes, this document must be updated in the same change cycle.

