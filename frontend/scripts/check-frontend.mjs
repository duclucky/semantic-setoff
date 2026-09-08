import assert from "node:assert/strict";
import fs from "node:fs";

const adapter = fs.readFileSync("src/adapters/contract.ts", "utf8");
const wallet = fs.readFileSync("src/wallet/discovery.ts", "utf8");
const context = fs.readFileSync("src/wallet/WalletContext.tsx", "utf8");
const vite = fs.readFileSync("vite.config.ts", "utf8");

for (const method of ["listRounds", "getRound", "getActivity", "openRound", "joinRound", "recordObligation", "acceptObligation", "reviewRound", "expireRound", "withdrawCredit"]) {
  assert.match(adapter, new RegExp(`async ${method}\\(`), `adapter wrapper missing ${method}`);
}
assert.match(adapter, /createClient\(\{\s*chain: studionet,\s*account: wallet\.account/);
assert.match(adapter, /TransactionStatus\.ACCEPTED/);
assert.match(adapter, /TransactionStatus\.FINALIZED/);
assert.match(adapter, /phase: "FAILED"/);
assert.match(adapter, /if \(hash\)[\s\S]*status: TransactionStatus\.FINALIZED/);
assert.match(adapter, /phase: "AWAITING_WALLET"/);
assert.match(adapter, /phase: "RETRYABLE"/);
assert.match(wallet, /eip6963:requestProvider/);
assert.match(wallet, /window\.ethereum\?\.providers/);
assert.match(context, /wallet_switchEthereumChain/);
assert.match(context, /wallet_addEthereumChain/);
assert.match(context, /setSession\(null\)/);
assert.match(vite, /"\/genlayer-rpc"/);
assert.doesNotMatch(adapter + wallet + context, /privateKey|seedPhrase|mnemonic/i);
assert.doesNotMatch(adapter + wallet + context, /localStorage|sessionStorage/);
console.log("FRONTEND_ADAPTER_TEST_OK");
