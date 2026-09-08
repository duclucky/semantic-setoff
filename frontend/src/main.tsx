import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ContractContext, LiveContractAdapter, UnavailableContractAdapter } from "./adapters/contract";
import { ReadOnlyFixtureAdapter } from "./adapters/fixtures";
import { App } from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles.css";
import { WalletProvider } from "./wallet/WalletContext";

const configuredAddress = (import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined)?.trim() ?? "";
const validAddress = /^0x[a-fA-F0-9]{40}$/.test(configuredAddress);
const adapter = import.meta.env.VITE_USE_DESIGN_FIXTURES === "true"
  ? new ReadOnlyFixtureAdapter()
  : validAddress
    ? new LiveContractAdapter()
    : new UnavailableContractAdapter();

createRoot(document.getElementById("root")!).render(
  <StrictMode><ErrorBoundary><BrowserRouter><WalletProvider><ContractContext.Provider value={adapter}><App /></ContractContext.Provider></WalletProvider></BrowserRouter></ErrorBoundary></StrictMode>,
);
