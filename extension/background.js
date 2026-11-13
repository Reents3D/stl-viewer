/**
 * Dienstprogramm der Erweiterung — bewusst das kuerzeste Stueck Code im Paket.
 *
 * WARUM ES UEBERHAUPT EINES GIBT
 * Ein 3D-Betrachter passt nicht in ein Popup und nicht in eine Seitenleiste. Er
 * braucht die ganze Flaeche. Also oeffnet der Klick auf das Symbol die im Paket
 * liegende Seite in einem eigenen Reiter. Genau dafuer ist dieser Dienst da und
 * fuer sonst nichts.
 *
 * WARUM ER OHNE JEDE BERECHTIGUNG AUSKOMMT
 * `chrome.tabs.create` braucht keine. Erst das ABFRAGEN von Reitern
 * (`chrome.tabs.query` mit `url`) verlangt die Berechtigung "tabs" — und die
 * wuerde im Store als Zugriff auf den Browserverlauf angezeigt werden. Fuer ein
 * Werkzeug, dessen Versprechen "Ihre Datei bleibt bei Ihnen" lautet, waere das
 * ein schlechter Tausch gegen den kleinen Komfort, einen bereits offenen Reiter
 * wiederzuverwenden. Mehrere Reiter sind hier ohnehin nuetzlich: So liegen zwei
 * Modelle nebeneinander.
 *
 * WARUM DIE ZUHOERER GANZ OBEN STEHEN
 * Der Dienst wird von Chrome beendet, sobald er nichts tut, und beim naechsten
 * Ereignis neu gestartet. Zuhoerer, die erst in einer Rueckruffunktion angemeldet
 * werden, existieren nach dem Neustart nicht mehr — der Klick liefe dann ins
 * Leere. Deshalb: Anmeldung auf oberster Ebene, synchron.
 */

const VIEWER_PAGE = "index.html";

function openViewer() {
  chrome.tabs.create({ url: chrome.runtime.getURL(VIEWER_PAGE) });
}

chrome.action.onClicked.addListener(openViewer);

/**
 * Nach der Installation einmal oeffnen.
 *
 * Nicht als Werbeseite — es ist das Werkzeug selbst. Wer eine Erweiterung
 * installiert, will sehen, was sie tut; eine Begruessungsseite auf einer
 * fremden Adresse waere an dieser Stelle genau das, was der Store als
 * aufdringlich einstuft. Bei "update" passiert bewusst nichts: ungefragt
 * Reiter aufzureissen, weil im Hintergrund eine neue Fassung eingespielt
 * wurde, ist eine Zumutung.
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") openViewer();
});
