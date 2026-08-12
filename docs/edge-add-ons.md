# Einreichung bei Microsoft Edge Add-ons

Zweitverwertung desselben Pakets. Das **Ausfüllen** des Eintrags dauert etwa
eine Stunde, wenn die Chrome-Einreichung sitzt
([chrome-web-store.md](chrome-web-store.md)).

**Die Kontoregistrierung davor dauert Tage bis Wochen.** Das ist der Grund,
warum die Reihenfolge in dieser Datei bei null anfängt und nicht beim Formular.
Wer erst am Tag der Einreichung merkt, dass Microsoft die Firma telefonisch
prüft, wartet danach noch zwei Wochen.

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

**Kostenlos.** Anders als bei Google keine Anmeldegebühr. Das ist auch schon
die einzige Stelle, an der Edge einfacher ist als Chrome.

### Der Anmeldeweg

Das Partner Center ist ein Sammelportal für viele Microsoft-Programme. Wer sich
dort anmeldet, ohne im Edge-Programm eingeschrieben zu sein, sieht eine fast
leere Startseite: unter „Workspaces" nur „My access", unter „Quick starts"
steht `undefined`. Das ist kein Fehler, sondern ein Konto ohne Programm.

Die Einschreibung liegt hinter:

> **Partner Center → Account settings → Programs → Karte „Microsoft Edge" →
> „Get started"**

Das Registrierungsformular öffnet sich dann in einem neuen Tab.

### Die Falle: Arbeitskonto geht nicht

> „The Microsoft Edge program doesn't support registering with a work or school
> account."

Ein Microsoft-365-Konto der Firma, also etwa `name@reents3d.de` in einem
Entra-Mandanten, **funktioniert nicht.** Verlangt wird ein **Microsoft-Konto
(MSA)**: outlook.com, live.com, hotmail.com — oder ein GitHub-Konto, mit dem
Microsoft automatisch ein MSA anlegt.

Das klingt nach einem Widerspruch zum Firmenkonto, ist aber keiner: Das MSA ist
nur der **Primary Owner** des Kontos. Die Firmendaten kommen im Formular
darunter, und nach der Freigabe lässt sich der Entra-Mandant der Firma
verknüpfen, damit weitere Personen die Erweiterung verwalten können.

**Praktisch heißt das:** ein eigenes MSA für diesen Zweck anlegen, kein
persönliches Privatkonto verwenden und keins, das an einer einzelnen Person
hängt. Der Zugang zu diesem Postfach entscheidet später darüber, wer den
Store-Eintrag ändern kann.

### Kontotyp: Company, und zwar unumkehrbar

Für die Reents Technologies GmbH ist **Company** richtig, sonst darf der
eingetragene Firmenname nicht als Publisher erscheinen.

Zwei Felder sind nach der Einschreibung **nicht mehr änderbar**:

- **Account country/region**
- **Account type** — „Switching from a company to an individual account is not
  supported."

### Was die Firmenprüfung verlangt

- **Dauer:** „a few days to a few weeks."
- **Anruf:** „Your company might receive phone calls from Microsoft
  verification partners." Wer ans Telefon geht, sollte das wissen.
- **Company approver:** Name, E-Mail und Telefonnummer einer Person, die
  Microsoft bestätigt, dass der Anmeldende für die Firma handeln darf. Bei
  einer GmbH sinnvollerweise die Geschäftsführung.
- **Kontaktangaben:** müssen die eingetragene Firmen-E-Mail-Adresse verwenden.
- **Nachweise**, falls die Prüfung hakt: Rechnungen eines Versorgers,
  **DUNS-Nummer**, Handelsregisterauszug. Hochzuladen unter
  *Account settings | Legal info*. Wer die DUNS-Nummer noch nicht hat: kostenlos
  bei Dun & Bradstreet, aber mit Tagen bis Wochen Vorlauf.

### Publisher-Anzeigename

`Reents Technologies GmbH` — der eingetragene Firmenname, exakt wie im
Impressum und wie im Chrome Web Store. Höchstens 50 Zeichen, hier sind es 24.

### Währenddessen

Die Prüfung blockiert nur die Veröffentlichung, nicht die Vorbereitung. Paket
und Texte liegen ohnehin fertig.

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
