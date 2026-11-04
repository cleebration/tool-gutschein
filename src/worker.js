// Gutschein · gutschein.cleebration.com – Cloudflare Worker (Projekt Tool Gutschein, Teil A, seit 2026-11-04)
// Schenker: Anmeldung mit dem cleebration-Konto (Tool-Grundsätze 6). Empfänger: kein Konto – der Link (QR) ist der Gutschein.
// Sets aus dem Store (/admin/sets): basis · plus (unbegrenzt offene Gutscheine, eigenes Foto, Mehrfach-Gutscheine, Druck ohne Hinweis).
// Zahlen aus dem Store (/admin/sets → Einstellungen): offen_frei (10), loeschen_monate (12) – Rückfall: vars in wrangler.jsonc.
//   /                      Editor (nach Anmeldung) · /anmelden · /anmelden/zurueck · /abmelden (Kit)
//   /h/<slug>              Gutscheinheft für Empfänger (öffentlich, nicht gelistet) · /g/<slug> ein einzelner Gutschein (QR auf dem Druck)
//   /api/ich · /api/hefte (GET, POST) · /api/hefte/<id> (GET, PUT, DELETE = beenden) · POST /api/hefte/<id>/gesehen
//   /api/hefte/<id>/gutscheine/<gid> (DELETE = entfernen, mit Einlösung: zurückziehen) · …/<gid>/einloesen (POST Schenker markiert, DELETE letzte zurücknehmen)
//   /api/erhalten (GET) · DELETE /api/erhalten/<heftId>             – übernommene Hefte („Erhalten“)
//   /api/h/<slug> · /api/g/<slug> (GET) · POST /api/g/<slug>/einloesen · POST /api/h/<slug>/merken · POST /api/h/<slug>/melden – für Empfänger
// Nachts (Cron): erledigte Gutscheine (eingelöst, abgelaufen, zurückgezogen, Heft beendet) nach loeschen_monate löschen + gelöschte Konten (Kit).
// Moderation zentral im Store (Tool-Grundsätze 11): Meldungen → Store-Inbox, gesperrte Hefte kommen über kit.gesperrteInhalte().

import { kit, SICHERHEIT, jetzt, esc, zufall, json, sprache } from "./cleebration-kit.js";

const TOOL = "gutschein";
export const DESIGNS = ["weihnachten", "geburtstag", "liebe", "blumen", "konfetti", "elegant"];
export const MOTIVE = ["geschenk", "herz", "kaffee", "film", "spa", "essen", "reise", "stern", "wuerfel", "musik", "blatt", "kuchen"];
const SLUG_ZEICHEN = "abcdefghjkmnpqrstuvwxyz23456789"; // ohne 0/o, 1/l/i
const MAX_HEFTE = 200;          // je Konto (nicht beendete)
const MAX_GUTSCHEINE = 40;      // je Heft
const MAX_ANZAHL = 20;          // Mehrfach-Gutschein „3× Rasen mähen“
const BILD_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;
const BILD_MAX = 700000;        // Zeichen (~500 KB)

/* ---------- Texte DE/EN (Tool-Grundsätze 11: Sprache Pflicht) ---------- */

const M = {
  de: {
    anmelden: "Bitte mit deinem cleebration-Konto anmelden.", basis: "Das Set Basis ist für dein Konto nicht freigeschaltet.",
    unbekannt: "Unbekannt.", nichtErlaubt: "Nicht erlaubt.", fehlt: "Diesen Gutschein gibt es nicht (mehr).", heftFehlt: "Gutscheinheft nicht gefunden.",
    gutscheinFehlt: "Gutschein nicht gefunden.", gesperrt: "Dieses Heft ist gesperrt.", beendet: "Dieses Gutscheinheft wurde beendet.",
    bildPlus: "Ein eigenes Foto gibt es mit dem Set Plus.", bildFormat: "Bild bitte als Foto hochladen (wird automatisch verkleinert).",
    hinweisPlus: "Drucken ohne cleebration-Hinweis gibt es mit dem Set Plus.", anzahlPlus: "Mehrfach-Gutscheine gibt es mit dem Set Plus.",
    grenze: n => `Gratis gehen ${n} offene Gutscheine gleichzeitig – mit dem Set Plus unbegrenzt. Tipp: eingelöste und abgelaufene zählen nicht.`,
    zuVieleHefte: `Höchstens ${MAX_HEFTE} Hefte – beende alte.`, zuVieleGutscheine: `Höchstens ${MAX_GUTSCHEINE} Gutscheine je Heft.`,
    schonEingeloest: "Dieser Gutschein ist schon eingelöst.", abgelaufen: "Dieser Gutschein ist abgelaufen.", zurueckgezogen: "Dieser Gutschein wurde zurückgenommen.",
    keineEinloesung: "Es gibt keine Einlösung zum Zurücknehmen.", eigenes: "Das ist dein eigenes Heft – es steht schon bei dir.",
    melden: "Melden hat gerade nicht geklappt – bitte später nochmal.", fehler: "Da ist etwas schiefgegangen.",
    gutschein: "Gutschein", heft: "Gutscheinheft", fuer: n => `Für ${n}`, eigen: "Eigenen Gutschein gratis gestalten",
    fehltText: "Vielleicht ist der Link unvollständig – frag am besten nach, wer ihn dir geschenkt hat.",
  },
  en: {
    anmelden: "Please sign in with your cleebration account.", basis: "The Basic set is not unlocked for your account.",
    unbekannt: "Unknown.", nichtErlaubt: "Not allowed.", fehlt: "This voucher does not exist (any more).", heftFehlt: "Voucher booklet not found.",
    gutscheinFehlt: "Voucher not found.", gesperrt: "This booklet is blocked.", beendet: "This voucher booklet has been closed.",
    bildPlus: "Your own photo comes with the Plus set.", bildFormat: "Please upload the picture as a photo (it is resized automatically).",
    hinweisPlus: "Printing without the cleebration note comes with the Plus set.", anzahlPlus: "Multi-use vouchers come with the Plus set.",
    grenze: n => `The free plan allows ${n} open vouchers at a time – unlimited with the Plus set. Tip: redeemed and expired ones don't count.`,
    zuVieleHefte: `At most ${MAX_HEFTE} booklets – close old ones.`, zuVieleGutscheine: `At most ${MAX_GUTSCHEINE} vouchers per booklet.`,
    schonEingeloest: "This voucher has already been redeemed.", abgelaufen: "This voucher has expired.", zurueckgezogen: "This voucher was withdrawn.",
    keineEinloesung: "There is no redemption to undo.", eigenes: "This is your own booklet – it is already in your account.",
    melden: "Reporting failed just now – please try again later.", fehler: "Something went wrong.",
    gutschein: "Voucher", heft: "Voucher booklet", fuer: n => `For ${n}`, eigen: "Design your own voucher for free",
    fehltText: "Maybe the link is incomplete – best ask whoever gave it to you.",
  },
};
const T = L => M[L] || M.de;

