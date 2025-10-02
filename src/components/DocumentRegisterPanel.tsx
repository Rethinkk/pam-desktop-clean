/* @ts-nocheck */
import React from "react";

/** Eenvoudige reader voor documentregister.
 *  Probeert "pam-docs-v1" te lezen; valt anders terug op lege lijst.
 *  Laat bewust geen aannames over shape los: toont id/title/filename als aanwezig.
 */
function readDocs(): any[] {
  try {
    const raw = localStorage.getItem("pam-docs-v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Ondersteun zowel {docs: []} als [] (back-compat)
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.docs)) return parsed.docs;
    return [];
  } catch {
    return [];
  }
}

export default function DocumentRegisterPanel() {
  const [docs, setDocs] = React.useState<any[]>(() => readDocs());

  React.useEffect(() => {
    // Als je al een event dispatcht bij updates, luisteren we daarop.
    const handler = () => setDocs(readDocs());
    window.addEventListener("pam-docs-updated", handler);
    return () => window.removeEventListener("pam-docs-updated", handler);
  }, []);

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Document Register</h2>
      <p className="text-sm opacity-80">
        Totaal documenten: {docs.length}
      </p>

      <div className="border rounded-lg divide-y">
        {docs.length === 0 ? (
          <div className="p-3 text-sm opacity-70">Nog geen documenten in het register.</div>
        ) : (
          docs.map((d, i) => (
            <div key={d?.id ?? i} className="p-3">
              <div className="font-medium">
                {d?.title ?? d?.name ?? d?.filename ?? "(zonder titel)"}
              </div>
              <div className="text-xs opacity-70">
                ID: {String(d?.id ?? "—")}
              </div>
              {d?.filename && (
                <div className="text-xs opacity-70">Bestand: {d.filename}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
