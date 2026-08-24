import React from "react";
import { useNavigate } from "react-router-dom";
import PublicFooter from "./PublicFooter";

const deepNavy = "#123052";
const pamNavy = "#173A61";
const olive = "#687348";
const warmIvory = "#F8F5EE";
const softWhite = "#FCFBF8";
const slateBlue = "#60718A";
const warmGrey = "#DEDCD5";
const contentWidth = 900;
const pagePadding = "clamp(24px, 5vw, 64px)";

export default function AccountAccessPage() {
  const navigate = useNavigate();

  return (
    <>
    <main
      style={{
        width: "min(calc(100% - clamp(22px, 8vw, 92px)), 1040px)",
        minHeight: "calc(100vh - 40px)",
        margin: "0 auto",
        background: warmIvory,
        color: deepNavy,
        borderRadius: 18,
        boxShadow: "0 18px 50px rgba(0,0,0,0.22)",
        overflow: "hidden",
      }}
    >
      <style>{`
        @media (max-width: 760px) {
          .pam-account-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <section
        style={{
          maxWidth: contentWidth,
          margin: "0 auto",
          padding: `34px ${pagePadding} 46px`,
        }}
      >
        <button
          onClick={() => navigate("/intro")}
          style={{
            alignItems: "center",
            background: "transparent",
            border: `1px solid ${pamNavy}`,
            borderRadius: 999,
            color: pamNavy,
            display: "inline-flex",
            gap: 10,
            padding: "9px 18px",
            fontSize: 16,
            fontWeight: 680,
          }}
        >
          <span style={{ fontSize: 22, lineHeight: 1 }}>←</span>
          Terug naar introductie
        </button>

        <div
          className="pam-account-grid"
          style={{
            alignItems: "center",
            display: "grid",
            gap: "clamp(28px, 5vw, 54px)",
            gridTemplateColumns: "minmax(0, 1fr) minmax(300px, 380px)",
            marginTop: "clamp(46px, 7vw, 78px)",
          }}
        >
          <div>
            <p
              style={{
                color: olive,
                fontSize: "clamp(12px, 1.3vw, 15px)",
                fontWeight: 780,
                letterSpacing: "0.28em",
                margin: "0 0 16px",
                textTransform: "uppercase",
              }}
            >
              Verder met PAM
            </p>
            <h1
              style={{
                color: pamNavy,
                fontSize: "clamp(38px, 5.6vw, 62px)",
                fontWeight: 780,
                letterSpacing: "-0.035em",
                lineHeight: 1.04,
                margin: 0,
                maxWidth: 640,
              }}
            >
              Klaar om je overzicht op te bouwen?
            </h1>
            <p
              style={{
                color: slateBlue,
                fontSize: "clamp(16px, 1.8vw, 19px)",
                lineHeight: 1.55,
                margin: "24px 0 0",
                maxWidth: 610,
              }}
            >
              Maak een PAM-account aan of log in om veilig verder te gaan.
              Daarna begin je rustig met je eerste asset en groeit je overzicht
              stap voor stap.
            </p>
          </div>

          <div
            style={{
              background: softWhite,
              border: `1px solid ${warmGrey}`,
              borderRadius: 18,
              boxShadow: "0 12px 28px rgba(18,48,82,0.08)",
              padding: 24,
            }}
          >
            <button
              onClick={() => navigate("/login", { state: { mode: "register", from: "/start" } })}
              style={{
                background: "linear-gradient(180deg, #74815a 0%, #4f5c36 100%)",
                border: "1px solid #4f5c36",
                borderRadius: 14,
                color: "#fff",
                fontSize: 16,
                fontWeight: 780,
                padding: "14px 18px",
                width: "100%",
              }}
            >
              Maak mijn PAM-account
            </button>

            <button
              onClick={() => navigate("/login", { state: { mode: "login", from: "/start" } })}
              style={{
                background: softWhite,
                border: `1px solid ${warmGrey}`,
                borderRadius: 14,
                color: pamNavy,
                fontSize: 16,
                fontWeight: 760,
                marginTop: 12,
                padding: "14px 18px",
                width: "100%",
              }}
            >
              Ik heb al een account
            </button>

            <div
              style={{
                background: "#F3F1EA",
                border: `1px solid ${warmGrey}`,
                borderRadius: 14,
                color: slateBlue,
                fontSize: 14,
                lineHeight: 1.5,
                marginTop: 18,
                padding: 16,
              }}
            >
              Je gegevens blijven van jou. PAM is ontworpen als local-first
              persoonlijke kluis, met een veilige cloudlaag zodra je die wilt
              gebruiken.
            </div>
          </div>
        </div>
      </section>
    </main>
    <PublicFooter />
    </>
  );
}