/* ---------- kleine Helfer ---------- */

const s = (v, n) => String(v == null ? "" : v).slice(0, n);
function zufallSlug(n) { const a = crypto.getRandomValues(new Uint8Array(n)); return [...a].map(x => SLUG_ZEICHEN[x % SLUG_ZEICHEN.length]).join(""); }
async function leseJson(request) { try { return await request.json(); } catch { return null; } }
const zahl = (v, min, max, std) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : std; };
const tag = v => { const t = s(v, 10); return /^\d{4}-\d{2}-\d{2}$/.test(t) && !isNaN(Date.parse(t + "T00:00:00Z")) ? t : null; };
// Heute in Wien als 'YYYY-MM-DD' (gültig bis = inklusive dieses Tages)
export const heute = (d = new Date()) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Vienna" }).format(d);

/* ---------- Kit: Anmeldung, Sitzung, Werte, Store ---------- */

let KIT = null;
const K = env => (KIT && KIT._env === env ? KIT : (KIT = Object.assign(kit({ tool: TOOL, env }), { _env: env })));
const rueckfall = env => ({ offen_frei: +(env.OFFEN_FREI || 10), loeschen_monate: +(env.LOESCHEN_MONATE || 12) });
// Grenzwerte aus dem Store (/admin/sets → Gutschein); nur positive Zahlen gelten, sonst Rückfall
export async function werte(env) {
  const r = rueckfall(env);
  if (!env.STORE_SCHLUESSEL) return r;
  const j = await K(env).werte({});
  for (const k of Object.keys(r)) if (Number.isFinite(+j[k]) && +j[k] > 0) r[k] = +j[k];
  return r;
}
export const _werteLeeren = () => { KIT = null; GESPERRT = null; };
const sitzung = (request, env) => K(env).sitzung(request);
const plusFrei = se => !!(KIT && KIT.darf(se, "plus"));
const nebenbei = (ctx, p) => (ctx && ctx.waitUntil ? ctx.waitUntil(p) : p);

// Vom Store (Meldungen-Inbox) gesperrte Hefte, 5 Min. zwischengespeichert
let GESPERRT = null, GESPERRT_ZEIT = 0;
async function storeGesperrt(env, id) {
  if (!env.STORE_SCHLUESSEL) return false;
  if (!GESPERRT || Date.now() - GESPERRT_ZEIT > 300000) { GESPERRT = await K(env).gesperrteInhalte(); GESPERRT_ZEIT = Date.now(); }
  return GESPERRT.has(id);
}

// Heft an „Meine Sachen“ im Store melden – Fehler blockieren nie das Speichern
async function meldeInhalt(env, se, h, titel, origin, weg = false) {
  if (!se || !env.STORE_SCHLUESSEL) return;
  if (weg) await K(env).inhaltWeg(se, h.id);
  else await K(env).inhalt(se, { schluessel: h.id, titel: titel || "Gutschein", url: `${origin}/h/${h.slug}`, bearbeiten: `${origin}/?h=${h.id}`, oeffentlich: false });
}

/* ---------- Status und Zeilen ---------- */

// offen · eingeloest · abgelaufen · zurueckgezogen (Reihenfolge der Prüfung = Vorrang)
export function status(g, n, h) {
  if (g.zurueckgezogen) return "zurueckgezogen";
  if (n >= g.anzahl) return "eingeloest";
  if (g.gueltig_bis && g.gueltig_bis < h) return "abgelaufen";
  return "offen";
}

// Ab wann ein erledigter Gutschein gelöscht wird (Datum 'YYYY-MM-DD') – null, solange er offen ist
function stichtag(g, eins, heft) {
  const ts = x => new Date(x * 1000).toISOString().slice(0, 10);
  const kand = [];
  if (heft.archiviert) kand.push(ts(heft.archiviert));
  if (g.zurueckgezogen) kand.push(ts(g.zurueckgezogen));
  if (eins.length >= g.anzahl && eins.length) kand.push(ts(Math.max(...eins.map(e => e.wann))));
  if (g.gueltig_bis && !kand.length) kand.push(g.gueltig_bis);
  return kand.length ? kand.sort()[0] : null;
}
const plusMonate = (d, m) => { const x = new Date(d + "T12:00:00Z"); x.setUTCMonth(x.getUTCMonth() + m); return x.toISOString().slice(0, 10); };

