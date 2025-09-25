import React from "react";
import { useNavigate } from "react-router-dom";

export default function FrontPage() {
  const navigate = useNavigate();

  // Blauw zoals eerder gebruikt
  const blue = "#003366";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: blue,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        position: "relative",
        padding: "6vh 5vw",
      }}
    >
      <main>
        {/* PAM */}
        <h1
          style={{
            fontWeight: 800,
            letterSpacing: "0.06em",
            margin: 0,
            fontSize: "clamp(48px, 12vw, 160px)",
            lineHeight: 1,
          }}
        >
          PAM
        </h1>

        {/* Tagline */}
        <p
          style={{
            marginTop: "8px",
            marginBottom: "4vh",
            textTransform: "uppercase",
            fontWeight: 700,
            letterSpacing: "0.12em",
            fontSize: "clamp(12px, 2.2vw, 22px)",
            opacity: 0.95,
          }}
        >
          your Personal Asset Manager
        </p>

        {/* COMING SOON */}
        <p
          style={{
            fontWeight: 900,
            margin: 0,
            fontSize: "clamp(28px, 8vw, 96px)",
            lineHeight: 1.1,
          }}
        >
          COMING SOON!
        </p>

        {/* Ronde witte knop naar assets */}
        <button
          onClick={() => navigate("/assets")}
          style={{
            marginTop: "4vh",
            backgroundColor: "#fff",
            color: blue,
            border: "none",
            borderRadius: 9999,
            padding: "14px 28px",
            fontWeight: 700,
            fontSize: "clamp(14px, 2.2vw, 18px)",
            cursor: "pointer",
            boxShadow: "0 6px 18px rgba(0,0,0,.25)",
          }}
          aria-label="Go to Assets"
        >
          Go to Assets
        </button>
      </main>

      {/* Footer */}
      <footer
        style={{
          position: "absolute",
          bottom: 16,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 12,
          opacity: 0.85,
          padding: "0 16px",
        }}
      >
        PAM is a Global Citizens b.v. company, copyright 2025
      </footer>
    </div>
  );
}
