import { ArrowRight, CheckCircle, Handshake, Scales, ShieldCheck } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useContract } from "../adapters/contract";
import { Notice } from "../components/Status";

export function HomePage() {
  const adapter = useContract();
  return (
    <>
      <section className="hero page-wrap">
        <div className="hero-copy">
          <p className="eyebrow">Three parties. One clear close.</p>
          <h1>Settle a circle of service obligations without a trusted clearing operator.</h1>
          <p className="hero-lede">Each participant ratifies the same charter, acknowledges one obligation, and locks 2 GEN. Validators decide semantic eligibility; contract arithmetic decides the final credits.</p>
          <div className="hero-actions">
            <Link className="button primary" to="/rounds/new">Start a round <ArrowRight aria-hidden="true" /></Link>
            <Link className="button secondary" to="/rounds">Find a round</Link>
          </div>
          <div className="trust-row" aria-label="Product safeguards">
            <span><ShieldCheck aria-hidden="true" /> Exact wallet ratification</span>
            <span><Scales aria-hidden="true" /> Zero-sum GEN accounting</span>
          </div>
        </div>
        <div className="cycle-visual" aria-label="A three-party obligation cycle where every participant locks 2 GEN">
          <div className="cycle-total"><strong>6</strong><span>GEN protected</span></div>
          {[
            ["A", "Owes 2 GEN"],
            ["B", "Owes 1 GEN"],
            ["C", "Owes 1 GEN"],
          ].map(([letter, text], index) => <div key={letter} className={`cycle-node node-${index + 1}`}><b>{letter}</b><span>{text}</span></div>)}
          <svg viewBox="0 0 360 320" role="presentation" aria-hidden="true"><path d="M106 70 C210 8 302 78 294 169"/><path d="M286 207 C225 302 111 301 62 211"/><path d="M54 170 C38 108 62 81 92 65"/></svg>
        </div>
      </section>
      <section className="section page-wrap">
        {adapter.source === "UNAVAILABLE" && <Notice title="Live deployment is not connected yet">You can explore the complete product flow. Transactions remain disabled until a verified contract address and separate wallet/read RPC paths are configured.</Notice>}
        <div className="section-heading"><p className="eyebrow">The shortest path</p><h2>Commit, compare, close</h2><p>Every step has an accountable wallet and a visible recovery path.</p></div>
        <div className="step-grid">
          <article><span>01</span><Handshake aria-hidden="true" /><h3>Ratify one charter</h3><p>Three named wallets approve the exact setoff terms and each locks 2 GEN.</p></article>
          <article><span>02</span><ShieldCheck aria-hidden="true" /><h3>Confirm each obligation</h3><p>Every debtor records one 1–2 GEN obligation; its named creditor confirms the exact terms.</p></article>
          <article><span>03</span><Scales aria-hidden="true" /><h3>Settle the net</h3><p>Validators judge eligibility. Deterministic code discharges the set or refunds all collateral.</p></article>
        </div>
      </section>
      <section className="proof-strip">
        <div className="page-wrap proof-grid">
          <div><strong>2 GEN</strong><span>fixed collateral per participant</span></div>
          <div><strong>3 of 3</strong><span>wallet approvals required</span></div>
          <div><strong>6 GEN</strong><span>must remain accounted for</span></div>
          <div><strong>0</strong><span>silent or simulated successes</span></div>
        </div>
      </section>
      <section className="section page-wrap split-section">
        <div><p className="eyebrow">Bounded by design</p><h2>It settles what this contract owns—nothing more.</h2></div>
        <div className="limit-list">
          <p><CheckCircle aria-hidden="true" /> Validator judgment covers exact onchain terms.</p>
          <p><CheckCircle aria-hidden="true" /> Final credits always sum to the 6 GEN funded.</p>
          <p><CheckCircle aria-hidden="true" /> Missing steps lead to a time-gated refund path.</p>
          <p className="muted">SemanticSetoff does not prove service delivery, legal identity, solvency, fiat payment, or enforceability outside the deployed contract.</p>
        </div>
      </section>
    </>
  );
}

