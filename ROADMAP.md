# MineRender V2 — Status, Parity & Continuation Plan

> Snapshot from a full repo + ecosystem audit, 2026-08. Baseline: branch `typescript` @ `bd141e4` ("yarn4", 2025-05-22), v2.0.0-alpha.15, plus uncommitted tsup-migration working-tree changes. Companion repos audited: `../MineRender` (V1), `../MineRenderServer`, `../MineRenderVite`, `../MineRenderWeb`, `../MineRenderSimple`.

**Headline:** the source is fully type-clean (`tsc --noEmit`: 0 errors across 129 files). The stall was never TypeScript debt — it is (a) a platform-mismatched `node_modules` (installed by npm from Windows, built from WSL2: wrong-platform esbuild/rollup/canvas natives), (b) three coexisting build systems with the newest (tsup) entirely uncommitted, and (c) the structural lack of a browser/Node packaging seam, which every build system so far (browserify-shim → esbuild polyfills → dual-tsc → tsup) merely relocated.

## Feature-parity matrix (V1 → V2)

| Feature | V1 | V2 today | Priority |
|---|---|---|---|
| Build & dev environment | webpack 4 per-feature IIFE bundles, works | Broken: wrong-platform natives, stale `yarn.lock`, tsup migration uncommitted | **critical** |
| Packaging / npm hygiene | script-tag CDN | `types` points at empty dir, no `files` whitelist (alpha.5 shipped the whole V1 website), exports map missing browser/node/types conditions, tests aimed at deleted output | **critical** |
| Clean import (no side effects) | window globals, telemetry beacon | Telemetry gone, but: 300k-iteration benchmark IIFE runs at import (`util/util.ts:79`), `Ticker` starts 3 intervals at import (keeps Node alive) | **critical** |
| Browser/Node dual-target | browser-only by design | Static imports of `canvas`/node-persist/localforage behind runtime branches; consumers need polyfill plugins; `Env.ts` empty | **critical** |
| Renderer core | continuous loop, SSAA, fps limit, dispose() | Dirty-flag loop (better), but `stop()` calls `window.stop()` (`Renderer.ts:280`), no dispose(), fpsLimit dead, composer default-on with known brightness defect | high |
| Camera controls | built-in OrbitControls via `options.controls` | Vendored twice, integrated nowhere; consumers must wire it + `registerEventDispatcher` manually | high |
| Skins — classic 64×64 | full, named toggleable parts | Works (named groups/meshes, overlay toggling) — missing variant auto-detect, `makeNonTransparentOpaque` | medium |
| Skins — slim + legacy 64×32 | auto-detected, dedicated UVs | Half-done: slim geometry ✔, slim UVs = copy of classic (`SkinTextureCoordinates.ts:690`), no 64×32, no auto-detect | high |
| Capes (vanilla/OptiFine/LabyMod) | full, 3 layouts, capes.dev | Not rendered at all (resolvers exist in `Skins.ts`, no meshes) | medium |
| Block/item model rendering | full incl. tint, display transforms | Works for common blocks; x-axis rotations no-op (`Axis.X` casing), texPosition crash, parent-merge concatenates `elements`, no tint/uvlock/display/builtin-entity | high |
| Blockstate resolution | variants + weighted random + multipart AND/OR | Missing `await` defeats default states (`BlockObject.ts:47`), no AND, no weighted pick, 150ms-setTimeout rotation hack | high |
| Animated textures | frametime honored | Ticks too fast (per-frame not per-50ms-tick), frame-math bugs in `WrappedImage`, no interpolation | medium |
| Entity rendering | 76 hosted models, mirror, inheritance | Richer data (107+19 ModelPart dumps) but children never recursed, mirror TODO, texture paths guessed, box-UV math unverified | high |
| GUI / inventory / recipes | full GuiRender + Positions + recipe() | `GuiObject` is an empty stub | high |
| Structure (.nbt) loading | works via ModelConverter | Parses correctly; placement serialized, debug wireframes hardcoded on, no entities/DataVersion | high |
| Legacy .schematic | full incl. AddBlocks nibbles | `SchematicParser` returns `{}`; mapping data (`res/idsToNames.json`, `legacyBlockList.json`) present but unreferenced | medium |
| Combined multi-renderer scene | CombinedRender wrapper | Superseded by design (one scene hosts all types) — **at parity** | — |
| Screenshots & 3D export | toImage(trim,mime), toObj/toGLTF/toPLY | Bare `toDataURL()`; no exporters | medium |
| Asset loading & resource packs | swappable assetRoot, fallback | More ambitious (sources, caches, zips) but: all-sources-parallel + deep-merge (double fetches, binary corruption risk), node-persist never `.init()`'d, every texture downloaded twice, errors swallowed, pinned to 1.17.1 with no version API, zips browser-only | high |
| Per-frame animation API | `<type>Render` CustomEvents | No supported hook (dirty-flag loop only) | medium |
| Embeds & website | minerender.org + iframe embeds | Demo/test pages only, non-deployable (hardcoded sibling paths, dual three r125/r158 loading) | low |
| **Large-scale worlds (V2 goal)** | n/a | Prototype, effectively dead code: 64³ box, `getChunkAt` broken (Map indexed with number), object-per-block, no meshing/culling/lighting/LOD, instance slots never freed | high |
| **Anvil .mca / world formats (V2 goal)** | n/a | Zero code | high |
| **Node headless rendering (V2 goal)** | faked externally by MineRenderServer | No DOM-free Renderer construction, no render-to-buffer API | high |
| Bedrock geometry (V2 ambition) | n/a | Type declarations only | low |
| Instancing architecture | merged Geometry + instanced-mesh fork | Cleaner concept; fixed capacity w/ silent overflow, whole-object transforms move ALL instances, `children[0]` assumption, no slot reclamation, shader material breaks under instancing | high |

