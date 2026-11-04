// Tests für den Worker mit echter SQLite (node:sqlite) statt D1 – ohne Internet. Aufruf: node test/worker.test.mjs
// Beide Konten von Chris (Tool-Grundsätze 8): chrisnate = Nutzer (Basis), chris = Inhaber (Basis + Plus).
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import worker, { aufraeumen, _werteLeeren, heute, status } from "../src/worker.js";

let fehler = 0, ok = 0;
const pruefe = (name, bed, info = "") => { if (bed) ok++; else { fehler++; console.log("FEHLER:", name, info); } };

// --- D1-Nachbau ---
function d1() {
  const db = new DatabaseSync(":memory:");
  for (const f of ["0001_start.sql", "0002_kit_sitzungen.sql"]) db.exec(readFileSync(new URL("../migrations/" + f, import.meta.url), "utf8"));
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    first: async col => { const r = db.prepare(sql).get(...args); return r === undefined ? null : col ? r[col] : { ...r }; },
    all: async () => ({ results: db.prepare(sql).all(...args).map(r => ({ ...r })) }),
    run: async () => { const r = db.prepare(sql).run(...args); return { meta: { changes: Number(r.changes) } }; },
  });
  return { prepare: sql => stmt(sql), batch: async l => { const out = []; db.exec("BEGIN"); try { for (const s of l) out.push(await s.run()); db.exec("COMMIT"); } catch (e) { db.exec("ROLLBACK"); throw e; } return out; }, _db: db };
}

// --- Store-Nachbau ---
const KONTEN = {
  nate: { konto_id: "k_nate", email: "chris@renateleeb.photos", name: "chrisnate", gesperrt: false, freischaltungen: { basis: true }, rollen: [], teams: [] },
  chris: { konto_id: "k_chris", email: "chris@cleebration.com", name: "chris", gesperrt: false, freischaltungen: { basis: true, plus: true }, rollen: [{ bereich: "alle", rolle: "inhaber" }], teams: [] },
  renate: { konto_id: "k_renate", email: "renate@example.com", name: "Renate", gesperrt: false, freischaltungen: { basis: true }, rollen: [], teams: [] },
};
let WERTE = { offen_frei: 3, loeschen_monate: 12 };
const inhalte = [], ereignisse = [], meldungen = [];
let GESPERRT = [], GELOESCHT = [];
const storeFetch = async (url, opts) => {
  const u = new URL(url), b = opts.body ? JSON.parse(opts.body) : null;
  const antw = (j, st = 200) => new Response(JSON.stringify(j), { status: st, headers: { "Content-Type": "application/json" } });
  if (opts.headers.Authorization !== "Bearer test_schluessel_1234567890") return antw({ fehler: "x" }, 401);
  if (u.pathname === "/api/v1/anmeldung/einloesen") return antw({ ...KONTEN[b.code], werte: WERTE });
  if (u.pathname === "/api/v1/produkt/werte") return antw({ produkt: "gutschein", werte: WERTE });
  if (u.pathname === "/api/v1/ereignis") { ereignisse.push([b.ereignis, b.konto_id]); return antw({ ok: true }); }
  if (u.pathname === "/api/v1/meldung") { meldungen.push(b); return antw({ ok: true }); }
  if (u.pathname === "/api/v1/gesperrt") return antw({ schluessel: GESPERRT });
  if (u.pathname === "/api/v1/geloeschte-konten") return antw({ konten: GELOESCHT, bis: GELOESCHT.length ? 999 : 0 });
  const m = u.pathname.match(/^\/api\/v1\/konto\/([^/]+)\/(freischaltungen|inhalte)$/);
  if (m && m[2] === "freischaltungen") { const k = Object.values(KONTEN).find(x => x.konto_id === m[1]); return antw({ ...k, werte: WERTE }); }
  if (m) { inhalte.push([opts.method, b || u.search, m[1]]); return antw({ ok: true }); }
  return antw({ fehler: "unbekannt" }, 404);
};

