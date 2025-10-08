import * as React from "react";
import { api } from "./api";

export default function DebugApiBanner() {
  const [status, setStatus] = React.useState<"ok"|"fail"|"loading">("loading");
  const [counts, setCounts] = React.useState<{people?:number; assets?:number}>({});

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await api.ping();
        const [people, assets] = await Promise.all([
          api.listPeople().catch(() => []),
          api.listAssets().catch(() => []),
        ]);
        if (!mounted) return;
        setCounts({ people: people.length, assets: assets.length });
        setStatus("ok");
      } catch {
        if (mounted) setStatus("fail");
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (status === "loading") return null;
  const ok = status === "ok";
  return (
    <div style={{
      padding: "8px 12px",
      background: ok ? "#e7f9ed" : "#fdeaea",
      borderBottom: "1px solid",
      borderColor: ok ? "#c2efd0" : "#f5c2c7",
      fontSize: 13
    }}>
      {ok
        ? `API connected • People: ${counts.people ?? 0} • Assets: ${counts.assets ?? 0}`
        : `API not reachable. Check VITE_API_BASE & CORS_ORIGIN.`}
    </div>
  );
}
