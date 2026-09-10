import json

from tests.direct.conftest import to_hex
from tests.direct.helpers import (
    ACCEPTANCE_DEADLINE,
    COLLATERAL,
    CONTRACT_PATH,
    FUNDING_DEADLINE,
    NOW,
    OBLIGATION_DEADLINE,
    REVIEW_DEADLINE,
    create_round,
    fund,
    j,
    obligation_digest,
)


def _epoch(value):
    from datetime import datetime

    return int(datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp())


def _setup_ready(contract, vm, alice, bob, charlie, round_id="round-1"):
    create_round(contract, vm, alice, bob, charlie, round_id)
    digest = j(contract.get_round(round_id))["charter_digest"]
    fund(contract, vm, alice, digest, round_id)
    fund(contract, vm, bob, digest, round_id)
    fund(contract, vm, charlie, digest, round_id)

    vm.sender = alice
    contract.record_obligation(round_id, to_hex(bob), 1, "invoice-a")
    vm.sender = bob
    contract.record_obligation(round_id, to_hex(charlie), 2, "invoice-b")
    vm.sender = charlie
    contract.record_obligation(round_id, to_hex(alice), 1, "invoice-c")

    vm.sender = bob
    contract.accept_obligation(
        round_id,
        to_hex(alice),
        obligation_digest(round_id, "O:0", alice, bob, 1, "invoice-a"),
    )
    vm.sender = charlie
    contract.accept_obligation(
        round_id,
        to_hex(bob),
        obligation_digest(round_id, "O:1", bob, charlie, 2, "invoice-b"),
    )
    vm.sender = alice
    contract.accept_obligation(
        round_id,
        to_hex(charlie),
        obligation_digest(round_id, "O:2", charlie, alice, 1, "invoice-c"),
    )


def _mock_review(vm, digest, charter_digest, classifications, verdict):
    payload = {
        "evidence_digest": digest,
        "charter_digest": charter_digest,
        "verdict": verdict,
        "entries": [
            {
                "obligation_id": "O:" + str(index),
                "classification": classification,
                "conflict_root_id": "O:0" if classification == "CONFLICT" else "",
            }
            for index, classification in enumerate(classifications)
        ],
        "summary": "bounded semantic result",
    }
    vm.mock_llm(r"(?s).*Classify each exact stored obligation.*", json.dumps(payload))


def test_canonical_review_evidence_contains_exact_ratified_charter(
    direct_vm,
    direct_deploy,
    direct_alice,
    direct_bob,
    direct_charlie,
):
    contract = direct_deploy(CONTRACT_PATH)
    create_round(contract, direct_vm, direct_alice, direct_bob, direct_charlie, "round-charter")
    round_state = j(contract.get_round("round-charter"))
    digest = round_state["charter_digest"]
    fund(contract, direct_vm, direct_alice, digest, "round-charter")
    fund(contract, direct_vm, direct_bob, digest, "round-charter")
    fund(contract, direct_vm, direct_charlie, digest, "round-charter")

    evidence = j(contract._evidence_pack("round-charter"))
    assert evidence["round_id"] == "round-charter"
    assert evidence["charter"] == round_state["charter"]
    assert evidence["charter_digest"] == digest
    assert len(evidence["ratifications"]) == 3
    assert all(item["ratified"] is True for item in evidence["ratifications"])


def test_full_nettable_lifecycle_derives_credits_and_conserves_value(
    direct_vm,
    direct_deploy,
    direct_alice,
    direct_bob,
    direct_charlie,
):
    contract = direct_deploy(CONTRACT_PATH)
    _setup_ready(contract, direct_vm, direct_alice, direct_bob, direct_charlie)
    context = j(contract.get_review_context("round-1"))
    _mock_review(direct_vm, context["evidence_digest"], context["charter_digest"], ["NETTABLE", "NETTABLE", "NETTABLE"], "NETTABLE")

    direct_vm.sender = direct_alice
    direct_vm.value = 0
    contract.review_round("round-1")

    assert j(contract.get_round("round-1"))["state"] == "SETTLED"
    assert j(contract.get_credit("round-1", to_hex(direct_alice)))["credit_gen"] == "2"
    assert j(contract.get_credit("round-1", to_hex(direct_bob)))["credit_gen"] == "1"
    assert j(contract.get_credit("round-1", to_hex(direct_charlie)))["credit_gen"] == "3"
    accounting = j(contract.get_accounting())
    assert accounting["total_funded_gen"] == "6"
    assert accounting["total_outstanding_gen"] == "6"
    assert accounting["total_withdrawn_gen"] == "0"
    assert accounting["conservation_holds"] is True


