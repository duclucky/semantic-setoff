import { createContext, useContext } from "react";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus, type TransactionHash } from "genlayer-js/types";
import type {
  ActivityItem,
  Address,
  DataSource,
  ObligationInput,
  OpenRoundInput,
  RoundSummary,
  SetoffRound,
  TransactionProgress,
} from "../types";
import type { WalletSession } from "../wallet/types";

export type ProgressListener = (progress: TransactionProgress) => void;

export interface ContractAdapter {
  readonly source: DataSource;
  readonly canRead: boolean;
  readonly canWrite: boolean;
  listRounds(address?: Address): Promise<RoundSummary[]>;
  getRound(roundId: string, address?: Address): Promise<SetoffRound | null>;
  getActivity(address: Address): Promise<ActivityItem[]>;
  openRound(input: OpenRoundInput, wallet: WalletSession, onProgress: ProgressListener): Promise<string>;
  joinRound(roundId: string, wallet: WalletSession, onProgress: ProgressListener): Promise<void>;
  recordObligation(input: ObligationInput, wallet: WalletSession, onProgress: ProgressListener): Promise<void>;
  acceptObligation(roundId: string, obligationId: string, wallet: WalletSession, onProgress: ProgressListener): Promise<void>;
  reviewRound(roundId: string, wallet: WalletSession, onProgress: ProgressListener): Promise<void>;
  expireRound(roundId: string, wallet: WalletSession, onProgress: ProgressListener): Promise<void>;
  withdrawCredit(roundId: string, wallet: WalletSession, onProgress: ProgressListener): Promise<void>;
}

export class AdapterUnavailableError extends Error {
  constructor() {
    super("Live contract writes are not configured yet. No transaction was sent.");
    this.name = "AdapterUnavailableError";
  }
}

export class UnavailableContractAdapter implements ContractAdapter {
  readonly source = "UNAVAILABLE" as const;
  readonly canRead = false;
  readonly canWrite = false;

  async listRounds(): Promise<RoundSummary[]> {
    return [];
  }

  async getRound(): Promise<SetoffRound | null> {
    return null;
  }

  async getActivity(): Promise<ActivityItem[]> {
    return [];
  }

  async openRound(): Promise<string> {
    throw new AdapterUnavailableError();
  }

  async joinRound(): Promise<void> {
    throw new AdapterUnavailableError();
  }

  async recordObligation(): Promise<void> {
    throw new AdapterUnavailableError();
  }

  async acceptObligation(): Promise<void> {
    throw new AdapterUnavailableError();
  }

  async reviewRound(): Promise<void> {
    throw new AdapterUnavailableError();
  }

  async expireRound(): Promise<void> {
    throw new AdapterUnavailableError();
  }

  async withdrawCredit(): Promise<void> {
    throw new AdapterUnavailableError();
  }
}

type JsonObject = Record<string, unknown>;

function jsonObject(value: unknown): JsonObject {
  if (typeof value === "string") {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object") return parsed as JsonObject;
  }
  if (value && typeof value === "object") return value as JsonObject;
  throw new Error("The contract returned an invalid JSON view.");
}

