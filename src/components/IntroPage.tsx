import React from "react";
import { useNavigate } from "react-router-dom";

const deepNavy = "#123052";
const pamNavy = "#173A61";
const olive = "#687348";
const warmIvory = "#F8F5EE";
const softWhite = "#FCFBF8";
const slateBlue = "#60718A";
const warmGrey = "#DEDCD5";
const contentWidth = 980;
const pagePadding = "clamp(28px, 7vw, 86px)";

const cards = [
  {
    icon: "□",
    title: "Alles wat belangrijk is overzichtelijk bij elkaar.",
    text: "Van documenten en bezittingen tot belangrijke informatie en wensen. Op één veilige plek.",
  },
  {
    icon: "◎",
    title: "Jij bepaalt wie wat mag zien.",
    text: "Je kiest zelf wie toegang krijgt en tot welke informatie. Altijd onder jouw regie.",
  },
  {
    icon: "✎",
    title: "Makkelijk aanpassen als je leven verandert.",
    text: "Nieuwe situatie? Pas het eenvoudig aan. PAM groeit mee met jouw leven.",
  },
  {
    icon: "♡",
    title: "Duidelijkheid voor de mensen die je vertrouwt.",
    text: "Wanneer het jou even niet lukt, weten zij wat belangrijk is en wat er moet gebeuren.",
  },
];

export default function IntroPage() {
  const navigate = useNavigate();

  return (
    <main
      style={{
        width: "min(calc(100% - clamp(22px, 8vw, 92px)), 1120px)",
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
          .pam-intro-card {
            grid-template-columns: 1fr !important;
            padding: 18px !important;
          }
        }
      `}</style>
      <section
        style={{
          maxWidth: contentWidth,
          margin: "0 auto",
          padding: `44px ${pagePadding} 36px`,
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
            padding: "11px 24px",
            fontSize: 18,
            fontWeight: 650,
          }}
        >
          <span style={{ fontSize: 24, lineHeight: 1 }}>←</span>
          Terug naar PAM
        </button>

        <div style={{ marginTop: "clamp(42px, 7vw, 72px)", maxWidth: 760 }}>
          <p
            style={{
              color: olive,
              fontSize: "clamp(16px, 2vw, 22px)",
              fontWeight: 800,
              letterSpacing: "0.32em",
              margin: "0 0 22px",
              textTransform: "uppercase",
            }}
          >
            Waarom PAM bestaat
          </p>
          <h1
            style={{
              color: deepNavy,
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(52px, 8vw, 92px)",
              fontWeight: 650,
              letterSpacing: "-0.035em",
              lineHeight: 0.98,
              margin: 0,
            }}
          >
            Grip op wat waarde heeft, juist op momenten dat overzicht telt.
          </h1>

          <div
            style={{
              background: olive,
              height: 3,
              margin: "42px 0 34px",
              width: 72,
            }}
          />

          <div
            style={{
              color: deepNavy,
              fontSize: "clamp(18px, 2.5vw, 25px)",
              lineHeight: 1.55,
              maxWidth: 760,
            }}
          >
            <p style={{ margin: "0 0 24px" }}>
              Het leven loopt niet altijd zoals gepland. Soms verandert er iets,
              soms heb je even andere dingen aan je hoofd. En soms wil je
              gewoon weten dat alles goed geregeld is.
            </p>
            <p style={{ margin: 0 }}>
              PAM brengt wat belangrijk is bij elkaar. Voor jezelf, voor de
              mensen om je heen en voor de momenten waarop je wel wat overzicht
              kunt gebruiken.
            </p>
          </div>
        </div>
      </section>

      <section
        style={{
          borderTop: `1px solid ${warmGrey}`,
          padding: `34px ${pagePadding} 44px`,
        }}
      >
        <div style={{ maxWidth: contentWidth, margin: "0 auto" }}>
          <h2
            style={{
              color: deepNavy,
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(30px, 4vw, 44px)",
              lineHeight: 1.1,
              margin: "0 0 24px",
            }}
          >
            Wat PAM voor je doet
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
                  borderRadius: 16,
                  display: "grid",
                  gap: 22,
                  gridTemplateColumns: "112px 1fr",
                  padding: "22px 28px",
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
                    fontSize: 42,
                    height: 76,
                    justifyContent: "center",
                    width: 76,
                  }}
                >
                  {card.icon}
                </div>
                <div>
                  <h3
                    style={{
                      color: deepNavy,
                      fontSize: "clamp(20px, 2.4vw, 28px)",
                      lineHeight: 1.2,
                      margin: "0 0 6px",
                    }}
                  >
                    {card.title}
                  </h3>
                  <p
                    style={{
                      color: slateBlue,
                      fontSize: "clamp(17px, 2vw, 22px)",
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
              justifyContent: "space-between",
              marginTop: 30,
            }}
          >
            <p style={{ color: slateBlue, fontSize: 18, lineHeight: 1.5, margin: 0 }}>
              Begin rustig. Eén asset is genoeg om overzicht op te bouwen.
            </p>
            <button
              onClick={() => navigate("/start")}
              style={{
                background: pamNavy,
                border: 0,
                borderRadius: 999,
                color: "#fff",
                fontSize: 18,
                fontWeight: 800,
                padding: "14px 24px",
                boxShadow: "0 10px 24px rgba(18,48,82,0.18)",
              }}
            >
              Verder met PAM
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
