# SemanticSetoff project specification

Status: `BUILDING`  
Category: `Projects`  
Registry: `IDEA-026`  
Network: Studionet, as locked by workspace decision D1  
Submission channel: Portal Builders, as locked by workspace decision D2

## Identity

- Product name: SemanticSetoff
- Project slug: `semantic-setoff`
- Primary contract: `SemanticSetoff`
- Contribution: a three-party semantic setoff product for co-ratified agent-service payment obligations
- Initial scope: one round, three fixed participants, one obligation per participant, and 2 GEN collateral per participant

## One-sentence product hook

Turn three mutually acknowledged, differently worded agent-service payment
obligations into one validator-approved GEN net settlement without trusting a
single clearing operator.

## Trust problem

Three service counterparties may agree that their payment obligations can be
set off, while disagreeing about whether natural-language restrictions such as
maturity, same-kind scope, anti-setoff wording, framework membership, or priority
exceptions allow all three obligations to enter the same netting set. A single
operator or LLM could choose a favorable interpretation and reassign value.
SemanticSetoff keeps the charter, obligations, approvals, judgment boundary,
net-position arithmetic, discharge state, and pull credits in one validator-
controlled contract.

## Fingerprint

- Trust problem: neutral semantic admission of co-ratified payment obligations into one multilateral setoff round.
- Actors/adversary: three fixed participants, each both debtor and creditor; one is the round coordinator.
- Evidence class + authenticity mechanism: bounded onchain charter and obligation text, participant transaction ratification, debtor authorship, creditor exact-digest acceptance.
- Consensus question: does every exact stored obligation satisfy the charter, classified exactly once as `NETTABLE`, `CONFLICT`, or `AMBIGUOUS`?
- State machine: open, funded, obligations recorded, ready, settled/not-nettable/expired, with retryable review and pull withdrawals.
- Direct consequence: deterministic discharge and redistribution of 6 GEN collateral from net positions, or full refund.
- Reuse surface: a generic three-counterparty setoff lifecycle and canonical settlement certificate for agent-service integrations.

## Mandatory gate matrix

| Gate | Result | Contract-level reason |
|---|---|---|
| Replacement | `PASS` | Replacing GenLayer with a database or single LLM loses replicated wallet-authenticated commitments and validator consensus before obligation discharge and GEN credit assignment. |
| Judgment | `PASS` | Same-kind scope, maturity semantics, anti-setoff wording, framework membership and exceptions cannot be safely reduced to arithmetic. |
| Evidence availability | `PASS` | Exact bounded charter and obligation bytes are onchain. A deterministic readiness probe checks IDs, sizes, digests, funding and acceptance before any model call. |
| Evidence authenticity | `PASS` | All consequential artifacts are transaction-authored or exact-digest ratified by locked participant addresses; every row is specified in the Evidence Authority Matrix below. |
| Equivalence | `PASS` | Consensus-critical output is exact obligation ID coverage, bounded class per ID and exact conflict-root set; validators compare this meaning independently. |
| Consequence | `PASS` | An accepted complete result either discharges all three obligations and creates deterministic net credits, or creates full collateral refunds. |
| Adversarial | `PASS` | Each participant is both debtor and creditor, so favorable admission/exclusion can change its liquidity position. |
| State model | `PASS` | Round IDs isolate state; commitments are append-only; every write is role/state/time gated; settlement, expiry and withdrawal are one-way and all funded value has a destination. |
| Reuse | `PASS` | Any three agent-service counterparties can use the lifecycle and canonical certificate without forking semantic/admission/accounting logic. |
| Contract count | `PASS` | One contract owns the sole state, judgment and consequence boundary. A second contract would be pass-through theater. |
| Differentiation | `PASS` | No registered project combines co-ratified obligation edges, semantic setoff eligibility, deterministic multilateral net positions and discharge. |
| Claim-to-code | `PASS` | Every retained claim maps to a write/state, view, direct test, frontend path and planned network evidence below. |
| Full lifecycle | `PASS` | Projects completion requires real browser wallet writes, accepted/finalized tracking and canonical state reload across the complete three-wallet Studionet lifecycle. |
| Scope honesty | `PASS` | V1 explicitly does not verify external performance, legal debt, identity, solvency, fiat/cross-chain settlement or jurisdictional enforceability. |

## Actors, roles and incentives

| Role | Human goal | Incentive / risk |
|---|---|---|
| Coordinator | Open a clear, time-bounded round for three known wallet addresses | Wants the cycle settled; cannot approve or write for other participants |
| Participant | Understand the charter, ratify it, lock 2 GEN, acknowledge one outgoing debt, accept one incoming debt, and receive the correct final credit | May prefer a semantic interpretation that improves liquidity or excludes an unfavorable edge |
| Returning participant | Revisit a round, see what is waiting on them, recover after expiry, and withdraw available GEN | Needs canonical status and legal actions, not validator internals |
| Read-only visitor / integrator | Inspect the product, a round result, and honest limits before connecting | Must not mistake fixture or pending transaction data for finalized state |

## Scope and non-goals

### In scope

- Exactly three fixed participant wallets per round.
- One charter ratified by all three participants.
- One 1 GEN or 2 GEN outgoing obligation per participant, accepted by its named creditor.
- Exactly 2 GEN collateral funded by each participant.
- Semantic classification of setoff eligibility over exact stored text.
- Deterministic full-coverage validation, zero-sum net positions, discharge flags, refunds, credits, expiry, retry, and withdrawal.
- A multi-page wallet-connected web product with canonical IC reads and real EVM wallet writes.

