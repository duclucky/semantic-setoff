# Portal Builders submission packet (copy-ready draft)

Status: `PENDING_REAL_EVIDENCE` — do not submit yet.

## Category

`Projects`

## Title

`SemanticSetoff — validator-checked three-party GEN obligation netting`

## English description (draft, under 1,000 characters)

SemanticSetoff is a GenLayer Projects prototype for three named participants to
co-ratify one bounded obligation set. Each participant locks 2 GEN, records one
1 or 2 GEN obligation to an exact creditor, and the creditor accepts the exact
terms. GenLayer validators classify every stored obligation as NETTABLE,
CONFLICT, or AMBIGUOUS from the canonical charter and evidence. Deterministic
contract code validates coverage, IDs, classes, conflict roots and the set
digest, then derives the consequence: a fully accounted settlement credit,
non-nettable refund, or retryable no-movement result. The UI separates EVM
wallet writes from GenLayer IC reads and reloads canonical state after
finalization. Current local evidence: one linted contract, 12 direct tests,
frontend adapter tests, and a successful production build. Studionet deployment
and a full three-actor `SETTLED` lifecycle are now verified. Public repository,
CI, browser-wallet interaction, Vercel, and Portal evidence remain pending
until their separate checks complete.

## Evidence fields

| Field | Current value |
|---|---|
| Repository | `PENDING_PUBLIC_REPOSITORY` |
| Primary contract Explorer | https://explorer-studio.genlayer.com/address/0xaD05145fcec7914189FcAe469288c8E2cB7E4f5c |
| Lifecycle evidence | `docs/evidence/studionet/lifecycle.json` (`SETTLED`, 6 GEN withdrawn) |
| CI link | `PENDING_PUBLIC_REPOSITORY` |
| Live demo | `PENDING_VERCEL_DEPLOYMENT` |
| Contract count | `1` (`SemanticSetoff`) |
| Direct tests | `12 passed` |
| Local acceptance | `PROJECT_CHECK_OK` |

## Honest limits

The prototype does not prove offchain service delivery, legal identity,
solvency, fiat payment, or enforceability outside the deployed contract. Do not
replace any pending field with an invented URL, address, receipt, balance, or
finality claim.
