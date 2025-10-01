import React from "react";

export default function AssetsPanel() {
  return (
    <>
      {/* SCOPED STYLES – alleen voor dit paneel */}
      <style>{`
        /* Container met auto-brede labelkolom (breedte = langste label) */
        .asset-form {
  display: grid;

  /* >>> Pas deze waarde aan tot het matcht met Reporting */
  --field-max: 720px;

  /* kolom 1 = breedte langste label, kolom 2 = max --field-max */
  grid-template-columns: max-content minmax(0, var(--field-max));
  column-gap: 16px;
  row-gap: 12px;
  align-items: center;
}

/* mobiel/tablet: laat velden weer meerekken */
@media (max-width: 1100px) {
  .asset-form { --field-max: 100%; }
}

        /* Labels en velden */
        .asset-form .form-label {
          white-space: nowrap;
          font-weight: 600;
          color: #0f172a;
        }
        .asset-form .form-field {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          background: #fff;
          color: #0f172a;
          padding: 10px 12px;
          height: 44px;
          box-sizing: border-box;
        }
        .asset-form .form-field:focus {
          outline: none;
          border-color: #64748b;
          box-shadow: 0 0 0 2px #e2e8f0;
        }

        /* Helpers */
        .asset-form .full  { grid-column: 1 / -1; }  /* Volle breedte */
        .asset-form .h2    { font-size: 18px; font-weight: 700; margin: 16px 0 4px; }
        .asset-form .tip   { color: #475569; font-size: 14px; }
        .asset-form .multi { min-height: 160px; height: auto; }
        .asset-form textarea.form-field { min-height: 120px; height: auto; resize: vertical; }

        /* Mobiel: labels boven velden */
        @media (max-width: 640px) {
          .asset-form {
            grid-template-columns: 1fr;
          }
          .asset-form .form-label {
            margin-bottom: 4px;
            white-space: normal;
          }
        }
      `}</style>

      <div className="asset-form">
        {/* Titel */}
        <div className="full">
          <h2 className="h2" style={{ fontSize: 24, marginTop: 0 }}>Nieuw asset</h2>
        </div>

        {/* Assetnaam */}
        <label htmlFor="assetName" className="form-label">
          Assetnaam / Benoeming <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <input
          id="assetName"
          className="form-field"
          placeholder='Bijv. MacBook Pro 14”'
          // value={...} onChange={...}  ← laat je eigen logica hier staan indien nodig
        />

        {/* Assettype */}
        <label htmlFor="assetType" className="form-label">
          Assettype <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <select id="assetType" defaultValue="IT-Materieel" className="form-field">
          <option>IT-Materieel</option>
          <option>Meubilair</option>
          <option>Voertuig</option>
          <option>Overig</option>
        </select>

        {/* Persoon */}
        <label htmlFor="person" className="form-label">Koppel aan persoon (optioneel)</label>
        <select id="person" defaultValue="" className="form-field">
          <option value="">— Geen —</option>
          <option>Jan Jansen</option>
          <option>Fatima Öz</option>
          <option>Alex Chen</option>
        </select>

        {/* Documenten (volle breedte) */}
        <label htmlFor="docs" className="form-label full">Koppel documenten (optioneel)</label>
        <select id="docs" multiple size={6} className="form-field full multi">
          {/* vervang door jouw eigen opties/data */}
          <option>Screenshot 2025-09-25 at 23.06.34.png</option>
          <option>Screenshot 2025-09-26 at 10.53.02.png</option>
          <option>Polis</option>
          <option>polis</option>
          <option>Apple garantie</option>
        </select>
        <div className="full tip">
          Tip: houd ⌘/Ctrl ingedrukt om meerdere documenten te selecteren.
        </div>

        {/* Sectie: Verplicht */}
        <div className="full h2">Verplicht</div>

        <label htmlFor="sn" className="form-label">Serienummer <span style={{ color: "#ef4444" }}>*</span></label>
        <input id="sn" className="form-field" placeholder="SN-…" />

        <label htmlFor="purchaseDate" className="form-label">Aankoopdatum <span style={{ color: "#ef4444" }}>*</span></label>
        <input id="purchaseDate" type="date" className="form-field" placeholder="dd/mm/jjjj" />

        <label htmlFor="price" className="form-label">Aankoopprijs <span style={{ color: "#ef4444" }}>*</span></label>
        <input id="price" className="form-field" placeholder="€ 0,00" inputMode="decimal" />

        {/* Sectie: Optioneel */}
        <div className="full h2">Optioneel</div>

        <label htmlFor="brand" className="form-label">Merk</label>
        <input id="brand" className="form-field" />

        <label htmlFor="model" className="form-label">Model</label>
        <input id="model" className="form-field" />

        <label htmlFor="warranty" className="form-label">Garantie tot</label>
        <input id="warranty" type="date" className="form-field" placeholder="dd/mm/jjjj" />

        <label htmlFor="notes" className="form-label">Notities</label>
        <textarea id="notes" className="form-field" placeholder="Eventuele bijzonderheden…" rows={5} />

        {/* Actie */}
        <div className="full" style={{ marginTop: 12 }}>
          <button
            className="h-11 px-4 rounded-xl"
            style={{ background: "#0f172a", color: "#fff", fontWeight: 700, border: 0 }}
          >
            Opslaan
          </button>
        </div>
      </div>
    </>
  );
}

