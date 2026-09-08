import type { Address } from "../types";

export interface Eip1193RequestArguments {
  method: string;
  params?: unknown[] | Record<string, unknown>;
}

export interface Eip1193Provider {
  request(args: Eip1193RequestArguments): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}

export interface WalletInfo {
  id: string;
  name: string;
  icon?: string;
  provider: Eip1193Provider;
}

export interface WalletSession {
  account: Address;
  chainId: string;
  wallet: WalletInfo;
}

export interface Eip6963ProviderDetail {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  provider: Eip1193Provider;
}

declare global {
  interface WindowEventMap {
    "eip6963:announceProvider": CustomEvent<Eip6963ProviderDetail>;
  }

  interface Window {
    ethereum?: Eip1193Provider & { providers?: Eip1193Provider[]; isMetaMask?: boolean; isRabby?: boolean; isCoinbaseWallet?: boolean };
    okxwallet?: Eip1193Provider;
    rabby?: Eip1193Provider;
    coinbaseWalletExtension?: Eip1193Provider;
  }
}