function gutscheinZeile(g, eins, heft, h, w, fuerSchenker) {
  const st = status(g, eins.length, h);
  const z = {
    id: fuerSchenker ? g.id : undefined, slug: g.slug, titel: g.titel, text: g.text, motiv: g.motiv, anzahl: g.anzahl,
    gueltig_bis: g.gueltig_bis, eingeloest: eins.length, status: st,
    einloesungen: eins.map(e => (fuerSchenker ? { id: e.id, wann: e.wann, durch: e.durch, notiz: e.notiz } : { wann: e.wann })),
  };
  if (fuerSchenker) {
    z.reihenfolge = g.reihenfolge; z.zurueckgezogen = g.zurueckgezogen || null;
    const sd = st === "offen" && !heft.archiviert ? null : stichtag(g, eins, heft);
    z.loeschen_am = sd ? plusMonate(sd, w.loeschen_monate) : null;
  }
  return z;
}

const heftZeile = r => ({
  id: r.id, slug: r.slug, titel: r.titel, fuer: r.fuer, von: r.von, deckblatt: r.deckblatt, design: r.design, bild: r.bild || null,
  hinweis_aus: !!r.hinweis_aus, plus: !!r.plus, gesperrt: r.gesperrt || null, archiviert: r.archiviert || null, gesehen: r.gesehen, erstellt: r.erstellt, geaendert: r.geaendert,
});

async function einloesungenVon(env, ids) {
  const nach = {};
  if (!ids.length) return nach;
  // in Stücken, damit die Platzhalter-Grenze von D1 nie erreicht wird
  for (let i = 0; i < ids.length; i += 80) {
    const t = ids.slice(i, i + 80);
    const r = await env.DB.prepare(`SELECT * FROM einloesungen WHERE gutschein_id IN (${t.map((_, j) => "?" + (j + 1)).join(",")}) ORDER BY wann`).bind(...t).all();
    for (const e of r.results || []) (nach[e.gutschein_id] ||= []).push(e);
  }
  return nach;
}

async function gutscheineVon(env, heft, h, w, fuerSchenker) {
  const g = (await env.DB.prepare("SELECT * FROM gutscheine WHERE heft_id = ?1 ORDER BY reihenfolge, erstellt").bind(heft.id).all()).results || [];
  const eins = await einloesungenVon(env, g.map(x => x.id));
  return g.map(x => gutscheinZeile(x, eins[x.id] || [], heft, h, w, fuerSchenker));
}

// Offene Gutscheine eines Kontos (für die Gratis-Grenze): nicht zurückgezogen, nicht abgelaufen, nicht voll eingelöst, Heft nicht beendet
async function offeneVon(env, kontoId, h) {
  return env.DB.prepare(`SELECT COUNT(*) n FROM gutscheine g JOIN hefte x ON x.id = g.heft_id
    WHERE x.konto_id = ?1 AND x.archiviert IS NULL AND g.zurueckgezogen IS NULL AND (g.gueltig_bis IS NULL OR g.gueltig_bis >= ?2)
    AND (SELECT COUNT(*) FROM einloesungen e WHERE e.gutschein_id = g.id) < g.anzahl`).bind(kontoId, h).first("n");
}

const zaehle = liste => {
  const z = { offen: 0, eingeloest: 0, abgelaufen: 0, zurueckgezogen: 0, gesamt: liste.length };
  for (const g of liste) z[g.status]++;
  return z;
};

/* ---------- Eingaben prüfen ---------- */

function felderHeft(b, se, L) {
  const out = {};
  if ("titel" in b) out.titel = s(b.titel, 120).trim();
  if ("fuer" in b) out.fuer = s(b.fuer, 80).trim();
  if ("von" in b) out.von = s(b.von, 80).trim();
  if ("deckblatt" in b) out.deckblatt = s(b.deckblatt, 600);
  if ("design" in b) out.design = DESIGNS.includes(b.design) ? b.design : "weihnachten";
  if ("hinweis_aus" in b) {
    if (b.hinweis_aus && !plusFrei(se)) return { fehler: T(L).hinweisPlus };
    out.hinweis_aus = b.hinweis_aus ? 1 : 0;
  }
  if ("bild" in b) {
    if (b.bild === null || b.bild === "") out.bild = null;
    else if (!plusFrei(se)) return { fehler: T(L).bildPlus };
    else if (typeof b.bild !== "string" || b.bild.length > BILD_MAX || !BILD_RE.test(b.bild)) return { fehler: T(L).bildFormat };
    else out.bild = b.bild;
  }
  return { out };
}