### Out of scope

- Proof that external services were delivered or that a debt is legally valid.
- Fiat, stablecoins, cross-chain assets, external bank settlement, legal identity, insolvency, or jurisdictional enforceability.
- More than three participants, more than one outgoing obligation per participant, partial setoff, or a central counterparty.
- A contract explorer, validator console, marketplace, reputation score, performance oracle, or simulated wallet.

## Product/frontend blueprint

### Provisional contract-capability sketch

The UI assumes only these user-visible capabilities; Phase 4 may narrow names or
inputs but may not invent a hidden product action:

| Capability | Human role and action | Minimum canonical read | Value / finality expectation | Recovery |
|---|---|---|---|---|
| Open round | Coordinator names the other two wallets, writes the charter, and sets four ordered deadlines | New round ID, fixed participants, charter summary, stage/deadlines | No GEN; submitted then finalized before sharing | Retry failed transaction; edit before resubmission |
| Join and ratify | Each participant confirms the exact charter and locks 2 GEN | Current participant, charter, join status, funding deadline | Exactly 2 GEN; no joined state until finalized | Failed write keeps wallet unjoined; expired funded rounds refund |
| Record obligation | A joined participant records one outgoing 1 or 2 GEN obligation to another participant | Their join state, available counterparties, obligation deadline | No additional GEN; append-only after finalization | Fix validation error before submit; expiry refunds collateral |
| Accept incoming | Named creditor accepts the exact current obligation | Obligation terms, debtor, creditor, amount, exact digest summary | No GEN; acceptance is false until finalized | Rejecting/ignoring creates no penalty; expiry refunds all collateral |
| Request review | Any participant starts semantic review after all three accept | Readiness, exact set summary, review deadline, last retry reason | No GEN; show submitted, accepted/decided, finalized, failed, retry | Technical/ambiguous result keeps value unchanged and allows retry before deadline |
| Recover expired round | A participant closes a nonterminal round only after the applicable deadline | Stage, relevant deadline, terminal/accounting state | No GEN; finalized recovery creates 2 GEN credit for each funder | Duplicate call is harmless/rejected before mutation |
| Withdraw credit | A participant pulls their finalized credit | Connected address, available credit, settlement/refund reason | Transfer shown only after finalization and canonical credit reload | Failed transfer retains/restores credit according to verified contract behavior; never show success early |

### Human users and jobs

The main persona is a service operator participating through an EVM wallet.
Their shortest complete journey is: discover the product on Home, connect and
choose a wallet, create or open a round, ratify and fund 2 GEN, record and accept
obligations, request or follow review, see the finalized settlement, withdraw,
then revisit it in Rounds or Activity. A read-only visitor can inspect the same
structure without being shown action controls.

### Information architecture and named route map

Persistent desktop navigation: Home, Rounds, Activity, Help, plus a wallet/account
menu. Mobile uses the same four destinations in a compact top navigation/drawer;
no duplicate hierarchy or icon-only navigation.

| Route | Page name | User job | Primary action | Required data | Mobile behavior |
|---|---|---|---|---|---|
| `/` | Home | Understand the value, three-party model, 2 GEN commitment, and honest limits | Start a round | Network availability and whether a deployment is configured | Single-column hero, three-step explanation, persistent connect/start action without obscuring content |
| `/rounds` | Rounds | Find current and past rounds; filter by waiting on me, active, settled, refunded | Open a round | Canonical round summaries for connected wallet; public ID lookup | Search first, filter chips wrap, cards replace wide table |
| `/rounds/new` | New round | Define participants, charter, and ordered deadlines with review before signing | Open round | Connected account, network, field validation, current time | Three clear steps with back navigation and sticky summary below fields, not over them |
| `/rounds/:roundId` | Round workspace | Understand current stage, counterparties, obligations, what is waiting, and available legal action | One contextual next action | Canonical round, participant status, obligations, deadlines, credits | Stage summary first; secondary terms in disclosures; actions full-width and role-gated |
| `/rounds/:roundId/obligations/new` | Record obligation | Create the participant's single outgoing acknowledged payment obligation | Record obligation | Eligible creditor list, charter summary, deadline, amount limits | Visible labels/helper text; review card follows form; no dense two-column form |
| `/rounds/:roundId/review` | Review and result | Verify readiness, start/follow semantic review, understand final net distribution or retry | Request review or Retry review | Readiness checklist, transaction lifecycle, final credit distribution, last user-safe retry state | Vertical readiness list; distribution shown as labeled rows, never color alone |
| `/activity` | My activity | See pending responsibilities, submitted transactions, available credits, and withdrawals | Continue the most urgent item or withdraw | Canonical participant-indexed rounds/credits plus in-memory transaction feedback | Group by action needed; compact cards; long addresses wrap |
| `/settings` | Account and network | Inspect selected wallet/network, disconnect, and understand separate write/read paths | Connect/select wallet or disconnect | Detected providers, account, wallet chain, IC read endpoint availability | Centered accessible wallet sheet; large tap targets; no auto-selected provider |
| `/help` | Help and limits | Learn setoff terms, lifecycle, recovery, privacy, and non-goals | Look up a round or return to Rounds | Static product guidance and configured Explorer link | Accordion only for secondary detail; essential limitations visible by default |

All routes provide: first-run/empty guidance, reserved loading layout, a specific
error with recovery, submitted transaction feedback when applicable, finalized
success based on canonical reload, and an honest not-configured/network-mismatch
state. Route changes focus the main heading. Deep links preserve the round ID.

