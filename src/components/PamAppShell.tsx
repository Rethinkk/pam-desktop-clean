import React, { useState } from "react";

/** Kleine, herbruikbare Tab-knop */
// NAV WRAPPER
<nav className="bg-slate-800 rounded-2xl p-3 shadow-sm">
  <div className="flex items-center justify-between gap-3">
    {/* ... */}
  </div>
</nav>

// TABBUTTON
function TabButton({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={[
        "h-9 px-4 rounded-full text-sm font-medium",
        "transition shadow-sm",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
        isActive
          ? "bg-white text-slate-900"
          : "text-slate-200 hover:bg-slate-700/60"
      ].join(" ")}
    >
      {label}
    </button>
  );
}


function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
      {children}
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl text-slate-900 shadow-sm ring-1 ring-black/5">
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900",
        "placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200",
        props.className || "",
      ].join(" ")}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900",
        "focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200",
        props.className || "",
      ].join(" ")}
    />
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-slate-200">{children}</label>;
}

function AssetsPage() {
  return (
    <Section title="Assets">
      <div className="space-y-8">
        <h2 className="text-xl font-semibold text-white">Nieuw asset</h2>

        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label>
              Assetnaam / Benoeming <span className="text-red-400">*</span>
            </Label>
            <Input placeholder='Bijv. MacBook Pro 14”' />
          </div>

          <div className="grid gap-2">
            <Label>
              Assettype <span className="text-red-400">*</span>
            </Label>
            <Select defaultValue="IT-Materieel">
              <option>IT-Materieel</option>
              <option>Meubilair</option>
              <option>Voertuig</option>
              <option>Overig</option>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Koppel aan persoon (optioneel)</Label>
            <Select defaultValue="">
              <option value="">— Geen —</option>
              <option>Jan Jansen</option>
              <option>Fatima Öz</option>
              <option>Alex Chen</option>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Koppel documenten (optioneel)</Label>
            <Input placeholder="Bijv. Factuur-2025-0001.pdf" />
          </div>

          <div>
            <button className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300">
              Opslaan
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}

function Placeholder({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Section title={title}>
      <Card>
        <p className="text-slate-700">{subtitle}</p>
      </Card>
    </Section>
  );
}

function AboutPage() {
  return (
    <Section title="Over PAM">
      <Card>
        <p className="text-slate-700">Personal Asset Manager.</p>
      </Card>
    </Section>
  );
}

export default function PamAppShell() {
  const MAIN_TABS = ["Assets", "Asset Register", "Docs", "Mensen"] as const;
  const ACTION_TABS = ["Reporting", "About"] as const;

  const [active, setActive] = useState<string>("Assets");

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <nav className="bg-slate-800 rounded-2xl p-2 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {MAIN_TABS.map((t) => (
                <TabButton key={t} label={t} isActive={active === t} onClick={() => setActive(t)} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {ACTION_TABS.map((t) => (
                <TabButton key={t} label={t} isActive={active === t} onClick={() => setActive(t)} />
              ))}
            </div>
          </div>
        </nav>

        <main className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-black/5">
          {active === "Assets" && <AssetsPage />}
          {active === "Asset Register" && (
            <Placeholder title="Asset Register" subtitle="Registreer en beheer al je assets op 1 plek." />
          )}
          {active === "Docs" && (
            <Placeholder title="Docs" subtitle="Koppel handleidingen, facturen en andere documenten." />
          )}
          {active === "Mensen" && (
            <Placeholder title="Mensen" subtitle="Beheer medewerkers en koppel assets aan personen." />
          )}
          {active === "Reporting" && (
            <Placeholder title="Reporting" subtitle="Maak overzichten en exporteer rapportages." />
          )}
          {active === "About" && <AboutPage />}
        </main>
      </div>
    </div>
  );
}
