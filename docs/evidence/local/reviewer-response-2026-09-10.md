# Reviewer response — 2026-09-10

Reviewer request:

> Bind the ratified charter and its digest into the canonical evidence used by
> both leader and validators, define charter-grounded rules for NETTABLE,
> CONFLICT, and AMBIGUOUS, and align the frontend terms limit with the contract's
> 600-character maximum.

Implemented locally:

1. The canonical evidence is deterministic JSON containing the round ID, exact
   stored charter, recomputed-and-verified charter digest, three participant
   ratification/funding rows, charter-grounded classification rules, and all
   ordered obligation records. The evidence digest covers the complete JSON.
2. Both leader and validators run the same task over that canonical evidence.
   Outputs must echo both the evidence digest and charter digest, and normalized
   semantic results must match.
3. NETTABLE, CONFLICT, and AMBIGUOUS have explicit charter-grounded rules.
   Contract code deterministically gives AMBIGUOUS precedence over CONFLICT and
   permits settlement only when all three entries are NETTABLE. Each CONFLICT
   entry must name itself as its conflict root.
4. The frontend textarea, validation message, `maxLength`, accessible helper,
   and live character counter now use the contract maximum of 600 characters.

Fresh local proof before redeployment:

```text
16 passed (final reviewer-revision local suite)
Lint passed (3 checks)
Validation passed
  Contract: SemanticSetoff
  Methods: 14 (7 view, 7 write)
FRONTEND_ADAPTER_TEST_OK
5033 modules transformed.
```

Network status: `CORRECTED_STUDIONET_LIFECYCLE_VERIFIED`. Contract
`0x2809483C6338861774e0D7655B1a6E33f0e9225A` was deployed from source commit
`a64deef10be7f5ad103a3ab10550e767cf8ec689`. Lifecycle round
`setoff-a64deef1` reached `SETTLED`; all 12 transactions are
`FINALIZED/MAJORITY_AGREE/SUCCESS`, with 6 GEN withdrawn and conservation true.
The earlier contract remains archived as historical evidence only.