### Per-screen state contract

| Page group | Empty / first run | Loading / submitted | Error / edge | Success / finality |
|---|---|---|---|---|
| Home | Explain that no wallet is required to learn | Check read configuration without blocking content | State that live rounds are unavailable; never invent counts | Connected state offers role-relevant continuation |
| Rounds / Activity | Guidance to create or look up a round | Skeleton cards with stable dimensions | Retry canonical read and preserve filters | Filtered canonical items with clear next action |
| New round / obligation | Inline examples and constraints | Disable duplicate submit; announce wallet request and tx hash safely | Field-level cause and fix; wallet rejection is not failure of the round | Navigate only after finalized receipt and successful canonical reload |
| Round workspace | Unknown ID guidance | Reserved stage/party/obligation sections | Distinguish unavailable read, wrong network, missing round, and expired action | Status, next action, history, and credits reflect canonical state |
| Review / result | Readiness checklist explains missing steps | Submitted, accepted/decided, finalized progression with retry-safe copy | Technical retry differs from semantic not-nettable and transaction failure | Final distribution totals 6 GEN and links back to round history |
| Settings / Help | Provider detection and plain-language education | Provider request feedback | No provider / switch rejected / read path unavailable each has a remedy | Selected provider/account is explicit; disconnect clears writable session |

### Visibility matrix

| Function or data group | Visibility | Reason |
|---|---|---|
| Product value, three-party model, 2 GEN per participant, honest limits | `USER_PRIMARY` | Required before a user commits value |
| Round stage, deadlines, participant completion, obligations, final distribution, available credit | `USER_PRIMARY` | Drives decisions and verifies consequence |
| Open, join/fund, record, accept, review/retry, recover, withdraw | `USER_CONTEXTUAL` | Show only to the eligible connected role in a legal state |
| Wallet provider, account, chain mismatch, IC-read availability | `USER_CONTEXTUAL` | Needed to make a real transaction or recover connectivity |
| Transaction hash and Explorer link | `USER_CONTEXTUAL` | Verification detail after submit; not the primary product story |
| Exact charter/obligation digest | `USER_CONTEXTUAL` | Available in technical details for verification, not the default card |
| Raw storage shape, normalized validator JSON, prompt, internal attempt ID, node config, receipt payload | `SYSTEM_ONLY` | Reviewer/debug information would confuse users and may expose unsafe data |
| Fixture flags, test wallets, deployment scripts, submission claims | `SYSTEM_ONLY` | Never product or canonical state |

### UI action matrix

| Visible control | Expected capability | Eligible role | Legal product state | Required input/value | Expected finality | Recovery path |
|---|---|---|---|---|---|---|
| Start a round | Open round | Connected participant/coordinator | No pending form transaction | Two unique wallet addresses, charter, ordered future deadlines; 0 GEN | Finalized + canonical new round | Edit and retry; wallet rejection changes nothing |
| Join and lock 2 GEN | Join/ratify | Listed participant | Open and before funding deadline; not already joined | Exact 2 GEN | Finalized + joined/funded read | Retry failed write; expiry returns funded collateral |
| Record my obligation | Record obligation | Joined debtor | Funded, before obligation deadline, no prior outgoing edge | Named participant creditor, 1 or 2 GEN amount, bounded terms; 0 GEN | Finalized + obligation read | Fix input or retry; cannot overwrite |
| Accept incoming obligation | Accept exact digest | Named joined creditor | Obligation exists, before acceptance deadline, not accepted | Exact current obligation; 0 GEN | Finalized + acceptance read | Retry wallet/network failure; no penalty for no action |
| Request review | Review | Any listed participant | All accepted/ready, before review deadline, not terminal | 0 GEN | Submitted -> accepted/decided -> finalized -> canonical reload | Retry only for technical/ambiguous result while deadline remains |
| Recover collateral | Expire round | Listed participant | Nonterminal and relevant stage deadline reached | 0 GEN | Finalized + refund credits | Duplicate cannot change accounting |
| Withdraw GEN | Withdraw credit | Address with credit | Finalized credit > 0 | 0 GEN call; display amount in GEN | Finalized transfer + canonical zero/remaining credit | Failed call must not show success or lose canonical credit |
| Disconnect | Clear writable wallet session | Connected user | Any | No chain call | Immediate local session clear | Reopen picker to reconnect; reads remain public if configured |

### User-facing state language

| Canonical meaning | Product label | Explanation |
|---|---|---|
| Open for ratification/funding | `Waiting for participants` | Listed wallets still need to approve the charter and lock 2 GEN |
| Funded; obligations incomplete | `Building the set` | One or more participants must record an outgoing obligation |
| Obligations await exact acceptance | `Awaiting confirmation` | Named creditors must confirm the terms they saw |
| Ready | `Ready for review` | All commitments are present and review can start |
| Submitted / accepted / finalized transaction | `Submitted` / `Network decision reached` / `Finalized` | Transaction progress is not collapsed into instant success |
| Retryable model/source failure | `Review needs another attempt` | No GEN moved; a participant may retry before the deadline |
| Settled | `Net settlement complete` | Included obligations are discharged and credits total 6 GEN |
| Not nettable | `Returned without setoff` | Semantic conflict prevented setoff; each participant receives 2 GEN back |
| Expired | `Round closed and refunded` | A required step missed its deadline; funded participants can withdraw refunds |
| Failed wallet/network transaction | `Transaction did not complete` | Canonical round state did not advance; retry or correct the network |

