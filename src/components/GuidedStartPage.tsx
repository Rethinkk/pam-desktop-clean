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
const contentWidth = 980;
const pagePadding = "clamp(28px, 7vw, 86px)";

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
          .pam-start-actions,
          .pam-start-stats {
            grid-template-columns: 1fr !important;
          }

          .pam-start-card {
            grid-template-columns: 72px 1fr 22px !important;
            padding: 18px !important;
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
          padding: `38px ${pagePadding} 28px`,
        }}
      >
        <nav
          style={{
            alignItems: "center",
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: "clamp(44px, 7vw, 72px)",
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
              fontSize: 20,
              fontWeight: 750,
            }}
          >
            <span style={{ fontSize: 36, lineHeight: 1 }}>←</span>
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
              fontSize: 24,
              fontWeight: 700,
              height: 48,
              justifyContent: "center",
              width: 48,
            }}
          >
            ?
          </button>
        </nav>

        <p
          style={{
            color: pamNavy,
            fontSize: "clamp(14px, 1.7vw, 20px)",
            fontWeight: 850,
            letterSpacing: "0.34em",
            margin: "0 0 20px",
            textTransform: "uppercase",
          }}
        >
          PAM - Personal Asset Manager
        </p>

        <h1
          style={{
            color: pamNavy,
            fontSize: "clamp(58px, 9vw, 104px)",
            fontWeight: 850,
            letterSpacing: "-0.04em",
            lineHeight: 0.96,
            margin: 0,
            maxWidth: 790,
          }}
        >
          Begin met wat waarde heeft.
        </h1>

        <p
          style={{
            color: pamNavy,
            fontSize: "clamp(20px, 2.5vw, 28px)",
            lineHeight: 1.45,
            margin: "32px 0 0",
            maxWidth: 800,
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
            gap: 24,
            marginTop: 38,
            maxWidth: 860,
          }}
        >
          <button
            onClick={() => openTab("asset-register")}
            style={{
              alignItems: "center",
              background: pamNavy,
              border: 0,
              borderRadius: 18,
              boxShadow: "0 14px 30px rgba(18,48,82,0.22)",
              color: "#fff",
              display: "inline-flex",
              gap: 18,
              justifyContent: "center",
              minHeight: 84,
              padding: "18px 28px",
              fontSize: "clamp(19px, 2vw, 25px)",
              fontWeight: 850,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                alignItems: "center",
                border: "2px solid rgba(255,255,255,0.9)",
                borderRadius: "50%",
                display: "flex",
                fontSize: 24,
                height: 34,
                justifyContent: "center",
                width: 34,
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
              borderRadius: 18,
              color: pamNavy,
              display: "inline-flex",
              gap: 18,
              justifyContent: "center",
              minHeight: 84,
              padding: "18px 28px",
              fontSize: "clamp(19px, 2vw, 25px)",
              fontWeight: 850,
            }}
          >
            <span aria-hidden="true" style={{ color: pamNavy, fontSize: 34 }}>
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
            borderRadius: 20,
            boxShadow: "0 16px 38px rgba(18,48,82,0.08)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            marginTop: 42,
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
          padding: `8px ${pagePadding} 54px`,
        }}
      >
        <h2
          style={{
            color: pamNavy,
            fontSize: "clamp(30px, 4vw, 42px)",
            lineHeight: 1.1,
            margin: "0 0 14px",
          }}
        >
          Bouw je overzicht stap voor stap
        </h2>
        <p
          style={{
            color: pamNavy,
            fontSize: "clamp(18px, 2.1vw, 24px)",
            lineHeight: 1.45,
            margin: "0 0 36px",
            maxWidth: 840,
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
                borderRadius: 20,
                boxShadow: "0 12px 30px rgba(18,48,82,0.07)",
                color: pamNavy,
                cursor: "pointer",
                display: "grid",
                gap: 24,
                gridTemplateColumns: "100px 1fr 34px",
                padding: "28px 34px",
                textAlign: "left",
              }}
            >
              <IconBubble icon={card.icon} />
              <span>
                <strong
                  style={{
                    display: "block",
                    fontSize: "clamp(22px, 2.7vw, 31px)",
                    lineHeight: 1.15,
                    marginBottom: 8,
                  }}
                >
                  {card.title}
                </strong>
                <span
                  style={{
                    color: pamNavy,
                    display: "block",
                    fontSize: "clamp(17px, 2.1vw, 24px)",
                    lineHeight: 1.38,
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
                  fontSize: 54,
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
            borderRadius: 20,
            color: pamNavy,
            cursor: "pointer",
            display: "grid",
            gap: 24,
            gridTemplateColumns: "100px 1fr",
            marginTop: 32,
            padding: "30px 34px",
            textAlign: "left",
            width: "100%",
          }}
        >
          <IconBubble icon="◇" />
          <span>
            <strong
              style={{
                display: "block",
                fontSize: "clamp(22px, 2.7vw, 31px)",
                lineHeight: 1.15,
                marginBottom: 8,
              }}
            >
              Jouw informatie blijft van jou
            </strong>
            <span
              style={{
                color: pamNavy,
                display: "block",
                fontSize: "clamp(17px, 2.1vw, 24px)",
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
        gap: 22,
        gridTemplateColumns: "90px 1fr",
        padding: "34px 32px",
      }}
    >
      <IconBubble icon={icon} />
      <div>
        <strong
          style={{
            color: pamNavy,
            display: "block",
            fontSize: "clamp(44px, 6vw, 58px)",
            lineHeight: 0.95,
            marginBottom: 12,
          }}
        >
          {count}
        </strong>
        <span style={{ color: pamNavy, fontSize: "clamp(18px, 2vw, 24px)" }}>
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
        fontSize: 42,
        height: 78,
        justifyContent: "center",
        width: 78,
      }}
    >
      {icon}
    </span>
  );
}
