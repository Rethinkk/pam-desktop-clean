/* @ts-nocheck */
import React from "react";
import ExportButton from "./ExportButton";

export default function SecurityPanel() {
  return (
    <div className="ui-page">
      {/* Info-balk bovenaan */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 24,
        }}
      >
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#334155" }}>
          🔐 Je werkt nu in de <strong>lokale, beveiligde modus</strong>. 
          Alle gegevens blijven op je eigen apparaat en verlaten dit niet.
        </p>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
        Beveiliging & Privacy
      </h1>

      {/* Introductie */}
      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ lineHeight: 1.6 }}>
          In de huidige versie van <strong>Personal Asset Manager</strong> staat
          veiligheid gelijk aan transparantie. We verwerken geen gegevens buiten
          jouw eigen apparaat. Alles wat je invoert blijft{" "}
          <strong>uitsluitend lokaal</strong> opgeslagen in jouw browser.
        </p>
        <p style={{ lineHeight: 1.6 }}>
          De applicatie is ontworpen volgens één kernprincipe:{" "}
          <strong>jij behoudt de controle</strong>. Geen stille synchronisatie,
          geen externe opslag. Alleen jij beslist of en wanneer gegevens worden
          gedeeld, geback-upt of verwijderd.
        </p>
      </div>

      {/* Opslagwijze */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          🔒 Huidige opslagwijze
        </h2>
        <p>
          De applicatie gebruikt <code>localStorage</code> — een beveiligde
          opslagruimte binnen je eigen browser. Dit betekent:
        </p>
        <ul style={{ lineHeight: 1.6, paddingLeft: 24 }}>
          <li>Je data blijft op je eigen apparaat, niet op een server.</li>
          <li>
            Verwijder je browserdata, dan verdwijnt ook je informatie uit de
            applicatie.
          </li>
          <li>
            Gebruik je een andere computer of browser, dan begin je opnieuw met
            een lege omgeving.
          </li>
        </ul>
      </div>

      {/* Export / Backup */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          🧰 Back-up maken (export)
        </h2>
        <p style={{ marginBottom: 12 }}>
          Met onderstaande knop kun je een back-up van je gegevens downloaden
          als <strong>JSON-bestand</strong>. Bewaar dit bestand op een veilige
          plek, bijvoorbeeld op een USB-stick of in een digitale kluis.
        </p>
        <ExportButton className="btn" />
      </div>

      {/* Toekomstige opties */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          🚀 Vooruitblik
        </h2>
        <p style={{ marginBottom: 8 }}>
          In een volgende versie kun je zelf kiezen welk beveiligingsniveau je
          wilt gebruiken:
        </p>
        <ul style={{ lineHeight: 1.6, paddingLeft: 24 }}>
          <li>
            🔐 <strong>Local secure mode</strong> — alles blijft in de browser
          </li>
          <li>
            ☁️ <strong>Cloud sync</strong> — end-to-end encryptie met eigen
            sleutel
          </li>
          <li>
            🧾 <strong>Audit trail</strong> — vastlegging van elke wijziging
          </li>
          <li>
            🧭 <strong>Eigen sleutelbeheer</strong> — volledige controle over
            decryptie
          </li>
        </ul>
        <p style={{ marginTop: 8 }}>
          Tot die tijd kun je met een gerust hart testen, wetende dat alle data
          alleen op jouw apparaat blijft.
        </p>
      </div>

      <footer style={{ marginTop: 32, fontSize: "0.9em", color: "#666" }}>
        <p>Versie 1.0 — Local Secure Mode</p>
      </footer>
    </div>
  );
}


