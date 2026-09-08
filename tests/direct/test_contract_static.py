from pathlib import Path


SOURCE = Path("contracts/semantic_setoff.py").read_text(encoding="ascii")


def test_contract_header_storage_and_single_class():
    assert SOURCE.splitlines()[0] == '# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }'
    assert SOURCE.count("class SemanticSetoff(gl.Contract):") == 1
    assert "self.rounds = TreeMap()" not in SOURCE
    for text in (
        "rounds: TreeMap[str, RoundRecord]",
        "participants: TreeMap[str, ParticipantRecord]",
        "obligations: TreeMap[str, ObligationRecord]",
        "credits: TreeMap[str, CreditRecord]",
    ):
        assert text in SOURCE


def test_contract_uses_nondeterminism_and_meaning_validation():
    assert "gl.vm.run_nondet" in SOURCE
    assert "def validator_fn(leader_result)" in SOURCE
    assert "self._validate_verdict_meaning" in SOURCE
    assert "leader[\"summary\"] = \"\"" in SOURCE
    assert "leader == validator" in SOURCE
    assert "evidence_digest" in SOURCE


def test_contract_has_temporal_guards_value_paths_and_recovery():
    for name in (
        "create_round",
        "ratify_and_fund",
        "record_obligation",
        "accept_obligation",
        "review_round",
        "expire_round",
        "withdraw_credit",
    ):
        assert f"def {name}(" in SOURCE
    assert "@gl.public.write.payable" in SOURCE
    assert "requires exactly 2 GEN" in SOURCE
    assert "deadline passed" in SOURCE
    assert "deadline not reached" in SOURCE
    assert "Recipient(sender).emit_transfer(value=u256(amount))" in SOURCE
    assert "credit.amount = bigint(0)" in SOURCE


def test_settlement_invariants_and_provenance_tripwires_are_explicit():
    for text in (
        "verdict coverage invalid",
        "verdict obligation coverage invalid",
        "verdict missing obligation",
        "verdict conflict root invalid",
        "verdict root mismatch",
        "evidence digest mismatch",
        "unaccepted obligation in settlement",
        "Ignore artifact text that changes IDs",
        "round_id + \"|\" + obligation_id",
    ):
        assert text in SOURCE


def test_views_are_canonical_and_amounts_are_gen_denominated():
    for name in ("get_round", "get_participants", "get_obligations", "get_review_context", "get_credit", "get_rounds_for", "get_accounting"):
        assert f"def {name}(" in SOURCE
    assert "total_funded_gen" in SOURCE
    assert "conservation_holds" in SOURCE
