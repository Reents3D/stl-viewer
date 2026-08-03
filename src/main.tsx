import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import "./styles/index.css";

const container = document.getElementById("root");
if (!container) throw new Error("Kein #root im Dokument — index.html wurde veraendert.");

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
