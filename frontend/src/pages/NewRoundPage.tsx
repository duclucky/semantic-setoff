import { ArrowLeft, ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useContract } from "../adapters/contract";
import { Notice, TransactionStatus } from "../components/Status";
import type { Address, OpenRoundInput, RoundDeadlines, TransactionProgress } from "../types";
import { useWallet } from "../wallet/WalletContext";

const addressPattern = /^0x[a-fA-F0-9]{40}$/;

function defaultDeadlines(): Record<keyof RoundDeadlines, string> {
  const values = [1, 2, 3, 4].map((days) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 16));
  return { funding: values[0], obligation: values[1], acceptance: values[2], review: values[3] };
}

export function NewRoundPage() {
  const adapter = useContract();
  const { session, openPicker, ensureTargetChain } = useWallet();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [participantB, setParticipantB] = useState("");
  const [participantC, setParticipantC] = useState("");
  const [charter, setCharter] = useState("");
  const [deadlines, setDeadlines] = useState(defaultDeadlines);
  const [progress, setProgress] = useState<TransactionProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const validation = useMemo(() => {
    const errors: string[] = [];
    if (!addressPattern.test(participantB)) errors.push("Participant B needs a valid EVM address.");
    if (!addressPattern.test(participantC)) errors.push("Participant C needs a valid EVM address.");
    if (participantB.toLowerCase() === participantC.toLowerCase()) errors.push("Participants B and C must be different wallets.");
    if (session && [participantB, participantC].some((value) => value.toLowerCase() === session.account.toLowerCase())) errors.push("The other participants must differ from your connected wallet.");
    if (charter.trim().length < 80 || charter.trim().length > 1200) errors.push("The charter must be 80–1,200 characters.");
    const times = Object.values(deadlines).map((value) => Date.parse(value));
    if (times.some(Number.isNaN) || times.some((value) => value <= Date.now())) errors.push("Every deadline must be in the future.");
    if (!times.every((value, index) => index === 0 || value > times[index - 1])) errors.push("Deadlines must be strictly ordered: funding, obligation, acceptance, review.");
    return errors;
  }, [participantB, participantC, charter, deadlines, session]);

  const submit = async () => {
    if (!session) return openPicker();
    if (validation.length) { setError(validation.join(" ")); return; }
    setError(null);
    try {
      await ensureTargetChain();
      const input: OpenRoundInput = {
        roundId: `round-${Date.now().toString(36)}`,
        participantB: participantB as Address,
        participantC: participantC as Address,
        charter: charter.trim(),
        deadlines: Object.fromEntries(Object.entries(deadlines).map(([key, value]) => [key, Date.parse(value)])) as unknown as RoundDeadlines,
      };
      const id = await adapter.openRound(input, session, setProgress);
      navigate(`/rounds/${id}`);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "The transaction did not complete.";
      setProgress({ phase: "FAILED", message });
      setError(message);
    }
  };

  return (
    <section className="page narrow-page page-wrap">
      <Link className="back-link" to="/rounds"><ArrowLeft aria-hidden="true" /> Back to rounds</Link>
      <div className="page-heading"><p className="eyebrow">Create a shared commitment</p><h1>Start a setoff round</h1><p>You are participant A and the coordinator. No GEN moves until each listed wallet separately joins and locks exactly 2 GEN.</p></div>
      <ol className="stepper" aria-label="Round creation progress">{["Participants", "Charter & timing", "Review & sign"].map((label, index) => <li className={step >= index + 1 ? "active" : ""} key={label}><span>{step > index + 1 ? <CheckCircle aria-label="Complete" /> : index + 1}</span>{label}</li>)}</ol>
      <div className="form-card">
        {step === 1 && <fieldset><legend>Name the three participants</legend><p className="field-help">Your connected wallet becomes participant A. Enter two distinct EVM addresses.</p><label>Participant B address<input value={participantB} onChange={(e) => setParticipantB(e.target.value.trim())} placeholder="0x…" spellCheck={false} /></label><label>Participant C address<input value={participantC} onChange={(e) => setParticipantC(e.target.value.trim())} placeholder="0x…" spellCheck={false} /></label></fieldset>}
        {step === 2 && <fieldset><legend>Define the setoff rule and windows</legend><label>Setoff charter<textarea rows={7} value={charter} onChange={(e) => setCharter(e.target.value)} placeholder="State when obligations are of the same kind, when they are due, and any restrictions or exceptions." /><span className="field-help">80–1,200 characters. All participants ratify these exact words.</span></label><div className="date-grid">{(["funding", "obligation", "acceptance", "review"] as const).map((name) => <label key={name}>{name[0].toUpperCase() + name.slice(1)} deadline<input type="datetime-local" value={deadlines[name]} onChange={(e) => setDeadlines((current) => ({ ...current, [name]: e.target.value }))} /></label>)}</div></fieldset>}
        {step === 3 && <div className="review-summary"><h2>Review before the wallet opens</h2><dl><div><dt>Coordinator</dt><dd>{session?.account ?? "Connect to set participant A"}</dd></div><div><dt>Other participants</dt><dd>{participantB || "Not entered"}<br />{participantC || "Not entered"}</dd></div><div><dt>Commitment</dt><dd>2 GEN per participant, 6 GEN total</dd></div><div><dt>Charter</dt><dd>{charter || "Not entered"}</dd></div></dl><Notice title="Opening does not settle anything">The round becomes canonical only after finalization. Each wallet must join independently; no participant can be signed for by another.</Notice>{validation.length > 0 && <div className="error-summary" role="alert" tabIndex={-1}><strong>Fix these items before signing</strong><ul>{validation.map((item) => <li key={item}>{item}</li>)}</ul></div>}<TransactionStatus progress={progress} /></div>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions">{step > 1 && <button className="button ghost" type="button" onClick={() => setStep((value) => value - 1)}><ArrowLeft aria-hidden="true" /> Back</button>}<button className="button primary" type="button" onClick={() => step < 3 ? setStep((value) => value + 1) : void submit()}>{step < 3 ? <>Continue <ArrowRight aria-hidden="true" /></> : session ? "Open round" : "Connect wallet"}</button></div>
      </div>
    </section>
  );
}
