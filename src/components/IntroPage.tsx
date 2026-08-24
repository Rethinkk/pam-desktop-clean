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

const cards = [
  {
    icon: "□",
    label: "1. Overzicht",
    title: "Alles wat belangrijk is overzichtelijk bij elkaar.",
    text: "Van documenten en bezittingen tot belangrijke informatie en wensen. Op één veilige plek.",
  },
  {
    icon: "◎",
    label: "2. Controle",
    title: "Jij bepaalt wie wat mag zien.",
    text: "Je kiest zelf wie toegang krijgt en tot welke informatie. Altijd onder jouw regie.",
  },
  {
    icon: "↻",
    label: "3. Continuïteit",
    title: "Makkelijk aanpassen als je leven verandert.",
    text: "Nieuwe situatie? Pas het eenvoudig aan. PAM groeit mee met jouw leven.",
  },
  {
    icon: "♡",
    label: "4. Duidelijkheid",
    title: "Duidelijkheid voor de mensen die je vertrouwt.",
    text: "Wanneer het jou even niet lukt, weten zij wat belangrijk is en wat er moet gebeuren.",
  },
];

export default function IntroPage() {
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
        @media (max-width: 680px) {
          .pam-intro-content {
            padding-left: 20px !important;
            padding-right: 20px !important;
          }

          .pam-intro-card {
            grid-template-columns: 1fr !important;
            padding: 16px !important;
          }

          .pam-intro-card-label,
          .pam-intro-card-copy {
            border-left: 0 !important;
            padding-left: 0 !important;
          }

          .pam-intro-card-label {
            padding-top: 2px !important;
          }
        }
      `}</style>
      <section
        style={{
          padding: "34px 0 28px",
        }}
      >
        <div
          className="pam-intro-content"
          style={{
            maxWidth: contentWidth,
            margin: "0 auto",
            paddingLeft: pagePadding,
            paddingRight: pagePadding,
          }}
        >
          <button
            onClick={() => navigate("/")}
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
            Terug naar PAM
          </button>

          <div style={{ marginTop: "clamp(34px, 5vw, 50px)", maxWidth: 720 }}>
            <p
              style={{
                color: olive,
                fontSize: "clamp(12px, 1.3vw, 15px)",
                fontWeight: 760,
                letterSpacing: "0.28em",
                margin: "0 0 16px",
                textTransform: "uppercase",
              }}
            >
              Waarom PAM bestaat
            </p>
            <h1
              style={{
                color: deepNavy,
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "clamp(42px, 5.8vw, 68px)",
                fontWeight: 560,
                letterSpacing: "-0.025em",
                lineHeight: 1.03,
                margin: 0,
              }}
            >
              Grip op wat waarde heeft, juist op momenten dat overzicht telt.
            </h1>

            <div
              style={{
                background: olive,
                height: 2,
                margin: "32px 0 26px",
                width: 58,
              }}
            />

            <div
              style={{
                color: deepNavy,
                fontSize: "clamp(16px, 1.9vw, 20px)",
                lineHeight: 1.55,
                maxWidth: 700,
              }}
            >
              <p style={{ margin: "0 0 20px" }}>
                Het leven loopt niet altijd zoals gepland. Soms verandert er
                iets, soms heb je even andere dingen aan je hoofd. En soms wil
                je gewoon weten dat alles goed geregeld is.
              </p>
              <p style={{ margin: 0 }}>
                PAM brengt wat belangrijk is bij elkaar. Voor jezelf, voor de
                mensen om je heen en voor de momenten waarop je wel wat overzicht
                kunt gebruiken.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          borderTop: `1px solid ${warmGrey}`,
          padding: "28px 0 42px",
        }}
      >
        <div
          className="pam-intro-content"
          style={{
            maxWidth: contentWidth,
            margin: "0 auto",
            paddingLeft: pagePadding,
            paddingRight: pagePadding,
          }}
        >
          <h2
            style={{
              color: deepNavy,
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(25px, 3vw, 34px)",
              fontWeight: 560,
              lineHeight: 1.1,
              margin: "0 0 22px",
            }}
          >
            Wat PAM je brengt
          </h2>

          <div style={{ display: "grid", gap: 14 }}>
            {cards.map((card) => (
              <div
                key={card.title}
                className="pam-intro-card"
                style={{
                  alignItems: "center",
                  background: softWhite,
                  border: `1px solid ${warmGrey}`,
                  borderRadius: 15,
                  display: "grid",
                  gap: 20,
                  gridTemplateColumns: "94px minmax(150px, 210px) 1fr",
                  padding: "18px 24px",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    alignItems: "center",
                    background: "#EFEEE8",
                    borderRadius: "50%",
                    color: olive,
                    display: "flex",
                    fontSize: 30,
                    height: 58,
                    justifyContent: "center",
                    width: 58,
                  }}
                >
                  {card.icon}
                </div>
                <div
                  className="pam-intro-card-label"
                  style={{
                    borderLeft: `1px solid ${warmGrey}`,
                    color: olive,
                    fontSize: "clamp(17px, 1.8vw, 20px)",
                    fontWeight: 780,
                    letterSpacing: "0.015em",
                    paddingLeft: 20,
                    textTransform: "uppercase",
                  }}
                >
                  {card.label}
                </div>
                <div
                  className="pam-intro-card-copy"
                  style={{
                    borderLeft: `1px solid ${warmGrey}`,
                    paddingLeft: 20,
                  }}
                >
                  <h3
                    style={{
                      color: deepNavy,
                      fontSize: "clamp(17px, 1.8vw, 20px)",
                      fontWeight: 740,
                      lineHeight: 1.2,
                      margin: "0 0 6px",
                    }}
                  >
                    {card.title}
                  </h3>
                  <p
                    style={{
                      color: deepNavy,
                      fontSize: "clamp(15px, 1.6vw, 17px)",
                      lineHeight: 1.45,
                      margin: 0,
                    }}
                  >
                    {card.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              alignItems: "center",
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              justifyContent: "flex-start",
              marginTop: 26,
            }}
          >
            <button
              onClick={() => navigate("/account")}
              style={{
                background: pamNavy,
                border: 0,
                borderRadius: 999,
                color: "#fff",
                fontSize: 16,
                fontWeight: 760,
                padding: "11px 20px",
                boxShadow: "0 8px 18px rgba(18,48,82,0.16)",
              }}
            >
              leer PAM kennen
            </button>
          </div>
        </div>
      </section>
    </main>
    <PublicFooter />
    </>
  );
}
