import json

import pytest
from gltest import get_contract_factory


@pytest.mark.integration
def test_contract_deploys_and_exposes_canonical_empty_view():
    factory = get_contract_factory("SemanticSetoff")
    contract = factory.deploy()
    result = contract.get_round(args=["missing-round"]).call()
    assert json.loads(result) == {"exists": False, "round_id": "missing-round"}
