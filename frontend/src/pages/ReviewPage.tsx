import { ArrowLeft, ArrowRight, CheckCircle, Circle, Scales } from "@phosphor-icons/react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useContract } from "../adapters/contract";
import { shortenAddress } from "../components/AppLayout";
import { ErrorState, LoadingCards } from "../components/LoadState";
import { Notice, StageBadge, TransactionStatus } from "../components/Status";
import { useAsyncData } from "../hooks/useAsyncData";
import type { TransactionProgress } from "../types";
import { useWallet } from "../wallet/WalletContext";

export function ReviewPage() {
  const { roundId = "" } = useParams();
  const adapter = useContract();
  const { session, openPicker, ensureTargetChain } = useWallet();
  const { data: round, loading, error, reload } = useAsyncData(() => adapter.getRound(roundId, session?.account), [adapter, roundId, session?.account]);
  const [progress, setProgress] = useState<TransactionProgress | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  if (loading) return <section className="page page-wrap"><LoadingCards /></section>;
  if (error || !round) return <section className="page page-wrap"><ErrorState message={error ?? "This round could not be found."} retry={() => void reload()} /></section>;
  const readyChecks = [
    { label: "All three wallets ratified and funded 2 GEN", pass: round.participantStates.every((item) => item.joined) },
    { label: "Exactly three obligations were recorded", pass: round.obligations.length === 3 },
    { label: "Every named creditor confirmed the exact terms", pass: round.obligations.length === 3 && round.obligations.every((item) => item.accepted) },
    { label: "The round is still inside its review window", pass: Date.now() < round.deadlines.review * 1000 },
  ];
  const canReview = round.stage === "READY" && readyChecks.every((item) => item.pass);
  const terminal = ["SETTLED", "NOT_NETTABLE", "EXPIRED"].includes(round.stage);

  const review = async () => {
    if (!session) return openPicker();
    setActionError(null);
    try { await ensureTargetChain(); await adapter.reviewRound(roundId, session, setProgress); await reload(); }
    catch (reason) { const message = reason instanceof Error ? reason.message : "The review transaction did not complete."; setProgress({ phase: "FAILED", message }); setActionError(message); }
  };

  return <section className="page page-wrap"><Link className="back-link" to={`/rounds/${roundId}`}><ArrowLeft aria-hidden="true" /> Back to round {roundId}</Link><div className="page-heading with-action"><div><p className="eyebrow">Semantic eligibility</p><h1>Review and result</h1><p>Confirm the set is complete, then follow the transaction through network decision and finalization.</p></div><StageBadge stage={round.stage} /></div><div className="review-layout"><div><section className="content-card"><div className="card-heading"><div><p className="eyebrow">Before consensus</p><h2>Readiness</h2></div><Scales aria-hidden="true" /></div><div className="check-list">{readyChecks.map((item) => <div key={item.label}>{item.pass ? <CheckCircle className="pass" aria-label="Complete" /> : <Circle aria-label="Incomplete" />}<span>{item.label}</span></div>)}</div>{!terminal && <button className="button primary full" type="button" disabled={!canReview || Boolean(progress && ["AWAITING_WALLET", "SUBMITTED", "ACCEPTED"].includes(progress.phase))} onClick={() => void review()}>{session ? progress?.phase === "RETRYABLE" ? "Retry review" : "Request validator review" : "Connect wallet"}</button>} {!canReview && !terminal && <p className="field-help">Review remains disabled until every requirement is canonical and the review deadline has not passed.</p>} {actionError && <p className="form-error" role="alert">{actionError}</p>}<TransactionStatus progress={progress} /></section><Notice title="What validators decide">Validators classify the exact obligations as nettable, conflicting, or ambiguous under the exact charter. They do not choose amounts, participants, payout destinations, or prove service delivery.</Notice></div><div><section className="content-card result-card"><p className="eyebrow">Canonical consequence</p>{terminal ? <><h2>{round.stage === "SETTLED" ? "Net settlement complete" : round.stage === "NOT_NETTABLE" ? "Returned without setoff" : "Round closed and refunded"}</h2><p>{round.lastReviewMessage ?? "The final contract state controls the distribution below."}</p><div className="distribution-list">{round.participantStates.map((item) => <div key={item.address}><span>{shortenAddress(item.address)}</span><strong>{item.creditGen} GEN</strong></div>)}</div><div className="total-line"><span>Total final credit</span><strong>{round.participantStates.reduce((sum, item) => sum + item.creditGen, 0)} / 6 GEN</strong></div><Link className="button secondary full" to={`/rounds/${roundId}`}>Return to round <ArrowRight aria-hidden="true" /></Link></> : <><h2>No finalized result yet</h2><p>The interface will not show success at signature or submission. A distribution appears only after finalization and a fresh canonical read.</p><div className="empty-result"><Scales aria-hidden="true" size={46} /><span>Waiting for an eligible review</span></div></>}</section></div></div></section>;
}

