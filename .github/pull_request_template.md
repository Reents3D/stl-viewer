## Was ändert sich

<!-- Kurz und im Ergebnis, nicht als Liste der berührten Dateien. -->

## Warum

<!-- Der Anlass. Bei Entscheidungen mit Nebenwirkungen zusätzlich ein ADR in DECISIONS.md. -->

## Prüfung

- [ ] `npm run ci` läuft durch
- [ ] Handprüfung nach der Liste im README, soweit betroffen
- [ ] Bei neuen berechneten Werten: Herkunft und Grenzen stehen in der Oberfläche
- [ ] Bei neuen Texten: beide Sprachen in `src/i18n/`, kein Text im Quelltext der Ansichten
- [ ] **Keine neue Netzwerkverbindung** — kein `fetch`, keine externe Ressource, keine Schrift von einem CDN
- [ ] Keine Kundendatei im Commit
