import React from "react";
import { useNavigate } from "react-router-dom";
import { assetRepository, documentRepository } from "../storage/repositories";

type TargetTab =
  | "assets"
  | "asset-register"
  | "docs"
  | "doc-register"
  | "people"
  | "reporting"
  | "security";

type ActionCard = {
  icon: string;
  title: string;
  text: string;
  tab: TargetTab;
};

const deepNavy = "#123052";
const pamNavy = "#173A61";
const olive = "#687348";
const warmIvory = "#F8F5EE";
const softWhite = "#FCFBF8";
const warmGrey = "#DEDCD5";
const contentWidth = 900;
const pagePadding = "clamp(24px, 5vw, 64px)";

const actionCards: ActionCard[] = [
  {
    icon: "⌂",
    title: "Begin met je assets",
    text: "Leg een woning, voertuig, rekening, verzekering of ander belangrijk bezit vast.",
    tab: "asset-register",
  },
  {
    icon: "□",
    title: "Koppel documenten",
    text: "Voeg contracten, polissen, facturen en andere documenten toe waar ze thuishoren.",
    tab: "docs",
  },
  {
    icon: "◎",
    title: "Voeg mensen toe",
    text: "Leg vast wie bij een asset betrokken is of wie je vertrouwt.",
    tab: "people",
  },
  {
    icon: "▥",
    title: "Bekijk je overzicht",
    text: "Zie in één oogopslag wat je al hebt vastgelegd en wat nog aandacht verdient.",
    tab: "assets",
  },
];