// Gutscheine übernehmen: vorhandene (id) ändern, neue anlegen, Reihenfolge = Reihenfolge im Array.
// Fehlende werden NICHT entfernt (Entfernen nur ausdrücklich per DELETE). Prüft die Gratis-Grenze und Plus-Funktionen vor dem Schreiben.
async function gutscheineSpeichern(env, heft, liste, se, L, h, w) {
  if (!Array.isArray(liste)) return {};
  const alt = (await env.DB.prepare("SELECT * FROM gutscheine WHERE heft_id = ?1").bind(heft.id).all()).results || [];
  const altNach = Object.fromEntries(alt.map(x => [x.id, x]));
  const eins = await einloesungenVon(env, alt.map(x => x.id));
  const plus = plusFrei(se), t = jetzt();
  const st = [];
  let neuOffen = 0, neuAnzahl = 0;
  for (const [i, p] of liste.slice(0, MAX_GUTSCHEINE + 1).entries()) {
    if (!p || typeof p !== "object") continue;
    const a = p.id && altNach[p.id];
    const n = a ? (eins[a.id] || []).length : 0;
    const titel = "titel" in p ? s(p.titel, 120).trim() : a ? a.titel : "";
    const text = "text" in p ? s(p.text, 600) : a ? a.text : "";
    const motiv = MOTIVE.includes(p.motiv) ? p.motiv : a ? a.motiv : "geschenk";
    const gueltig = "gueltig_bis" in p ? tag(p.gueltig_bis) : a ? a.gueltig_bis : null;
    let anzahl = "anzahl" in p ? zahl(p.anzahl, 1, MAX_ANZAHL, 1) : a ? a.anzahl : 1;
    if (anzahl > 1 && !plus && anzahl > (a ? a.anzahl : 1)) return { fehler: T(L).anzahlPlus };
    anzahl = Math.max(anzahl, n, 1); // nie unter die schon eingelösten
    let zur = a ? a.zurueckgezogen : null;
    if ("zurueckgezogen" in p) zur = p.zurueckgezogen ? (zur || t) : null;
    const neu = { titel, text, motiv, anzahl, gueltig_bis: gueltig, zurueckgezogen: zur };
    const offenNeu = status(neu, n, h) === "offen", offenAlt = a ? status(a, n, h) === "offen" : false;
    if (offenNeu && !offenAlt) neuOffen++;
    if (a) {
      st.push(env.DB.prepare("UPDATE gutscheine SET titel = ?1, text = ?2, motiv = ?3, anzahl = ?4, gueltig_bis = ?5, zurueckgezogen = ?6, reihenfolge = ?7, geaendert = ?8 WHERE id = ?9")
        .bind(titel, text, motiv, anzahl, gueltig, zur, i, t, a.id));
    } else {
      neuAnzahl++;
      st.push(env.DB.prepare("INSERT INTO gutscheine (id, heft_id, slug, titel, text, motiv, anzahl, gueltig_bis, reihenfolge, zurueckgezogen, erstellt, geaendert) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?11)")
        .bind(zufall(9), heft.id, await neuerSlug(env, "gutscheine", 10), titel, text, motiv, anzahl, gueltig, i, zur, t));
    }
  }
  if (alt.length + neuAnzahl > MAX_GUTSCHEINE) return { fehler: T(L).zuVieleGutscheine };
  if (neuOffen && !plus && !heft.archiviert) {
    const offen = await offeneVon(env, se.konto_id, h);
    if (offen + neuOffen > w.offen_frei) return { fehler: T(L).grenze(w.offen_frei), grenze: true };
  }
  if (st.length) await env.DB.batch(st);
  return {};
}

async function neuerSlug(env, tabelle, n) {
  for (let i = 0; i < 8; i++) {
    const slug = zufallSlug(n);
    if (!(await env.DB.prepare(`SELECT 1 FROM ${tabelle} WHERE slug = ?1`).bind(slug).first())) return slug;
  }
  throw new Error("kein freier Slug");
}

const anzeigeTitel = (heft, liste) => heft.titel || (liste[0] && liste[0].titel) || "";

/* ---------- API für Schenker ---------- */

async function heftAntwort(env, heft, se, h, w) {
  const gutscheine = await gutscheineVon(env, heft, h, w, true);
  return { heft: heftZeile(heft), gutscheine, zahlen: zaehle(gutscheine), offen: await offeneVon(env, se.konto_id, h), grenze: plusFrei(se) ? null : w.offen_frei, werte: w };
}

