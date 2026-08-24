import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const deepNavy = "#123052";
const pamNavy = "#173A61";
const olive = "#687348";
const warmIvory = "#F8F5EE";
const softWhite = "#FCFBF8";
const slateBlue = "#60718A";
const warmGrey = "#DEDCD5";

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initialMode = (location.state as { mode?: "login" | "register" } | null)?.mode;
  const [mode, setMode] = React.useState<"login" | "register">(
    initialMode === "login" ? "login" : "register",
  );
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const from = (location.state as { from?: string } | null)?.from ?? "/workspace";

  React.useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [from, navigate, user]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "register") {
        await register({ name, email, password });
      } else {
        await login({ email, password });
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inloggen is niet gelukt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        alignItems: "center",
        background: pamNavy,
        color: deepNavy,
        display: "flex",
        justifyContent: "center",
        minHeight: "calc(100vh - 40px)",
        padding: "28px 18px",
      }}
    >
      <section
        className="pam-auth-shell"
        style={{
          background: warmIvory,
          border: `1px solid ${warmGrey}`,
          borderRadius: 22,
          boxShadow: "0 18px 50px rgba(0,0,0,0.22)",
          display: "grid",
          gap: 28,
          gridTemplateColumns: "minmax(0, 0.95fr) minmax(320px, 0.75fr)",
          maxWidth: 1040,
          padding: "clamp(24px, 4vw, 44px)",
          width: "100%",
        }}
      >
        <style>{`
          @media (max-width: 820px) {
            .pam-auth-shell { grid-template-columns: 1fr !important; }
          }
        `}</style>
        <div className="pam-auth-shell" style={{ display: "contents" }}>
          <div>
            <button
              type="button"
              onClick={() => navigate("/account")}
              style={{
                background: "transparent",
                border: `1px solid ${pamNavy}`,
                borderRadius: 999,
                color: pamNavy,
                padding: "9px 16px",
                fontWeight: 700,
              }}
            >
              ← Terug naar PAM
            </button>
            <p
              style={{
                color: olive,
                fontSize: 13,
                fontWeight: 780,
                letterSpacing: "0.26em",
                margin: "46px 0 14px",
                textTransform: "uppercase",
              }}
            >
              PAM account
            </p>
            <h1
              style={{
                color: deepNavy,
                fontSize: "clamp(38px, 5vw, 58px)",
                lineHeight: 1.03,
                margin: 0,
                maxWidth: 580,
              }}
            >
              Veilig verder met je persoonlijke overzicht.
            </h1>
            <p
              style={{
                color: slateBlue,
                fontSize: 18,
                lineHeight: 1.55,
                marginTop: 24,
                maxWidth: 560,
              }}
            >
              Maak een PAM-account aan of log in om je workspace te openen. Je
              account koppelt straks je lokale kluis aan de Europese cloudlaag.
            </p>
          </div>

          <form
            onSubmit={submit}
            style={{
              alignSelf: "center",
              background: softWhite,
              border: `1px solid ${warmGrey}`,
              borderRadius: 18,
              boxShadow: "0 12px 28px rgba(18,48,82,0.08)",
              padding: 24,
            }}
          >
            <div
              style={{
                background: "#EFEEE8",
                borderRadius: 999,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                marginBottom: 22,
                padding: 4,
              }}
            >
              <button
                type="button"
                onClick={() => setMode("register")}
                style={{
                  background: mode === "register" ? "#fff" : "transparent",
                  border: 0,
                  borderRadius: 999,
                  boxShadow: mode === "register" ? "0 4px 12px rgba(18,48,82,0.08)" : "none",
                  color: deepNavy,
                  padding: "10px 12px",
                  fontWeight: 750,
                }}
              >
                Account maken
              </button>
              <button
                type="button"
                onClick={() => setMode("login")}
                style={{
                  background: mode === "login" ? "#fff" : "transparent",
                  border: 0,
                  borderRadius: 999,
                  boxShadow: mode === "login" ? "0 4px 12px rgba(18,48,82,0.08)" : "none",
                  color: deepNavy,
                  padding: "10px 12px",
                  fontWeight: 750,
                }}
              >
                Inloggen
              </button>
            </div>

            {mode === "register" && (
              <label>
                Naam
                <input
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Bijv. Pam de Vries"
                  style={{ marginTop: 6, width: "100%" }}
                />
              </label>
            )}

            <label style={{ display: "block", marginTop: 14 }}>
              E-mail
              <input
                autoComplete="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="naam@example.nl"
                style={{ marginTop: 6, width: "100%" }}
              />
            </label>

            <label style={{ display: "block", marginTop: 14 }}>
              Wachtwoord
              <input
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === "register" ? "Minimaal 10 tekens" : "Je wachtwoord"}
                style={{ marginTop: 6, width: "100%" }}
              />
            </label>

            {error && (
              <p style={{ color: "#991b1b", fontWeight: 650, margin: "14px 0 0" }}>
                {error}
              </p>
            )}

            <button
              className="ui-btn ui-btn--primary"
              disabled={busy}
              type="submit"
              style={{ marginTop: 20, width: "100%" }}
            >
              {busy ? "Even controleren..." : mode === "register" ? "Maak mijn PAM-account" : "Log in bij PAM"}
            </button>

            <p style={{ color: slateBlue, fontSize: 13, lineHeight: 1.45, margin: "16px 0 0" }}>
              Deze POC bewaart het account lokaal in deze browser. De backend
              krijgt dezelfde sessiegrens voor productiegebruik.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
