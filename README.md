# SemanticSetoff

SemanticSetoff is a GenLayer Projects prototype for three named participants
to co-ratify a bounded obligation set, lock 2 GEN each, and let validators
classify the exact stored obligations as `NETTABLE`, `CONFLICT`, or
`AMBIGUOUS`. Contract code derives the only consequential outcome: a settled
credit distribution, a non-nettable refund, or a retryable no-movement result.

## Current status

The contract, direct tests, frontend adapter, and production build are locally
verified. Studionet deployment and browser-wallet writes are intentionally not
claimed yet: the authorized environment currently provides only two distinct
actor keys, while the V1 lifecycle requires three. The local GLSim integration
smoke is recorded as a Windows temporary-file harness failure, not a passing
integration result.

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
`PROJECT_CHECK_OK`. The production build is a verification artifact only; it
does not imply a deployed contract or live chain state.

## Value and trust boundary

Human-facing amounts are whole GEN. Demo values are 1 or 2 GEN; contract
encoding uses the required base-unit conversion. The contract proves only its
own authenticated charter, obligations, validator classification, GEN
accounting, and final state. It does not prove service delivery, legal identity,
solvency, fiat payment, or enforceability outside the deployed contract.

## Not yet published

No GitHub push, Vercel deployment, Portal submission, or Studionet transaction
has been performed from this repository. Those steps require the corresponding
authorized actor and explicit action-time authorization.
