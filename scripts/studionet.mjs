import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(PROJECT, "contracts", "semantic_setoff.py");
const EVIDENCE_DIR = path.join(PROJECT, "docs", "evidence", "studionet");
const DEPLOYMENT_PATH = path.join(EVIDENCE_DIR, "deployment.json");
const LIFECYCLE_PATH = path.join(EVIDENCE_DIR, "lifecycle.json");
const CHAIN_ID = 61999;
const GEN = 10n ** 18n;
const ACTOR_KEYS = ["STUDIONET_PRIVATE_KEY", "STUDIONET_INTEGRATOR_PRIVATE_KEY", "STUDIONET_PARTICIPANT_C_PRIVATE_KEY"];

function parseEnv(text) {
  const result = {};
  for (const line of String(text).split(/\r?\n/)) {
    const index = line.indexOf("=");
    if (index <= 0 || line.trim().startsWith("#")) continue;
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    result[line.slice(0, index).trim()] = value;
  }
  return result;
}

function loadEnv() {
  const merged = {};
  for (const file of [path.join(PROJECT, ".env"), path.resolve(PROJECT, "..", ".env")]) {
    if (!fs.existsSync(file)) continue;
    Object.assign(merged, parseEnv(fs.readFileSync(file, "utf8")));
  }
  for (const [key, value] of Object.entries(merged)) if (value && !process.env[key]) process.env[key] = value;
}

function keyFor(name) {
  const value = process.env[name]?.trim() ?? "";
  if (!value) throw new Error(`missing ${name}`);
  if (!/^(0x)?[0-9a-fA-F]{64}$/.test(value)) throw new Error(`${name} is not a 32-byte hex key`);
  return value.startsWith("0x") ? value : `0x${value}`;
}

function sourceCommit() {
  return execSync("git rev-parse HEAD", { cwd: PROJECT, encoding: "utf8" }).trim();
}

function sourceHash() {
  return crypto.createHash("sha256").update(fs.readFileSync(CONTRACT_PATH)).digest("hex");
}

function safe(value) {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(safe);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, safe(v)]));
  return value;
}

function writeEvidence(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(safe(value), null, 2)}\n`, "utf8");
}

function extractAddress(receipt) {
  const values = [receipt?.contractAddress, receipt?.result?.contractAddress, receipt?.deployment?.contractAddress, receipt?.txDataDecoded?.contractAddress, receipt?.tx_data_decoded?.contract_address, receipt?.execution_result?.return_data?.contractAddress, receipt?.consensus_data?.leader_receipt?.[0]?.execution_result?.contract_address].filter(Boolean);
  if (!values.length) throw new Error("contract address not found in sanitized receipt fields");
  return String(values[0]);
}

function summarizeReceipt(hash, receipt) {
  const execution = receipt?.execution_result ?? receipt?.executionResult ?? receipt?.consensus_data?.leader_receipt?.[0]?.execution_result ?? {};
  return {
    transactionHash: hash,
    status: receipt?.networkStatus ?? receipt?.status ?? receipt?.statusName ?? "",
    resultName: receipt?.result_name ?? receipt?.resultName ?? receipt?.txResultName ?? "",
    executionResult: execution?.result ?? execution?.status ?? "UNKNOWN",
    executionError: execution?.error ?? execution?.message ?? "",
  };
}

function assertExecutionSuccess(receipt) {
  const summary = summarizeReceipt("", receipt);
  if (!["SUCCESS", "FINISHED_WITH_RETURN"].includes(String(summary.executionResult).toUpperCase())) throw new Error(`execution failed: ${summary.executionResult} ${summary.executionError}`);
  return summary;
}

async function waitFinal(client, hash) {
  const receipt = await client.waitForTransactionReceipt({ hash, status: "FINALIZED", interval: 5000, retries: 120, fullTransaction: true });
  assertExecutionSuccess(receipt);
  return receipt;
}

async function makeClients() {
  const { createAccount, createClient } = await import("genlayer-js");
  const { studionet } = await import("genlayer-js/chains");
  const accounts = ACTOR_KEYS.map((name) => createAccount(keyFor(name)));
  const endpoint = process.env.STUDIONET_RPC_URL || studionet.rpcUrls.default.http[0];
  const clients = accounts.map((account) => createClient({ chain: studionet, endpoint, account }));
  const reader = createClient({ chain: studionet, endpoint });
  const chainHex = await reader.request({ method: "eth_chainId", params: [] });
  if (Number.parseInt(String(chainHex), 16) !== CHAIN_ID) throw new Error(`wrong chain id ${chainHex}`);
  return { accounts, clients, reader };
}

async function preflight() {
  loadEnv();
  const missing = ACTOR_KEYS.filter((name) => !(process.env[name] ?? "").trim());
  if (missing.length) {
    console.log(`ACTOR_AUTH_REQUIRED missing=${missing.join(",")}`);
    process.exitCode = 2;
    return;
  }
  const { accounts } = await makeClients();
  const addresses = accounts.map((account) => account.address);
  if (new Set(addresses.map((address) => address.toLowerCase())).size !== 3) throw new Error("three actor keys must resolve to distinct addresses");
  console.log(`ACTORS_READY count=${addresses.length}`);
  console.log(`ACTOR_ADDRESSES=${addresses.join(",")}`);
}

async function deploy() {
  loadEnv();
  const missing = ACTOR_KEYS.filter((name) => !(process.env[name] ?? "").trim());
  if (missing.length) throw new Error(`ACTOR_AUTH_REQUIRED missing=${missing.join(",")}`);
  if (execSync("git status --short -- contracts scripts tests frontend package.json package-lock.json docs", { cwd: PROJECT, encoding: "utf8" }).trim()) throw new Error("commit local changes before Studionet deployment");
  const { clients } = await makeClients();
  const code = fs.readFileSync(CONTRACT_PATH, "utf8");
  const hash = await clients[0].deployContract({ code, args: [] });
  const receipt = await waitFinal(clients[0], hash);
  const address = extractAddress(receipt);
  const deployment = { network: "studionet", chainId: CHAIN_ID, contractAddress: address, explorerUrl: `https://explorer-studio.genlayer.com/address/${address}`, sourceCommit: sourceCommit(), sourceSha256: sourceHash(), deploy: summarizeReceipt(hash, receipt), evidenceIsSanitized: true };
  writeEvidence(DEPLOYMENT_PATH, deployment);
  console.log(`STUDIONET_DEPLOYED contract=${address}`);
  console.log(`EXPLORER_URL=${deployment.explorerUrl}`);
}