## Continuation plan (ordered)

### 1. Unbreak the dev environment — critical
From WSL: delete `node_modules` and the staged `package-lock.json`, run a mutable `yarn install` (regenerates `yarn.lock` for the three→peerDependencies move, fetches linux-x64 natives, rebuilds `canvas`). If the checkout must stay shared with Windows, instead add `supportedArchitectures` (win32-x64 + linux-x64) to `.yarnrc.yml`. Delete `yarn-error.log` (it's just an old `yarn add 2.0.0-alpha.12` typo failure). Consider moving the checkout off `/mnt/p` DrvFS. Verify `yarn build` passes; `tsc --noEmit` is already clean.

### 2. Commit the tsup migration coherently; fix packaging metadata — critical
The entire tsup migration is uncommitted (and `tsup.config.ts` is **staged as an empty blob** with the real content unstaged; branch `typescript-tsup` has no extra commits). Stage the real config + package.json changes + regenerated lock; commit. Then:
- `types` → `./dist/index.d.ts` (or per-condition `types` in the exports map).
- Add a `files` whitelist (dist only) — alpha tarballs shipped the entire V1 website.
- Drop `splitting: true` (engages tsup's experimental sucrase CJS path; buys nothing for a single entry).
- Add an `iife` entry (`globalName: MineRender`) to replace `build.mjs` so `dist/bundle.js` consumers keep working.
- Repoint ava: `ava.config.js` rewrites `src/` → `dist/cjs/`, which tsup deletes — run tests via esbuild-runner/tsx against `src/` instead.
- Fix `scripts/make-exports.sh` (emits every barrel line twice) and regenerate `src/index.ts`.
- Prune dead browserify-era deps: onscreen, stream-http, pako, url, util, assert, process, colors, supports-color, threejs-examples. Replace the Java-era `renovate.json`.

### 3. Purge import-time side effects and dead code — critical
- Delete the 300k-iteration benchmark IIFE (`src/util/util.ts:79-120` — it ships in the bundles).
- Make `src/Ticker.ts` lazy-start, `unref()` in Node, fix `dispose()`/`remove(0)`.
- Remove stray imports: `import exp from "constants"` (`util/util.ts:4`), `SSAOPass` from three/examples (`MineRenderScene.ts:8`, `ImageLoader.ts:7`), `keys` from node-persist (`ModelTextures.ts:10`), `warn` from three (`Renderer.ts:1`).
- Delete `src/lib/OrbitControls.js`, `src/_model/`, empty root `three/`, `mccolor.js`.
- Sweep `console.log` from hot paths (AssetLoader, UVMapper atlas-data-URL log, BlockObject, ArchiveAssetSource, Entities).

### 4. Build the browser/Node environment seam — critical (the historical blocker)
Implement what `src/Env.ts` was meant to be: an injected/detected environment providing canvas+image creation, persistence backend, crypto. Convert `import * as nodeCanvas from "canvas"` (`CanvasCompat.ts:1`) and node-persist/localforage (`PersistentCache.ts:2-4`) to lazy dynamic imports behind it (the pattern already proven by `NBTHelper.ts`). Mark `canvas` an optional peerDependency. Add split entries (`index.browser.ts` / `index.node.ts`) and a conditional exports map (`browser`/`node` × `import`/`require` + `types`). Success criterion: MineRenderVite/MineRenderWeb build **without** node-polyfill plugins, and a Node import pulls zero browser deps.

### 5. Renderer core fixes + built-in OrbitControls — high
Fix `stop(); // just in case` calling `window.stop()` (`Renderer.ts:280`). Implement `dispose()`. Restore or delete `fpsLimit`. Resolve the composer brightness defect (`Renderer.ts:144`) or default `composer.enabled` to false. Integrate vendored OrbitControls behind `options.controls` with automatic `registerEventDispatcher` (MineRenderWeb's TODO asks for exactly this). Bump `@types/three` to ~0.158, migrate `outputEncoding` → `outputColorSpace`, rewrite `three/src/*` deep imports to bare `three`. Fix `MineRenderScene.remove()` (detach listeners, decrement stats).

### 6. Asset pipeline correctness & performance — high
Sequential-priority source resolution with early return (replace Promise.all + unconditional deep-merge, which double-fetches everything and can corrupt binary assets). `PersistentCache`: call node-persist `.init()`, stop persisting `undefined`. Raise request concurrency (currently 1 req/10ms globally), add retry to the CDN queue, stop mutating global axios defaults. Decode images from the already-fetched Buffer (every texture is currently downloaded twice). Stop caching fake 0×0 images on error — surface errors. Replace `@Memoize` on async statics with failure-evicting caches. Add an asset-version selection API (root is hardcoded to 1.17.1). Fix `WrappedImage` frame math.

### 7. Model/blockstate correctness bug batch — high
Small, high-impact: (1) `Axis.X = "X"` → lowercase (x-rotations silently no-op); (2) missing `await` on `BlockStates.getDefaultState` (`BlockObject.ts:47`); (3) texPosition-undefined crash (`UVMapper.ts:426`); (4) ModelMerger: child `elements` must override, not concat; (5) replace the 150ms setTimeout rotation hack with awaited init ordering; (6) multipart AND + `apply` arrays + weighted variants; (7) `AssetKey.parse` extension fallback + broken `isAssetKey`. Then tintindex, uvlock, display transforms. Grow the test suite around these (ModelMerger, `mapStateToVariant`).

### 8. Finish skins: slim, cape, legacy — high
Preferred route: migrate `SkinObject` onto the ModelPart pipeline using the completely unused `src/skin/playerModels.json` (correct default+slim trees already there), unifying with `EntityObject` — slim UVs come for free and the hand-written slim stub retires. Add cape meshes (vanilla layout first; OptiFine/LabyMod layouts portable from V1 `texturePositions.js:896-1047`) wired to the existing `Skins.ts` resolvers. Add 64×32 legacy layout + slim/legacy auto-detection (port V1's pixel-scan, `MineRender/src/skin/index.js:129-158`). Dispose replaced geometries/materials on `setSlim` rebuilds.

### 9. Entity rendering completion — high
Recurse `ModelPart.children` (most multi-part entities currently render incomplete). Implement `mirror`. Verify the five TODO face-UV methods in `MinecraftCubeTexture.ts` and the possibly-doubled pivot translation. Replace guessed `textures/entity/<name>.png` with a proper mapping (subdirs/variants). In `res/tools`, remap intermediary names (`field_20813`) in blockEntityModels and regenerate the hosted JSON.

### 10. Instance lifecycle overhaul — high (prerequisite for worlds)
Manage `InstancedMesh.count` (GPU currently always processes full capacity); add a free-list so removal reclaims slots (deletion today = zero-scale forever); grow capacity on demand instead of silent out-of-bounds writes; route whole-object transforms through per-index `InstanceReference`s (four "TODO specific instance" sites move ALL instances today); replace the `children[0]`-is-the-InstancedMesh assumption with a stored reference; extend dedup beyond `assetType === "models"` to blockstate level.

### 11. World subsystem redesign for scale — high (the V2 differentiator)
Immediate fixes: `getChunkAt` uses `this._chunks[numericIndex]` on a Map — use `.get(key)` (`MineRenderWorld.ts:104`); remove the 4×4×4 bound and negative-coordinate rejection (1.18+ needs negative Y); remove hardcoded debug wireframes (`Chunk.ts:34-43, 102-107`); fix `BatchedExecutor`'s missing setInterval delay + add `stop()`; parallelize `placeMultiBlock` (the `await` inside the loop serializes everything). Then the real redesign: palette + typed-array section storage (drop object-per-block `BlockInfo`), one merged mesh per chunk section with neighbor face culling via the model `cullface` attribute (currently entirely unhandled), chunk load/unload + frustum culling, baked per-vertex AO (SSAO was abandoned at ~2fps), biome tint. Keep 1 block = 16 units.

### 12. Node headless rendering entry point — high
Make `Renderer` constructible without DOM: injectable canvas + GL context (headless-gl or OffscreenCanvas), `renderOnce()`/`renderToBuffer()` bypassing the animation loop, `toImage()` returning a Buffer in Node (V1's `trimCanvas` is portable). `../MineRenderServer` is the reference contract — it faked all of this against V1 and reached into `_scene`/`_camera`; V2 already exposes them publicly. Then a thin V2 server can revive `GET /render/skin/:texture` and `GET /render/model/:type/:model`.

### 13. Anvil region (.mca) + schematic loaders — high
New world-format layer feeding the redesigned chunk storage: .mca region parsing (sector table, section palettes, DataVersion) — `NBTHelper` must stop discarding prismarine-nbt type/compression metadata; implement `SchematicParser` (legacy .schematic) using the already-present `legacyBlockList.json` / `res/idsToNames.json` mappings (V1 reference: `modelConverter.js:209-275`); Sponge `.schem` + litematica as follow-ups; structure entities + DataVersion handling.

### 14. GUI renderer parity — medium
Implement `GuiObject` (empty stub today): layered textured planes with UV crop, pixel positioning, z-layering, camera auto-fit. V1's `guiPositions.js` (boss bars, book, chest, crafting table atlases) and `guiHelper.js` (`inventorySlot` math + `recipe()` for crafting_shaped/shapeless JSON) port nearly verbatim; update texture paths for the newer asset layout. Wire `scene.addGui(...)`.

### 15. Polish: exports, animation API, inspector, demos, docs — medium
Port toObj/toGLTF and toImage trim/mime. Add a per-frame callback + `autoRotate` convenience integrated with the dirty flag (replaces V1's CustomEvent contract). Fix `SceneInspector` raycast normalization (against canvas rect, not window) and `SceneStatsDisplay`'s leaked interval. Fix animated-texture tick rate + full mcmeta support. Update companions: MineRenderWeb (untangle dual three loading, drop hardcoded `../../../../MineRender2/dist/bundle.js` paths, commit its yarn4 migration), MineRenderVite (renderer leak on recreate); delete MineRenderWweb. Grow the test suite beyond AssetKey and document the consumer API contract (see AGENTS.md) as the beta compatibility baseline.
