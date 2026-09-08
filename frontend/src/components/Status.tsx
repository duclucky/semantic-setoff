import { ArrowClockwise, CheckCircle, CircleNotch, WarningCircle, XCircle } from "@phosphor-icons/react";
import type { RoundStage, TransactionProgress } from "../types";

const labels: Record<RoundStage, string> = {
  OPEN: "Waiting for participants",
  FUNDED: "Building the set",
  OBLIGATIONS_RECORDED: "Awaiting confirmation",
  READY: "Ready for review",
  SETTLED: "Net settlement complete",
  NOT_NETTABLE: "Returned without setoff",
  EXPIRED: "Round closed and refunded",
};

export function StageBadge({ stage }: { stage: RoundStage }) {
  const tone = stage === "SETTLED" ? "success" : stage === "NOT_NETTABLE" || stage === "EXPIRED" ? "neutral" : "pending";
  return <span className={`status-badge ${tone}`}>{stage === "SETTLED" ? <CheckCircle aria-hidden="true" /> : <CircleNotch aria-hidden="true" />}{labels[stage]}</span>;
}

export function TransactionStatus({ progress }: { progress: TransactionProgress | null }) {
  if (!progress || progress.phase === "IDLE") return null;
  const Icon = progress.phase === "FINALIZED" ? CheckCircle : progress.phase === "FAILED" ? XCircle : progress.phase === "RETRYABLE" ? ArrowClockwise : CircleNotch;
  return (
    <div className={`transaction-status ${progress.phase.toLowerCase()}`} role="status" aria-live="polite" aria-atomic="true">
      <Icon aria-hidden="true" />
      <div><strong>{progress.phase.replaceAll("_", " ")}</strong><span>{progress.message}</span>{progress.hash && <code>{progress.hash}</code>}</div>
    </div>
  );
}

export function Notice({ title, children, tone = "info" }: { title: string; children: React.ReactNode; tone?: "info" | "warning" | "error" }) {
  return <div className={`notice ${tone}`}><WarningCircle aria-hidden="true" /><div><strong>{title}</strong><div>{children}</div></div></div>;
}

