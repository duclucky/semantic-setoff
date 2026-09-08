import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useContract } from "../adapters/contract";
import { shortenAddress } from "../components/AppLayout";
import { ErrorState, LoadingCards } from "../components/LoadState";
import { Notice, TransactionStatus } from "../components/Status";
import { useAsyncData } from "../hooks/useAsyncData";
import type { Address, TransactionProgress } from "../types";
import { useWallet } from "../wallet/WalletContext";

export function NewObligationPage() {
  const { roundId = "" } = useParams();
  const adapter = useContract();
  const { session, openPicker, ensureTargetChain } = useWallet();
  const navigate = useNavigate();
  const { data: round, loading, error, reload } = useAsyncData(() => adapter.getRound(roundId, session?.account), [adapter, roundId, session?.account]);
  const [creditor, setCreditor] = useState("");
  const [amount, setAmount] = useState<1 | 2>(1);
  const [terms, setTerms] = useState("");
  const [progress, setProgress] = useState<TransactionProgress | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  if (loading) return <section className="page page-wrap"><LoadingCards /></section>;
  if (error || !round) return <section className="page page-wrap"><ErrorState message={error ?? "This round could not be found."} retry={() => void reload()} /></section>;
  const options = round.participants.filter((address) => address.toLowerCase() !== session?.account.toLowerCase());

  const submit = async () => {
    if (!session) return openPicker();
    if (!creditor || terms.trim().length < 60 || terms.trim().length > 800) { setSubmitError("Choose a creditor and write 60–800 characters of bounded payment terms."); return; }
    setSubmitError(null);
    try {
      await ensureTargetChain();
      await adapter.recordObligation({ roundId, creditor: creditor as Address, amountGen: amount, terms: terms.trim() }, session, setProgress);
      navigate(`/rounds/${roundId}`);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "The transaction did not complete.";
      setProgress({ phase: "FAILED", message }); setSubmitError(message);
    }
  };

  return <section className="page narrow-page page-wrap"><Link className="back-link" to={`/rounds/${roundId}`}><ArrowLeft aria-hidden="true" /> Back to round {roundId}</Link><div className="page-heading"><p className="eyebrow">Your outgoing edge</p><h1>Record an obligation</h1><p>You can record one append-only obligation. Its named creditor must separately accept these exact terms.</p></div><div className="form-card"><fieldset><legend>Payment direction</legend><label>Creditor<select value={creditor} onChange={(event) => setCreditor(event.target.value)}><option value="">Choose another participant</option>{options.map((address) => <option key={address} value={address}>{shortenAddress(address)}</option>)}</select></label><div className="amount-choice"><span>Amount</span>{([1, 2] as const).map((value) => <button key={value} type="button" aria-pressed={amount === value} onClick={() => setAmount(value)}>{value} GEN</button>)}</div></fieldset><fieldset><legend>Terms this creditor will confirm</legend><label>Obligation terms<textarea rows={7} value={terms} onChange={(event) => setTerms(event.target.value)} placeholder="State the service framework, when payment is due, the GEN denomination, and whether circular setoff is allowed or restricted." /><span className="field-help">Do not paste credentials or claim that this contract proves external delivery.</span></label></fieldset><div className="direction-preview"><span>{session ? shortenAddress(session.account) : "Your wallet"}</span><strong>{amount} GEN</strong><ArrowRight aria-hidden="true" /><span>{creditor ? shortenAddress(creditor) : "Creditor"}</span></div><Notice title="No new GEN is sent here">Your 2 GEN collateral was locked when you joined. This transaction records only your acknowledged obligation.</Notice>{submitError && <p className="form-error" role="alert">{submitError}</p>}<TransactionStatus progress={progress} /><div className="form-actions"><Link className="button ghost" to={`/rounds/${roundId}`}>Cancel</Link><button className="button primary" type="button" onClick={() => void submit()}>{session ? "Record obligation" : "Connect wallet"}</button></div></div></section>;
}

