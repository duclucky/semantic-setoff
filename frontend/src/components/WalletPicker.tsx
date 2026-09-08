import { useEffect, useRef } from "react";
import { ArrowClockwise, Wallet, X } from "@phosphor-icons/react";
import { useWallet } from "../wallet/WalletContext";

export function WalletPicker() {
  const { wallets, isPickerOpen, isDiscovering, error, closePicker, refreshWallets, connect } = useWallet();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isPickerOpen) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePicker();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPickerOpen, closePicker]);

  if (!isPickerOpen) return null;

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closePicker()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="wallet-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Your choice</p>
            <h2 id="wallet-title">Select an EVM wallet</h2>
          </div>
          <button ref={closeRef} className="icon-button" type="button" onClick={closePicker} aria-label="Close wallet picker">
            <X aria-hidden="true" />
          </button>
        </div>
        <p className="muted">We request accounts only after you choose a detected provider. SemanticSetoff never asks for a private key.</p>
        <div className="wallet-list" aria-busy={isDiscovering}>
          {wallets.map((wallet) => (
            <button className="wallet-option" type="button" key={wallet.id} onClick={() => void connect(wallet)}>
              {wallet.icon ? <img src={wallet.icon} alt="" width="32" height="32" /> : <Wallet aria-hidden="true" size={28} />}
              <span>{wallet.name}</span>
            </button>
          ))}
          {!isDiscovering && wallets.length === 0 && (
            <div className="empty-inline">
              <strong>No compatible wallet detected</strong>
              <span>Install or enable an EVM wallet extension, then scan again.</span>
            </div>
          )}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button secondary" type="button" onClick={() => void refreshWallets()} disabled={isDiscovering}>
          <ArrowClockwise aria-hidden="true" /> {isDiscovering ? "Scanning…" : "Scan again"}
        </button>
      </section>
    </div>
  );
}

