# Portal Builders submission packet (copy-ready draft)

Status: `READY_FOR_PORTAL_REVIEW` — do not click final Submit without explicit
action-time authorization.

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
current-commit CI, Chrome wallet funding, and Vercel live evidence are recorded
below. Portal acceptance is not claimed.

## Evidence fields

| Field | Current value |
|---|---|
| Repository | https://github.com/duclucky/semantic-setoff |
| Primary contract Explorer | https://explorer-studio.genlayer.com/address/0xaD05145fcec7914189FcAe469288c8E2cB7E4f5c |
| Lifecycle evidence | `docs/evidence/studionet/lifecycle.json` (`SETTLED`, 6 GEN withdrawn) |
| CI link | https://github.com/duclucky/semantic-setoff/actions |
| Live demo | https://semantic-setoff.vercel.app/ |
| Contract count | `1` (`SemanticSetoff`) |
| Direct tests | `12 passed` |
| Local acceptance | `Project semantic-setoff -Category projects` / `NO BLOCKER` |

## Honest limits

The prototype does not prove offchain service delivery, legal identity,
solvency, fiat payment, or enforceability outside the deployed contract. The
browser demo proves one selected-wallet round open/funding path and canonical
reload; the full three-actor consequence is evidenced separately by the
sanitized Studionet lifecycle. Do not replace Portal acceptance with an
inference from CI, Vercel, or local checks.
