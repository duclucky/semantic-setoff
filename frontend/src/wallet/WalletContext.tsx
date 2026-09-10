import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Address } from "../types";
import { discoverWallets } from "./discovery";
import type { WalletInfo, WalletSession } from "./types";

interface WalletContextValue {
  wallets: WalletInfo[];
  session: WalletSession | null;
  isPickerOpen: boolean;
  isDiscovering: boolean;
  error: string | null;
  openPicker(): void;
  closePicker(): void;
  refreshWallets(): Promise<void>;
  connect(wallet: WalletInfo): Promise<void>;
  disconnect(): void;
  ensureTargetChain(): Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);
const SELECTED_WALLET_KEY = "semantic-setoff.wallet-provider";

function parseAccount(value: unknown): Address {
  if (!Array.isArray(value) || typeof value[0] !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(value[0])) {
    throw new Error("The selected wallet did not return a valid EVM account.");
  }
  return value[0] as Address;
}

function readSelectedWalletId(): string | null {
  try {
    return window.sessionStorage.getItem(SELECTED_WALLET_KEY);
  } catch {
    return null;
  }
}

function rememberSelectedWallet(walletId: string): void {
  try {
    window.sessionStorage.setItem(SELECTED_WALLET_KEY, walletId);
  } catch {
    // Session storage is only a convenience for restoring the selected provider.
  }
}

function forgetSelectedWallet(): void {
  try {
    window.sessionStorage.removeItem(SELECTED_WALLET_KEY);
  } catch {
    // Session storage is optional and must never block wallet disconnect.
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [session, setSession] = useState<WalletSession | null>(null);
  const [isPickerOpen, setPickerOpen] = useState(false);
  const [isDiscovering, setDiscovering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const restoreAuthorizedWallet = useCallback(async (discovered: WalletInfo[]) => {
    const rememberedId = readSelectedWalletId();
    const candidates = rememberedId ? discovered.filter((wallet) => wallet.id === rememberedId) : discovered;
    const authorized: WalletSession[] = [];
    for (const wallet of candidates) {
      try {
        const accounts = await wallet.provider.request({ method: "eth_accounts" });
        if (!Array.isArray(accounts) || accounts.length === 0) continue;
        const account = parseAccount(accounts);
        const chainId = await wallet.provider.request({ method: "eth_chainId" });
        if (typeof chainId !== "string") continue;
        authorized.push({ account, chainId, wallet });
      } catch {
        // A wallet may reject a passive read; it remains available for explicit selection.
      }
    }

    if (rememberedId) {
      if (authorized.length === 1) setSession(authorized[0]);
      else if (authorized.length === 0) forgetSelectedWallet();
      return;
    }

    // Never auto-pick among different providers/accounts. Duplicate announcements
    // from one already-authorized wallet are still one unambiguous user choice.
    const uniqueAccounts = new Set(authorized.map((candidate) => candidate.account.toLowerCase()));
    if (authorized.length === 1 || (authorized.length > 1 && uniqueAccounts.size === 1)) setSession(authorized[0]);
  }, []);

  const refreshWallets = useCallback(async () => {
    setDiscovering(true);
    setError(null);
    try {
      const discovered = await discoverWallets();
      setWallets(discovered);
      await restoreAuthorizedWallet(discovered);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Wallet discovery failed.");
    } finally {
      setDiscovering(false);
    }
  }, [restoreAuthorizedWallet]);

  useEffect(() => {
    void refreshWallets();
  }, [refreshWallets]);

  const connect = useCallback(async (wallet: WalletInfo) => {
    setError(null);
    try {
      const accounts = await wallet.provider.request({ method: "eth_requestAccounts" });
      const account = parseAccount(accounts);
      const chainId = await wallet.provider.request({ method: "eth_chainId" });
      if (typeof chainId !== "string") throw new Error("The wallet returned an invalid chain identifier.");
      rememberSelectedWallet(wallet.id);
      setSession({ account, chainId, wallet });
      setPickerOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The wallet connection did not complete.");
    }
  }, []);

  const disconnect = useCallback(() => {
    forgetSelectedWallet();
    setSession(null);
    setError(null);
  }, []);

  const ensureTargetChain = useCallback(async () => {
    if (!session) throw new Error("Connect a wallet before continuing.");
    const target = import.meta.env.VITE_WALLET_CHAIN_ID as string | undefined;
    const rpcUrl = import.meta.env.VITE_WALLET_RPC_URL as string | undefined;
    if (!target || !rpcUrl) throw new Error("The Studionet wallet chain is not configured.");
    const normalized = target.startsWith("0x") ? target : `0x${Number(target).toString(16)}`;
    if (session.chainId.toLowerCase() === normalized.toLowerCase()) return;
    try {
      await session.wallet.provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: normalized }] });
    } catch (switchError) {
      const code = typeof switchError === "object" && switchError !== null && "code" in switchError ? Number(switchError.code) : 0;
      if (code !== 4902) throw switchError;
      await session.wallet.provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: normalized,
          chainName: (import.meta.env.VITE_WALLET_CHAIN_NAME as string | undefined) ?? "Studionet",
          nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
          rpcUrls: [rpcUrl],
          blockExplorerUrls: [(import.meta.env.VITE_BLOCK_EXPLORER_URL as string | undefined) ?? "https://explorer-studio.genlayer.com"],
        }],
      });
    }
    setSession((current) => (current ? { ...current, chainId: normalized } : null));
  }, [session]);

  const value = useMemo<WalletContextValue>(() => ({
    wallets,
    session,
    isPickerOpen,
    isDiscovering,
    error,
    openPicker: () => setPickerOpen(true),
    closePicker: () => setPickerOpen(false),
    refreshWallets,
    connect,
    disconnect,
    ensureTargetChain,
  }), [wallets, session, isPickerOpen, isDiscovering, error, refreshWallets, connect, disconnect, ensureTargetChain]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet must be used within WalletProvider.");
  return value;
}