### Wallet and network behavior

- Scan EIP-6963 providers first, then deduplicate injected fallbacks for MetaMask, Rabby, OKX, Coinbase, Brave, and compatible EVM providers.
- Never request accounts or auto-pick a provider before the centered wallet picker is shown and the user chooses.
- The selected account appears as a clickable, shortened address with an account menu and a clear Disconnect action.
- Disconnect clears selected provider/account and disables every write; it does not erase canonical chain state or pretend to disconnect the extension globally.
- Before writes, switch or add the verified current Studionet EVM wallet chain. Wallet writes and GenLayer IC reads remain separate configured paths.
- Show wallet confirmation, submitted hash, accepted/decided, finalized, failure, and retry. Reload the canonical round after finalization.
- No private key, simulated signature/finality/balance/gas, or localStorage canonical cache is allowed.

### Visual preservation constraints

The required project-local `ui-ux-pro-max` engine was run on 2026-09-08 with
`settlement fintech trustworthy calm spacious`, variance 4, motion 3 and density
5. Its verified result is persisted at
`design-system/semanticsetoff/MASTER.md`: Fintech/Crypto category, Trust &
Authority pattern, Minimalism & Swiss style, dark slate surfaces, gold primary,
purple accent, IBM Plex Sans, standard 4/8-derived spacing, subtle 200-250 ms
feedback, visible focus and reduced-motion support. The generic database CTA
recommendation (`Contact Sales`) is inapplicable to the locked product journey;
the product CTA remains `Start a round`.

Focused skill results govern the wallet modal and asynchronous state treatment:
visible focus on every modal control, no obscured focus, logical keyboard order,
native button semantics for chips, stable `aria-busy` loading regions, complete
status announcements rather than bare numbers, and a recovery action after
failure. React guidance requires an application error boundary and explicit
handling of async errors. Once Phase 3B passes, FE-PRESERVE forbids later
restyling: contract integration may replace adapter behavior and live data only.

## State model

### Stable IDs

- `round_id`: caller-supplied ASCII identifier, 3–48 characters, unique forever.
- `obligation_id`: contract-derived as `<round_id>:O:<participant_index>` where
  the index is `0`, `1` or `2`; callers cannot choose IDs.
- `credit_key`: contract-derived as `<round_id>:C:<lowercase_address>`.
- `obligation_set_digest`: contract-derived from the ordered charter digest and
  exact three stored obligation representations in participant-index order.
- `review_attempt`: monotonically increasing only after a structurally valid
  retryable result; reverted transactions consume no attempt.

### Structured storage

`RoundRecord` stores the coordinator, three participant addresses, charter and
digest, four deadlines, ratification/funding flags, stage, counts, review attempt,
last safe outcome, terminal marker and funded accounting. `ObligationRecord`
stores the derived ID, round, participant index, debtor, creditor, whole-GEN
amount, bounded terms, digest, acceptance, class and discharge flag. Records use
`TreeMap[str, ...]`; per-round credits use contract-derived string keys. Class-body
containers are never reassigned in `__init__`.

Text is ASCII and bounded: round ID 3–48, charter 80–1,200, obligation 60–800.
Addresses are three unique non-zero values. Obligation amount is 1 or 2 GEN;
storage/transfers use base units with `1 GEN = 10**18`.

### State machine

```text
OPEN -- 3/3 exact ratifications + 2 GEN each --> FUNDED
FUNDED -- 3 derived obligations recorded --> OBLIGATIONS_RECORDED
OBLIGATIONS_RECORDED -- 3 exact creditor acceptances --> READY
READY -- all NETTABLE --> SETTLED
READY -- any CONFLICT and no AMBIGUOUS --> NOT_NETTABLE
READY -- any AMBIGUOUS --> READY (retry record only)
OPEN | FUNDED | OBLIGATIONS_RECORDED | READY -- applicable expiry --> EXPIRED
```

`SETTLED`, `NOT_NETTABLE` and `EXPIRED` are terminal. Withdrawal changes only
the caller credit ledger, never the outcome or obligation history.

### Temporal entrypoint rules

The contract's `_now()` helper reads the GenVM transaction clock through
`datetime.now(timezone.utc)`; direct tests use the VM warp helper that controls
that clock. Every write below calls its own guard before mutation.

- `create_round`: `now < funding < obligation < acceptance < review`.
- `ratify_and_fund`: direct `now < funding_deadline`; equality is late.
- `record_obligation`: direct `now < obligation_deadline`; equality is late.
- `accept_obligation`: direct `now < acceptance_deadline`; equality is late.
- `review_round`: direct `now < review_deadline`; equality is late.
- `expire_round`: uses the earliest unmet step: missing funding requires
  `now >= funding_deadline`; else missing obligations requires
  `now >= obligation_deadline`; else missing acceptances requires
  `now >= acceptance_deadline`; else READY requires `now >= review_deadline`.
- `withdraw_credit`: `N/A` for time; positive terminal credit is sufficient.

### Illegal transitions

Creation rejects duplicate/zero participants, duplicate ID, invalid text,
non-ordered deadlines or value. Funding rejects outsider, duplicate, wrong
digest/value, late or non-OPEN calls. Obligation rejects outsider/unfunded,
second edge, self/nonparticipant creditor, wrong amount/text, wrong state or
late call. Acceptance rejects wrong creditor/round/digest/revision, duplicate,
wrong state or late call. Review rejects outsider, incomplete/expired/terminal
round or inconsistent evidence. Expiry rejects outsider, early or terminal call.
Withdrawal rejects non-owner, nonterminal, zero-credit and duplicate calls.

