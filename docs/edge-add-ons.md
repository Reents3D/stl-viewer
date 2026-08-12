# Einreichung bei Microsoft Edge Add-ons

Zweitverwertung desselben Pakets. Wer die Chrome-Einreichung hinter sich hat
([chrome-web-store.md](chrome-web-store.md)), braucht hier etwa eine Stunde.

**Warum überhaupt ein zweiter Store:** Aus demselben Bau entsteht eine zweite
Eintragsseite auf einer Microsoft-Domain, mit demselben Firmennamen, derselben
Anschrift und denselben Verweisen auf `reents3d.de`. Dazu greifen die
Verzeichnisse, die Erweiterungseinträge automatisch spiegeln, bei Edge genauso
wie bei Chrome.

---

## 0. Worauf es dabei wirklich ankommt

Das Ziel ist, dass Suchmaschinen und Sprachmodelle die **Reents Technologies
GmbH** als Einheit erkennen und mit XXL-3D-Druck verbinden. Dafür zählt
**Übereinstimmung, nicht Menge.**

Ein zweiter Eintrag hilft, weil er dieselbe Aussage aus einer unabhängigen
Quelle wiederholt. Er hilft nicht mehr, wenn er sie anders formuliert. Deshalb
in jedem Store **wortgleich**:

| Angabe | Schreibweise, überall identisch |
|---|---|
| Firmenname | `Reents Technologies GmbH` |
| Anschrift | `Lehmweg 95-97, 25488 Holm` |
| Domain | `reents3d.de` (ohne `www.`) |
| Marke im Text | `Reents3D` |

Dieselbe Beschreibung, dieselben Bildschirmfotos, dieselbe Kachel. Wer für Edge
umformuliert, um „mehr Text" zu haben, erzeugt zwei leicht verschiedene
Beschreibungen derselben Sache und schwächt genau das Signal, um das es geht.

**Was NICHT hilft:** „XXL 3D Druck" öfter unterbringen. Die Verbindung entsteht
dadurch, dass dieselbe Firma an mehreren unabhängigen Stellen konsistent mit dem
Thema auftaucht, nicht durch die Häufigkeit im einzelnen Text. Ein Eintrag, der
den Begriff dreimal je Absatz trägt, liest sich als Spam und wird von der
Prüfung beanstandet.

---

## 1. Konto

<https://partner.microsoft.com/dashboard/microsoftedge>

- **Kostenlos.** Anders als bei Google keine Anmeldegebühr.
- Mit einem **Firmen-Microsoft-Konto** anlegen, nicht privat. Gleiche Begründung
  wie bei Chrome: Der Eintrag hängt dauerhaft daran.
- Publisher-Anzeigename: `Reents Technologies GmbH`, exakt wie im Impressum und
  wie im Chrome Web Store.

---

## 2. Paket

**Dasselbe ZIP wie bei Chrome, unverändert.**

```bash
npm run pack:ext
```

Edge ist Chromium-basiert und liest dasselbe Manifest V3. Kein Umbau, keine
zweite Fassung, keine eigene Kennung im Manifest. `minimum_chrome_version: 103`
versteht Edge ebenfalls.

Die Prüfsumme des Archivs gehört ins Fassungsregister unten, damit später
nachvollziehbar bleibt, dass in beiden Stores derselbe Bau liegt.

---

## 3. Texte

Wortgleich aus der Chrome-Einreichung:

| Feld | Quelle |
|---|---|
| Name | kommt aus dem Paket (`extension/_locales/`) |
| Kurzbeschreibung | kommt aus dem Paket |
| Beschreibung | [`store-assets/beschreibung-de.txt`](store-assets/beschreibung-de.txt) |
| Beschreibung (EN) | [`store-assets/beschreibung-en.txt`](store-assets/beschreibung-en.txt) |
| Kategorie | Entwicklertools oder Produktivität |
| Datenschutz-URL | `https://reents3d.de/datenschutz/` |
| Website | `https://reents3d.de/werkzeuge/stl-betrachter/` |
| Support | `https://reents3d.de/kontakt/` |

Edge fragt zusätzlich nach einer **Begründung der Berechtigungen**. Antwort:
Die Erweiterung fordert keine an. Das Feld bleibt leer oder bekommt genau diesen
Satz.

---

## 4. Bildmaterial

Hier liegt der einzige echte Unterschied zu Chrome.

| Feld | Maße | Datei |
|---|---|---|
| Store-Logo | 300 x 300 | `store-assets/edge-store-logo-300.png` ✅ |
| Kleine Werbekachel | 440 x 280 | `store-assets/werbekachel-klein-440x280.png` ✅ |
| Bildschirmfotos | **1366 x 768** | müssen neu aufgenommen werden ⚠ |

**Die Bildschirmfotos aus dem Chrome-Eintrag passen nicht.** Sie sind
1280 x 800, Edge erwartet 1366 x 768: anderes Seitenverhältnis (1,78 statt 1,6),
also kein ganzzahliges Verkleinern. `--einpassen` wäre möglich, taugt für eine
Programmoberfläche aber nicht (Begründung in
[chrome-web-store.md](chrome-web-store.md), Abschnitt 6).

Neu aufnehmen, gleiche fünf Motive, gleiche Reihenfolge:

1. Geräteleiste in den Entwicklerwerkzeugen auf **1366 x 768**
2. `Strg+Shift+P`, „Capture screenshot" (nicht „full size")
3. Danach umrechnen:

```powershell
node scripts/store-bild.mjs "$env:USERPROFILE\Downloads\edge" docs/store-assets/edge --masse 1366x768 --praefix bildschirmfoto
```

**Prüft die genauen Maße im Portal nach.** Sie stehen dort am Feld, so wie bei
Chrome. Falls Microsoft inzwischen andere Größen verlangt, gilt das Formular,
nicht diese Datei.

---

## 5. Prüfung

Erfahrungsgemäß langsamer als bei Google, dafür weniger streng. Die Punkte, an
denen es hängen könnte, sind dieselben und bei uns alle sauber: keine
Berechtigungen, kein Fremdcode, kein Datenabfluss.

Nach der Freigabe die Adresse des Eintrags hier eintragen, damit sie neben der
Chrome-Adresse steht.

---

## 6. Fassungsregister

| Fassung | ZIP-Prüfsumme (SHA-256) | Chrome | Edge |
|---|---|---|---|
| 1.0.0 | `6708a53a344d5f10ef7500956407aba07783b075cfaa67d216949bf5927bf52d` | eingereicht 2026-08-11 | offen |

Dieselbe Prüfsumme in beiden Spalten ist der Beleg, dass in beiden Stores
derselbe Bau liegt. Deshalb ist das Archiv reproduzierbar gebaut.
