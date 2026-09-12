import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import "./styles/index.css";

const container = document.getElementById("root");
if (!container) throw new Error("Kein #root im Dokument — index.html wurde veraendert.");

// Die statische Fusszeile aus index.html ist fuer Abrufer ohne JavaScript da. Die App
// bringt dieselben Links in ihrer eigenen Fusszeile mit, also weg damit, bevor beides
// untereinander steht.
document.getElementById("static-links")?.remove();

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