### Authorization

The creating sender is participant 0/coordinator. No privileged operator exists.
Only locked participants can ratify/fund, author their derived edge, request
review/retry, expire a round and withdraw their own credit. Only the stored
creditor can accept an obligation.

### Idempotency and double-action prevention

Round IDs never reopen. Ratification, obligation and acceptance flags move once.
Terminal state and all credits are assigned once after invariants pass. Each
obligation discharges once. Withdrawal debits credit to zero before external
transfer; duplicates observe zero.

## Write-method safety matrix

| Method | Caller | Allowed states | Forbidden states | Temporal/expiry gate | Idempotency | Value/accounting effect | Views affected | Negative tests |
|---|---|---|---|---|---|---|---|---|
| `create_round` | Any valid sender; becomes participant 0 | Unique ID | Existing ID; malformed roles/text/deadlines; value | `now < funding < obligation < acceptance < review` | unique ID | Zero value; funded remains 0 | round/participant index | duplicate, zero/duplicate actors, bounds/order/equality, attached value |
| `ratify_and_fund` | Exact listed participant | `OPEN`, own flag false | outsider, duplicate, wrong digest/value/state | direct `now < funding_deadline` | false-to-true once | payable exact 2 GEN; total += 2; at 6 GEN -> FUNDED | round/participant/accounting/activity | caller/state/digest/value; boundary-1/equal/+1 with stale OPEN; duplicate; payable metadata |
| `record_obligation` | Funded listed debtor | `FUNDED`/partial, no own edge | outsider/unfunded, duplicate, wrong creditor/amount/text/state | direct `now < obligation_deadline` | derived ID prevents overwrite | zero value; funded/credits unchanged | round/obligation/readiness/activity | caller/state/duplicate/self/nonparticipant/amount/text; boundary trio; accounting unchanged |
| `accept_obligation` | Stored named creditor | all edges recorded, target unaccepted | outsider/wrong creditor, missing edge, wrong digest, duplicate/state | direct `now < acceptance_deadline` | false-to-true once | zero value; no credit/discharge | obligation/readiness/activity | caller/state/duplicate/wrong round/objective/digest; boundary trio; hard state unchanged |
| `review_round` | Listed participant | `READY`, complete set | outsider, incomplete, expired, terminal | direct `now < review_deadline` | terminal once; valid ambiguity increments attempt and stays READY | all NETTABLE -> net credits/discharge; conflict -> 2 GEN refunds; ambiguity moves zero | status/result/obligations/credits/activity | caller/state/duplicate/late; malformed/coverage/class/root/set-digest/semantic replay/injection; accounting unchanged on invalid/retry |
| `expire_round` | Listed participant | Nonterminal + earliest unmet step expired | outsider, early, terminal | direct `now >= applicable_deadline`; equality permits recovery | single terminal transition | credits exactly each funder's 2 GEN; no unfunded credit | status/refunds/credit/activity | caller/state/duplicate; boundary trio at all four stages; no double/unfunded credit; invariant |
| `withdraw_credit` | Owner of positive round credit | Terminal and own credit > 0 | other owner, nonterminal, zero/duplicate | `N/A`: terminal pull credit has no expiry | debit before transfer | transfer exact credit to caller; liability and balance fall together | credit/accounting/activity | wrong caller/key/state, duplicate, transfer failure, no double withdraw |

## Frontend lifecycle coverage matrix

| Canonical state | User action | Contract write | UI component | Frontend test | Evidence status |
|---|---|---|---|---|---|
| No round | Create roles/charter/deadlines | `create_round` | New Round flow | mapping, selected wallet, finality/reload | UI built; live write pending Phase 8/13 |
| `OPEN` | Ratify and lock 2 GEN | `ratify_and_fund` | Round contextual action | 2 GEN encoding, role/state, finality/reload | UI built; live write pending |
| `FUNDED` | Record 1/2 GEN edge | `record_obligation` | New Obligation route | bounds, creditor, role/state/time | UI built; live write pending |
| `OBLIGATIONS_RECORDED` | Creditor accepts exact terms | `accept_obligation` | Round action | digest mapping, wrong-role hidden, reload | UI built; live write pending |
| `READY` | Request/retry review | `review_round` | Review/Result | readiness, accepted/finalized/retry, reload | UI built; nondet/live pending |
| Terminal | Withdraw own credit | `withdraw_credit` | Round/Activity | role/credit, finalized transfer/reload | UI built; live transfer pending |
| Expired nonterminal | Recover collateral | `expire_round` | Round recovery action | applicable deadline/state/role/reload | UI built; live recovery pending |
| Any read state | Filter/revisit/history | none | Rounds/Round/Activity/Help | mappings, empty/loading/error/deep link | Design-fixture proof only; live read pending |

## Evidence policy

V1 uses no claimant-hosted URL and makes no consequential real-world performance
claim. Consequential evidence is bounded onchain content whose authority comes
from exact transaction senders and digest ratification. A digest proves byte
stability only; sender/round/role/deadline/charter binding proves authority for
this contract-local purpose.

Before semantic review, code requires the exact round/charter digest; three
unique contract-derived obligation IDs; each expected debtor and valid creditor;
each 1/2 GEN amount; exact recomputed obligation digest; three creditor
acceptances; exact ordered set digest; and READY/time state. The prompt labels
terms as untrusted data and supplies objective IDs, actors, amounts, allowed
classes and consequence rules from state. Artifact prose cannot redefine them.

