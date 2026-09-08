import { useState, type ReactNode } from "react";
import { BookOpenText, CirclesThreePlus, House, List, Pulse, Wallet, X } from "@phosphor-icons/react";
import { Link, NavLink } from "react-router-dom";
import { useContract } from "../adapters/contract";
import { useWallet } from "../wallet/WalletContext";
import { WalletPicker } from "./WalletPicker";

const navItems = [
  { to: "/", label: "Home", icon: House, end: true },
  { to: "/rounds", label: "Rounds", icon: CirclesThreePlus, end: false },
  { to: "/activity", label: "Activity", icon: Pulse, end: false },
  { to: "/help", label: "Help", icon: BookOpenText, end: false },
];

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const adapter = useContract();
  const { session, openPicker, disconnect } = useWallet();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      {adapter.source === "DESIGN_FIXTURE" && (
        <div className="fixture-banner" role="status">Design preview — example data below is not live chain state. Writes are disabled.</div>
      )}
      <header className="site-header">
        <div className="nav-wrap">
          <Link className="brand" to="/" aria-label="SemanticSetoff home">
            <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
            <span>Semantic<span>Setoff</span></span>
          </Link>
          <button className="icon-button menu-toggle" type="button" aria-label={navOpen ? "Close navigation" : "Open navigation"} aria-expanded={navOpen} onClick={() => setNavOpen((value) => !value)}>
            {navOpen ? <X aria-hidden="true" /> : <List aria-hidden="true" />}
          </button>
          <nav className={navOpen ? "primary-nav open" : "primary-nav"} aria-label="Primary navigation">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} onClick={() => setNavOpen(false)}>
                <Icon aria-hidden="true" /> <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="account-control">
            {session ? (
              <>
                <button className="account-button" type="button" aria-expanded={accountOpen} onClick={() => setAccountOpen((value) => !value)}>
                  <span className="connection-dot" aria-hidden="true" />
                  <span>{shortenAddress(session.account)}</span>
                </button>
                {accountOpen && (
                  <div className="account-menu">
                    <strong>{session.wallet.name}</strong>
                    <span>{shortenAddress(session.account)}</span>
                    <Link to="/settings" onClick={() => setAccountOpen(false)}>Account & network</Link>
                    <button type="button" onClick={() => { disconnect(); setAccountOpen(false); }}>Disconnect</button>
                  </div>
                )}
              </>
            ) : (
              <button className="button connect" type="button" onClick={openPicker}><Wallet aria-hidden="true" /> Connect wallet</button>
            )}
          </div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>{children}</main>
      <footer className="site-footer">
        <div>
          <Link className="brand footer-brand" to="/"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>SemanticSetoff</span></Link>
          <p>Validator-approved GEN net settlement for three co-ratified service obligations.</p>
        </div>
        <div className="footer-links"><Link to="/help">How it works</Link><Link to="/settings">Network & account</Link><Link to="/rounds">Find a round</Link></div>
        <p className="legal-note">Not proof of service delivery or legal enforceability.</p>
      </footer>
      <WalletPicker />
    </div>
  );
}
