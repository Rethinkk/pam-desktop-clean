import React, { useState } from "react";
import AssetsPanel from "./components/AssetsPanel";
import DocumentsPanel from "./components/DocumentsPanel";

type Tab = 'assets' | 'docs' | 'about';

export default function App() {
  const [tab, setTab] = useState<Tab>('assets');

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center gap-4">
        <h1 className="text-xl font-bold">PAM — Personal Asset Manager</h1>
        <nav className="ml-auto flex gap-2">
          {(['assets','docs','about'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 border rounded ${tab===t ? 'font-semibold' : ''}`}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      {tab === 'assets' && <AssetsPanel />}
      {tab === 'docs' && <DocumentsPanel />}
      {tab === 'about' && <div>Over PAM</div>}
    </div>
  );
}