### Evidence Authority Matrix

| Consequential claim and representation | Byte controller | Authoritative source or issuer | Deterministic verification | Canonical objective/entity/actor binding | Freshness and anti-replay identity | Semantic role after verification | Non-penalizing failure | Consequences blocked | Required negative test |
|---|---|---|---|---|---|---|---|---|---|
| Exact charter governs this round | Coordinator proposes; participants approve/refuse | Three locked transaction senders collectively | membership, exact digest, one ratification each, no mismatch mutation | round ID, ordered participants, charter version/digest | unique round ID; one approval before funding deadline | eligibility policy after 3/3 ratify | revert; remains OPEN | readiness/review/discharge/credits | correct digest from wrong participant/round/version leaves state/accounting unchanged |
| Debtor acknowledges one obligation | Locked debtor controls its edge text | Debtor transaction sender | sender/index, derived ID, valid creditor, 1/2 GEN, text/digest bounds | round, ID, debtor, creditor, amount, charter digest | one append-only ID before obligation deadline | exact terms to classify | revert/no record | set/review/discharge/credits | digest-valid bytes from wrong debtor/round/charter/creditor leave count/value/status unchanged |
| Creditor accepts exact obligation | Stored creditor controls acceptance | Creditor transaction sender | sender equals creditor; recomputed digest matches; target unaccepted | round, ID, debtor-creditor pair, amount, charter, revision 1 | false-to-true once before deadline; cross-round replay rejected | makes edge reviewable, not proof of service | revert; remains unaccepted | readiness/review/discharge/credits | correct digest from wrong actor/objective/round/revision leaves hard state unchanged |
| Complete semantic classification | Leader proposes; validators replay | GenLayer validator set over exact onchain bytes | exact schema/round/set digest/ID coverage/enums; roots exactly CONFLICT IDs; code-derived outcome | current round, charter, ordered set and attempt | READY before review deadline; terminal blocks replay | classifies eligibility only | invalid reverts; valid ambiguity records retry only | discharge/terminal/credits/transfers | extra/missing/duplicate ID, enum/root/set mismatch, injected payout/authority leaves accounting unchanged |

Tripwire tests use matching digests with wrong sender, round, objective, actor,
creditor, charter or revision. Even semantically plausible prose cannot cross the
deterministic provenance gate.

## Consensus design

### Leader task

The no-argument leader closure reads the exact charter and three ordered
obligations, then invokes `gl.nondet.exec_prompt(..., response_format="json")`
with a bounded prompt. Output has `round_id`, `obligation_set_digest`, exactly
three `{obligation_id, class, reason}` entries, `conflict_roots` and `summary`.
Allowed classes are `NETTABLE`, `CONFLICT`, `AMBIGUOUS`.

### Consensus-critical fields

- Exact round ID and obligation-set digest.
- Exact set of three derived obligation IDs, each once.
- One allowed class for each expected ID.
- Conflict roots equal exactly the IDs classed `CONFLICT`.

Unknown keys are dropped. Reason wording and ordering are noncritical after
ID-keyed normalization; missing/invalid core fields fail before mutation.

### Validator

The validator rejects any leader value that is not `gl.vm.Return` or fails local
invariants. It independently runs the same semantic task over exact stored bytes,
normalizes by expected ID, and accepts only when round/set binding, per-ID classes
and conflict-root meaning match. It never accepts on JSON shape alone.

### Rationale policy

Only a bounded user-safe summary and per-edge final classes are stored after valid
consensus. Raw prompt, extra keys, validator/node configuration and full model
response are never stored or shown.

### Settlement invariant matrix

| Invariant | Rule before consequence | Invalid behavior | Negative test |
|---|---|---|---|
| Source coverage | READY, 3 ratifications, 6 GEN funded, exactly 3 obligations and 3 acceptances | revert/no attempt/consequence | remove funding/edge/acceptance with stale phase |
| Expected IDs | exactly three contract-derived IDs | revert | extra/missing/duplicate IDs |
| Classes | one allowed enum per ID | revert | invalid enum; conflicting duplicate |
| Root derivation | roots equal exactly IDs classed CONFLICT | revert | false/missing/extra root; root/class mismatch |
| Downstream classes | `N/A`: no downstream/blocked/inherited class; any such enum invalid | revert | inject BLOCKED/DOWNSTREAM |
| Consequence derivation | any AMBIGUOUS -> retry; else any CONFLICT -> refund; else all NETTABLE -> settle | ignore model outcome/payout; invalid core moves nothing | injected payout/outcome and mixed classes |
| Net arithmetic | credit = 2 GEN + incoming - outgoing; each 1–3 GEN; sum exactly 6 | revert before discharge/credit | altered amount, under/overflow/sum mismatch |
| Destinations | SETTLED net credits; NOT_NETTABLE 2 each; AMBIGUOUS zero movement; no rounding | revert or retry | all branches prove funded = credits + withdrawn + liability |

## Consequence and accounting

