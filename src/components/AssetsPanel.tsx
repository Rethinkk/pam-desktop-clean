import React, { useState } from "react";
import AssetForm from "./AssetForm";
import { loadRegister } from "../lib/assetNumber";
import { Asset } from "../types";

export default function AssetsPanel() {
  
//Veiliger als loadRegister() (tijdelijk) niets teruggeeft:
  const [assets, setAssets] = useState<Asset[]>(
    () => (loadRegister()?.assets ?? [])
  );
  const refresh = () => setAssets(loadRegister()?.assets ?? []);

  return (
    <div className="stack">{/* onze layout helper */}
      <div className="card">{/* wit venster voor formulier */}
        <AssetForm onCreated={refresh} />
      </div>

      <div className="register">{/* wit/licht registerblok */}
        <h2>Register</h2>
        {assets.length === 0 ? (
          <p className="mt-8">Nog geen assets in het register.</p>
        ) : (
          <ul>
            {[...assets].reverse().map(a => (
              <li key={a.id}>
                <strong>{a.assetNumber}</strong>
                <span>{a.name}</span>
                <span>Type: {a.type}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
 }