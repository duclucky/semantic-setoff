import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const blockers = [];
const deployment = resolve(root, "docs/evidence/studionet/deployment.json");
const lifecycle = resolve(root, "docs/evidence/studionet/lifecycle.json");

if (!existsSync(deployment)) blockers.push("missing finalized Studionet deployment evidence");
if (!existsSync(lifecycle)) blockers.push("missing consequential Studionet lifecycle evidence");
if (!existsSync(resolve(root, "frontend/.env"))) blockers.push("frontend has no verified deployed contract configuration");
const gitConfig = resolve(root, ".git", "config");
if (!existsSync(gitConfig) || !/\[remote\s+"/.test(readFileSync(gitConfig, "utf8"))) blockers.push("no public GitHub remote/CI evidence");
if (!existsSync(resolve(root, "docs/evidence/public/repository.txt"))) blockers.push("missing public repository hygiene evidence");
if (!existsSync(resolve(root, "docs/evidence/public/ci.txt"))) blockers.push("missing current-commit CI evidence");
if (!existsSync(resolve(root, "docs/evidence/live/app.txt"))) blockers.push("missing production live-app verification");

let actorBlocker = false;
try {
  const envText = [resolve(root, ".env"), resolve(root, "..", ".env")]
    .filter((file) => existsSync(file))
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
  actorBlocker = !/^STUDIONET_PARTICIPANT_C_PRIVATE_KEY\s*=\s*\S+/m.test(envText);
} catch {
  actorBlocker = true;
}
if (actorBlocker) blockers.push("third authorized Studionet actor is required");

console.log("Project semantic-setoff -Category projects");
console.log(blockers.length ? `${blockers.length} BLOCKER` : "NO BLOCKER");
for (const blocker of blockers) console.log(`BLOCKER: ${blocker}`);
process.exitCode = blockers.length ? 1 : 0;