| Value item | Payer/source | Locked state | Release/refund destination | Terminal states | Duplicate/late/retry behavior | Canonical proof view |
|---|---|---|---|---|---|---|
| Participant 0 collateral, 2 GEN | participant 0 payable ratification | round liability | own net credit or 2 GEN refund | SETTLED/NOT_NETTABLE/EXPIRED | duplicate/late reverts; retry moves none | round accounting + credit |
| Participant 1 collateral, 2 GEN | participant 1 | round liability | own net credit or refund | same | same | same |
| Participant 2 collateral, 2 GEN | participant 2 | round liability | own net credit or refund | same | same | same |
| Net residual | no new payer; redistribution of same 6 GEN | none separate | entirely included in three credits | SETTLED | whole GEN, no rounding | total credit + withdrawn + liability = 6 GEN |
| Withdrawal credit | terminal liability | credit map until pull | exact owning participant | all terminal | debit-before-transfer; duplicate zero; transaction failure cannot double | credit/accounting/balance |

Demo: A owes B 2, B owes C 1, C owes A 1 GEN. Credits are A=`2+1-2=1`,
B=`2+2-1=3`, C=`2+1-1=2 GEN`; total 6. Conflict refunds 2/2/2.
Expiry refunds 2 GEN only to each actual funder. No fee, slash or orphan exists.

## Reusable interface

### Write methods

- `create_round(round_id, participant_b, participant_c, charter,
  funding_deadline, obligation_deadline, acceptance_deadline, review_deadline)`
- `ratify_and_fund(round_id, charter_digest)` — payable exactly 2 GEN
- `record_obligation(round_id, creditor, amount_gen, terms)`
- `accept_obligation(round_id, debtor, obligation_digest)`
- `review_round(round_id)`
- `expire_round(round_id)`
- `withdraw_credit(round_id)`

### View methods

- `get_round(round_id)` — status, charter, deadlines, counts and accounting.
- `get_participants(round_id)` — fixed addresses, joined flags and credits.
- `get_obligations(round_id)` — IDs, parties, GEN amount, terms, acceptance,
  discharge and user-safe class.
- `get_credit(round_id, participant)` — exact base-unit credit.
- `get_rounds_for(participant)` — append-only participant index.
- `get_readiness(round_id)` — missing step and legal next-action category.

### Consumer/callback

`N/A` in V1. This contract owns the direct GEN/discharge consequence. A status-
mirroring consumer would add no trust property. A future gateway milestone must
authenticate sender/certificate and consume delivery idempotently.

## Threat model

| Threat | Control | Required test/evidence |
|---|---|---|
| Duplicate/zero roles or colluding wallets | three unique non-zero addresses; sybil independence honestly out of scope | constructor/creation rejection + limitation |
| Actor impersonation | exact `gl.message.sender` on every write | wrong caller for each method |
| Digest-correct artifact bound to wrong authority/objective | round/charter/ID/debtor/creditor/revision checks before prompt | provenance tripwires; accounting unchanged |
| Debtor overwrites terms | one append-only derived obligation | second record rejected; first digest unchanged |
| Acceptance replay | immutable edge plus exact digest/round/revision binding | stale/cross-round digest rejected |
| Artifact prompt redefines authority, IDs or payout | untrusted delimiters; objective/rules from state; strict output allowlist | injection cannot affect destination or expected set |
| Leader omits/adds/duplicates edge | exact expected-ID coverage | malicious normalized output rejected |
| Validator shape-checks/parrots leader | independent semantic replay and critical-field comparison | valid-shape semantic mismatch rejected |
| Model invents roots/outcome | roots checked against classes; consequence derived in code | root/class and injected outcome tests |
| Late action passes stale stage | direct clock check inside every bounded write | boundary-1/equal/+1 with stale phase |
| Double settlement/refund/withdraw | one terminal transition, single credit assignment, debit-before-transfer | duplicate calls + accounting invariant |
| UI invents canonical success | explicit finality phases, fresh IC reload, no canonical localStorage | focused frontend/browser tests |

## Test plan

1. Metadata: exact line-1 runner, ASCII, one recognized contract class, payable
   metadata, no class-container reassignment.
2. Identity/isolation: two rounds, duplicate IDs and no cross-round mutation.
3. Authorization/config lock: wrong caller/role for every method; immutable roles,
   charter and deadlines.
4. State/idempotency: all legal transitions and every duplicate/illegal write.
5. Temporal: boundary-1/exact/+1 for creation ordering, funding, obligation,
   acceptance, review and four recovery predicates while phase is stale; rejects
   preserve state/accounting.
6. Provenance: matching digest but wrong participant, round, charter, debtor,
   creditor, objective, entity or revision.
7. Evidence semantics: missing/malformed/out-of-policy/contradictory terms and
   prompt injection.
8. Nondeterminism: all-nettable, conflict, ambiguity/retry, malicious leader and
   semantic validator replay with mocks installed before transaction.
9. Settlement invariants: extra/missing/duplicate IDs, invalid/downstream class,
   root mismatch, wrong set digest and injected consequence; accounting unchanged.
10. Value: only 1/2 GEN obligations, exact 2 GEN joins, 6 GEN total, 1/3/2 net,
    2/2/2 refunds, no unfunded credit, withdraw and no double spend.
11. Frontend: adapter mapping, EIP-6963/fallback selection, no auto request,
    disconnect, chain switch/add, separate RPCs, action visibility, finality/retry
    and canonical reload.
12. Parser: raw Studio `consensus_data.leader_receipt[].execution_result` and
    normalized SDK shape.
13. Network: bounded Studionet lifecycle and browser-local RPC/CORS behavior;
    direct success is never labeled network evidence.

## Claim-to-code matrix

