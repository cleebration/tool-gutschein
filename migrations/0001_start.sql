-- tool-gutschein · eigene Datenbank. 2026-11-04, Chat „Tool Gutschein“ (Teil A, Nutzer-Tool).
-- Schenker melden sich mit dem cleebration-Konto an; Empfänger brauchen kein Konto (der Link ist der Gutschein).

-- Ein Heft = eine Sammlung von Gutscheinen mit gemeinsamem Design (auch ein einzelner Gutschein steckt in einem Heft).
-- design: weihnachten | geburtstag | liebe | blumen | konfetti | elegant. bild = eigenes Foto (Set Plus), hinweis_aus = Druck ohne cleebration-Hinweis (Set Plus).
-- gesehen = Zeitpunkt, bis zu dem der Schenker Einlösungen gesehen hat (für die Glocke).
CREATE TABLE IF NOT EXISTS hefte (
  id TEXT PRIMARY KEY, konto_id TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
  titel TEXT NOT NULL DEFAULT '', fuer TEXT NOT NULL DEFAULT '', von TEXT NOT NULL DEFAULT '', deckblatt TEXT NOT NULL DEFAULT '',
  design TEXT NOT NULL DEFAULT 'weihnachten', bild TEXT, hinweis_aus INTEGER NOT NULL DEFAULT 0, plus INTEGER NOT NULL DEFAULT 0,
  gesperrt TEXT, archiviert INTEGER, gesehen INTEGER NOT NULL DEFAULT 0,
  erstellt INTEGER NOT NULL, geaendert INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_hefte_konto ON hefte (konto_id, geaendert);

-- Ein Gutschein. anzahl = wie oft einlösbar (Teil-Einlösung, > 1 nur mit Set Plus). gueltig_bis = 'YYYY-MM-DD' (inklusive) oder NULL.
-- zurueckgezogen = Schenker hat ihn zurückgenommen (nie löschen, solange der Empfänger ihn sehen kann).
CREATE TABLE IF NOT EXISTS gutscheine (
  id TEXT PRIMARY KEY, heft_id TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
  titel TEXT NOT NULL DEFAULT '', text TEXT NOT NULL DEFAULT '', motiv TEXT NOT NULL DEFAULT 'geschenk',
  anzahl INTEGER NOT NULL DEFAULT 1, gueltig_bis TEXT, reihenfolge INTEGER NOT NULL DEFAULT 0,
  zurueckgezogen INTEGER, erstellt INTEGER NOT NULL, geaendert INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_gutscheine_heft ON gutscheine (heft_id, reihenfolge);

-- Jede Einlösung (bei Mehrfach-Gutscheinen mehrere). durch: empfaenger | schenker.
CREATE TABLE IF NOT EXISTS einloesungen (
  id TEXT PRIMARY KEY, gutschein_id TEXT NOT NULL, wann INTEGER NOT NULL,
  durch TEXT NOT NULL CHECK (durch IN ('empfaenger','schenker')), notiz TEXT NOT NULL DEFAULT '');
CREATE INDEX IF NOT EXISTS idx_einloesungen_gutschein ON einloesungen (gutschein_id, wann);

-- Erhaltene Hefte, die ein angemeldeter Empfänger in sein Konto übernommen hat („Erhalten“).
CREATE TABLE IF NOT EXISTS gemerkt (
  konto_id TEXT NOT NULL, heft_id TEXT NOT NULL, erstellt INTEGER NOT NULL, PRIMARY KEY (konto_id, heft_id));
CREATE INDEX IF NOT EXISTS idx_gemerkt_heft ON gemerkt (heft_id);
