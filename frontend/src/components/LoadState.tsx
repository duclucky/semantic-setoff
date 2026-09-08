import { ArrowClockwise, CirclesThreePlus } from "@phosphor-icons/react";

export function LoadingCards({ label = "Loading canonical state" }: { label?: string }) {
  return <div className="loading-stack" aria-busy="true" aria-label={label}><div className="skeleton" /><div className="skeleton short" /><div className="skeleton" /></div>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return <section className="empty-state"><CirclesThreePlus aria-hidden="true" size={40} /><h2>{title}</h2><p>{body}</p>{action}</section>;
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return <section className="empty-state error-state"><h2>We could not load this state</h2><p>{message}</p>{retry && <button className="button secondary" type="button" onClick={retry}><ArrowClockwise aria-hidden="true" /> Try again</button>}</section>;
}

