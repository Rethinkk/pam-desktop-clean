import React from "react";

export default class ErrorBoundary extends React.Component<
  { children?: React.ReactNode },
  { hasError: boolean; err?: unknown }
> {
  constructor(props: { children?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, err: undefined };
  }
  static getDerivedStateFromError(err: unknown) {
    return { hasError: true, err };
  }
  componentDidCatch(err: unknown, info: any) {
    console.error("UI crash:", err, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 12, border: "1px solid #e11d48", 
borderRadius: 8 }}>
          <b>Er ging iets mis</b>
          <pre style={{ whiteSpace: "pre-wrap" 
}}>{String(this.state.err)}</pre>
        </div>
      );
    }
    return this.props.children ?? null;
  }
}

