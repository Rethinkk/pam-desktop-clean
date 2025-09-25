import React, { useState } from "react";
import AssetForm from "./AssetForm";
import { loadRegister, saveRegister } from "../lib/assetNumber";
import { Asset } from "../types";

export default function AssetsPanel() {
  const [assets, setAssets] = useState<Asset[]>(
    () => (loadRegister()?.assets ?? [])
  );

  const refresh = () => setAssets(loadRegister()?.assets ?? []);

  // Verwijder op originele index (bullet-proof) en schrijf meteen weg
  const removeAt = (originalIndex: number) => {
    const next = assets.slice();
    next.splice(originalIndex, 1);
    saveRegister(next);
    setAssets(next);
  };

  const handleDelete = (originalIndex: number) => {
    const ok = window.confirm("Weet je zeker dat je dit asset wilt verwijderen?");
    if (!ok) return;
    removeAt(originalIndex);
  };

  // Maak een display-lijst met originele index vastgeklikt
  const display = assets.map((a, i) => ({ a, originalIndex: i })).slice().reverse();

  return (
    <div className="stack">
      <div className="card">
        <AssetForm onCreated={refresh} />
      </div>

      <div className="register">
        <h2>Register</h2>
        {assets.length === 0 ? (
          <p className="mt-8">Nog geen assets in het register.</p>
        ) : (
          <ul className="space-y-2">
            {display.map(({ a, originalIndex }) => (
              <li
                key={(a.id ?? a.assetNumber ?? originalIndex).toString()}
                className="border rounded p-2 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div className="text-sm text-gray-600 truncate">{a.assetNumber}</div>
                  <div className="font-medium truncate">{a.name}</div>
                  {a.type && <div className="text-xs text-gray-500">Type: {a.type}</div>}
                </div>
                <button
                  onClick={() => handleDelete(originalIndex)}
                  className="text-red-600 hover:text-red-800 text-sm ml-4 shrink-0"
                  aria-label={`Verwijder asset ${a.assetNumber ?? ""}`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}