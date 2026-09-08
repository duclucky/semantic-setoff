import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const spec = readFileSync(resolve(here, "../docs/README.md"), "utf8");

const requiredHeadings = [
  "Identity", "One-sentence product hook", "Trust problem", "Fingerprint",
  "Mandatory gate matrix", "Actors, roles and incentives", "Scope and non-goals",
  "Product/frontend blueprint", "State model", "Write-method safety matrix",
  "Frontend lifecycle coverage matrix", "Evidence policy", "Consensus design",
  "Consequence and accounting", "Reusable interface", "Threat model", "Test plan",
  "Claim-to-code matrix", "Analogue and differentiation matrix",
  "Deployment and evidence plan", "Definition of Done", "Honest limitations", "Kill criteria",
];

const gates = [
  "Replacement", "Judgment", "Evidence availability", "Evidence authenticity",
  "Equivalence", "Consequence", "Adversarial", "State model", "Reuse",
  "Contract count", "Differentiation", "Claim-to-code", "Full lifecycle", "Scope honesty",
];

const writes = [
  "create_round", "ratify_and_fund", "record_obligation", "accept_obligation",
  "review_round", "expire_round", "withdraw_credit",
];

const failures = [];
for (const heading of requiredHeadings) {
  if (!spec.includes(`## ${heading}`)) failures.push(`missing heading: ${heading}`);
}
for (const gate of gates) {
  const line = spec.split(/\r?\n/).find((item) => item.startsWith(`| ${gate} |`));
  if (!line || !line.includes("`PASS`")) failures.push(`gate is not PASS: ${gate}`);
}
for (const write of writes) {
  const safetyLine = spec.split(/\r?\n/).find((item) => item.startsWith(`| \`${write}\` |`));
  if (!safetyLine || safetyLine.split("|").length < 11) failures.push(`incomplete safety row: ${write}`);
}
if (/Phase 4 pending|\bTBD\b|\bTODO\b|<fill|<pending/i.test(spec)) failures.push("placeholder remains");
if ((spec.match(/^\| (Exact charter governs|Debtor acknowledges|Creditor accepts exact obligation|Complete semantic classification)/gm) ?? []).length !== 4) failures.push("Evidence Authority Matrix must have 4 data rows");
if ((spec.match(/^\| (Source coverage|Expected IDs|Classes|Root derivation|Downstream classes|Consequence derivation|Net arithmetic|Destinations) \|/gm) ?? []).length !== 8) failures.push("settlement invariant matrix must have 8 rows");
if ((spec.match(/^\| .+ \| `PASS` \|/gm) ?? []).length !== 14) failures.push("gate row count must be 14");

if (failures.length) {
  console.error(`SPEC_AUDIT_FAILED (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("SPEC_AUDIT_OK");
console.log(`required_headings=${requiredHeadings.length}`);
console.log(`gate_rows=${gates.length}`);
console.log(`write_safety_rows=${writes.length}`);
console.log("evidence_authority_rows=4");
console.log("settlement_invariant_rows=8");
