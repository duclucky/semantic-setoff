import { ArrowRight, CheckCircle, Clock, FileText, HandCoins, UsersThree } from "@phosphor-icons/react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useContract } from "../adapters/contract";
import { shortenAddress } from "../components/AppLayout";
import { EmptyState, ErrorState, LoadingCards } from "../components/LoadState";
import { Notice, StageBadge, TransactionStatus } from "../components/Status";
import { useAsyncData } from "../hooks/useAsyncData";
import type { TransactionProgress } from "../types";
import { useWallet } from "../wallet/WalletContext";

function formatDeadline(timestampMs: number) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(timestampMs));
}

export function RoundDetailPage() {
  const { roundId = "" } = useParams();
  const adapter = useContract();
  const { session, openPicker, ensureTargetChain } = useWallet();
  const { data: round, loading, error, reload } = useAsyncData(() => adapter.getRound(roundId, session?.account), [adapter, roundId, session?.account]);
  const [progress, setProgress] = useState<TransactionProgress | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const participant = round?.participantStates.find((state) => state.address.toLowerCase() === session?.account.toLowerCase());
  const incoming = round?.obligations.find((item) => item.creditor.toLowerCase() === session?.account.toLowerCase() && !item.accepted);
  const isTerminal = round ? ["SETTLED", "NOT_NETTABLE", "EXPIRED"].includes(round.stage) : false;

  const run = async (action: "join" | "accept" | "expire" | "withdraw", obligationId?: string) => {
    if (!session) return openPicker();
    setActionError(null);
    try {
      await ensureTargetChain();
      if (action === "join") await adapter.joinRound(roundId, session, setProgress);
      if (action === "accept" && obligationId) await adapter.acceptObligation(roundId, obligationId, session, setProgress);
      if (action === "expire") await adapter.expireRound(roundId, session, setProgress);
      if (action === "withdraw") await adapter.withdrawCredit(roundId, session, setProgress);
      await reload();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "The transaction did not complete.";
      setProgress({ phase: "FAILED", message });
      setActionError(message);
    }
  };

  if (loading) return <section className="page page-wrap"><LoadingCards label="Loading round" /></section>;
  if (error) return <section className="page page-wrap"><ErrorState message={error} retry={() => void reload()} /></section>;
  if (!round) return <section className="page page-wrap"><EmptyState title="Round not found" body={adapter.canRead ? "Check the ID and network, then try again." : "The live contract read path is not configured, so this ID cannot be verified."} action={<Link className="button secondary" to="/rounds">Return to rounds</Link>} /></section>;

  return (
    <section className="page page-wrap">
      <div className="page-heading with-action"><div><p className="eyebrow">Round {round.id}</p><h1>Setoff workspace</h1><p>See the shared commitments, the one action available to your wallet, and the finalized consequence.</p></div><StageBadge stage={round.stage} /></div>
      <div className="workspace-grid">
        <div className="workspace-main">
          <article className="summary-card prominent">
            <div className="summary-icon"><UsersThree aria-hidden="true" /></div>
            <div><p className="eyebrow">Shared funding</p><h2>{round.participantStates.filter((item) => item.joined).length} of 3 participants joined</h2><p>Each joined wallet has locked exactly 2 GEN. The round accounts for {round.settlementTotalGen || round.participantStates.filter((item) => item.joined).length * 2} GEN.</p></div>
          </article>
          <section className="content-card"><div className="card-heading"><div><p className="eyebrow">What everyone ratified</p><h2>Setoff charter</h2></div><FileText aria-hidden="true" /></div><p className="charter-text">{round.charter}</p><details><summary>Verification details</summary><code className="break-token">{round.charterDigest}</code></details></section>
          <section className="content-card"><div className="card-heading"><div><p className="eyebrow">Acknowledged payment edges</p><h2>Obligations</h2></div><HandCoins aria-hidden="true" /></div><div className="obligation-list">{round.obligations.length === 0 ? <p className="muted">No participant has recorded an obligation yet.</p> : round.obligations.map((item) => <article key={item.id}><div className="obligation-route"><strong>{shortenAddress(item.debtor)}</strong><span>{item.amountGen} GEN</span><ArrowRight aria-hidden="true" /><strong>{shortenAddress(item.creditor)}</strong></div><p>{item.terms}</p><div className="inline-meta"><span>{item.accepted ? "Creditor confirmed" : "Awaiting creditor"}</span>{item.discharged && <span><CheckCircle aria-hidden="true" /> Discharged</span>}</div></article>)}</div></section>
          {isTerminal && <section className="content-card"><div className="card-heading"><div><p className="eyebrow">Final distribution</p><h2>{round.stage === "SETTLED" ? "Net credits" : "Collateral refunds"}</h2></div><CheckCircle aria-hidden="true" /></div><div className="distribution-list">{round.participantStates.map((item) => <div key={item.address}><span>{shortenAddress(item.address)}</span><strong>{item.creditGen} GEN</strong></div>)}</div><p className="accounting-proof">Total credit: <strong>{round.participantStates.reduce((sum, item) => sum + item.creditGen, 0)} GEN</strong> of 6 GEN funded.</p></section>}
        </div>
        <aside className="workspace-aside">
          <section className="action-card"><p className="eyebrow">Your next step</p>{!session ? <><h2>Connect the listed wallet</h2><p>Actions appear only after the selected account matches a participant.</p><button className="button primary full" type="button" onClick={openPicker}>Choose wallet</button></> : !participant ? <><h2>Read-only for this wallet</h2><p>{shortenAddress(session.account)} is not one of the three participants.</p></> : !participant.joined && round.stage === "OPEN" ? <><h2>Ratify and lock 2 GEN</h2><p>Approve the exact charter and fund your fixed collateral before the funding deadline.</p><button className="button primary full" type="button" onClick={() => void run("join")}>Join with 2 GEN</button></> : participant.joined && !participant.obligationId && ["FUNDED", "OBLIGATIONS_RECORDED"].includes(round.stage) ? <><h2>Record your outgoing obligation</h2><p>Choose one other participant and acknowledge 1 or 2 GEN.</p><Link className="button primary full" to={`/rounds/${round.id}/obligations/new`}>Record obligation</Link></> : incoming ? <><h2>Confirm incoming terms</h2><p>Only your wallet can confirm the exact obligation from {shortenAddress(incoming.debtor)}.</p><button className="button primary full" type="button" onClick={() => void run("accept", incoming.id)}>Accept {incoming.amountGen} GEN obligation</button></> : round.stage === "READY" ? <><h2>Ready for semantic review</h2><p>All three edges are confirmed. Review readiness before requesting validator consensus.</p><Link className="button primary full" to={`/rounds/${round.id}/review`}>Review the set</Link></> : isTerminal && (participant.creditGen > 0) ? <><h2>{participant.creditGen} GEN available</h2><p>This credit comes from the finalized settlement or refund path.</p><button className="button primary full" type="button" onClick={() => void run("withdraw")}>Withdraw {participant.creditGen} GEN</button></> : <><h2>No action waiting</h2><p>Another participant or network finality must complete the next step.</p></>}
            {round.nextDeadline && <div className="deadline-line"><Clock aria-hidden="true" /><span>Next deadline<strong>{formatDeadline(round.nextDeadline)}</strong></span></div>}
            {!isTerminal && round.nextDeadline && Date.now() >= round.nextDeadline && participant && <button className="button secondary full" type="button" onClick={() => void run("expire")}>Close and create refunds</button>}
            {actionError && <p className="form-error" role="alert">{actionError}</p>}<TransactionStatus progress={progress} />
          </section>
          <section className="content-card compact"><h2>Participants</h2>{round.participantStates.map((item, index) => <div className="participant-row" key={item.address}><span><b>{String.fromCharCode(65 + index)}</b>{shortenAddress(item.address)}</span><span>{item.joined ? "2 GEN locked" : "Not joined"}</span></div>)}</section>
          <Notice title="Contract-owned consequence">This page does not claim that any external service was delivered. It reports only this contract’s obligations, status and GEN credits.</Notice>
        </aside>
      </div>
    </section>
  );
}
