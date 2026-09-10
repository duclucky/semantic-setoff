import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createAccount, createClient } from "../frontend/node_modules/genlayer-js/dist/index.js";
import { studionet } from "../frontend/node_modules/genlayer-js/dist/chains/index.js";

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const endpoint = process.env.STUDIONET_RPC_URL || "https://studio.genlayer.com/api";
const deployment = JSON.parse(fs.readFileSync(path.join(project, "docs", "evidence", "studionet", "deployment.json"), "utf8"));
const contractAddress = deployment.contractAddress;
const roundId = process.argv[2] || "round-mtse8le6";
const GEN = 10n ** 18n;

function loadEnv() {
  for (const file of [path.join(project, ".env"), path.resolve(project, "..", ".env")]) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const index = line.indexOf("=");
      if (index <= 0 || line.trim().startsWith("#")) continue;
      const key = line.slice(0, index).trim();
      if (!process.env[key]) process.env[key] = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    }
  }
}

loadEnv();
const accounts = ["STUDIONET_PRIVATE_KEY", "STUDIONET_INTEGRATOR_PRIVATE_KEY", "STUDIONET_PARTICIPANT_C_PRIVATE_KEY"].map((name) => createAccount(process.env[name]));
const clients = accounts.map((account) => createClient({ chain: studionet, endpoint, account }));
const reader = createClient({ chain: studionet, endpoint });

async function read(functionName, args = []) {
  const value = await reader.readContract({ address: contractAddress, functionName, args, jsonSafeReturn: true });
  return typeof value === "string" ? JSON.parse(value) : value;
}

async function call(index, functionName, args, value = 0n) {
  const hash = await clients[index].writeContract({ address: contractAddress, functionName, args, value });
  const receipt = await clients[index].waitForTransactionReceipt({ hash, status: "FINALIZED", interval: 5000, retries: 120 });
  console.log(JSON.stringify({ method: functionName, hash, status: receipt.status_name ?? receipt.status ?? "", resultName: receipt.result_name ?? receipt.resultName ?? "" }));
  return hash;
}

const round = await read("get_round", [roundId]);
if (!round.exists) throw new Error(`round not found: ${roundId}`);
const digest = round.charter_digest;
const participants = await read("get_participants", [roundId]);
const rows = participants.participants || [];
for (const [index, account] of accounts.entries()) {
  const row = rows.find((item) => String(item.participant).toLowerCase() === account.address.toLowerCase());
  if (!row) continue;
  if (row.funded) continue;
  if (account.address.toLowerCase() === String(round.coordinator).toLowerCase()) continue;
  await call(index, "ratify_and_fund", [roundId, digest], 2n * GEN);
}
const after = await read("get_round", [roundId]);
console.log(JSON.stringify({ roundId, state: after.state, fundedCount: after.funded_count, totalFundedGEN: after.total_funded_gen, lockedFundsGEN: after.locked_funds_gen }));
