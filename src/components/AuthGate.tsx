import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main
        style={{
          alignItems: "center",
          color: "#123052",
          display: "flex",
          justifyContent: "center",
          minHeight: "calc(100vh - 40px)",
        }}
      >
        PAM wordt geopend...
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
