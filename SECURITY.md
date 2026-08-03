# Sicherheit

## Bedrohungsmodell

Dieses Werkzeug ist eine statische Seite ohne Server, ohne Konto und ohne Datenhaltung.
Es gibt kein Backend, das angegriffen werden könnte, und keine gespeicherten Daten, die
abfließen könnten.

Was es gibt, ist **fremde Eingabe**: eine STL-Datei, die der Besucher öffnet. Sie wird
als unvertrauenswürdig behandelt.

## Getroffene Maßnahmen

**Keine ausgehenden Verbindungen.** Die ausgelieferte Seite trägt
`connect-src 'none'`. Der Browser lässt aus dieser Seite heraus kein `fetch`, kein
`XMLHttpRequest`, keinen WebSocket und kein `sendBeacon` zu. Damit kann eine
kompromittierte Abhängigkeit die geöffnete Datei nicht abtransportieren.

**Vollständige Richtlinie** (siehe [vite.config.ts](vite.config.ts)):

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:; font-src 'self'; connect-src 'none';
manifest-src 'self'; worker-src 'self'; object-src 'none';
base-uri 'self'; form-action 'none'
```

`style-src` braucht `'unsafe-inline'`, weil React Stilattribute direkt am Element setzt
(Fortschrittsbalken, Markenpositionen). `frame-ancestors` fehlt bewusst: Die Richtung
wirkt laut Spezifikation nur als echte HTTP-Kopfzeile und ist im Meta-Tag wirkungslos;
GitHub Pages lässt keine eigenen Kopfzeilen zu. Klickjacking-Schutz gibt es erst nach
einem Umzug auf eine eigene Domain mit vorgelagertem CDN.

**Keine externen Ressourcen.** Schriften, Programmcode und Bildmarke liegen auf demselben
Server wie die Seite. Kein CDN sieht die IP eines Besuchers.

**Parser gegen fehlerhafte Eingaben gehärtet.** Abgeschnittene Dateien werden so weit
gelesen, wie sie reichen, statt eine Ausnahme zu werfen. Dreieckszahlen aus dem Dateikopf
werden gegen die tatsächliche Dateilänge geprüft, bevor Speicher angefordert wird — eine
Datei, die 4 Mrd. Dreiecke behauptet, führt nicht zu einer Speicheranforderung über
180 GB. Fehlgeschlagene Anforderungen werden als Fehler gemeldet, nicht als Absturz.

**Anmerkungsdateien werden vollständig geprüft.** Eine geladene JSON-Datei kommt
möglicherweise per E-Mail und ist möglicherweise von Hand bearbeitet. Jedes Feld wird
einzeln geprüft und auf einen gültigen Wert zurückgeführt, bevor es in den Zustand
wandert.

**Kein `innerHTML`, kein `eval`, kein `new Function`.** Im gesamten Quelltext nicht
vorhanden.

## Was bewusst nicht abgesichert ist

Ein bösartiges STL kann den Reiter zum Absturz bringen, indem es sehr viel Speicher
anfordert. Das ist ein Verlust der Sitzung, kein Datenabfluss — und es trifft nur den
Besucher selbst, der die Datei geöffnet hat.

## Meldung von Schwachstellen

Bitte an **info@reents3d.de**, nicht über ein öffentliches Issue.

Antwort in der Regel innerhalb von fünf Werktagen. Für eine sinnvolle Analyse hilft:
betroffene Version oder Commit, Browser und Version, Beschreibung des Ablaufs und —
sofern für die Reproduktion nötig — eine Beispieldatei.