async function apiSchenker(request, env, url, pfad, se, ctx, L) {
  const m = request.method, h = heute(), w = await werte(env);
  if (pfad === "hefte" && m === "GET") {
    const r = (await env.DB.prepare("SELECT * FROM hefte WHERE konto_id = ?1 AND archiviert IS NULL ORDER BY geaendert DESC LIMIT ?2").bind(se.konto_id, MAX_HEFTE).all()).results || [];
    const ids = r.map(x => x.id);
    const alle = ids.length ? ((await env.DB.prepare(`SELECT * FROM gutscheine WHERE heft_id IN (SELECT id FROM hefte WHERE konto_id = ?1 AND archiviert IS NULL) ORDER BY reihenfolge`).bind(se.konto_id).all()).results || []) : [];
    const eins = await einloesungenVon(env, alle.map(x => x.id));
    const liste = r.map(x => {
      const gs = alle.filter(g => g.heft_id === x.id).map(g => gutscheinZeile(g, eins[g.id] || [], x, h, w, true));
      const neu = gs.reduce((a, g) => a + g.einloesungen.filter(e => e.durch === "empfaenger" && e.wann > x.gesehen).length, 0);
      const { bild, ...k } = heftZeile(x);
      return { ...k, anzeige: anzeigeTitel(x, gs), zahlen: zaehle(gs), neu, motive: gs.slice(0, 4).map(g => g.motiv) };
    });
    return json(200, { hefte: liste, offen: await offeneVon(env, se.konto_id, h), grenze: plusFrei(se) ? null : w.offen_frei });
  }
  if (pfad === "hefte" && m === "POST") {
    const b = await leseJson(request) || {};
    const { out, fehler } = felderHeft(b, se, L);
    if (fehler) return json(403, { fehler });
    const n = await env.DB.prepare("SELECT COUNT(*) n FROM hefte WHERE konto_id = ?1 AND archiviert IS NULL").bind(se.konto_id).first("n");
    if (n >= MAX_HEFTE) return json(403, { fehler: T(L).zuVieleHefte });
    // Gratis-Grenze vorab prüfen, damit kein leeres Heft entsteht
    const neue = Array.isArray(b.gutscheine) ? b.gutscheine.filter(p => p && !p.zurueckgezogen && !(tag(p.gueltig_bis) && tag(p.gueltig_bis) < h)).length : 0;
    if (neue && !plusFrei(se) && (await offeneVon(env, se.konto_id, h)) + neue > w.offen_frei) return json(403, { fehler: T(L).grenze(w.offen_frei), grenze_erreicht: true });
    const id = zufall(9), slug = await neuerSlug(env, "hefte", 8), t = jetzt();
    const x = { titel: "", fuer: "", von: se.name || "", deckblatt: "", design: "weihnachten", bild: null, hinweis_aus: 0, ...out };
    await env.DB.prepare(`INSERT INTO hefte (id, konto_id, slug, titel, fuer, von, deckblatt, design, bild, hinweis_aus, plus, gesehen, erstellt, geaendert)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?13)`)
      .bind(id, se.konto_id, slug, x.titel, x.fuer, x.von, x.deckblatt, x.design, x.bild, x.hinweis_aus, plusFrei(se) ? 1 : 0, 0, t).run();
    const heft = await env.DB.prepare("SELECT * FROM hefte WHERE id = ?1").bind(id).first();
    const g = await gutscheineSpeichern(env, heft, b.gutscheine, se, L, h, w);
    const antwort = await heftAntwort(env, heft, se, h, w);
    await meldeInhalt(env, se, heft, anzeigeTitel(heft, antwort.gutscheine), url.origin);
    nebenbei(ctx, K(env).ereignis(se, "angelegt"));
    return json(201, { ...antwort, fehler: g.fehler || undefined });
  }
  if (pfad === "erhalten" && m === "GET") {
    const r = (await env.DB.prepare(`SELECT x.* FROM gemerkt m JOIN hefte x ON x.id = m.heft_id WHERE m.konto_id = ?1 AND x.gesperrt IS NULL ORDER BY m.erstellt DESC LIMIT 200`).bind(se.konto_id).all()).results || [];
    const liste = [];
    for (const x of r) {
      if (await storeGesperrt(env, x.id)) continue;
      const gs = await gutscheineVon(env, x, h, w, false);
      liste.push({ id: x.id, slug: x.slug, titel: anzeigeTitel(x, gs), von: x.von, design: x.design, beendet: !!x.archiviert, zahlen: zaehle(gs), motive: gs.slice(0, 4).map(g => g.motiv) });
    }
    return json(200, { erhalten: liste });
  }
  const mer = pfad.match(/^erhalten\/([A-Za-z0-9_-]{6,20})$/);
  if (mer && m === "DELETE") {
    await env.DB.prepare("DELETE FROM gemerkt WHERE konto_id = ?1 AND heft_id = ?2").bind(se.konto_id, mer[1]).run();
    return json(200, { ok: true });
  }

  const mh = pfad.match(/^hefte\/([A-Za-z0-9_-]{6,20})(\/gesehen|\/gutscheine\/([A-Za-z0-9_-]{6,20})(\/einloesen)?)?$/);
  if (!mh) return null;
  const heft = await env.DB.prepare("SELECT * FROM hefte WHERE id = ?1 AND konto_id = ?2 AND archiviert IS NULL").bind(mh[1], se.konto_id).first();
  if (!heft) return json(404, { fehler: T(L).heftFehlt });

  if (mh[2] === "/gesehen" && m === "POST") {
    await env.DB.prepare("UPDATE hefte SET gesehen = ?1 WHERE id = ?2").bind(jetzt(), heft.id).run();
    return json(200, { ok: true });
  }
  if (mh[3]) {
    const g = await env.DB.prepare("SELECT * FROM gutscheine WHERE id = ?1 AND heft_id = ?2").bind(mh[3], heft.id).first();
    if (!g) return json(404, { fehler: T(L).gutscheinFehlt });
    const eins = (await einloesungenVon(env, [g.id]))[g.id] || [];
    if (mh[4] && m === "POST") { // Schenker markiert als eingelöst (z. B. Papier-Gutschein ohne Handy)
      if (g.zurueckgezogen) return json(409, { fehler: T(L).zurueckgezogen });
      if (eins.length >= g.anzahl) return json(409, { fehler: T(L).schonEingeloest });
      const b = await leseJson(request) || {};
      await env.DB.prepare("INSERT INTO einloesungen (id, gutschein_id, wann, durch, notiz) VALUES (?1, ?2, ?3, 'schenker', ?4)").bind(zufall(9), g.id, jetzt(), s(b.notiz, 200).trim()).run();
      nebenbei(ctx, K(env).ereignis(se, "eingeloest"));
      return json(200, await heftAntwort(env, heft, se, h, w));
    }
    if (mh[4] && m === "DELETE") { // letzte Einlösung zurücknehmen (Versehen)
      if (!eins.length) return json(409, { fehler: T(L).keineEinloesung });
      await env.DB.prepare("DELETE FROM einloesungen WHERE id = ?1").bind(eins[eins.length - 1].id).run();
      return json(200, await heftAntwort(env, heft, se, h, w));
    }
    if (!mh[4] && m === "DELETE") { // ohne Einlösung entfernen, sonst nur zurückziehen (der Empfänger sieht „zurückgenommen“)
      if (eins.length) await env.DB.prepare("UPDATE gutscheine SET zurueckgezogen = COALESCE(zurueckgezogen, ?1), geaendert = ?1 WHERE id = ?2").bind(jetzt(), g.id).run();
      else await env.DB.prepare("DELETE FROM gutscheine WHERE id = ?1").bind(g.id).run();
      await env.DB.prepare("UPDATE hefte SET geaendert = ?1 WHERE id = ?2").bind(jetzt(), heft.id).run();
      return json(200, { ...(await heftAntwort(env, heft, se, h, w)), zurueckgezogen: !!eins.length });
    }
    return json(405, { fehler: T(L).nichtErlaubt });
  }
  if (mh[2]) return json(404, { fehler: T(L).unbekannt });

  if (m === "GET") return json(200, await heftAntwort(env, heft, se, h, w));
  if (m === "PUT") {
    if (heft.gesperrt) return json(403, { fehler: T(L).gesperrt });
    const b = await leseJson(request) || {};
    const { out, fehler } = felderHeft(b, se, L);
    if (fehler) return json(403, { fehler });
    const g = await gutscheineSpeichern(env, heft, b.gutscheine, se, L, h, w);
    if (g.fehler) return json(403, { fehler: g.fehler, grenze_erreicht: !!g.grenze || undefined });
    out.plus = plusFrei(se) ? 1 : 0;
    const k = Object.keys(out);
    await env.DB.prepare(`UPDATE hefte SET ${k.map((x, i) => `${x} = ?${i + 1}`).join(", ")}, geaendert = ?${k.length + 1} WHERE id = ?${k.length + 2}`).bind(...k.map(x => out[x]), jetzt(), heft.id).run();
    const neu = await env.DB.prepare("SELECT * FROM hefte WHERE id = ?1").bind(heft.id).first();
    const antwort = await heftAntwort(env, neu, se, h, w);
    if ("titel" in out || Array.isArray(b.gutscheine)) await meldeInhalt(env, se, neu, anzeigeTitel(neu, antwort.gutscheine), url.origin);
    return json(200, antwort);
  }
  if (m === "DELETE") { // nie löschen: beenden – offene Gutscheine sind dann nicht mehr einlösbar, der Link zeigt „beendet“
    await env.DB.prepare("UPDATE hefte SET archiviert = ?1, geaendert = ?1 WHERE id = ?2").bind(jetzt(), heft.id).run();
    await meldeInhalt(env, se, heft, "", url.origin, true);
    return json(200, { ok: true });
  }
  return json(405, { fehler: T(L).nichtErlaubt });
}