| Claim | Contract method/state | View/read | Test | Network evidence |
|---|---|---|---|---|
| Three wallets ratify one charter | create + payable ratification flags | round/participants | role/digest/3-of-3/config lock | three finalized ratifications |
| Each locks 2 GEN | payable ratification + funded total | accounting/participants | value/payable/duplicate/6 total | receipts + before/after reads |
| Debtor authors and creditor confirms each edge | record + accept | obligations/readiness | role/digest/provenance/replay | three record + three accept txs |
| Validators decide semantic eligibility | D3 review/classes | result/obligations | net/conflict/ambiguous/replay | accepted/finalized review + canonical result |
| Invalid output moves no hard state | invariant block before terminal mutation | status/accounting/credits | coverage/class/root/set attacks | direct proof; network attack only if safely available |
| Code computes zero-sum net positions | SETTLED arithmetic | participant credits/accounting | 1/3/2 plus varied cycles/sum 6 | canonical distribution/balance liability |
| Conflict/expiry refunds without penalty | NOT_NETTABLE/EXPIRED | status/credits/accounting | conflict, four clocks, no unfunded credit | finalized conflict/expiry if safely run |
| Withdrawal cannot run twice | debit-before-transfer | credit/accounting | duplicate/failure/re-entry | receipt + balance delta |
| Browser lifecycle is real | live adapter/wrappers | IC adapter | wallet/finality/reload tests | browser evidence distinct from script |
| Primitive is reusable | stable writes/views | canonical interface | adapter/parser integration | public repo/Explorer/lifecycle |

## Analogue and differentiation matrix

| Analogue | Shared surface | Structural difference |
|---|---|---|
| SkillSlot Clearing | semantic classification + deterministic batch consequence | marketplace offers/requests/capacity/matches/fees vs ratified debt edges/setoff/net positions/discharge |
| TraceSettle | multi-actor value + validator classes | workflow evidence/DAG fault/apportionment vs no performance proof/obligation cycle/net discharge |
| SemanticPolicyQuorum | wallet constraints + semantic consensus | owner policy/executor plan/authorization vs debtor-creditor edges/charter/zero-sum settlement |
| Disclosure Dividend | multi-actor classification + credits | sponsor/GHSA/overlap reward vs reciprocal debt/no external evidence/netting/discharge |
| Corda MultilateralNetState | signed obligations + netting | deterministic same-template ledger vs validator judgment for bounded natural-language eligibility in GenVM |

The rejected ScopeHandshake remains in the root record as an anti-duplication
lesson. Collision on four fingerprint dimensions remains a kill criterion.

## Deployment and evidence plan

1. Resolve project then authorized parent `.env` by presence only.
2. Use repo Python 3.12 `.venv` and one pinned runner/API family.
3. Check official Studionet/tool status before any diagnostic conclusion.
4. Use resumable inspect/deploy/demo scripts; inspect existing state before write.
5. Bind deployment to network, address, source commit/digest, Depends hash,
   CLI/SDK version and public actors; archive superseded attempts.
6. Store only allowlisted receipt fields: network, actor, method, hash, Explorer,
   accepted/finalized/result status, timestamp and canonical before/after views.
7. Run three-wallet flow: create, three 2 GEN funds, three 1/2 GEN edges, three
   accepts, review/finality, canonical settlement and withdrawals.
8. Exercise conflict refund or expiry separately when safe; inspect ambiguous
   transaction/destination before retry.
9. Store only Studionet evidence under `docs/evidence/studionet`; keep browser-
   wallet proof distinct from script signer proof.
10. Bind public frontend config, build, Vercel deploy, HTTP/body and browser RPC
    verification.

## Definition of Done

### Projects

- IDEA-026 registry truth includes fingerprint, evidence and milestone headroom.
- Exactly one lint-recognized ASCII `SemanticSetoff` contract with pinned stable
  header/API family and no pass-through consumer.
- Every write matches a safety row/direct temporal rule.
- Every provenance and settlement-invariant attack is tested with hard state and
  accounting unchanged.
- Root `npm run check` is green with exact test count and zero critical skips.
- Studionet deployment has `Result: SUCCESS`, bound source identity and a real
  consequence using only 1–2 GEN demo transactions.
- Preserved nine-route frontend performs real selected-wallet writes, distinct
  IC reads, finality/retry and canonical reload with browser-local CORS proof.
- Public GitHub allowlist/history/secret scan and current-commit CI pass.
- Production Vercel returns 200, contains app/root and passes live browser QA.
- README/Portal packet use exact counts, verified URLs and honest limitations.
- `Project semantic-setoff -Category projects` reports no blocker.
- Final full master-prompt reread reconciles every phase/directive.

## Honest limitations

The UI and product must state that SemanticSetoff does not verify delivery,
legal identity, solvency, fiat settlement, or legal enforceability. Its only
canonical consequence is the GEN collateral and obligation-discharge state
owned by the deployed contract.

Wallet origin does not prove legal identity or independent ownership, so three
colluding wallets remain possible. Ambiguous semantic consensus is retryable and
non-penalizing. The fixed three-edge, whole-GEN ring intentionally omits partial
netting and rounding. Browser writes, deployment, adoption and Portal acceptance
remain pending until their named phases produce current evidence.

## Kill criteria

Stop or redesign if the validator cannot reliably distinguish nettable,
conflicting, and ambiguous bounded cases; if exact output coverage cannot be
validated before value movement; if the frontend cannot perform real wallet
writes and canonical reads in a browser; or if the result duplicates an active
registry primitive on four or more fingerprint dimensions.
