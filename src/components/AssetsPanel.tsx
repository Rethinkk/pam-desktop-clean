import React, { useState } from "react";
import AssetForm from "./AssetForm";
import { loadRegister } from "../lib/assetNumber";
import { Asset } from "../types";

export default function AssetsPanel() {
  const [assets, setAssets] = useState<Asset[]>(() => loadRegister().assets);
  const refresh = () => setAssets(loadRegister().assets);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <AssetForm onCreated={refresh} />
      <div>
        <h2 className="font-semibold mb-2">Register</h2>
        <ul className="space-y-2">
          {assets.slice().reverse().map(a => (
            <li key={a.id} className="border rounded p-2">
              <div className="text-sm text-gray-600">{a.assetNumber}</div>
              <div className="font-medium">{a.name}</div>
              <div className="text-xs">{a.type}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
