/**
 * Kopf- und Fussbereich im Corporate Design der Reents Technologies GmbH.
 *
 * Der Kopf ist bewusst schmal: Sobald ein Modell geladen ist, gehoert jeder
 * Bildpunkt der Zeichenflaeche. Der Fuss erscheint nur auf der Startseite —
 * ueber einem 3D-Fenster gibt es nichts zu scrollen, und ein Impressum, das die
 * Zeichenflaeche verkuerzt, hilft niemandem.
 */

import { SITE, trackedUrl } from "../config/site";
import { LANGS, type Lang, type T } from "../i18n";
import { Button, cx, Icon, ICONS } from "./ui";

const logoColor = `${import.meta.env.BASE_URL}brand/reents-logo-horizontal-color.svg`;
const logoWhite = `${import.meta.env.BASE_URL}brand/reents-logo-horizontal-white.svg`;

export function Header({
  lang,
  onLang,
  t,
  onNewFile,
  hasModel,
}: {
  lang: Lang;
  onLang: (lang: Lang) => void;
  t: T;
  onNewFile: () => void;
  hasModel: boolean;
}) {
  return (
    <header className="shrink-0 bg-white border-b border-hairline dark:bg-[#0B121F] dark:border-[#1E2B3D]">
      <div className="h-14 px-4 flex items-center gap-4">
        <a href={SITE.urls.primary} target="_blank" rel="noopener" className="shrink-0">
          {/* Zwei Dateien statt eines CSS-Filters: Der Filter rechnet das Weiss
              aus und verliert dabei die Zweifarbigkeit des Zeichens. */}
          <img
            src={logoColor}
            alt={SITE.legalEntity}
            className="h-8 w-auto dark:hidden"
            width={200}
            height={36}
          />
          <img
            src={logoWhite}
            alt=""
            aria-hidden="true"
            className="h-8 w-auto hidden dark:block"
            width={200}
            height={36}
          />
        </a>

        <div className="hidden sm:block border-l border-hairline dark:border-[#1E2B3D] pl-4 min-w-0">
          <h1 className="font-display font-bold text-sm leading-tight truncate">{t("app.name")}</h1>
          <p className="text-[11px] muted leading-tight truncate">{t("app.tagline")}</p>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span
            className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold text-good bg-good/10 rounded-lg px-2.5 py-1.5"
            title={t("privacy.p1")}
          >
            <Icon path={ICONS.lock} className="w-3.5 h-3.5" />
            {t("privacy.badge")}
          </span>

          {hasModel && (
            <Button onClick={onNewFile} variant="outline" className="hidden sm:inline-flex">
              {t("ui.newFile")}
            </Button>
          )}

          <div className="flex shrink-0 items-center rounded-lg overflow-hidden border border-hairline dark:border-[#1E2B3D]">
            {LANGS.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => onLang(code)}
                aria-pressed={lang === code}
                className={cx(
                  "shrink-0 px-2 py-1 text-xs font-semibold uppercase transition-colors",
                  lang === code
                    ? "bg-petrol-700 text-white dark:bg-petrol-300 dark:text-ink"
                    : "hover:bg-petrol-50 dark:hover:bg-white/5",
                )}
              >
                {code}
              </button>
            ))}
          </div>

          <a
            href={trackedUrl(SITE.urls.contact)}
            target="_blank"
            rel="noopener"
            className="hidden lg:inline-flex items-center gap-2 bg-petrol-700 text-canvas rounded-xl font-bold text-[12px] uppercase px-4 py-2.5 hover:bg-petrol-600 transition-colors dark:bg-petrol-300 dark:text-ink dark:hover:bg-petrol-200"
          >
            {t("cta.request")}
            <Icon path={ICONS.arrow} className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
}

export function Footer({ t, lang }: { t: T; lang: Lang }) {
  const F = SITE.facts;
  return (
    <footer className="bg-petrol-700 text-petrol-100">
      <div className="max-w-5xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-3 text-sm">
        <div>
          <img
            src={logoWhite}
            alt={SITE.legalEntity}
            className="h-9 w-auto mb-4"
            width={200}
            height={36}
          />
          <p className="leading-relaxed opacity-90">
            {SITE.contact.street}
            <br />
            {SITE.contact.zip} {SITE.contact.city}
          </p>
          <p className="mt-2">
            <a
              href={`tel:${SITE.contact.phone.replace(/[^+\d]/g, "")}`}
              className="hover:text-white"
            >
              {SITE.contact.phone}
            </a>
            <br />
            <a href={`mailto:${SITE.contact.email}`} className="hover:text-white">
              {SITE.contact.email}
            </a>
          </p>
        </div>

        <div>
          <h2 className="font-display font-bold uppercase tracking-wider text-xs text-petrol-300 mb-3">
            {t("footer.production")}
          </h2>
          <ul className="space-y-1.5 opacity-90">
            {[F.machines, F.maxPart, F.finishing, F.location, F.confidentiality].map((fact) => (
              <li key={fact} className="flex gap-2">
                <span aria-hidden="true" className="text-petrol-300">
                  ·
                </span>
                {fact}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display font-bold uppercase tracking-wider text-xs text-petrol-300 mb-3">
            {t("footer.about")}
          </h2>
          <p className="opacity-90 leading-relaxed mb-3">{t("footer.aboutText")}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {[
              [SITE.urls.imprint, t("footer.imprint")],
              [SITE.urls.privacy, t("footer.privacy")],
              [SITE.urls.repo, "GitHub"],
              [SITE.urls.advisor, t("cta.advisor")],
            ].map(([href, label]) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener"
                className="hover:text-white underline underline-offset-2 decoration-petrol-400"
              >
                {label}
              </a>
            ))}
          </div>
          <p className="mt-4 text-xs opacity-70 leading-relaxed">{t("footer.legal")}</p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <nav
          className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap gap-x-7 gap-y-2 text-sm"
          aria-label={lang === "de" ? "Leistungen" : "Services"}
        >
          {(
            [
              [SITE.urls.xxl, lang === "de" ? "XXL-3D-Druck" : "XXL 3D printing"],
              [SITE.urls.cad, lang === "de" ? "CAD-Konstruktion" : "CAD engineering"],
              [SITE.urls.fdm, lang === "de" ? "FDM-Druckservice" : "FDM printing service"],
              [SITE.urls.primary, "reents3d.de"],
            ] as const
          ).map(([href, label]) => (
            <a
              key={label}
              href={trackedUrl(href)}
              target="_blank"
              rel="noopener"
              className="font-semibold text-petrol-300 hover:text-white transition-colors"
            >
              {label} →
            </a>
          ))}
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4 text-xs opacity-70">
          © {SITE.legalEntity} · {SITE.claim[lang]}
        </div>
      </div>
    </footer>
  );
}