/* ---------- API für Empfänger ---------- */

async function heftPerSlug(env, art, slug) {
  if (art === "h") return { heft: await env.DB.prepare("SELECT * FROM hefte WHERE slug = ?1").bind(slug).first(), gutschein: null };
  const g = await env.DB.prepare("SELECT * FROM gutscheine WHERE slug = ?1").bind(slug).first();
  if (!g) return { heft: null, gutschein: null };
  return { heft: await env.DB.prepare("SELECT * FROM hefte WHERE id = ?1").bind(g.heft_id).first(), gutschein: g };
}

async function oeffentlich(env, heft, gutschein, se) {
  const h = heute(), w = await werte(env);
  let gs = await gutscheineVon(env, heft, h, w, false);
  if (gutschein) gs = gs.filter(x => x.slug === gutschein.slug);
  const meins = !!(se && se.konto_id === heft.konto_id);
  const gemerkt = se && !meins ? !!(await env.DB.prepare("SELECT 1 FROM gemerkt WHERE konto_id = ?1 AND heft_id = ?2").bind(se.konto_id, heft.id).first()) : false;
  return {
    heft: { slug: heft.slug, titel: heft.titel, fuer: heft.fuer, von: heft.von, deckblatt: heft.deckblatt, design: heft.design, bild: heft.bild || null, hinweis_aus: !!heft.hinweis_aus },
    gutscheine: gs, einzeln: !!gutschein, beendet: !!heft.archiviert, heute: h,
    angemeldet: !!se, meins, gemerkt, bearbeiten: meins ? `/?h=${heft.id}` : null,
  };
}

async function apiEmpfaenger(request, env, url, art, slug, rest, ctx, L) {
  const { heft, gutschein } = await heftPerSlug(env, art, slug);
  if (!heft || heft.gesperrt || await storeGesperrt(env, heft.id)) return json(404, { fehler: T(L).fehlt });
  const se = await sitzung(request, env);
  const m = request.method;
  if (!rest && m === "GET") return json(200, await oeffentlich(env, heft, gutschein, se));
  if (rest === "/melden" && m === "POST") {
    const b = await leseJson(request) || {};
    const grund = ["spam", "anstoessig", "betrug", "sonstiges"].includes(b.grund) ? b.grund : "sonstiges";
    try { await K(env).melden({ schluessel: heft.id, url: `${url.origin}/h/${heft.slug}`, grund, text: s(b.text, 1000) }); }
    catch (er) { console.error("melden", er.status, er.message); return json(502, { fehler: T(L).melden }); }
    return json(200, { ok: true });
  }
  if (rest === "/merken" && m === "POST") {
    if (!se) return json(401, { fehler: T(L).anmelden, anmelden: `/anmelden?zurueck=${encodeURIComponent("/" + art + "/" + slug + "?merken=1")}` });
    if (se.konto_id === heft.konto_id) return json(409, { fehler: T(L).eigenes });
    await env.DB.prepare("INSERT OR IGNORE INTO gemerkt (konto_id, heft_id, erstellt) VALUES (?1, ?2, ?3)").bind(se.konto_id, heft.id, jetzt()).run();
    nebenbei(ctx, K(env).ereignis(se, "gemerkt"));
    return json(200, await oeffentlich(env, heft, gutschein, se));
  }
  if (rest === "/einloesen" && m === "POST" && art === "g") {
    if (heft.archiviert) return json(403, { fehler: T(L).beendet });
    const h = heute(), eins = (await einloesungenVon(env, [gutschein.id]))[gutschein.id] || [];
    const st = status(gutschein, eins.length, h);
    if (st !== "offen") return json(409, { fehler: T(L)[st === "eingeloest" ? "schonEingeloest" : st === "abgelaufen" ? "abgelaufen" : "zurueckgezogen"] });
    const b = await leseJson(request) || {};
    // atomar: nur einfügen, solange noch nicht alle Einlösungen verbraucht sind (zwei gleichzeitige Klicks)
    const r = await env.DB.prepare(`INSERT INTO einloesungen (id, gutschein_id, wann, durch, notiz)
      SELECT ?1, ?2, ?3, 'empfaenger', ?4 WHERE (SELECT COUNT(*) FROM einloesungen WHERE gutschein_id = ?2) < (SELECT anzahl FROM gutscheine WHERE id = ?2 AND zurueckgezogen IS NULL)`)
      .bind(zufall(9), gutschein.id, jetzt(), s(b.notiz, 200).trim()).run();
    if (!r.meta || !r.meta.changes) return json(409, { fehler: T(L).schonEingeloest });
    await env.DB.prepare("UPDATE hefte SET geaendert = ?1 WHERE id = ?2").bind(jetzt(), heft.id).run();
    nebenbei(ctx, K(env).ereignis(null, "eingeloest"));
    return json(200, await oeffentlich(env, heft, gutschein, se));
  }
  return json(405, { fehler: T(L).nichtErlaubt });
}

