/* @ts-nocheck */
import React from "react";

type State = { error: any };

export default class ErrorBoundary extends React.Component<any, State> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { error };
  }
  componentDidCatch(error: any, info: any) {
    console.error("[ErrorBoundary] UI crashed:", error, info);
  }
  render() {
    if (this.state.error) {
      const msg = String(this.state.error?.message || this.state.error);
      return (
        <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
          <h2>Er ging iets mis 😬</h2>
          <pre style={{ whiteSpace: "pre-wrap", background:"#f7f7f7", padding:12, borderRadius:8 }}>
            {msg}
          </pre>
          <p style={{ color:"#666" }}>
            Check de browserconsole voor de stacktrace. De rest van de app blijft werken.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}


