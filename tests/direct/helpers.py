import json

from tests.direct.conftest import to_hex


CONTRACT_PATH = "contracts/semantic_setoff.py"
GEN = 10**18
COLLATERAL = 2 * GEN
NOW = "2026-09-01T00:00:00Z"
FUNDING_DEADLINE = "2026-09-01T00:10:00Z"
OBLIGATION_DEADLINE = "2026-09-01T00:20:00Z"
ACCEPTANCE_DEADLINE = "2026-09-01T00:30:00Z"
REVIEW_DEADLINE = "2026-09-01T01:00:00Z"


def j(value):
    return json.loads(value) if isinstance(value, str) else value


def create_round(contract, vm, alice, bob, charlie, round_id="round-1"):
    vm.sender = alice
    vm.value = 0
    vm.warp(NOW)
    contract.create_round(
        round_id,
        to_hex(bob),
        to_hex(charlie),
        "Three parties agree to classify exact obligations and net only when all are clear.",
        int(__import__("datetime").datetime.fromisoformat(FUNDING_DEADLINE.replace("Z", "+00:00")).timestamp()),
        int(__import__("datetime").datetime.fromisoformat(OBLIGATION_DEADLINE.replace("Z", "+00:00")).timestamp()),
        int(__import__("datetime").datetime.fromisoformat(ACCEPTANCE_DEADLINE.replace("Z", "+00:00")).timestamp()),
        int(__import__("datetime").datetime.fromisoformat(REVIEW_DEADLINE.replace("Z", "+00:00")).timestamp()),
    )
    return round_id


def fund(contract, vm, participant, digest, round_id="round-1"):
    vm.sender = participant
    vm.value = COLLATERAL
    contract.ratify_and_fund(round_id, digest)
    contract_address = vm._contract_address
    current_balance = vm._balances.get(bytes(contract_address), 0)
    vm.deal(contract_address, current_balance + COLLATERAL)
    vm.value = 0


def obligation_digest(round_id, obligation_id, debtor, creditor, amount, terms):
    import hashlib

    raw = round_id + "|" + obligation_id + "|" + to_hex(debtor) + "|" + to_hex(creditor) + "|" + str(amount) + "|" + terms
    return "sha256:" + hashlib.sha256(raw.encode("utf-8")).hexdigest()
