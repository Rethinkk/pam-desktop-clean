import React from "react";
import { useNavigate } from "react-router-dom";

const blue = "#1E3A5F";

export default function FrontPage() {
  const navigate = useNavigate();

  return (
    <main
      style={{
        minHeight: "calc(100vh - 40px)",
        background: blue,
        color: "#fff",
        borderRadius: 18,
        boxShadow: "0 18px 50px rgba(0,0,0,0.22)",
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        padding: "32px 20px",
      }}
    >
      <section>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(72px, 18vw, 190px)",
            lineHeight: 0.92,
            fontWeight: 850,
            letterSpacing: "0.035em",
          }}
        >
          PAM
        </h1>
        <p
          style={{
            margin: "18px 0 0",
            textTransform: "lowercase",
            letterSpacing: "0.18em",
            fontSize: "clamp(13px, 2.5vw, 24px)",
            fontWeight: 700,
            opacity: 0.92,
          }}
        >
          your personal asset manager
        </p>
        <p
          style={{
            margin: "22px auto 0",
            maxWidth: 560,
            fontSize: "clamp(16px, 2.2vw, 22px)",
            lineHeight: 1.55,
            fontWeight: 500,
            opacity: 0.86,
          }}
        >
          PAM helpt u graag verder om uw assets vast te leggen en te beheren.
        </p>
        <button
          onClick={() => navigate("/start")}
          style={{
            margin: "30px auto 0",
            background: "#fff",
            color: blue,
            border: "1px solid rgba(255,255,255,0.8)",
            borderRadius: 999,
            padding: "13px 24px",
            fontSize: "clamp(15px, 2vw, 18px)",
            fontWeight: 800,
            boxShadow: "0 10px 28px rgba(0,0,0,0.18)",
          }}
        >
          PAM nodigt u uit
        </button>
      </section>
    </main>
  );
}
