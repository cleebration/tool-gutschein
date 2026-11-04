# Gutschein · gutschein.cleebration.com

Tool im cleebration store (Projekt **Tool Gutschein**, Teil A, `1! claude/05 Projekte/Tool Gutschein`). Cloudflare Worker `tool-gutschein`, D1 `tool-gutschein`. Steckbrief: `Output/Steckbrief Gutschein.md`, Preise: `Output/Preise.md`.

- **Schenker:** nur mit cleebration-Konto (Kit v1, Tool-Schlüssel als Secret `STORE_SCHLUESSEL`). Gutscheinheft mit Gutscheinen: Titel, Text, Motiv (12), „Wie oft“ (Mehrfach, Set Plus), gültig bis; Ideen zum Antippen; Für/Von, 6 Designs, Deckblatt, eigenes Foto (Plus), ohne cleebration-Hinweis (Plus). Speichert automatisch. Zeilen am Griff ziehen.
- **Drucken** (im Browser, mm-genau, Druck-Kern nach Rückenschild): 8 auf A4 (98 × 69,3 mm), 4 auf A4 quer (141,5 × 100 mm), Klappkarte (A4 hoch, einmal quer falten → A5; Rückseite mit großem QR gedreht). Deckblatt, Schnittlinien, nur offene oder alle. Jede Karte mit QR → `/g/<slug>`. QR-Code lokal: `public/vendor/qrcode.js` (qrcode-generator 2.0.4, Kazuhiko Arase, MIT).
- **Teilen:** Heft-Link `/h/<slug>` + QR (`<cleebration-qr>` aus dem Store, Rückfall: eigener QR) und Links zu einzelnen Gutscheinen.
- **Beschenkte:** ohne Konto. `/h/<slug>` ganzes Heft, `/g/<slug>` ein Gutschein. „Einlösen“ mit Bestätigung + optionaler Notiz; Mehrfach-Gutscheine einzeln. Angemeldet: „In mein Konto übernehmen“ (Liste „Erhalten“ im Editor); sonst „Anmelden und aufheben“ (`?merken=1`).
- **Verwaltung für Schenker:** Status offen · eingelöst · abgelaufen · zurückgenommen, Einlösungen mit Datum und Notiz, „rückgängig“, selbst als eingelöst markieren, zurücknehmen/wieder gültig, entfernen (mit Einlösung nur zurücknehmen). Glocke + „neu“ für Einlösungen seit dem letzten Öffnen. Heft „beenden“ statt löschen.
- **Sets** (Store → /admin/sets): `basis` · `plus`. **Zahlen** (Store → Einstellungen): `offen_frei` (10 offene Gutscheine gratis), `loeschen_monate` (12). Rückfall: `vars` in `wrangler.jsonc`.
- **Datenschutz:** Cron täglich 03:23 UTC löscht Gutscheine `loeschen_monate` nach Einlösung, Ablauf, Zurücknehmen oder Beenden, danach leere Hefte; gelöschte Store-Konten (Kit). Der Editor zeigt je erledigtem Gutschein „Wird am … gelöscht“.
- **Moderation** zentral im Store: „Melden“ auf der Seite der Beschenkten → Meldungen-Inbox, gesperrte Hefte über `kit.gesperrteInhalte()`. Keine eigene Verwaltungsseite (Tool-Grundsätze 11).
- **Sprache** DE/EN (Cookie `cleeb_lang`, sonst Browser), Server-Meldungen ebenso.
- **Meine Sachen:** jedes Heft wird an `store.cleebration.com/konto` gemeldet (Bearbeiten `/?h=<id>`).

## Noch nicht in Version 1
- Mail an den Schenker bei Einlösung und Ablauf-Erinnerung an Beschenkte (braucht eine Mail-Schnittstelle im Store) – bis dahin Glocke im Editor.
- Store-Gutscheine für den Admin (Teil B) – gehören ins Store-Repo (Leitstand-Auftrag 21).

## Dateien
`src/worker.js` (Server) · `src/cleebration-kit.js` (Kit v1, Kopie – nie hier ändern) · `public/index.html`, `app.js`, `app.css` (Editor) · `public/karte.js`, `karte.css` (Karte + Druckbögen, gemeinsam) · `public/gast.js`, `gast.css` (Beschenkte) · `migrations/0001_start.sql`, `0002_kit_sitzungen.sql` · `test/worker.test.mjs` (`npm test`, ohne Internet, node:sqlite)

## Erstes Veröffentlichen
1. `npx wrangler d1 create tool-gutschein` → `database_id` in `wrangler.jsonc` eintragen.
2. `npx wrangler d1 migrations apply tool-gutschein --remote`
3. Store: Produkt/Tool `gutschein` mit Sets `basis`, `plus` und Werten `offen_frei` = 10, `loeschen_monate` = 12 anlegen, Tool-Schlüssel erzeugen → `npx wrangler secret put STORE_SCHLUESSEL`
4. `npx wrangler deploy` (Custom Domain gutschein.cleebration.com)
5. Mit `chris` und `chrisnate` prüfen, dann Kachel im Store sichtbar schalten.
