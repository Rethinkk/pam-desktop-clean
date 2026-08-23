import React from "react";
import { useNavigate } from "react-router-dom";

const blue = "#1E3A5F";
const accent = "#24508c";
const border = "#d8e0ea";

const needs = [
  "Rust krijgen in alles wat belangrijk is.",
  "Assets, documenten en betrokken mensen op één plek bij elkaar brengen.",
  "Familie, adviseurs of executeurs later duidelijkheid geven.",
  "Zelf eigenaar blijven van gevoelige informatie en toestemming.",
];

const promises = [
  {
    title: "PAM brengt orde",
    text: "U begint met uw assets. Daarna koppelt u documenten, personen en toestemming op een manier die logisch blijft.",
  },
  {
    title: "PAM blijft menselijk",
    text: "Niet alles hoeft in één keer. PAM helpt stap voor stap, zonder dat het voelt als zware administratie.",
  },
  {
    title: "PAM is gebouwd voor vertrouwen",
    text: "De basis is local-first, met cloud alleen waar dat bewust, veilig en controleerbaar wordt ingericht.",
  },
];

export default function IntroPage() {
  const navigate = useNavigate();

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
          padding: "34px clamp(20px, 5vw, 58px)",
        }}
      >
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.28)",
              borderRadius: 999,
              padding: "8px 13px",
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 24,
            }}
          >
            Terug naar PAM
          </button>
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
            Waarom PAM bestaat
          </p>
          <h1
            style={{
              margin: 0,
              maxWidth: 860,
              fontSize: "clamp(34px, 6vw, 68px)",
              lineHeight: 1.04,
              letterSpacing: 0,
            }}
          >
            Grip op wat waarde heeft, juist op momenten dat overzicht telt.
          </h1>
          <p
            style={{
              margin: "20px 0 0",
              maxWidth: 760,
              color: "#dbeafe",
              fontSize: "clamp(17px, 2.2vw, 22px)",
              lineHeight: 1.6,
            }}
          >
            PAM is geschreven vanuit een herkenbare behoefte: weten wat er is,
            waar het staat, wie erbij hoort en wie er later op mag vertrouwen.
            Voor uzelf, voor uw naasten en voor professionals die u helpen.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: 1040, margin: "0 auto", padding: "30px clamp(16px, 4vw, 40px)" }}>
        <div
          style={{
            background: "#fff",
            border: `1px solid ${border}`,
            borderRadius: 12,
            padding: "20px 22px",
            marginBottom: 18,
          }}
        >
          <h2 style={{ margin: "0 0 10px", fontSize: 24 }}>Welke behoefte vervult PAM?</h2>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.7, fontSize: 16 }}>
            Veel belangrijke informatie leeft verspreid: in mappen, mailboxen,
            bankomgevingen, hoofden van familieleden of dossiers van adviseurs.
            PAM maakt daar een persoonlijk overzicht van. Niet om alles complexer
            te maken, maar juist om rust, continuïteit en vertrouwen te geven.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 10,
              marginTop: 18,
            }}
          >
            {needs.map((need) => (
              <div
                key={need}
                style={{
                  background: "#f8fafc",
                  border: `1px solid ${border}`,
                  borderRadius: 10,
                  padding: "12px 14px",
                  color: "#334155",
                  lineHeight: 1.45,
                  fontWeight: 650,
                }}
              >
                {need}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 14,
            marginBottom: 22,
          }}
        >
          {promises.map((item) => (
            <div
              key={item.title}
              style={{
                background: "#fff",
                border: `1px solid ${border}`,
                borderRadius: 12,
                padding: 18,
                boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
              }}
            >
              <h3 style={{ margin: "0 0 8px", fontSize: 19 }}>{item.title}</h3>
              <p style={{ margin: 0, color: "#52677d", lineHeight: 1.6 }}>
                {item.text}
              </p>
            </div>
          ))}
        </div>

        <div
          style={{
            alignItems: "center",
            background: "#eef5ff",
            border: `1px solid #c7d8ee`,
            borderRadius: 12,
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            justifyContent: "space-between",
            padding: "18px 20px",
          }}
        >
          <div>
            <strong style={{ display: "block", fontSize: 18, marginBottom: 4 }}>
              Klaar om PAM in te richten?
            </strong>
            <span style={{ color: "#52677d", lineHeight: 1.5 }}>
              Begin rustig. Eén asset is genoeg om overzicht op te bouwen.
            </span>
          </div>
          <button
            onClick={() => navigate("/start")}
            style={{
              background: accent,
              color: "#fff",
              border: 0,
              borderRadius: 999,
              padding: "13px 20px",
              fontWeight: 800,
              boxShadow: "0 8px 20px rgba(36,80,140,0.22)",
            }}
          >
            Verder met PAM
          </button>
        </div>
      </section>
    </main>
  );
}
