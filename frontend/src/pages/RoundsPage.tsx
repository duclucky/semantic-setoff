import { ArrowRight, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useContract } from "../adapters/contract";
import { EmptyState, ErrorState, LoadingCards } from "../components/LoadState";
import { StageBadge } from "../components/Status";
import { shortenAddress } from "../components/AppLayout";
import { useAsyncData } from "../hooks/useAsyncData";
import { useWallet } from "../wallet/WalletContext";

type Filter = "ALL" | "ACTION" | "ACTIVE" | "CLOSED";

export function RoundsPage() {
  const adapter = useContract();
  const { session } = useWallet();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const { data, loading, error, reload } = useAsyncData(() => adapter.listRounds(session?.account), [adapter, session?.account]);
  const rounds = useMemo(() => (data ?? []).filter((round) => {
    const matchesQuery = !query || round.id.toLowerCase().includes(query.toLowerCase()) || round.participants.some((address) => address.toLowerCase().includes(query.toLowerCase()));
    const matchesFilter = filter === "ALL" || (filter === "ACTION" && round.waitingOnConnectedUser) || (filter === "ACTIVE" && !["SETTLED", "NOT_NETTABLE", "EXPIRED"].includes(round.stage)) || (filter === "CLOSED" && ["SETTLED", "NOT_NETTABLE", "EXPIRED"].includes(round.stage));
    return matchesQuery && matchesFilter;
  }), [data, filter, query]);

  return (
    <section className="page page-wrap">
      <div className="page-heading with-action"><div><p className="eyebrow">Your settlement work</p><h1>Rounds</h1><p>Find a round, see what is waiting on you, and return to finalized results.</p></div><Link className="button primary" to="/rounds/new"><Plus aria-hidden="true" /> New round</Link></div>
      <div className="toolbar">
        <label className="search-field"><span className="sr-only">Search by round ID or participant address</span><MagnifyingGlass aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Round ID or participant address" /></label>
        <div className="filter-group" aria-label="Filter rounds">
          {(["ALL", "ACTION", "ACTIVE", "CLOSED"] as Filter[]).map((item) => <button type="button" key={item} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item === "ACTION" ? "Waiting on me" : item.toLowerCase()}</button>)}
        </div>
      </div>
      {loading ? <LoadingCards /> : error ? <ErrorState message={error} retry={() => void reload()} /> : rounds.length === 0 ? (
        <EmptyState title={query || filter !== "ALL" ? "No rounds match this view" : "No canonical rounds yet"} body={adapter.canRead ? "Adjust the filter or start your first three-party setoff round." : "Live reads are not configured. You can still review the product flow without pretending example data is live."} action={<Link className="button secondary" to="/rounds/new">Start a round</Link>} />
      ) : (
        <div className="round-list">{rounds.map((round) => (
          <Link className="round-card" key={round.id} to={`/rounds/${round.id}`}>
            <div><p className="eyebrow">Round {round.id}</p><StageBadge stage={round.stage} /></div>
            <div className="party-stack" aria-label="Participants">{round.participants.map((address) => <span key={address}>{shortenAddress(address)}</span>)}</div>
            <div className="round-meta"><span>{round.waitingOnConnectedUser ? "Action needed" : "No action waiting"}</span><strong>{round.availableCreditGen} GEN credit</strong></div>
            <ArrowRight aria-hidden="true" />
          </Link>
        ))}</div>
      )}
    </section>
  );
}