async function api(request, env, url, ctx) {
  const pfad = url.pathname.replace(/^\/api\/?/, "").replace(/\/+$/, "");
  const L = sprache(request);
  // Schreibende Aufrufe nur von der eigenen Seite (CSRF-Schutz zusätzlich zu SameSite=Lax)
  if (request.method !== "GET" && request.headers.get("Origin") !== url.origin) return json(403, { fehler: T(L).nichtErlaubt });

  const me = pfad.match(/^(h|g)\/([a-z0-9]{8}|[a-z0-9]{10})(\/einloesen|\/merken|\/melden)?$/);
  if (me && ((me[1] === "h" && me[2].length === 8) || (me[1] === "g" && me[2].length === 10))) return apiEmpfaenger(request, env, url, me[1], me[2], me[3], ctx, L);

  const se = await sitzung(request, env);
  if (pfad === "ich") {
    if (!se) return json(200, { angemeldet: false });
    const w = await werte(env);
    return json(200, { angemeldet: true, name: se.name, email: se.email, frei: se.frei, plus: plusFrei(se), werte: w, grenze: plusFrei(se) ? null : w.offen_frei, designs: DESIGNS, motive: MOTIVE, heute: heute() });
  }
  if (!se) return json(401, { fehler: T(L).anmelden, anmelden: "/anmelden" });
  if (!K(env).darf(se, "basis")) return json(403, { fehler: T(L).basis });
  return (await apiSchenker(request, env, url, pfad, se, ctx, L)) || json(404, { fehler: T(L).unbekannt });
}

/* ---------- Seite für Empfänger ---------- */

