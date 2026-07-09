import React from "react";
import { useNavigate } from "react-router-dom";

const blue = "#1E3A5F";

export default function FrontPage() {
  const navigate = useNavigate();

  return (
    <main
      onClick={() => navigate("/start")}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          navigate("/start");
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Open PAM"
      style={{
        minHeight: "calc(100vh - 40px)",
        background: blue,
        color: "#fff",
        borderRadius: 18,
        boxShadow: "0 18px 50px rgba(0,0,0,0.22)",
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        cursor: "pointer",
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
      </section>
    </main>
  );
}
