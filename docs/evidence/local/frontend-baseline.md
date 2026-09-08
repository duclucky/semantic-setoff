# Phase 3A/3B frontend baseline

Date: 2026-09-08  
Scope: design fixture and honest unconfigured-production adapter only; no live
contract or browser-wallet transaction is claimed.

## Skill evidence

Command:

```powershell
python ".agents\skills\ui-ux-pro-max\scripts\search.py" "settlement fintech trustworthy calm spacious" --design-system --variance 4 --motion 3 --density 5 --persist -p "SemanticSetoff" --output-dir "D:\Genlayer Project\semantic-setoff"
```

Verified result: category `Fintech/Crypto`; pattern `Trust & Authority +
Conversion`; style `Minimalism & Swiss Style`; IBM Plex Sans; dark slate, gold
primary and purple accent; variance 4, motion 3, density 5. The persisted source
of truth is `design-system/semanticsetoff/MASTER.md`.

Focused results came from `ux-guidelines.csv`: Focus States, Focus Not Obscured,
Keyboard Navigation, Submit Feedback, Contextual Live Badge Updates and Loading
Indicators. The React stack result required an ErrorBoundary and explicit async
error handling.

## Build evidence

Command: `cd frontend; npm run build`

```text
> tsc --noEmit
vite v8.2.2 building client environment for production...
✓ 4585 modules transformed.
dist/index.html                   0.62 kB │ gzip:   0.37 kB
dist/assets/index-C25VIhd8.css   26.90 kB │ gzip:   6.17 kB
dist/assets/index-BS5S6EmP.js   364.89 kB │ gzip: 107.51 kB
✓ built in 707ms
```

Static audit output:

```text
route_count=10
page_files=10
localstorage_hits=0
secret_api_hits=0
system_ui_hits=0
fixture_imports=5
```

Ten route elements include the nine named product routes and the not-found
route. Fixture imports are limited to the adapter/data-source boundary and the
explicit non-live labeling path.

## Browser evidence

- Home screenshot at the normal browser viewport visibly matched the persisted
  dark Swiss/fintech system.
- At 375 CSS px: `innerWidth=375`, `scrollWidth=360`,
  `horizontalOverflow=false`, and the mobile navigation control existed.
- At 768 CSS px, all nine named routes returned their expected H1, retained four
  persistent navigation destinations, showed the fixture disclosure, and had no
  horizontal overflow.
- At 1024 CSS px: `scrollWidth=1009`, `overflow=false`; the round workspace used
  two columns.
- At 1440 CSS px: `scrollWidth=1425`, `overflow=false`; the round workspace used
  two columns.
- With browser media set to `prefers-reduced-motion: reduce`, the query matched
  and transition duration was reduced to `0.00001s`.
- The round workspace screenshot showed status, charter, obligations and user
  action hierarchy without a method-list/debug console.
- Browser console warnings/errors: `[]`.
- Wallet picker opened only after `Choose wallet`, exposed a dialog named
  `Select an EVM wallet`, focused the named close button, reported no detected
  provider honestly, and closed with Escape.

## Self-review result

- Every planned page is routed and reachable through primary navigation,
  contextual links, account/footer support links or direct deep link.
- The main journey is represented end to end. Live writes remain disabled until
  a verified deployment address and separate wallet/read RPC configuration are
  supplied; no simulated transaction/finality exists.
- Primary pages contain no `node_config`, receipt payload, normalized validator
  output, attempt ID, reviewer or submission surface.
- Contextual controls are role/stage dependent in the adapter-facing UI.
- Empty, loading, unavailable, submitted, accepted, finalized, failed,
  retryable, terminal, recovery and disconnect language is present.

## Phase 7 live-adapter evidence

Command: `cd frontend; npm install genlayer-js@1.1.8; npm test; npm run build`

Verified output:

```text
FRONTEND_ADAPTER_TEST_OK
vite v8.2.2 building client environment for production...
5033 modules transformed.
dist/index.html 0.62 kB
dist/assets/index-CbLT6wnE.js 892.57 kB
PROJECT_CHECK_OK
```

The adapter binds the selected wallet account in `createClient`, sends 0/2 GEN
values through the real write path, waits for `ACCEPTED` and `FINALIZED`, then
reloads canonical views. IC reads use `VITE_GENLAYER_IC_RPC_URL`, with Vite's
same-origin `/genlayer-rpc` proxy available for browser-CORS-safe development.

Browser-local recheck on `http://127.0.0.1:5173/` after SDK wiring:

```text
default: width=459 scrollWidth=444 overflow=false alerts=0 sdkBanner=true
375px: width=375 scrollWidth=360 overflow=false mobileNav=true
wallet dialog: Select an EVM wallet; no compatible wallet detected; close button focused
console warning/error count=0
```
- FE-HONEST and FE-SURFACE pass. FE-PRESERVE is now active.