function text(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function numberValue(value: unknown): number {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

function addressValue(value: unknown): Address {
  return text(value) as Address;
}

const configuredAddress = (import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined)?.trim() ?? "";
const readEndpoint = (import.meta.env.VITE_GENLAYER_IC_RPC_URL as string | undefined)?.trim() || undefined;

function validContractAddress(value: string): value is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function stageValue(value: unknown): SetoffRound["stage"] {
  const stage = text(value);
  if (["OPEN", "FUNDED", "OBLIGATIONS_RECORDED", "READY", "SETTLED", "NOT_NETTABLE", "EXPIRED"].includes(stage)) {
    return stage as SetoffRound["stage"];
  }
  throw new Error(`Unknown contract round state: ${stage}`);
}

function deadlineMs(value: unknown): number {
  const seconds = numberValue(value);
  return seconds > 0 ? seconds * 1000 : 0;
}

export class LiveContractAdapter implements ContractAdapter {
  readonly source = "LIVE" as const;
  readonly canRead = validContractAddress(configuredAddress);
  readonly canWrite = this.canRead;
  private readonly address: Address;
  private readonly readClient = createClient({ chain: studionet, endpoint: readEndpoint });

  constructor() {
    if (!validContractAddress(configuredAddress)) {
      throw new Error("VITE_CONTRACT_ADDRESS must be a valid EVM address for the live adapter.");
    }
    this.address = configuredAddress;
  }

  private async read(functionName: string, args: unknown[] = []): Promise<JsonObject> {
    const value = await this.readClient.readContract({
      address: this.address,
      functionName,
      args: args as never[],
      jsonSafeReturn: true,
    });
    return jsonObject(value);
  }

  private writeClient(wallet: WalletSession) {
    return createClient({
      chain: studionet,
      account: wallet.account as `0x${string}`,
      provider: wallet.wallet.provider as never,
    });
  }

  private async transaction(
    functionName: string,
    args: unknown[],
    value: bigint,
    wallet: WalletSession,
    onProgress: ProgressListener,
  ): Promise<void> {
    onProgress({ phase: "AWAITING_WALLET", message: "Approve this GEN transaction in your selected wallet." });
    let hash: TransactionHash;
    try {
      hash = await this.writeClient(wallet).writeContract({
        address: this.address,
        functionName,
        args: args as never[],
        value,
      });
      onProgress({ phase: "SUBMITTED", hash, message: "Transaction submitted; waiting for the network decision." });
      await this.readClient.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED });
      onProgress({ phase: "ACCEPTED", hash, message: "Accepted and decided; waiting for finalization." });
      await this.readClient.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED });
      onProgress({ phase: "FINALIZED", hash, message: "Finalized. Reloading canonical contract state." });
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "The transaction did not finalize.";
      onProgress({ phase: "FAILED", message });
      throw reason;
    }
  }

  async listRounds(address?: Address): Promise<RoundSummary[]> {
    if (!address) return [];
    const result = await this.read("get_rounds_for", [address]);
    const ids = Array.isArray(result.round_ids) ? result.round_ids.map(text) : [];
    const rounds = await Promise.all(ids.map((id) => this.getRound(id, address)));
    return rounds.filter((round): round is SetoffRound => Boolean(round)).map(({ charter: _charter, charterDigest: _digest, deadlines: _deadlines, participantStates: _states, obligations: _obligations, lastReviewMessage: _message, settlementTotalGen: _total, ...summary }) => summary);
  }

  async getRound(roundId: string, address?: Address): Promise<SetoffRound | null> {
    const round = await this.read("get_round", [roundId]);
    if (round.exists !== true) return null;
    const participantView = await this.read("get_participants", [roundId]);
    const obligationView = await this.read("get_obligations", [roundId]);
    const participantRows = Array.isArray(participantView.participants) ? participantView.participants as JsonObject[] : [];
    const obligationRows = Array.isArray(obligationView.obligations) ? obligationView.obligations as JsonObject[] : [];
    const participants = participantRows.map((row) => addressValue(row.participant));
    const obligations = obligationRows.map((row) => ({
      id: text(row.obligation_id),
      debtor: addressValue(row.debtor),
      creditor: addressValue(row.creditor),
      amountGen: numberValue(row.amount_gen) as 1 | 2,
      terms: text(row.terms),
      accepted: row.accepted === true,
      verdict: text(row.classification) as "NETTABLE" | "CONFLICT" | "AMBIGUOUS" | undefined,
      discharged: row.discharged === true,
      digest: text(row.digest),
    }));
    const participantStates = participantRows.map((row) => ({
      address: addressValue(row.participant),
      joined: row.funded === true,
      obligationId: text(row.obligation_id) || undefined,
      incomingAccepted: obligations.filter((item) => item.creditor.toLowerCase() === addressValue(row.participant).toLowerCase()).every((item) => item.accepted),
      creditGen: numberValue(row.credit_gen),
    }));
    const deadlines = {
      funding: deadlineMs(round.funding_deadline),
      obligation: deadlineMs(round.obligation_deadline),
      acceptance: deadlineMs(round.acceptance_deadline),
      review: deadlineMs(round.review_deadline),
    };
    const now = Date.now();
    const stage = stageValue(round.state);
    const nextDeadline = stage === "OPEN" ? deadlines.funding : stage === "FUNDED" ? deadlines.obligation : stage === "OBLIGATIONS_RECORDED" ? deadlines.acceptance : stage === "READY" ? deadlines.review : null;
    return {
      id: text(round.round_id),
      stage,
      coordinator: addressValue(round.coordinator),
      participants,
      nextDeadline: nextDeadline && nextDeadline > now ? nextDeadline : nextDeadline,
      waitingOnConnectedUser: Boolean(address && participantStates.some((item) => item.address.toLowerCase() === address.toLowerCase())),
      availableCreditGen: numberValue(participantStates.find((item) => item.address.toLowerCase() === address?.toLowerCase())?.creditGen),
      charter: text(round.charter),
      charterDigest: text(round.charter_digest),
      deadlines,
      participantStates,
      obligations,
      lastReviewMessage: text(round.last_summary) || undefined,
      settlementTotalGen: numberValue(round.total_funded_gen),
    };
  }

  async getActivity(address: Address): Promise<ActivityItem[]> {
    const rounds = await this.listRounds(address);
    const items: ActivityItem[] = [];
    for (const summary of rounds) {
      const round = await this.getRound(summary.id, address);
      if (!round) continue;
      const mine = round.participantStates.find((item) => item.address.toLowerCase() === address.toLowerCase());
      if (!mine) continue;
      if (!mine.joined && round.stage === "OPEN") items.push({ id: `${round.id}:join`, roundId: round.id, kind: "ACTION_REQUIRED", title: "Ratify and fund this round", description: "Your exact 2 GEN collateral is still required.", timestamp: Date.now() });
      else if (!mine.obligationId && ["FUNDED", "OBLIGATIONS_RECORDED"].includes(round.stage)) items.push({ id: `${round.id}:obligation`, roundId: round.id, kind: "ACTION_REQUIRED", title: "Record your obligation", description: "Add one outgoing 1 or 2 GEN obligation.", timestamp: Date.now() });
      else if (round.obligations.some((item) => item.creditor.toLowerCase() === address.toLowerCase() && !item.accepted)) items.push({ id: `${round.id}:accept`, roundId: round.id, kind: "ACTION_REQUIRED", title: "Accept an incoming obligation", description: "Confirm the exact stored terms before the deadline.", timestamp: Date.now() });
      else if (round.stage === "READY") items.push({ id: `${round.id}:review`, roundId: round.id, kind: "ACTION_REQUIRED", title: "Request semantic review", description: "All three edges are ready for validator consensus.", timestamp: Date.now() });
      if (mine.creditGen > 0) items.push({ id: `${round.id}:credit`, roundId: round.id, kind: "CREDIT", title: `${mine.creditGen} GEN available`, description: "Withdraw the finalized canonical credit.", timestamp: Date.now() });
      if (["SETTLED", "NOT_NETTABLE", "EXPIRED"].includes(round.stage)) items.push({ id: `${round.id}:result`, roundId: round.id, kind: "RESULT", title: round.stage === "SETTLED" ? "Net settlement finalized" : "Round closed without setoff", description: "The contract has a terminal canonical result.", timestamp: Date.now() });
    }
    return items;
  }

  async openRound(input: OpenRoundInput, wallet: WalletSession, onProgress: ProgressListener): Promise<string> {
    const roundId = this.roundIdFromInput(input);
    const seconds = (value: number) => BigInt(value > 10_000_000_000 ? Math.floor(value / 1000) : Math.floor(value));
    const args = [input.participantB, input.participantC, input.charter, seconds(input.deadlines.funding), seconds(input.deadlines.obligation), seconds(input.deadlines.acceptance), seconds(input.deadlines.review)];
    await this.transaction("create_round", [roundId, ...args], 0n, wallet, onProgress);
    return roundId;
  }

  private roundIdFromInput(input: OpenRoundInput): string {
    const value = input.roundId;
    if (!value) throw new Error("A round ID is required before opening a round.");
    return value;
  }

  async joinRound(roundId: string, wallet: WalletSession, onProgress: ProgressListener): Promise<void> {
    const round = await this.getRound(roundId, wallet.account);
    if (!round) throw new Error("Round not found before funding.");
    await this.transaction("ratify_and_fund", [roundId, round.charterDigest], 2n * 10n ** 18n, wallet, onProgress);
  }

  async recordObligation(input: ObligationInput, wallet: WalletSession, onProgress: ProgressListener): Promise<void> {
    await this.transaction("record_obligation", [input.roundId, input.creditor, BigInt(input.amountGen), input.terms], 0n, wallet, onProgress);
  }

  async acceptObligation(roundId: string, obligationId: string, wallet: WalletSession, onProgress: ProgressListener): Promise<void> {
    const round = await this.getRound(roundId, wallet.account);
    const obligation = round?.obligations.find((item) => item.id === obligationId);
    if (!obligation?.digest) throw new Error("The canonical obligation digest was not available.");
    await this.transaction("accept_obligation", [roundId, obligation.debtor, obligation.digest], 0n, wallet, onProgress);
  }

  async reviewRound(roundId: string, wallet: WalletSession, onProgress: ProgressListener): Promise<void> {
    await this.transaction("review_round", [roundId], 0n, wallet, onProgress);
    const round = await this.getRound(roundId, wallet.account);
    if (round?.stage === "READY") {
      onProgress({ phase: "RETRYABLE", message: "The finalized review was ambiguous; no GEN moved. You can retry before the deadline." });
    }
  }

  async expireRound(roundId: string, wallet: WalletSession, onProgress: ProgressListener): Promise<void> {
    await this.transaction("expire_round", [roundId], 0n, wallet, onProgress);
  }

  async withdrawCredit(roundId: string, wallet: WalletSession, onProgress: ProgressListener): Promise<void> {
    await this.transaction("withdraw_credit", [roundId], 0n, wallet, onProgress);
  }
}

export const ContractContext = createContext<ContractAdapter>(new UnavailableContractAdapter());

export function useContract(): ContractAdapter {
  return useContext(ContractContext);
}