function safeCounts() {
  try {
    return {
      assets: assetRepository.load().assets.length,
      documents: documentRepository.all().length,
    };
  } catch {
    return { assets: 0, documents: 0 };
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
          .pam-start-actions,
          .pam-start-stats {
            grid-template-columns: 1fr !important;
          }

          .pam-start-card {
            grid-template-columns: 56px 1fr 18px !important;
            padding: 16px !important;
          }

          .pam-start-stat + .pam-start-stat {
            border-left: 0 !important;
            border-top: 1px solid ${warmGrey};
          }
        }
      `}</style>

      <section
        style={{
          maxWidth: contentWidth,
          margin: "0 auto",
          padding: `34px ${pagePadding} 24px`,
        }}
      >
        <nav
          style={{
            alignItems: "center",
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: "clamp(34px, 5vw, 46px)",
          }}
        >
          <button
            onClick={() => navigate("/intro")}
            style={{
              alignItems: "center",
              background: "transparent",
              border: 0,
              color: pamNavy,
              display: "inline-flex",
              gap: 14,
              padding: 0,
              fontSize: 16,
              fontWeight: 720,
            }}
          >
            <span style={{ fontSize: 28, lineHeight: 1 }}>←</span>
            Terug naar introductie
          </button>

          <button
            aria-label="Bekijk veiligheid"
            onClick={() => openTab("security")}
            style={{
              alignItems: "center",
              background: "transparent",
              border: `2px solid ${pamNavy}`,
              borderRadius: "50%",
              color: pamNavy,
              display: "flex",
              fontSize: 19,
              fontWeight: 700,
              height: 38,
              justifyContent: "center",
              width: 38,
            }}
          >
            ?
          </button>
        </nav>

        <p
          style={{
            color: pamNavy,
            fontSize: "clamp(12px, 1.3vw, 15px)",
            fontWeight: 780,
            letterSpacing: "0.28em",
            margin: "0 0 16px",
            textTransform: "uppercase",
          }}
        >
          PAM - Personal Asset Manager
        </p>

        <h1
          style={{
            color: pamNavy,
            fontSize: "clamp(44px, 6.2vw, 72px)",
            fontWeight: 780,
            letterSpacing: "-0.035em",
            lineHeight: 1.02,
            margin: 0,
            maxWidth: 700,
          }}
        >
          Begin met wat waarde heeft.
        </h1>

        <p
          style={{
            color: pamNavy,
            fontSize: "clamp(17px, 2vw, 21px)",
            lineHeight: 1.48,
            margin: "24px 0 0",
            maxWidth: 720,
          }}
        >
          PAM helpt je belangrijke assets stap voor stap vast te leggen. Daarna
          koppel je eenvoudig documenten en mensen aan wat voor jou waarde
          heeft. Zo ontstaat rust en overzicht.
        </p>

        <div
          className="pam-start-actions"
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.95fr",
            gap: 16,
            marginTop: 30,
            maxWidth: 760,
          }}
        >
          <button
            onClick={() => openTab("asset-register")}
            style={{
              alignItems: "center",
              background: pamNavy,
              border: 0,
              borderRadius: 14,
              boxShadow: "0 10px 22px rgba(18,48,82,0.18)",
              color: "#fff",
              display: "inline-flex",
              gap: 12,
              justifyContent: "center",
              minHeight: 62,
              padding: "14px 22px",
              fontSize: "clamp(16px, 1.6vw, 19px)",
              fontWeight: 760,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                alignItems: "center",
                border: "2px solid rgba(255,255,255,0.9)",
                borderRadius: "50%",
                display: "flex",
                fontSize: 18,
                height: 27,
                justifyContent: "center",
                width: 27,
              }}
            >
              +
            </span>
            Eerste asset vastleggen
          </button>

          <button
            onClick={() => openTab("assets")}
            style={{
              alignItems: "center",
              background: "transparent",
              border: `2px solid ${pamNavy}`,
              borderRadius: 14,
              color: pamNavy,
              display: "inline-flex",
              gap: 12,
              justifyContent: "center",
              minHeight: 62,
              padding: "14px 22px",
              fontSize: "clamp(16px, 1.6vw, 19px)",
              fontWeight: 760,
            }}
          >
            <span aria-hidden="true" style={{ color: pamNavy, fontSize: 25 }}>
              ◔
            </span>
            Bekijk mijn overzicht
          </button>
        </div>

        <div
          className="pam-start-stats"
          style={{
            background: softWhite,
            border: `1px solid ${warmGrey}`,
            borderRadius: 16,
            boxShadow: "0 12px 28px rgba(18,48,82,0.06)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            marginTop: 32,
            overflow: "hidden",
          }}
        >
          <StatBlock icon="□" count={counts.assets} label="assets vastgelegd" />
          <StatBlock
            icon="▤"
            count={counts.documents}
            label="documenten gekoppeld"
            withDivider
          />
        </div>
      </section>

      <section
        style={{
          maxWidth: contentWidth,
          margin: "0 auto",
          padding: `4px ${pagePadding} 46px`,
        }}
      >
        <h2
          style={{
            color: pamNavy,
            fontSize: "clamp(25px, 3vw, 33px)",
            fontWeight: 780,
            lineHeight: 1.1,
            margin: "0 0 12px",
          }}
        >
          Bouw je overzicht stap voor stap
        </h2>
        <p
          style={{
            color: pamNavy,
            fontSize: "clamp(16px, 1.8vw, 19px)",
            lineHeight: 1.48,
            margin: "0 0 28px",
            maxWidth: 760,
          }}
        >
          Niet alles hoeft vandaag compleet. Begin met één asset. Later vul je
          documenten, personen en extra details aan. Zo groeit je persoonlijke
          overzicht zonder dat het als administratie voelt.
        </p>

        <div style={{ display: "grid", gap: 16 }}>
          {actionCards.map((card) => (
            <button
              key={card.title}
              className="pam-start-card"
              onClick={() => openTab(card.tab)}
              style={{
                alignItems: "center",
                background: softWhite,
                border: `1px solid ${warmGrey}`,
                borderRadius: 16,
                boxShadow: "0 9px 22px rgba(18,48,82,0.055)",
                color: pamNavy,
                cursor: "pointer",
                display: "grid",
                gap: 18,
                gridTemplateColumns: "74px 1fr 28px",
                padding: "20px 26px",
                textAlign: "left",
              }}
            >
              <IconBubble icon={card.icon} />
              <span>
                <strong
                  style={{
                    display: "block",
                    fontSize: "clamp(19px, 2vw, 23px)",
                    fontWeight: 780,
                    lineHeight: 1.15,
                    marginBottom: 6,
                  }}
                >
                  {card.title}
                </strong>
                <span
                  style={{
                    color: pamNavy,
                    display: "block",
                    fontSize: "clamp(15px, 1.7vw, 18px)",
                    lineHeight: 1.42,
                    maxWidth: 620,
                  }}
                >
                  {card.text}
                </span>
              </span>
              <span
                aria-hidden="true"
                style={{
                  color: pamNavy,
                  fontSize: 38,
                  fontWeight: 300,
                  justifySelf: "end",
                  lineHeight: 1,
                }}
              >
                ›
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => openTab("security")}
          style={{
            alignItems: "center",
            background: "#F3F1EA",
            border: `1px solid ${warmGrey}`,
            borderRadius: 16,
            color: pamNavy,
            cursor: "pointer",
            display: "grid",
            gap: 18,
            gridTemplateColumns: "74px 1fr",
            marginTop: 26,
            padding: "22px 26px",
            textAlign: "left",
            width: "100%",
          }}
        >
          <IconBubble icon="◇" />
          <span>
            <strong
              style={{
                display: "block",
                fontSize: "clamp(19px, 2vw, 23px)",
                fontWeight: 780,
                lineHeight: 1.15,
                marginBottom: 6,
              }}
            >
              Jouw informatie blijft van jou
            </strong>
            <span
              style={{
                color: pamNavy,
                display: "block",
                fontSize: "clamp(15px, 1.7vw, 18px)",
                lineHeight: 1.45,
                maxWidth: 690,
              }}
            >
              PAM is local-first ontworpen. Jij houdt de controle over je
              gegevens en bepaalt wat je deelt en met wie.
            </span>
          </span>
        </button>
      </section>
    </main>
  );
}

function StatBlock({
  icon,
  count,
  label,
  withDivider = false,
}: {
  icon: string;
  count: number;
  label: string;
  withDivider?: boolean;
}) {
  return (
    <div
      className="pam-start-stat"
      style={{
        alignItems: "center",
        borderLeft: withDivider ? `1px solid ${warmGrey}` : 0,
        display: "grid",
        gap: 18,
        gridTemplateColumns: "68px 1fr",
        padding: "24px 28px",
      }}
    >
      <IconBubble icon={icon} />
      <div>
        <strong
          style={{
            color: pamNavy,
            display: "block",
            fontSize: "clamp(34px, 4vw, 42px)",
            fontWeight: 780,
            lineHeight: 0.95,
            marginBottom: 8,
          }}
        >
          {count}
        </strong>
        <span style={{ color: pamNavy, fontSize: "clamp(15px, 1.6vw, 18px)" }}>
          {label}
        </span>
      </div>
    </div>
  );
}

function IconBubble({ icon }: { icon: string }) {
  return (
    <span
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
      {icon}
    </span>
  );
}
