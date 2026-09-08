import { ArrowLeft } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return <section className="page page-wrap empty-state"><p className="eyebrow">404</p><h1>This page is outside the round</h1><p>The route does not exist. Return home or find a canonical round.</p><Link className="button primary" to="/"><ArrowLeft aria-hidden="true" /> Return home</Link></section>;
}

