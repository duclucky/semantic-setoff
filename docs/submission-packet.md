# Portal Builders submission packet (copy-ready draft)

Status: `REVIEW_REVISION_NETWORK_VERIFIED` — reviewer-requested fixes are
locally, onchain, and in the production frontend verified; Portal resubmission
is still pending explicit final-submit authorization.

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
finalization. Current local evidence: one linted contract, 16 direct tests,
frontend adapter tests, and a successful production build. Studionet deployment
and a full three-actor `SETTLED` lifecycle are now verified. Public repository,
current-commit CI, Chrome wallet funding, and Vercel live evidence are recorded
below. Portal acceptance is not claimed.

## Evidence fields

| Field | Current value |
|---|---|
| Repository | https://github.com/duclucky/semantic-setoff |
| Primary contract Explorer | https://explorer-studio.genlayer.com/address/0x2809483C6338861774e0D7655B1a6E33f0e9225A |
| Lifecycle evidence | `docs/evidence/studionet/lifecycle.json` (`setoff-a64deef1`, `SETTLED`, 6 GEN withdrawn) |
| CI link | https://github.com/duclucky/semantic-setoff/actions |
| Live demo | https://semantic-setoff.vercel.app/ |
| Contract count | `1` (`SemanticSetoff`) |
| Direct tests | `16 passed` |
| Local acceptance | `Project semantic-setoff -Category projects` / `NO BLOCKER` |

## Honest limits

The prototype does not prove offchain service delivery, legal identity,
solvency, fiat payment, or enforceability outside the deployed contract. The
browser demo proves one selected-wallet round open/funding path and canonical
reload; the full three-actor consequence is evidenced separately by the
sanitized Studionet lifecycle. Do not replace Portal acceptance with an
inference from CI, Vercel, or local checks.
