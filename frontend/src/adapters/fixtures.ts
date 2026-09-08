import type { ContractAdapter, ProgressListener } from "./contract";
import { AdapterUnavailableError } from "./contract";
import type {
  ActivityItem,
  Address,
  ObligationInput,
  OpenRoundInput,
  RoundSummary,
  SetoffRound,
} from "../types";
import type { WalletSession } from "../wallet/types";

const ALICE = "0x1111111111111111111111111111111111111111" as Address;
const BLAIR = "0x2222222222222222222222222222222222222222" as Address;
const CASEY = "0x3333333333333333333333333333333333333333" as Address;
const now = Date.now();

const sampleRound: SetoffRound = {
  id: "42",
  stage: "SETTLED",
  coordinator: ALICE,
  participants: [ALICE, BLAIR, CASEY],
  nextDeadline: null,
  waitingOnConnectedUser: false,
  availableCreditGen: 3,
  charter:
    "Payment obligations may be set off only when all are due under the same agent-service framework, payable in GEN, and contain no anti-setoff exception.",
  charterDigest: "0x7c0a-design-preview-only",
  deadlines: {
    funding: now - 345_600_000,
    obligation: now - 259_200_000,
    acceptance: now - 172_800_000,
    review: now - 86_400_000,
  },
  participantStates: [
    { address: ALICE, joined: true, obligationId: "A-01", incomingAccepted: true, creditGen: 1 },
    { address: BLAIR, joined: true, obligationId: "B-01", incomingAccepted: true, creditGen: 3 },
    { address: CASEY, joined: true, obligationId: "C-01", incomingAccepted: true, creditGen: 2 },
  ],
  obligations: [
    {
      id: "A-01",
      debtor: ALICE,
      creditor: BLAIR,
      amountGen: 2,
      terms: "Due at round close for accepted agent research services under Framework S-4; reciprocal circular setoff is allowed.",
      accepted: true,
      verdict: "NETTABLE",
      discharged: true,
    },
    {
      id: "B-01",
      debtor: BLAIR,
      creditor: CASEY,
      amountGen: 1,
      terms: "Due at the same close for agent verification services under Framework S-4; setoff with reciprocal framework debts is allowed.",
      accepted: true,
      verdict: "NETTABLE",
      discharged: true,
    },
    {
      id: "C-01",
      debtor: CASEY,
      creditor: ALICE,
      amountGen: 1,
      terms: "Due at the same close for agent routing services under Framework S-4 and eligible for circular payment setoff.",
      accepted: true,
      verdict: "NETTABLE",
      discharged: true,
    },
  ],
  lastReviewMessage: "All three co-ratified obligations fit the charter. Contract arithmetic produced net positions of -1, +1 and 0 GEN.",
  settlementTotalGen: 6,
};

export class ReadOnlyFixtureAdapter implements ContractAdapter {
  readonly source = "DESIGN_FIXTURE" as const;
  readonly canRead = true;
  readonly canWrite = false;

  async listRounds(): Promise<RoundSummary[]> {
    const { charter: _charter, charterDigest: _digest, deadlines: _deadlines, participantStates: _states, obligations: _obligations, lastReviewMessage: _message, settlementTotalGen: _total, ...summary } = sampleRound;
    return [summary];
  }

  async getRound(roundId: string): Promise<SetoffRound | null> {
    return roundId === sampleRound.id ? sampleRound : null;
  }

  async getActivity(address: Address): Promise<ActivityItem[]> {
    return [
      {
        id: "fixture-credit",
        roundId: "42",
        kind: "CREDIT",
        title: "3 GEN available in the design example",
        description: `Shown for ${address.slice(0, 8)}... as non-live interface data.`,
        timestamp: now - 60_000,
      },
      {
        id: "fixture-result",
        roundId: "42",
        kind: "RESULT",
        title: "Example net settlement complete",
        description: "The example distribution totals 6 GEN.",
        timestamp: now - 120_000,
      },
    ];
  }

  async openRound(_input: OpenRoundInput, _wallet: WalletSession, _onProgress: ProgressListener): Promise<string> {
    throw new AdapterUnavailableError();
  }

  async joinRound(): Promise<void> {
    throw new AdapterUnavailableError();
  }

  async recordObligation(_input: ObligationInput): Promise<void> {
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

