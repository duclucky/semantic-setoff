# SemanticSetoff

SemanticSetoff is a GenLayer Projects prototype for three named participants
to co-ratify a bounded obligation set, lock 2 GEN each, and let validators
classify the exact stored obligations as `NETTABLE`, `CONFLICT`, or
`AMBIGUOUS`. Contract code derives the only consequential outcome: a settled
credit distribution, a non-nettable refund, or a retryable no-movement result.

## Current status

The contract, direct tests, frontend adapter, production build, Studionet
deployment, and a consequential three-actor lifecycle are verified. A Chrome
OKX Wallet session also opened a real round and finalized a 2 GEN funding write;
the browser extension confirmation remains a user-controlled step. The local
GLSim integration smoke is recorded as a Windows temporary-file harness
failure, not a passing integration result.

## Repository map

- `contracts/semantic_setoff.py` — one ASCII GenVM contract (`SemanticSetoff`).
- `tests/direct/` — direct state, authorization, temporal, provenance,
  nondeterminism, settlement, accounting, and recovery tests.
- `tests/integration/` — read-only GLSim smoke test (requires a working local
  harness).
- `frontend/` — Vite/React product UI with honest unavailable/fixture modes and
  a real `genlayer-js` adapter for a configured deployment.
- `docs/README.md` — full specification, authority matrix, safety cards,
  settlement invariants, and claim-to-code map.
- `docs/IMPLEMENTATION-PLAN.md` — phase ledger and external blockers.

## Local verification

```powershell
npm install
npm run check
npm run audit:spec
```

The current local check reports `12 passed`, `FRONTEND_ADAPTER_TEST_OK`, and
`PROJECT_CHECK_OK`.

## Studionet evidence

- Network: Studionet, chain ID `61999`.
- Active contract: [`0xaD05145f...B7E4f5c`](https://explorer-studio.genlayer.com/address/0xaD05145fcec7914189FcAe469288c8E2cB7E4f5c).
- Deployment receipt: `FINALIZED`, `MAJORITY_AGREE`, execution `SUCCESS`.
- Lifecycle round: `setoff-a3bc176` finalized as `SETTLED`.
- Canonical accounting: 6 GEN funded, 0 GEN locked, 0 GEN outstanding, 6 GEN
  withdrawn; `conservation_holds=true`.
- Sanitized transaction and canonical-view evidence: `docs/evidence/studionet/`.

The browser build uses this address only through ignored local configuration;
no private key is included in the frontend.

## Value and trust boundary

Human-facing amounts are whole GEN. Demo values are 1 or 2 GEN; contract
encoding uses the required base-unit conversion. The contract proves only its
own authenticated charter, obligations, validator classification, GEN
accounting, and final state. It does not prove service delivery, legal identity,
solvency, fiat payment, or enforceability outside the deployed contract.

## Publication status

Public repository: [github.com/duclucky/semantic-setoff](https://github.com/duclucky/semantic-setoff).
CI run: [current Windows check](https://github.com/duclucky/semantic-setoff/actions).
Live app: [semantic-setoff.vercel.app](https://semantic-setoff.vercel.app/).
Portal submission remains intentionally pending explicit final-submit
authorization; these links are not Portal acceptance claims.
