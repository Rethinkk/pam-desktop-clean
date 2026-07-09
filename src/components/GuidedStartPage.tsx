import React from "react";
import { useNavigate } from "react-router-dom";
import { assetRepository, documentRepository, personRepository } from "../storage/repositories";

type TargetTab =
  | "assets"
  | "asset-register"
  | "docs"
  | "doc-register"
  | "people"
  | "reporting"
  | "security";

type ActionCard = {
  title: string;
  text: string;
  cta: string;
  tab: TargetTab;
};

const blue = "#1E3A5F";
const accent = "#24508c";
const border = "#d8e0ea";

const actionCards: ActionCard[] = [
  {
    title: "Begin met assets",
    text: "Leg woning, voertuig, verzekering, rekening of ander belangrijk bezit vast.",
    cta: "Asset toevoegen",
    tab: "asset-register",
  },
  {
    title: "Orden documenten",
    text: "Bewaar contracten, polissen, facturen en scans bij de juiste onderdelen.",
    cta: "Document toevoegen",
    tab: "docs",
  },
  {
    title: "Voeg mensen toe",
    text: "Noteer familie, adviseurs, executeurs of andere belangrijke contactpersonen.",
    cta: "Persoon toevoegen",
    tab: "people",
  },
  {
    title: "Bekijk overzicht",
    text: "Controleer wat al is ingevuld en maak een rapport of export voor jezelf.",
    cta: "Naar rapportage",
    tab: "reporting",
  },
];

function safeCounts() {
  try {
    return {
      assets: assetRepository.load().assets.length,
      documents: documentRepository.all().length,
      people: personRepository.all().length,
    };
  } catch {
    return { assets: 0, documents: 0, people: 0 };
  }
}

export default function GuidedStartPage() {
  const navigate = useNavigate();
  const counts = React.useMemo(() => safeCounts(), []);

  const openTab = React.useCallback(
    (tab: TargetTab) => {
      navigate("/assets", { state: { tab } });
    },
    [navigate],
  );

  return (
    <main
      style={{
        minHeight: "calc(100vh - 40px)",
        background: "#f7f9fb",
        color: blue,
        borderRadius: 18,
        boxShadow: "0 18px 50px rgba(0,0,0,0.22)",
        overflow: "hidden",
      }}
    >
      <section
        style={{
          background: blue,
          color: "#fff",
          padding: "34px clamp(20px, 5vw, 56px)",
        }}
      >
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <p
            style={{
              margin: "0 0 12px",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              fontWeight: 700,
              fontSize: 13,
              opacity: 0.9,
            }}
          >
            PAM - Personal Asset Manager
          </p>
          <h1
            style={{
              margin: 0,
              maxWidth: 820,
              fontSize: "clamp(34px, 6vw, 70px)",
              lineHeight: 1.04,
              letterSpacing: 0,
            }}
          >
            Rust en overzicht in alles wat belangrijk is.
          </h1>
          <p
            style={{
              margin: "18px 0 0",
              maxWidth: 720,
              fontSize: "clamp(17px, 2.2vw, 22px)",
              lineHeight: 1.55,
              color: "#dbeafe",
            }}
          >
            PAM helpt je belangrijke assets, bezittingen, documenten en
            contactpersonen stap voor stap vast te leggen. Voor jezelf, en voor
            de mensen die ooit moeten weten wat er is en waar het staat.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 26 }}>
            <button
              onClick={() => openTab("asset-register")}
              style={{
                background: "#fff",
                color: blue,
                border: 0,
                borderRadius: 10,
                padding: "13px 18px",
                fontWeight: 800,
              }}
            >
              Begin met invullen
            </button>
            <button
              onClick={() => openTab("assets")}
              style={{
                background: "rgba(255,255,255,0.12)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.35)",
                borderRadius: 10,
                padding: "13px 18px",
                fontWeight: 800,
              }}
            >
              Bekijk mijn overzicht
            </button>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "28px clamp(16px, 4vw, 40px)" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div style={statStyle}>
            <strong style={statNumberStyle}>{counts.assets}</strong>
            <span>assets vastgelegd</span>
          </div>
          <div style={statStyle}>
            <strong style={statNumberStyle}>{counts.documents}</strong>
            <span>documenten gekoppeld</span>
          </div>
          <div style={statStyle}>
            <strong style={statNumberStyle}>{counts.people}</strong>
            <span>mensen toegevoegd</span>
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            border: `1px solid ${border}`,
            borderRadius: 12,
            padding: "18px 20px",
            marginBottom: 18,
          }}
        >
          <h2 style={{ margin: "0 0 8px", fontSize: 22 }}>Waar helpt PAM bij?</h2>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
            Niet alles hoeft vandaag compleet. PAM is bedoeld om orde te brengen
            in kleine stappen: eerst wat je weet, later aanvullen wat ontbreekt.
            Zo groeit je persoonlijke overzicht zonder dat het als administratie
            voelt.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 14,
          }}
        >
          {actionCards.map((card) => (
            <button
              key={card.title}
              onClick={() => openTab(card.tab)}
              style={{
                display: "block",
                textAlign: "left",
                background: "#fff",
                color: blue,
                border: `1px solid ${border}`,
                borderRadius: 12,
                padding: 18,
                boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
                cursor: "pointer",
              }}
            >
              <strong style={{ display: "block", fontSize: 19, marginBottom: 8 }}>
                {card.title}
              </strong>
              <span style={{ display: "block", color: "#52677d", lineHeight: 1.55 }}>
                {card.text}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  marginTop: 14,
                  color: accent,
                  fontWeight: 800,
                }}
              >
                {card.cta}
              </span>
            </button>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
            marginTop: 22,
            color: "#52677d",
            fontSize: 14,
          }}
        >
          <span>PAM is local-first ontworpen. Cloud-sync komt pas met expliciete beveiliging.</span>
          <button className="btn-secondary" onClick={() => openTab("security")}>
            Veiligheid bekijken
          </button>
        </div>
      </section>
    </main>
  );
}

const statStyle: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${border}`,
  borderRadius: 12,
  padding: "16px 18px",
  color: blue,
};

const statNumberStyle: React.CSSProperties = {
  display: "block",
  fontSize: 28,
  lineHeight: 1,
  marginBottom: 6,
};