async function lifecycle() {
  loadEnv();
  if (!fs.existsSync(DEPLOYMENT_PATH)) throw new Error("deployment.json missing; deploy first");
  const deployment = JSON.parse(fs.readFileSync(DEPLOYMENT_PATH, "utf8"));
  if (!deployment.contractAddress) throw new Error("deployment address missing");
  const { accounts, clients, reader } = await makeClients();
  const roundId = `setoff-${sourceCommit().slice(0, 8)}`;
  const now = Math.floor(Date.now() / 1000);
  const deadlines = [now + 600, now + 1200, now + 1800, now + 3600];
  const transactions = {};
  const call = async (index, functionName, args, value = 0n) => {
    const hash = await clients[index].writeContract({ address: deployment.contractAddress, functionName, args, value });
    transactions[functionName + (Object.keys(transactions).length ? `_${Object.keys(transactions).length}` : "")] = { transactionHash: hash, status: "SUBMITTED" };
    const receipt = await waitFinal(clients[index], hash);
    transactions[functionName + (Object.keys(transactions).length ? `_${Object.keys(transactions).length - 1}` : "")] = summarizeReceipt(hash, receipt);
    writeEvidence(LIFECYCLE_PATH, { network: "studionet", contractAddress: deployment.contractAddress, roundId, transactions, evidenceIsSanitized: true });
  };
  await call(0, "create_round", [roundId, accounts[1].address, accounts[2].address, "All three named obligations are same-framework GEN debts and may be netted only after exact creditor acceptance.", ...deadlines.map(BigInt)]);
  const charter = await reader.readContract({ address: deployment.contractAddress, functionName: "get_round", args: [roundId], jsonSafeReturn: true });
  const charterDigest = typeof charter === "string" ? JSON.parse(charter).charter_digest : charter.charter_digest;
  for (let index = 0; index < 3; index += 1) await call(index, "ratify_and_fund", [roundId, charterDigest], 2n * GEN);
  console.log("LIFECYCLE_PENDING_REVIEW round=" + roundId);
}

loadEnv();
const command = process.argv[2] || "preflight";
if (command === "preflight") await preflight();
else if (command === "deploy") await deploy();
else if (command === "lifecycle") await lifecycle();
else throw new Error(`unknown command ${command}`);
