import React from "react";
import { Link, useParams } from "react-router-dom";
import PublicFooter, {
  findPublicFooterItem,
  publicPageColors,
  PublicPageFrame,
} from "./PublicFooter";

const { deepNavy, olive, pamNavy, slateBlue, softWhite, warmGrey } = publicPageColors;

export default function PublicInfoPage() {
  const { slug } = useParams();
  const item = findPublicFooterItem(slug);

  return (
    <>
      <PublicPageFrame>
        <section
          style={{
            margin: "0 auto",
            maxWidth: 900,
            padding: "34px clamp(24px, 5vw, 64px) 46px",
          }}
        >
          <Link
            to="/intro"
            style={{
              alignItems: "center",
              border: `1px solid ${pamNavy}`,
              borderRadius: 999,
              color: pamNavy,
              display: "inline-flex",
              gap: 10,
              padding: "9px 18px",
              textDecoration: "none",
              fontSize: 16,
              fontWeight: 680,
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>←</span>
            Terug naar PAM
          </Link>

          <p
            style={{
              color: olive,
              fontSize: "clamp(12px, 1.3vw, 15px)",
              fontWeight: 780,
              letterSpacing: "0.28em",
              margin: "clamp(44px, 6vw, 66px) 0 16px",
              textTransform: "uppercase",
            }}
          >
            PAM informatie
          </p>

          <h1
            style={{
              color: deepNavy,
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(38px, 5.4vw, 62px)",
              fontWeight: 560,
              letterSpacing: "-0.025em",
              lineHeight: 1.04,
              margin: 0,
              maxWidth: 760,
            }}
          >
            {item?.title ?? "Pagina niet gevonden"}
          </h1>

          <div
            style={{
              background: olive,
              height: 2,
              margin: "30px 0 26px",
              width: 58,
            }}
          />

          <p
            style={{
              color: slateBlue,
              fontSize: "clamp(17px, 1.9vw, 20px)",
              lineHeight: 1.55,
              margin: 0,
              maxWidth: 740,
            }}
          >
            {item?.intro ?? "Deze PAM-pagina bestaat nog niet."}
          </p>

          {item ? (
            <div style={{ display: "grid", gap: 14, marginTop: 34 }}>
              {item.sections.map((section) => (
                <article
                  key={section.heading}
                  style={{
                    background: softWhite,
                    border: `1px solid ${warmGrey}`,
                    borderRadius: 15,
                    padding: "20px 24px",
                  }}
                >
                  <h2
                    style={{
                      color: deepNavy,
                      fontSize: "clamp(19px, 2vw, 23px)",
                      lineHeight: 1.2,
                      margin: "0 0 8px",
                    }}
                  >
                    {section.heading}
                  </h2>
                  <p
                    style={{
                      color: slateBlue,
                      fontSize: "clamp(15px, 1.7vw, 18px)",
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {section.body}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <Link
              to="/"
              style={{
                color: pamNavy,
                display: "inline-block",
                fontWeight: 760,
                marginTop: 28,
              }}
            >
              Terug naar de startpagina
            </Link>
          )}
        </section>
      </PublicPageFrame>
      <PublicFooter />
    </>
  );
}