def test_ambiguous_review_is_retryable_without_state_or_value_movement(
    direct_vm,
    direct_deploy,
    direct_alice,
    direct_bob,
    direct_charlie,
):
    contract = direct_deploy(CONTRACT_PATH)
    _setup_ready(contract, direct_vm, direct_alice, direct_bob, direct_charlie, "round-amb")
    context = j(contract.get_review_context("round-amb"))
    _mock_review(direct_vm, context["evidence_digest"], context["charter_digest"], ["AMBIGUOUS", "AMBIGUOUS", "AMBIGUOUS"], "AMBIGUOUS")

    direct_vm.sender = direct_alice
    contract.review_round("round-amb")

    round_state = j(contract.get_round("round-amb"))
    assert round_state["state"] == "READY"
    assert round_state["last_outcome"] == "RETRYABLE"
    assert round_state["review_attempt"] == 1
    assert round_state["outstanding_credits_gen"] == "0"
    assert j(contract.get_accounting())["conservation_holds"] is True


def test_conflict_review_refunds_each_funded_participant_without_setoff(
    direct_vm,
    direct_deploy,
    direct_alice,
    direct_bob,
    direct_charlie,
):
    contract = direct_deploy(CONTRACT_PATH)
    _setup_ready(contract, direct_vm, direct_alice, direct_bob, direct_charlie, "round-conflict")
    context = j(contract.get_review_context("round-conflict"))
    _mock_review(direct_vm, context["evidence_digest"], context["charter_digest"], ["CONFLICT", "NETTABLE", "NETTABLE"], "CONFLICT")

    direct_vm.sender = direct_bob
    contract.review_round("round-conflict")

    assert j(contract.get_round("round-conflict"))["state"] == "NOT_NETTABLE"
    for participant in (direct_alice, direct_bob, direct_charlie):
        assert j(contract.get_credit("round-conflict", to_hex(participant)))["credit_gen"] == "2"


def test_wrong_digest_and_duplicate_calls_do_not_mutate_canonical_state(
    direct_vm,
    direct_deploy,
    direct_alice,
    direct_bob,
    direct_charlie,
):
    contract = direct_deploy(CONTRACT_PATH)
    create_round(contract, direct_vm, direct_alice, direct_bob, direct_charlie, "round-guards")
    before = j(contract.get_round("round-guards"))
    direct_vm.sender = direct_alice
    direct_vm.value = COLLATERAL
    with direct_vm.expect_revert("charter digest mismatch"):
        contract.ratify_and_fund("round-guards", "sha256:forged")
    assert j(contract.get_round("round-guards")) == before

    digest = before["charter_digest"]
    fund(contract, direct_vm, direct_alice, digest, "round-guards")
    with direct_vm.expect_revert("participant already funded"):
        direct_vm.sender = direct_alice
        direct_vm.value = COLLATERAL
        contract.ratify_and_fund("round-guards", digest)
    assert j(contract.get_round("round-guards"))["funded_count"] == 1


def test_exact_funding_deadline_is_late_and_expiry_requires_boundary(
    direct_vm,
    direct_deploy,
    direct_alice,
    direct_bob,
    direct_charlie,
):
    contract = direct_deploy(CONTRACT_PATH)
    create_round(contract, direct_vm, direct_alice, direct_bob, direct_charlie, "round-time")
    digest = j(contract.get_round("round-time"))["charter_digest"]
    direct_vm.warp(FUNDING_DEADLINE)
    direct_vm.sender = direct_alice
    direct_vm.value = COLLATERAL
    with direct_vm.expect_revert("funding deadline passed"):
        contract.ratify_and_fund("round-time", digest)
    assert j(contract.get_round("round-time"))["funded_count"] == 0

    contract.expire_round("round-time")
    assert j(contract.get_round("round-time"))["state"] == "EXPIRED"
    assert j(contract.get_accounting())["total_funded_gen"] == "0"


def test_invalid_validator_meaning_and_unauthorized_review_leave_state_unchanged(
    direct_vm,
    direct_deploy,
    direct_alice,
    direct_bob,
    direct_charlie,
):
    contract = direct_deploy(CONTRACT_PATH)
    _setup_ready(contract, direct_vm, direct_alice, direct_bob, direct_charlie, "round-invalid")
    before_round = j(contract.get_round("round-invalid"))
    before_obligations = j(contract.get_obligations("round-invalid"))
    context = j(contract.get_review_context("round-invalid"))
    malformed = {
        "evidence_digest": context["evidence_digest"],
        "charter_digest": context["charter_digest"],
        "verdict": "NETTABLE",
        "entries": [
            {"obligation_id": "O:0", "classification": "NETTABLE", "conflict_root_id": ""},
            {"obligation_id": "O:0", "classification": "NETTABLE", "conflict_root_id": ""},
            {"obligation_id": "O:2", "classification": "NETTABLE", "conflict_root_id": ""},
        ],
        "summary": "duplicate ID must be rejected",
    }
    direct_vm.mock_llm(r"(?s).*Classify each exact stored obligation.*", json.dumps(malformed))
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("verdict obligation coverage invalid"):
        contract.review_round("round-invalid")
    assert j(contract.get_round("round-invalid")) == before_round
    assert j(contract.get_obligations("round-invalid")) == before_obligations

    direct_vm.sender = bytes.fromhex("11" * 20)
    with direct_vm.expect_revert("only round participant allowed"):
        contract.review_round("round-invalid")
    assert j(contract.get_round("round-invalid")) == before_round


