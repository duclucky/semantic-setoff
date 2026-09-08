export type Address = `0x${string}`;

export type RoundStage =
  | "OPEN"
  | "FUNDED"
  | "OBLIGATIONS_RECORDED"
  | "READY"
  | "SETTLED"
  | "NOT_NETTABLE"
  | "EXPIRED";

export type VerdictClass = "NETTABLE" | "CONFLICT" | "AMBIGUOUS";

export type TransactionPhase =
  | "IDLE"
  | "AWAITING_WALLET"
  | "SUBMITTED"
  | "ACCEPTED"
  | "FINALIZED"
  | "FAILED"
  | "RETRYABLE";

export interface TransactionProgress {
  phase: TransactionPhase;
  hash?: string;
  message: string;
}

export interface ParticipantState {
  address: Address;
  joined: boolean;
  obligationId?: string;
  incomingAccepted: boolean;
  creditGen: number;
}

export interface Obligation {
  id: string;
  debtor: Address;
  creditor: Address;
  amountGen: 1 | 2;
  terms: string;
  accepted: boolean;
  verdict?: VerdictClass;
  discharged: boolean;
  digest?: string;
}

export interface RoundDeadlines {
  funding: number;
  obligation: number;
  acceptance: number;
  review: number;
}

export interface RoundSummary {
  id: string;
  stage: RoundStage;
  coordinator: Address;
  participants: Address[];
  nextDeadline: number | null;
  waitingOnConnectedUser: boolean;
  availableCreditGen: number;
}

export interface SetoffRound extends RoundSummary {
  charter: string;
  charterDigest: string;
  deadlines: RoundDeadlines;
  participantStates: ParticipantState[];
  obligations: Obligation[];
  lastReviewMessage?: string;
  settlementTotalGen: number;
}

export interface ActivityItem {
  id: string;
  roundId: string;
  kind: "ACTION_REQUIRED" | "TRANSACTION" | "CREDIT" | "RESULT";
  title: string;
  description: string;
  timestamp: number;
}

export interface OpenRoundInput {
  roundId?: string;
  participantB: Address;
  participantC: Address;
  charter: string;
  deadlines: RoundDeadlines;
}

export interface ObligationInput {
  roundId: string;
  creditor: Address;
  amountGen: 1 | 2;
  terms: string;
}

export type DataSource = "LIVE" | "UNAVAILABLE" | "DESIGN_FIXTURE";