const env = { DB: d1(), STORE_SCHLUESSEL: "test_schluessel_1234567890", STORE_FETCH: storeFetch, OFFEN_FREI: "10", LOESCHEN_MONATE: "12",
  ASSETS: { fetch: async r => new Response("asset " + new URL(r.url).pathname, { headers: { "Content-Type": "text/plain" } }) } };
const O = "https://gutschein.cleebration.com";
const cookies = {};
async function req(pfad, { method = "GET", body, wer, origin = O, header = {} } = {}) {
  const h = new Headers({ ...header });
  if (wer && cookies[wer]) h.set("Cookie", cookies[wer]);
  if (method !== "GET") h.set("Origin", origin);
  if (body !== undefined) h.set("Content-Type", "application/json");
  const r = await worker.fetch(new Request(O + pfad, { method, headers: h, body: body !== undefined ? JSON.stringify(body) : undefined, redirect: "manual" }), env);
  const typ = r.headers.get("Content-Type") || "";
  return { status: r.status, headers: r.headers, j: typ.includes("json") ? await r.json() : null, t: typ.includes("json") ? null : await r.text() };
}
async function anmelden(wer) {
  const a = await worker.fetch(new Request(O + "/anmelden?zurueck=/"), env);
  const st = a.headers.get("Set-Cookie").match(/cleeb_gutschein_state=([^;]+)/)[1];
  const state = decodeURIComponent(st).split("|")[0];
  const z = await worker.fetch(new Request(O + `/anmelden/zurueck?code=${wer}&state=${state}`, { headers: { Cookie: "cleeb_gutschein_state=" + st } }), env);
  pruefe("anmelden " + wer, z.status === 302, z.status);
  const sid = [...z.headers.entries()].filter(([k]) => k === "set-cookie").map(([, v]) => v).join(",").match(/cleeb_gutschein=([^;]+)/)[1];
  cookies[wer] = "cleeb_gutschein=" + sid;
}
const H = heute();
const plusTage = n => { const d = new Date(H + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

// 0 Status-Logik
pruefe("Status offen", status({ anzahl: 1 }, 0, "2026-12-01") === "offen");
pruefe("Status eingelöst", status({ anzahl: 3 }, 3, "2026-12-01") === "eingeloest");
pruefe("Status abgelaufen", status({ anzahl: 1, gueltig_bis: "2026-11-30" }, 0, "2026-12-01") === "abgelaufen");
pruefe("Status letzter Tag noch offen", status({ anzahl: 1, gueltig_bis: "2026-12-01" }, 0, "2026-12-01") === "offen");
pruefe("Status zurückgezogen vor allem", status({ anzahl: 1, zurueckgezogen: 5 }, 1, "2026-12-01") === "zurueckgezogen");

// 1 ohne Anmeldung
let r = await req("/api/ich");
pruefe("ich ohne Anmeldung", r.j.angemeldet === false);
r = await req("/");
pruefe("/ leitet zur Anmeldung", r.status === 302 && r.headers.get("Location").includes("/anmelden"));
r = await req("/api/hefte");
pruefe("Hefte ohne Anmeldung 401", r.status === 401);
r = await req("/api/hefte", { header: { "Accept-Language": "en-GB" } });
pruefe("Fehlermeldung auf Englisch", r.status === 401 && /sign in/i.test(r.j.fehler), r.j.fehler);

// 2 anmelden (beide Konten + Empfängerin)
await anmelden("nate"); await anmelden("chris"); await anmelden("renate");
r = await req("/api/ich", { wer: "nate" });
pruefe("ich nate (Basis)", r.j.angemeldet && r.j.name === "chrisnate" && r.j.grenze === 3 && !r.j.plus && r.j.motive.length === 12, JSON.stringify(r.j));
r = await req("/api/ich", { wer: "chris" });
pruefe("ich chris (Plus, keine Grenze)", r.j.plus && r.j.grenze === null, JSON.stringify(r.j));

// 3 Heft anlegen (Gutscheinheft mit 2 Gutscheinen)
r = await req("/api/hefte", { method: "POST", wer: "nate", body: { titel: "Weihnachten für Renate", fuer: "Renate", design: "weihnachten",
  gutscheine: [{ titel: "1× Frühstück ans Bett", motiv: "kaffee" }, { titel: "Kinoabend", motiv: "film", gueltig_bis: plusTage(90) }] } });
pruefe("anlegen", r.status === 201 && r.j.heft.slug.length === 8 && r.j.gutscheine.length === 2 && r.j.gutscheine[0].slug.length === 10 && r.j.heft.von === "chrisnate", JSON.stringify(r.j));
const HF = r.j.heft, G = r.j.gutscheine;
pruefe("Zählung offen", r.j.offen === 2 && r.j.zahlen.offen === 2, JSON.stringify(r.j.zahlen));
pruefe("Ereignis angelegt mit Konto", ereignisse.some(([n, k]) => n === "angelegt" && k === "k_nate"));
pruefe("Meine Sachen gemeldet", inhalte.some(([m, b]) => m === "PUT" && b.url === `${O}/h/${HF.slug}` && b.bearbeiten === `${O}/?h=${HF.id}` && b.titel === "Weihnachten für Renate"), JSON.stringify(inhalte));
r = await req("/api/hefte", { method: "POST", wer: "nate", origin: "https://boese.example", body: {} });
pruefe("CSRF fremde Seite", r.status === 403);

// 4 Plus-Funktionen für Basis gesperrt
r = await req("/api/hefte/" + HF.id, { method: "PUT", wer: "nate", body: { bild: "data:image/jpeg;base64,AAAA" } });
pruefe("Foto ohne Plus 403", r.status === 403);
r = await req("/api/hefte/" + HF.id, { method: "PUT", wer: "nate", body: { hinweis_aus: true } });
pruefe("ohne Hinweis ohne Plus 403", r.status === 403);
r = await req("/api/hefte/" + HF.id, { method: "PUT", wer: "nate", body: { gutscheine: [{ id: G[0].id, anzahl: 3 }] } });
pruefe("Mehrfach ohne Plus 403", r.status === 403 && /Plus/.test(r.j.fehler));

// 5 Gratis-Grenze: 3 offene
r = await req("/api/hefte/" + HF.id, { method: "PUT", wer: "nate", body: { gutscheine: [{ id: G[0].id }, { id: G[1].id }, { titel: "Massage", motiv: "spa" }] } });
pruefe("dritter Gutschein geht", r.status === 200 && r.j.gutscheine.length === 3 && r.j.offen === 3, JSON.stringify(r.j));
const G3 = r.j.gutscheine[2];
r = await req("/api/hefte/" + HF.id, { method: "PUT", wer: "nate", body: { gutscheine: [{ id: G[0].id }, { id: G[1].id }, { id: G3.id }, { titel: "Zu viel" }] } });
pruefe("vierter über der Grenze 403", r.status === 403 && r.j.grenze_erreicht && /3 offene/.test(r.j.fehler), JSON.stringify(r.j));
r = await req("/api/hefte", { method: "POST", wer: "nate", body: { gutscheine: [{ titel: "Noch einer" }] } });
pruefe("neues Heft über der Grenze 403, kein leeres Heft", r.status === 403 && env.DB._db.prepare("SELECT COUNT(*) n FROM hefte WHERE konto_id='k_nate'").get().n === 1);
r = await req("/api/hefte/" + HF.id, { method: "PUT", wer: "nate", body: { gutscheine: [{ id: G[0].id }, { id: G[1].id }, { id: G3.id }, { titel: "Abgelaufen schon", gueltig_bis: plusTage(-1) }] } });
pruefe("abgelaufener zählt nicht zur Grenze", r.status === 200 && r.j.gutscheine[3].status === "abgelaufen", JSON.stringify(r.j));
const G4 = r.j.gutscheine[3];
// Reihenfolge per Array, Felder ändern
r = await req("/api/hefte/" + HF.id, { method: "PUT", wer: "nate", body: { von: "Chris", deckblatt: "Frohe Weihnachten!", design: "liebe", gutscheine: [{ id: G[1].id }, { id: G[0].id, text: "Mit Croissant" }, { id: G3.id }, { id: G4.id }] } });
pruefe("ändern + umsortieren", r.j.heft.von === "Chris" && r.j.heft.design === "liebe" && r.j.gutscheine[0].id === G[1].id && r.j.gutscheine[1].text === "Mit Croissant", JSON.stringify(r.j.gutscheine.map(g => g.titel)));
r = await req("/api/hefte/" + HF.id, { method: "PUT", wer: "chris", body: { titel: "fremd" } });
pruefe("fremdes Heft 404", r.status === 404);
r = await req("/api/hefte", { wer: "chris" });
pruefe("chris sieht nates Hefte nicht", r.j.hefte.length === 0);

// 6 Empfängerin ohne Konto
r = await req("/api/h/" + HF.slug);
pruefe("Heft lesen", r.status === 200 && r.j.gutscheine.length === 4 && !("konto_id" in r.j.heft) && r.j.gutscheine.every(g => g.id === undefined && g.einloesungen.every(e => !e.durch)), JSON.stringify(r.j));
pruefe("Empfängerin: nicht meins, nicht angemeldet", !r.j.meins && !r.j.angemeldet && !r.j.bearbeiten);
r = await req("/api/g/" + G[0].slug);
pruefe("einzelner Gutschein zeigt nur sich", r.status === 200 && r.j.einzeln && r.j.gutscheine.length === 1 && r.j.gutscheine[0].titel === "1× Frühstück ans Bett");
r = await req(`/api/g/${G[0].slug}/einloesen`, { method: "POST", body: { notiz: "Sonntag!" } });
pruefe("einlösen", r.status === 200 && r.j.gutscheine[0].status === "eingeloest" && r.j.gutscheine[0].eingeloest === 1, JSON.stringify(r.j));
pruefe("Ereignis eingelöst ohne Konto", ereignisse.some(([n, k]) => n === "eingeloest" && k === null));
r = await req(`/api/g/${G[0].slug}/einloesen`, { method: "POST" });
pruefe("doppelt einlösen 409", r.status === 409);
r = await req(`/api/g/${G4.slug}/einloesen`, { method: "POST" });
pruefe("abgelaufen einlösen 409", r.status === 409 && /abgelaufen/.test(r.j.fehler));
r = await req(`/api/h/${HF.slug}/einloesen`, { method: "POST" });
pruefe("einlösen nur über /g/", r.status === 405);

// 7 Schenker sieht Einlösung (Glocke), markiert selbst, nimmt zurück
r = await req("/api/hefte", { wer: "nate" });
pruefe("Glocke: 1 neue Einlösung", r.j.hefte[0].neu === 1 && r.j.hefte[0].zahlen.eingeloest === 1 && r.j.offen === 2, JSON.stringify(r.j));
await req(`/api/hefte/${HF.id}/gesehen`, { method: "POST", wer: "nate" });
r = await req("/api/hefte", { wer: "nate" });
pruefe("gesehen → Glocke aus", r.j.hefte[0].neu === 0);
r = await req("/api/hefte/" + HF.id, { wer: "nate" });
const eFrueh = r.j.gutscheine.find(g => g.id === G[0].id);
pruefe("Schenker sieht wer + Notiz", eFrueh.einloesungen[0].durch === "empfaenger" && eFrueh.einloesungen[0].notiz === "Sonntag!" && eFrueh.loeschen_am, JSON.stringify(eFrueh));
r = await req(`/api/hefte/${HF.id}/gutscheine/${G[1].id}/einloesen`, { method: "POST", wer: "nate", body: { notiz: "Papier" } });
pruefe("Schenker markiert eingelöst", r.status === 200 && r.j.gutscheine.find(g => g.id === G[1].id).status === "eingeloest");
r = await req(`/api/hefte/${HF.id}/gutscheine/${G[1].id}/einloesen`, { method: "DELETE", wer: "nate" });
pruefe("Einlösung zurücknehmen", r.status === 200 && r.j.gutscheine.find(g => g.id === G[1].id).status === "offen");
r = await req(`/api/hefte/${HF.id}/gutscheine/${G[1].id}/einloesen`, { method: "DELETE", wer: "nate" });
pruefe("nichts mehr zurückzunehmen 409", r.status === 409);

// 8 zurückziehen / entfernen
r = await req(`/api/hefte/${HF.id}/gutscheine/${G4.id}`, { method: "DELETE", wer: "nate" });
pruefe("ohne Einlösung entfernt", r.status === 200 && !r.j.zurueckgezogen && r.j.gutscheine.length === 3);
r = await req(`/api/hefte/${HF.id}/gutscheine/${G[0].id}`, { method: "DELETE", wer: "nate" });
pruefe("mit Einlösung nur zurückgezogen", r.status === 200 && r.j.zurueckgezogen && r.j.gutscheine.find(g => g.id === G[0].id).status === "zurueckgezogen");
r = await req("/api/g/" + G[0].slug);
pruefe("Empfängerin sieht zurückgenommen", r.j.gutscheine[0].status === "zurueckgezogen");
r = await req("/api/hefte/" + HF.id, { method: "PUT", wer: "nate", body: { gutscheine: [{ id: G3.id, zurueckgezogen: true }] } });
pruefe("per PUT zurückziehen", r.j.gutscheine.find(g => g.id === G3.id).status === "zurueckgezogen" && r.j.offen === 1, JSON.stringify(r.j.offen));
r = await req(`/api/g/${G3.slug}/einloesen`, { method: "POST" });
pruefe("zurückgezogen einlösen 409", r.status === 409);
r = await req("/api/hefte/" + HF.id, { method: "PUT", wer: "nate", body: { gutscheine: [{ id: G3.id, zurueckgezogen: false }] } });
pruefe("wieder aktivieren", r.j.gutscheine.find(g => g.id === G3.id).status === "offen");

// 9 Plus: Mehrfach-Gutschein mit Teil-Einlösung, Foto, ohne Hinweis
r = await req("/api/hefte", { method: "POST", wer: "chris", body: { titel: "Für Nate", design: "elegant", hinweis_aus: true, gutscheine: [{ titel: "3× Rasen mähen", motiv: "blatt", anzahl: 3 }] } });
pruefe("Plus legt Mehrfach an", r.status === 201 && r.j.gutscheine[0].anzahl === 3 && r.j.heft.hinweis_aus, JSON.stringify(r.j));
const HC = r.j.heft, GC = r.j.gutscheine[0];
r = await req("/api/hefte/" + HC.id, { method: "PUT", wer: "chris", body: { bild: "data:image/jpeg;base64,AAAA" } });
pruefe("Plus: Foto", r.status === 200 && r.j.heft.bild);
for (let i = 0; i < 2; i++) await req(`/api/g/${GC.slug}/einloesen`, { method: "POST" });
r = await req("/api/g/" + GC.slug);
pruefe("Teil-Einlösung 2 von 3 offen", r.j.gutscheine[0].eingeloest === 2 && r.j.gutscheine[0].status === "offen");
r = await req("/api/hefte/" + HC.id, { method: "PUT", wer: "chris", body: { gutscheine: [{ id: GC.id, anzahl: 1 }] } });
pruefe("Anzahl nie unter Eingelöste", r.j.gutscheine[0].anzahl === 2, r.j.gutscheine[0].anzahl);
pruefe("auf 2 gesenkt = schon eingelöst", r.j.gutscheine[0].status === "eingeloest");
r = await req("/api/hefte/" + HC.id, { method: "PUT", wer: "chris", body: { gutscheine: [{ id: GC.id, anzahl: 3 }] } });
r = await req(`/api/g/${GC.slug}/einloesen`, { method: "POST" });
pruefe("letzte Einlösung → eingelöst", r.status === 200 && r.j.gutscheine[0].status === "eingeloest" && r.j.gutscheine[0].eingeloest === 3, JSON.stringify(r.j));

// 10 Erhalten / Merken (Renate ist angemeldet)
r = await req(`/api/h/${HF.slug}/merken`, { method: "POST" });
pruefe("merken ohne Anmeldung 401 mit Weg zurück", r.status === 401 && r.j.anmelden.includes(encodeURIComponent("/h/" + HF.slug + "?merken=1")), JSON.stringify(r.j));
r = await req(`/api/h/${HF.slug}/merken`, { method: "POST", wer: "renate" });
pruefe("Renate merkt", r.status === 200 && r.j.gemerkt && r.j.angemeldet);
r = await req(`/api/h/${HF.slug}/merken`, { method: "POST", wer: "nate" });
pruefe("eigenes Heft merken 409", r.status === 409);
r = await req("/api/erhalten", { wer: "renate" });
pruefe("Renate: Erhalten", r.j.erhalten.length === 1 && r.j.erhalten[0].slug === HF.slug && r.j.erhalten[0].von === "Chris", JSON.stringify(r.j));
r = await req("/api/h/" + HF.slug, { wer: "nate" });
pruefe("Schenker sieht Bearbeiten", r.j.meins && r.j.bearbeiten === `/?h=${HF.id}`);

// 11 Seiten
r = await req("/h/" + HF.slug, { wer: "nate" });
pruefe("Seite für Schenker mit Bearbeiten", r.status === 200 && r.t.includes(`bearbeiten="/?h=${HF.id}"`) && r.t.includes('class="d-liebe"') && r.t.includes('hintergrund="aus"'));
r = await req("/g/" + G3.slug);
pruefe("Seite Gutschein für Besucher", r.status === 200 && !r.t.includes("bearbeiten=") && r.t.includes("Eigenen Gutschein gratis gestalten") && r.t.includes("<title>Massage"), r.t.slice(0, 600));
r = await req("/g/" + G3.slug, { header: { "Accept-Language": "en" } });
pruefe("Seite auf Englisch", r.t.includes('<html lang="en">') && r.t.includes("Design your own voucher"));
r = await req("/h/abcdefgh");
pruefe("unbekanntes Heft 404", r.status === 404);
r = await req("/g/abc");
pruefe("kaputter Link 404", r.status === 404);

// 12 Meldung + Sperre aus der Store-Inbox
r = await req(`/api/h/${HF.slug}/melden`, { method: "POST", body: { grund: "spam" } });
pruefe("Besucher meldet", r.status === 200 && meldungen[0].schluessel === HF.id && meldungen[0].url.endsWith("/h/" + HF.slug));
GESPERRT = [HF.id]; _werteLeeren();
r = await req("/api/g/" + G3.slug);
pruefe("im Store gesperrt → 404", r.status === 404);
r = await req("/h/" + HF.slug);
pruefe("im Store gesperrt → Seite 404", r.status === 404);
r = await req("/api/erhalten", { wer: "renate" });
pruefe("gesperrt nicht unter Erhalten", r.j.erhalten.length === 0);
GESPERRT = []; _werteLeeren();
r = await req("/kit/version");
pruefe("Kit-Version", r.j && r.j.kit === 1 && r.j.tool === "gutschein");

// 13 Werte aus dem Store ändern sich (Admin) → greift nach Cache-Ablauf
WERTE = { ...WERTE, offen_frei: 1 }; _werteLeeren();
r = await req("/api/ich", { wer: "nate" });
pruefe("neue Gratis-Grenze aus dem Store", r.j.grenze === 1, r.j.grenze);
WERTE = { ...WERTE, offen_frei: 3 }; _werteLeeren();

// 14 Beenden: offene nicht mehr einlösbar, Heft weg aus der Liste
r = await req("/api/hefte", { method: "POST", wer: "chris", body: { titel: "Zweites", gutscheine: [{ titel: "Offen" }] } });
const H2 = r.j.heft, G2 = r.j.gutscheine[0];
r = await req("/api/hefte/" + H2.id, { method: "DELETE", wer: "chris" });
r = await req(`/api/g/${G2.slug}/einloesen`, { method: "POST" });
pruefe("beendet → nicht einlösbar", r.status === 403);
r = await req("/api/g/" + G2.slug);
pruefe("beendet sichtbar", r.j.beendet === true);
r = await req("/api/hefte", { wer: "chris" });
pruefe("beendet nicht in der Liste", r.j.hefte.length === 1 && r.j.hefte[0].id === HC.id);
pruefe("Meine Sachen entfernt", inhalte.some(([m, q]) => m === "DELETE" && String(q).includes(H2.id)));

// 15 Aufräumen nach 12 Monaten
let n = await aufraeumen(env, new Date());
pruefe("heute nichts gelöscht", n.gutscheine === 0, JSON.stringify(n));
const in13 = new Date(Date.now() + 400 * 864e5);
n = await aufraeumen(env, in13);
const rest = env.DB._db.prepare("SELECT titel FROM gutscheine ORDER BY titel").all().map(x => x.titel);
// gelöscht: Frühstück (zurückgezogen), Rasen (eingelöst), Offen (Heft beendet); bleiben: Kinoabend (offen, läuft erst in 90 Tagen ab → noch keine 12 Monate), Massage (offen, ohne Datum)
pruefe("nach 13 Monaten erledigte weg", n.gutscheine === 3 && rest.join("|") === "Kinoabend|Massage", JSON.stringify({ n, rest }));
pruefe("leer gewordene alte Hefte weg", n.hefte === 2 && env.DB._db.prepare("SELECT COUNT(*) n FROM hefte").get().n === 1, JSON.stringify(n));
pruefe("Einlösungen der gelöschten weg", env.DB._db.prepare("SELECT COUNT(*) n FROM einloesungen").get().n === 0);
n = await aufraeumen(env, new Date(Date.now() + 800 * 864e5));
pruefe("abgelaufener Kinoabend nach 12 Monaten weg", env.DB._db.prepare("SELECT titel FROM gutscheine").all().map(x => x.titel).join() === "Massage");

// 16 Konto im Store gelöscht → Hefte weg (DSGVO)
await req(`/api/h/${HF.slug}/merken`, { method: "POST", wer: "renate" });
GELOESCHT = [{ konto_id: "k_nate", geloescht: 999 }];
await aufraeumen(env, new Date());
pruefe("Konto gelöscht → Hefte, Gutscheine, Merker weg", env.DB._db.prepare("SELECT COUNT(*) n FROM hefte WHERE konto_id='k_nate'").get().n === 0
  && env.DB._db.prepare("SELECT COUNT(*) n FROM gutscheine").get().n === 0 && env.DB._db.prepare("SELECT COUNT(*) n FROM gemerkt").get().n === 0);
r = await req("/api/ich", { wer: "nate" });
pruefe("Sitzung des gelöschten Kontos weg", r.j.angemeldet === false);

console.log(`${ok} ok, ${fehler} FEHLER`);
process.exit(fehler ? 1 : 0);
