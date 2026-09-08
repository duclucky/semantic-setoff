import type { Eip1193Provider, WalletInfo } from "./types";

function walletName(provider: Eip1193Provider, index: number): string {
  const flags = provider as Eip1193Provider & {
    isMetaMask?: boolean;
    isRabby?: boolean;
    isCoinbaseWallet?: boolean;
    isOkxWallet?: boolean;
    isBraveWallet?: boolean;
  };
  if (flags.isRabby) return "Rabby";
  if (flags.isOkxWallet) return "OKX Wallet";
  if (flags.isCoinbaseWallet) return "Coinbase Wallet";
  if (flags.isBraveWallet) return "Brave Wallet";
  if (flags.isMetaMask) return "MetaMask";
  return index === 0 ? "Browser wallet" : `Browser wallet ${index + 1}`;
}

export async function discoverWallets(waitMs = 180): Promise<WalletInfo[]> {
  const found = new Map<Eip1193Provider, WalletInfo>();
  const onAnnouncement = (event: WindowEventMap["eip6963:announceProvider"]) => {
    const { info, provider } = event.detail;
    found.set(provider, { id: info.uuid, name: info.name, icon: info.icon, provider });
  };

  window.addEventListener("eip6963:announceProvider", onAnnouncement);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  await new Promise((resolve) => window.setTimeout(resolve, waitMs));
  window.removeEventListener("eip6963:announceProvider", onAnnouncement);

  const injected = [
    ...(window.ethereum?.providers ?? (window.ethereum ? [window.ethereum] : [])),
    window.okxwallet,
    window.rabby,
    window.coinbaseWalletExtension,
  ].filter((provider): provider is Eip1193Provider => Boolean(provider));

  injected.forEach((provider, index) => {
    if (!found.has(provider)) {
      found.set(provider, {
        id: `injected-${index}`,
        name: walletName(provider, index),
        provider,
      });
    }
  });

  return [...found.values()].sort((a, b) => a.name.localeCompare(b.name));
}

