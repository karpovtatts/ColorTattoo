# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ColorTattoo — a client-side React/TypeScript tool for tattoo artists that suggests an ink-mixing recipe to reach a target color, and extracts dominant colors from a reference photo. No backend; all persistence is `localStorage`. The app is entirely in Russian (UI copy, code comments).

## Commands

```bash
npm run dev       # Vite dev server on :3000 (binds 0.0.0.0)
npm run build     # tsc (type-check, noEmit) && vite build -> dist/
npm run preview   # serve the production build locally
npm run lint       # eslint . --ext ts,tsx --max-warnings 0
```

There is no test suite/runner configured in this repo — don't assume Jest/Vitest exists.

`npm run server` in package.json points at `server/index.js`, which does not exist in this repo — it's a stale script, ignore it. The app has no backend.

Production build base path is controlled by `VITE_BASE_PATH` (read in `vite.config.ts`, defaults to `/colortattoo/`), set via `.env.production` (gitignored). Dev always serves from `/`. The app is deployed as a static SPA behind nginx at a subpath alongside unrelated sibling apps — see `SERVER_INFO.md` (gitignored, contains server credentials/paths — don't commit it, and don't lift its nginx config into other docs).

## Architecture

### Path aliases

`@/`, `@/components`, `@/services`, `@/utils`, `@/types`, `@/workers` are defined **twice** — in `tsconfig.json` (`paths`) and `vite.config.ts` (`resolve.alias`). Both need to be updated together if aliases change.

### Color domain model (`src/types/index.ts`)

A `Color` carries `rgb`, `hsl`, `hex`, and a cached `lab` (LAB is expensive to compute and is reused for perceptual-distance comparisons). Conversions and operations are layered:

- `utils/colorConversions.ts` — pure math: RGB↔HSL↔HEX↔CMYK↔LAB.
- `utils/colorOperations.ts` — color construction (`createColorFrom{Rgb,Hsl,Hex}`) and classification (`isBlackInk`, `isWhiteColor`, `isGrayColor`, `isColorful`), color-wheel helpers (complementary/triadic/analogous), plus a `deltaE` (CIE2000) implementation duplicated here.
- `utils/colorPhysics.ts` — **subtractive** mixing via CMYK averaging (`mixColorsSubtractive`, and `mixColorsSubtractiveSequential` for order-dependent mixing). This is what tattoo-ink mixing actually uses — it's why yellow+blue gives green instead of RGB-average gray. Recipe search always goes through this subtractive path; there is no additive RGB-average mixing path anywhere in the app.
- `utils/colorMetric.ts` — perceptual distance: `calculateDeltaE76` (cheap) and `calculateDeltaE2000` (more accurate), exposed as `calculateColorDistancePerceptual(Full)`.

### Recipe search (`src/services/recipeFinder.ts`)

`findRecipe(targetColor, palette)` brute-forces ink combinations (1–4 colors, `generateCombinations`) and, for each, brute-forces proportions at a fixed step size (5% for 2–3 colors, 10% for 4, for performance) to minimize DeltaE. Black ink is filtered out of the palette entirely before searching when the target is chromatic (black only darkens by muddying in skin, never used to darken hue) — see `analyzeBlackUsage` in `colorAnalysis.ts` for the rationale. Distances below `EXACT_MATCH_THRESHOLD` (2) short-circuit the search; above `UNREACHABLE_THRESHOLD` (15) the result is flagged unreachable and `generateUnreachableExplanation` suggests a complementary color to add to the palette.

`colorAnalysis.ts` layers warnings on top of a found recipe: cleanliness (low-saturation/grayish results), black usage, complementary-color combos (risk of muddy gray), and warm/cool temperature classification — these populate `RecipeResult.warnings`/`analysis`.

### State (React Context, not Redux)

- `ColorContext` — the current target color being matched (ephemeral, not persisted).
- `PaletteContext` — the user's ink palette; persisted to `localStorage` (`paletteStorage.ts`, key `userPalette`) on every change, seeded from `getDefaultPalette()` if empty.
- Saved recipes go through `recipeStorage.ts` (key `savedRecipes`), independent of the contexts above — pages call it directly.
- `ToastContext` is the only global UI feedback mechanism (no inline form-level error components beyond per-field validation).

### Image analysis pipeline (`ImageAnalysisPage` → `imageProcessor.ts` → `colorAnalysis.worker.ts`)

1. `imageProcessor.ts` loads the file, downscales to max 150px on the long edge (`MAX_PROCESSING_SIZE`), and extracts raw RGB pixels from canvas.
2. Pixels are posted to `workers/colorAnalysis.worker.ts`, which runs K-means quantization (`quantizeColors`, k = requested color count) then post-processing (DeltaE clustering of similar quantized colors, near-white/near-black exclusion, and either "representative" or "dominant" color selection per cluster) off the main thread.
3. **Important**: the worker does not import `colorConversions.ts` or any other `src/utils/` module — it has hand-duplicated copies of `rgbToHsl`/`rgbToLab`/`deltaE`/`quantizeColors`/cluster-selection inline, because of how Vite bundles workers. There used to be standalone `quantizer.ts`/`colorPostProcessing.ts` source files that this logic was originally copied from, but they drifted out of sync with the worker (missing the `achromaticThreshold` param the worker later grew) and were never imported by anything else, so they were deleted — the worker file is now the only copy of this logic. If you touch quantization, clustering, or color-conversion math here, there is no "source" file to also update; the worker is authoritative for this pipeline.
4. Results (hex strings) flow back to the page, which can highlight matching pixels on the original image (`createColorPixelMapping` in `imageProcessor.ts`, simple RGB-distance threshold) and let the user push any swatch into their palette.

### Brand ink data

There is no brand-lookup service layer (the old `src/services/brandInks.ts` stub was deleted). `PalettePage.tsx` imports `src/data/brands/world-famous.json` and `src/data/brands/limitless.json` directly for the "quick-fill from brand" buttons, converting each entry via `createColorFromHex(ink.hex, ink.id, ...)`. The image-analysis flow still only deals in raw HEX values and does not touch brand data.

### Styling

Plain CSS files co-located per component (`Component/Component.tsx` + `Component/Component.css`), BEM-style class names (`block__element--modifier`), imported directly — **despite what `README.md` says, this is not CSS Modules** (no `.module.css`, no scoped class hashing). Design tokens (colors, spacing, radii, shadows) live as CSS custom properties in `src/index.css`. Routing chrome (`Layout`, `Navigation`) and most page/component CSS files already carry a `768px` breakpoint, but coverage is inconsistent across components.

### Routing

`react-router-dom` v6, five routes (`/`, `/palette`, `/recipe`, `/saved`, `/image-analysis`), `basename` set from `import.meta.env.BASE_URL` so the same route config works at `/` in dev and `/colortattoo/` in production.
