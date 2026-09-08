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

function parseAccount(value: unknown): Address {
  if (!Array.isArray(value) || typeof value[0] !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(value[0])) {
    throw new Error("The selected wallet did not return a valid EVM account.");
  }
  return value[0] as Address;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [session, setSession] = useState<WalletSession | null>(null);
  const [isPickerOpen, setPickerOpen] = useState(false);
  const [isDiscovering, setDiscovering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshWallets = useCallback(async () => {
    setDiscovering(true);
    setError(null);
    try {
      setWallets(await discoverWallets());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Wallet discovery failed.");
    } finally {
      setDiscovering(false);
    }
  }, []);

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
      setSession({ account, chainId, wallet });
      setPickerOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The wallet connection did not complete.");
    }
  }, []);

  const disconnect = useCallback(() => {
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

