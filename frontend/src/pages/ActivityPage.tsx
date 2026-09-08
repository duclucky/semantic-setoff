import { ArrowRight, Coins, Hourglass, Receipt, Wallet } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useContract } from "../adapters/contract";
import { EmptyState, ErrorState, LoadingCards } from "../components/LoadState";
import { useAsyncData } from "../hooks/useAsyncData";
import { useWallet } from "../wallet/WalletContext";

const icons = { ACTION_REQUIRED: Hourglass, TRANSACTION: Receipt, CREDIT: Coins, RESULT: Wallet };

export function ActivityPage() {
  const adapter = useContract();
  const { session, openPicker } = useWallet();
  const { data, loading, error, reload } = useAsyncData(() => session ? adapter.getActivity(session.account) : Promise.resolve([]), [adapter, session?.account]);
  return <section className="page page-wrap"><div className="page-heading"><p className="eyebrow">What needs you</p><h1>My activity</h1><p>Pending responsibilities, finalized results and available GEN credits for the selected wallet.</p></div>{!session ? <EmptyState title="Connect to see wallet-specific activity" body="Public round pages remain readable. Activity appears only after you choose a wallet; no account request happens before that choice." action={<button className="button primary" type="button" onClick={openPicker}>Choose wallet</button>} /> : loading ? <LoadingCards label="Loading wallet activity" /> : error ? <ErrorState message={error} retry={() => void reload()} /> : !data?.length ? <EmptyState title="Nothing needs this wallet" body={adapter.canRead ? "When a round needs your ratification, confirmation, review or withdrawal, it will appear here." : "Live activity cannot be read until the deployed contract path is configured."} action={<Link className="button secondary" to="/rounds">Browse rounds</Link>} /> : <div className="activity-list">{data.map((item) => { const Icon = icons[item.kind]; return <Link key={item.id} to={`/rounds/${item.roundId}`}><span className={`activity-icon ${item.kind.toLowerCase()}`}><Icon aria-hidden="true" /></span><div><p className="eyebrow">Round {item.roundId}</p><h2>{item.title}</h2><p>{item.description}</p><time dateTime={new Date(item.timestamp).toISOString()}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(item.timestamp)}</time></div><ArrowRight aria-hidden="true" /></Link>; })}</div>}</section>;
}

