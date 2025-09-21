import React from "react"
import { createRoot } from "react-dom/client"
const root = createRoot(document.getElementById("root")!)
root.render(
  <div>
    <h1>PAM — Mojave build</h1>
    <p>Statische build modus ✔️ (geen dev-server)</p>
  </div>
)
