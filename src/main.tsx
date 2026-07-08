
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { bootstrapStorage } from "./storage/bootstrap";
import "./styles.css"; // ⬅️ CSS import bovenaan

bootstrapStorage()
  .catch((error) => {
    console.warn("PAM secure storage bootstrap failed:", error);
  })
  .finally(() => {
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  });