async function empfaengerSeite(request, env, url, art, slug) {
  const L = sprache(request);
  const { heft, gutschein } = await heftPerSlug(env, art, slug);
  if (!heft || heft.gesperrt || await storeGesperrt(env, heft.id)) return seiteFehlt(L);
  const se = await sitzung(request, env);
  const meins = se && se.konto_id === heft.konto_id;
  const titel = (gutschein ? gutschein.titel : heft.titel) || T(L)[gutschein ? "gutschein" : "heft"];
  const beschreibung = [heft.fuer ? T(L).fuer(heft.fuer) : "", heft.von ? (L === "en" ? "from " : "von ") + heft.von : ""].filter(Boolean).join(" · ") || T(L).gutschein;
  const zurueck = encodeURIComponent(url.pathname);
  const html = `<!doctype html>
<html lang="${L}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(titel)} · ${esc(T(L).gutschein)}</title>
<meta name="description" content="${esc(beschreibung)}">
<meta property="og:title" content="${esc(titel)}">
<meta property="og:description" content="${esc(beschreibung)}">
<meta property="og:type" content="website">
<meta name="robots" content="noindex">
<link rel="icon" href="/icon.svg">
<link rel="stylesheet" href="/karte.css">
<link rel="stylesheet" href="/gast.css">
</head>
<body class="d-${esc(DESIGNS.includes(heft.design) ? heft.design : "weihnachten")}">
<cleebration-leiste id="leiste" tool="gutschein" lang="${L}" kategorie="tools" hintergrund="aus" anmelden="/anmelden?zurueck=${zurueck}"${meins ? ` bearbeiten="/?h=${esc(heft.id)}"` : ""}></cleebration-leiste>
<main id="seite" data-art="${art}" data-slug="${esc(slug)}"><div class="laedt" aria-busy="true"></div></main>
<footer class="fuss"><cleebration-fuss produkt="gutschein" eigen="${esc(T(L).eigen)}"></cleebration-fuss></footer>
<script src="https://store.cleebration.com/leiste.js" defer></script>
<script src="https://store.cleebration.com/tipp.js" defer></script>
<script src="https://store.cleebration.com/kit.js" data-produkt="gutschein" defer></script>
<script src="/karte.js" defer></script>
<script src="/gast.js" defer></script>
</body>
</html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", ...SICHERHEIT } });
}

function seiteFehlt(L = "de") {
  return new Response(`<!doctype html><html lang="${L}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(T(L).fehlt)}</title><link rel="stylesheet" href="/karte.css"><link rel="stylesheet" href="/gast.css">
<body class="d-konfetti"><main class="leer-seite"><div class="karte-glas"><h1>${esc(T(L).fehlt)}</h1><p>${esc(T(L).fehltText)}</p>
<p><a class="knopf" href="https://store.cleebration.com/p/gutschein">${esc(T(L).eigen)}</a></p></div></main></body></html>`, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8", ...SICHERHEIT } });
}

/* ---------- Nachts: erledigte Gutscheine nach der Lösch-Frist entfernen ---------- */

export async function aufraeumen(env, jetztDatum = new Date()) {
  const w = await werte(env);
  const grenze = plusMonate(heute(jetztDatum), -w.loeschen_monate);
  const kand = (await env.DB.prepare(`SELECT g.*, x.archiviert heft_archiviert FROM gutscheine g JOIN hefte x ON x.id = g.heft_id
    WHERE g.zurueckgezogen IS NOT NULL OR x.archiviert IS NOT NULL OR g.gueltig_bis IS NOT NULL
      OR (SELECT COUNT(*) FROM einloesungen e WHERE e.gutschein_id = g.id) >= g.anzahl LIMIT 2000`).all()).results || [];
  const eins = await einloesungenVon(env, kand.map(x => x.id));
  const h = heute(jetztDatum), weg = [];
  for (const g of kand) {
    const e = eins[g.id] || [];
    const heft = { archiviert: g.heft_archiviert };
    if (!heft.archiviert && status(g, e.length, h) === "offen") continue;
    const sd = stichtag(g, e, heft);
    if (sd && sd < grenze) weg.push(g);
  }
  for (const g of weg) await env.DB.batch([
    env.DB.prepare("DELETE FROM einloesungen WHERE gutschein_id = ?1").bind(g.id),
    env.DB.prepare("DELETE FROM gutscheine WHERE id = ?1").bind(g.id),
  ]);
  // Hefte ohne Gutscheine, die älter als die Frist sind (zuletzt geändert), samt „Erhalten“-Einträgen weg; Meine Sachen nachziehen
  const grenzeTs = Math.floor(Date.parse(grenze + "T00:00:00Z") / 1000);
  const leer = (await env.DB.prepare(`SELECT id, konto_id FROM hefte x WHERE geaendert < ?1 AND NOT EXISTS (SELECT 1 FROM gutscheine g WHERE g.heft_id = x.id) LIMIT 500`).bind(grenzeTs).all()).results || [];
  for (const x of leer) {
    await env.DB.batch([env.DB.prepare("DELETE FROM gemerkt WHERE heft_id = ?1").bind(x.id), env.DB.prepare("DELETE FROM hefte WHERE id = ?1").bind(x.id)]);
    if (env.STORE_SCHLUESSEL) await K(env).inhaltWeg({ konto_id: x.konto_id }, x.id);
  }
  // Kit: abgelaufene Sitzungen + Konten, die im Store gelöscht wurden (DSGVO) → deren Hefte samt Gutscheinen und Merkern löschen
  const konten = await K(env).aufraeumen(async kontoId => {
    const ids = ((await env.DB.prepare("SELECT id FROM hefte WHERE konto_id = ?1").bind(kontoId).all()).results || []).map(x => x.id);
    for (const id of ids) await env.DB.batch([
      env.DB.prepare("DELETE FROM einloesungen WHERE gutschein_id IN (SELECT id FROM gutscheine WHERE heft_id = ?1)").bind(id),
      env.DB.prepare("DELETE FROM gutscheine WHERE heft_id = ?1").bind(id),
      env.DB.prepare("DELETE FROM gemerkt WHERE heft_id = ?1").bind(id),
      env.DB.prepare("DELETE FROM hefte WHERE id = ?1").bind(id),
    ]);
    await env.DB.prepare("DELETE FROM gemerkt WHERE konto_id = ?1").bind(kontoId).run();
  });
  if (konten) console.log(`aufraeumen: ${konten} gelöschte(s) Konto/Konten entfernt`);
  console.log(`aufraeumen: ${weg.length} Gutschein(e), ${leer.length} leere(s) Heft(e), Frist ${w.loeschen_monate} Monate, Stichtag vor ${grenze}`);
  return { gutscheine: weg.length, hefte: leer.length };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/")) return await api(request, env, url, ctx);
      const kr = await K(env).route(request); // /anmelden, /anmelden/zurueck, /abmelden, /kit/version, /kit/ich
      if (kr) return kr;
      const ms = url.pathname.match(/^\/(h)\/([a-z0-9]{8})\/?$/) || url.pathname.match(/^\/(g)\/([a-z0-9]{10})\/?$/);
      if (ms) return await empfaengerSeite(request, env, url, ms[1], ms[2]);
      if (/^\/[hg]\//.test(url.pathname)) return seiteFehlt(sprache(request));
      // Grundsatz 6: Editor nur mit Anmeldung
      if (url.pathname === "/" || url.pathname === "/index.html") {
        const se = await sitzung(request, env);
        if (!se) return K(env).zurAnmeldung(request);
      }
      const r = await env.ASSETS.fetch(request);
      const h = new Headers(r.headers);
      for (const [k, v] of Object.entries(SICHERHEIT)) h.set(k, v);
      if (url.pathname === "/" || url.pathname.endsWith(".html")) h.set("Cache-Control", "no-store");
      return new Response(r.body, { status: r.status, headers: h });
    } catch (e) {
      console.error(e);
      return json(500, { fehler: T(sprache(request)).fehler });
    }
  },
  async scheduled(event, env, ctx) { ctx.waitUntil(aufraeumen(env)); },
};