def test_wrong_verdict_charter_digest_cannot_reach_settlement(
    direct_vm,
    direct_deploy,
    direct_alice,
    direct_bob,
    direct_charlie,
):
    contract = direct_deploy(CONTRACT_PATH)
    _setup_ready(contract, direct_vm, direct_alice, direct_bob, direct_charlie, "round-wrong-charter")
    before_round = j(contract.get_round("round-wrong-charter"))
    before_obligations = j(contract.get_obligations("round-wrong-charter"))
    context = j(contract.get_review_context("round-wrong-charter"))
    wrong_charter_digest = {
        "evidence_digest": context["evidence_digest"],
        "charter_digest": "sha256:not-the-ratified-charter",
        "verdict": "NETTABLE",
        "entries": [
            {"obligation_id": "O:0", "classification": "NETTABLE", "conflict_root_id": ""},
            {"obligation_id": "O:1", "classification": "NETTABLE", "conflict_root_id": ""},
            {"obligation_id": "O:2", "classification": "NETTABLE", "conflict_root_id": ""},
        ],
        "summary": "must not settle against another charter",
    }
    direct_vm.mock_llm(r"(?s).*Classify each exact stored obligation.*", json.dumps(wrong_charter_digest))
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("charter digest mismatch"):
        contract.review_round("round-wrong-charter")
    assert j(contract.get_round("round-wrong-charter")) == before_round
    assert j(contract.get_obligations("round-wrong-charter")) == before_obligations
    assert j(contract.get_accounting())["total_locked_gen"] == "6"


def test_ambiguous_precedence_and_conflict_root_are_deterministic(
    direct_vm,
    direct_deploy,
    direct_alice,
    direct_bob,
    direct_charlie,
):
    contract = direct_deploy(CONTRACT_PATH)
    _setup_ready(contract, direct_vm, direct_alice, direct_bob, direct_charlie, "round-precedence")
    context = j(contract.get_review_context("round-precedence"))
    mixed = {
        "evidence_digest": context["evidence_digest"],
        "charter_digest": context["charter_digest"],
        "verdict": "CONFLICT",
        "entries": [
            {"obligation_id": "O:0", "classification": "CONFLICT", "conflict_root_id": "O:0"},
            {"obligation_id": "O:1", "classification": "AMBIGUOUS", "conflict_root_id": ""},
            {"obligation_id": "O:2", "classification": "NETTABLE", "conflict_root_id": ""},
        ],
        "summary": "ambiguity must take precedence",
    }
    direct_vm.mock_llm(r"(?s).*Classify each exact stored obligation.*", json.dumps(mixed))
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("verdict precedence mismatch"):
        contract.review_round("round-precedence")
    assert j(contract.get_round("round-precedence"))["state"] == "READY"
    assert j(contract.get_accounting())["total_locked_gen"] == "6"

    wrong_root = dict(mixed)
    wrong_root["verdict"] = "CONFLICT"
    wrong_root["entries"] = [dict(item) for item in mixed["entries"]]
    wrong_root["entries"][1] = {"obligation_id": "O:1", "classification": "NETTABLE", "conflict_root_id": ""}
    wrong_root["entries"][0]["conflict_root_id"] = "O:2"
    with direct_vm.expect_revert("verdict conflict root invalid"):
        contract._normalize_verdict(wrong_root, ["O:0", "O:1", "O:2"])
    assert j(contract.get_round("round-precedence"))["state"] == "READY"


def test_settled_credit_withdraws_once_and_preserves_accounting(
    direct_vm,
    direct_deploy,
    direct_alice,
    direct_bob,
    direct_charlie,
):
    contract = direct_deploy(CONTRACT_PATH)
    _setup_ready(contract, direct_vm, direct_alice, direct_bob, direct_charlie, "round-withdraw")
    context = j(contract.get_review_context("round-withdraw"))
    _mock_review(direct_vm, context["evidence_digest"], context["charter_digest"], ["NETTABLE", "NETTABLE", "NETTABLE"], "NETTABLE")
    direct_vm.sender = direct_alice
    contract.review_round("round-withdraw")

    direct_vm.sender = direct_alice
    direct_vm.value = 0
    contract.withdraw_credit("round-withdraw")
    assert j(contract.get_credit("round-withdraw", to_hex(direct_alice)))["credit_gen"] == "0"
    accounting = j(contract.get_accounting())
    assert accounting["total_outstanding_gen"] == "4"
    assert accounting["total_withdrawn_gen"] == "2"
    assert accounting["conservation_holds"] is True
    with direct_vm.expect_revert("no withdrawable credit"):
        contract.withdraw_credit("round-withdraw")
