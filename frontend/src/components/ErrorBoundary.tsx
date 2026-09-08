import { Component, type ErrorInfo, type ReactNode } from "react";

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("SemanticSetoff interface error", error.name, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-error">
          <p className="eyebrow">Interface error</p>
          <h1>This page could not be shown</h1>
          <p>No transaction was submitted by this error. Reload the interface to try again.</p>
          <button className="button primary" type="button" onClick={() => window.location.reload()}>Reload</button>
        </main>
      );
    }
    return this.props.children;
  }
}

