// Gutschein · Editor für Schenker (gutschein.cleebration.com). Speichert automatisch (kein Speichern-Knopf), Erklärungen hinter (i), DE/EN.
(() => {
"use strict";
const $ = id => document.getElementById(id);
const K = window.GKarte, esc = K.esc;

/* ---------- Sprache (Cookie der Leiste, sonst Browser) ---------- */
const L = (() => { const m = document.cookie.match(/(?:^|;\s*)cleeb_lang=(de|en)/); return m ? m[1] : /^en\b/i.test(navigator.language || "") ? "en" : "de"; })();
const TX = {
  de: {
    neu: "Neu", neuHeft: "Neues Gutscheinheft", drucken: "Drucken", teilen: "Teilen und QR", ansehen: "Wie Beschenkte es sehen", gutscheine: "Gutscheine",
    gutscheinDazu: "Gutschein", vorschau: "Vorschau", zeigeDeckblatt: "Deckblatt zeigen", linkDiesem: "Link zu diesem Gutschein", gestaltung: "Für wen & Design",
    fuer: "Für", von: "Von", phFuer: "z. B. Renate", phVon: "Dein Name", design: "Design", heftTitel: "Titel des Hefts", phTitel: "z. B. Weihnachten 2026",
    deckText: "Text auf dem Deckblatt", phDeck: "Ein paar liebe Worte …", foto: "Eigenes Foto", fotoKnopf: "Foto", fotoWeg: "Foto entfernen",
    ohneHinweis: "Ohne cleebration-Hinweis", ohneHinweisText: "Die kleine Zeile unten auf jeder Karte.", meine: "Meine Gutscheine", erhalten: "Erhalten",
    teilenText: "Mit diesem Link sieht die beschenkte Person das ganze Heft und kann jeden Gutschein einlösen – ohne Konto.", kopieren: "Link kopieren",
    senden: "Senden …", einzeln: "Einzelne Gutscheine", deckblatt: "Deckblatt", deckText2: "Erste Karte mit Titel, Für und Text.",
    auchErledigte: "Auch eingelöste und abgelaufene", auchErledigteText: "Sonst nur offene Gutscheine.", linien: "Schnittlinien", linienText: "Feine Strichellinie zum Ausschneiden.",
    jetztDrucken: "Drucken", motiv: "Motiv", phGs: "Was schenkst du? z. B. 1× Frühstück ans Bett", phText: "Ein paar Worte dazu (optional)",
    anzahl: "Wie oft", gueltig: "gültig bis", alsEingeloest: "Als eingelöst markieren", zurueckziehen: "Zurücknehmen", reaktivieren: "Wieder gültig machen", entfernen: "Entfernen",
    st: { offen: "offen", eingeloest: "eingelöst", abgelaufen: "abgelaufen", zurueckgezogen: "zurückgenommen" }, neuChip: "neu",
    eingeloestAm: (d, wer) => `eingelöst am ${d}${wer === "schenker" ? " (von dir markiert)" : ""}`, rueckgaengig: "rückgängig",
    loeschen: d => `Wird am ${d} automatisch gelöscht.`, ohneTitel: "Ohne Titel", leer: "Noch keine Gutscheine – nimm eine Idee oder tippe auf „Gutschein“.",
    zahlen: z => [z.offen ? `${z.offen} offen` : "", z.eingeloest ? `${z.eingeloest} eingelöst` : "", z.abgelaufen ? `${z.abgelaufen} abgelaufen` : ""].filter(Boolean).join(" · ") || "leer",
    grenze: (n, g) => `${n} von ${g} offenen Gutscheinen (gratis) – mit Plus unbegrenzt`, plusNoetig: "Kommt mit dem Set Plus.", fotoHilfe: "Erscheint links auf jeder Karte.",
    beenden: "Beenden", beendenFrage: t => `„${t}“ beenden? Offene Gutscheine darin lassen sich dann nicht mehr einlösen. Das kann man nicht rückgängig machen.`,
    entfernenFrage: t => `„${t}“ entfernen?`, entferntZurueck: "Schon eingelöst – deshalb nur zurückgenommen.", vergessen: "Aus „Erhalten“ entfernen",
    gespeichert: "gespeichert", gesperrt: "gesperrt", kopiert: "Link kopiert", neueEinl: n => n === 1 ? "1 neue Einlösung" : `${n} neue Einlösungen`,
    druckInfo: (k, b) => `${k} ${k === 1 ? "Karte" : "Karten"} auf ${b} ${b === 1 ? "Bogen" : "Bögen"} A4. Im Druckdialog „Tatsächliche Größe“ bzw. 100 % wählen.`,
    druckLeer: "Keine Gutscheine zum Drucken.", formate: { a7: ["8 auf A4", "klein, zum Ausschneiden"], a6: ["4 auf A4", "Postkarte"], klapp: ["Klappkarte", "A5, 1 pro Blatt"] },
    vonDir: "von", erstelltVon: v => v ? `von ${v}` : "", nurEinmal: "Mehrfach-Gutscheine gibt es mit dem Set Plus.",
    info: {
      editor: "<h2>So geht’s</h2><p>Nimm eine <b>Idee</b> oder tippe auf <b>Gutschein</b>, schreib, was du schenkst – alles speichert sich selbst. Oben in der Leiste: <b>Drucken</b> (8 oder 4 auf A4 oder als Klappkarte) und <b>Teilen</b> (Link und QR-Code).</p><p>Jeder Gutschein hat einen QR-Code. Die beschenkte Person scannt ihn und tippt auf <b>Einlösen</b> – du siehst hier sofort, was eingelöst ist (Glocke in der Liste). Bei Papier ohne Handy markierst du ihn selbst als eingelöst.</p><p>Eingelöste, abgelaufene und zurückgenommene Gutscheine werden nach 12 Monaten automatisch gelöscht.</p>",
      heft: "<h2>Gutscheinheft</h2><p>Alle Gutscheine hier gehören zu einem Heft – mit gemeinsamem Design, „Für“ und „Von“. Das Deckblatt (Titel und Text) kannst du beim Drucken als erste Karte mitnehmen.</p><p>Für eine andere Person tippe oben auf <b>Neu</b>.</p>",
    },
  },
  en: {
    neu: "New", neuHeft: "New voucher booklet", drucken: "Print", teilen: "Share and QR", ansehen: "How the recipient sees it", gutscheine: "Vouchers",
    gutscheinDazu: "Voucher", vorschau: "Preview", zeigeDeckblatt: "Show cover", linkDiesem: "Link to this voucher", gestaltung: "Recipient & design",
    fuer: "For", von: "From", phFuer: "e.g. Renate", phVon: "Your name", design: "Design", heftTitel: "Booklet title", phTitel: "e.g. Christmas 2026",
    deckText: "Text on the cover", phDeck: "A few kind words …", foto: "Your own photo", fotoKnopf: "Photo", fotoWeg: "Remove photo",
    ohneHinweis: "Without cleebration note", ohneHinweisText: "The small line at the bottom of each card.", meine: "My vouchers", erhalten: "Received",
    teilenText: "With this link the recipient sees the whole booklet and can redeem each voucher – no account needed.", kopieren: "Copy link",
    senden: "Send …", einzeln: "Single vouchers", deckblatt: "Cover", deckText2: "First card with title, recipient and text.",
    auchErledigte: "Include redeemed and expired", auchErledigteText: "Otherwise open vouchers only.", linien: "Cutting lines", linienText: "Fine dashed line for cutting.",
    jetztDrucken: "Print", motiv: "Motif", phGs: "What are you giving? e.g. breakfast in bed", phText: "A few words (optional)",
    anzahl: "Uses", gueltig: "valid until", alsEingeloest: "Mark as redeemed", zurueckziehen: "Withdraw", reaktivieren: "Make valid again", entfernen: "Remove",
    st: { offen: "open", eingeloest: "redeemed", abgelaufen: "expired", zurueckgezogen: "withdrawn" }, neuChip: "new",
    eingeloestAm: (d, wer) => `redeemed on ${d}${wer === "schenker" ? " (marked by you)" : ""}`, rueckgaengig: "undo",
    loeschen: d => `Will be deleted automatically on ${d}.`, ohneTitel: "Untitled", leer: "No vouchers yet – pick an idea or tap “Voucher”.",
    zahlen: z => [z.offen ? `${z.offen} open` : "", z.eingeloest ? `${z.eingeloest} redeemed` : "", z.abgelaufen ? `${z.abgelaufen} expired` : ""].filter(Boolean).join(" · ") || "empty",
    grenze: (n, g) => `${n} of ${g} open vouchers (free) – unlimited with Plus`, plusNoetig: "Comes with the Plus set.", fotoHilfe: "Shown on the left of each card.",
    beenden: "Close", beendenFrage: t => `Close “${t}”? Open vouchers in it can no longer be redeemed. This cannot be undone.`,
    entfernenFrage: t => `Remove “${t}”?`, entferntZurueck: "Already redeemed – so it was only withdrawn.", vergessen: "Remove from “Received”",
    gespeichert: "saved", gesperrt: "blocked", kopiert: "Link copied", neueEinl: n => n === 1 ? "1 new redemption" : `${n} new redemptions`,
    druckInfo: (k, b) => `${k} ${k === 1 ? "card" : "cards"} on ${b} A4 ${b === 1 ? "sheet" : "sheets"}. Choose “Actual size” or 100 % in the print dialog.`,
    druckLeer: "No vouchers to print.", formate: { a7: ["8 per A4", "small, to cut out"], a6: ["4 per A4", "postcard"], klapp: ["Folded card", "A5, 1 per sheet"] },
    vonDir: "from", erstelltVon: v => v ? `from ${v}` : "", nurEinmal: "Multi-use vouchers come with the Plus set.",
    info: {
      editor: "<h2>How it works</h2><p>Pick an <b>idea</b> or tap <b>Voucher</b> and write what you are giving – everything saves itself. In the bar at the top: <b>Print</b> (8 or 4 per A4 or as a folded card) and <b>Share</b> (link and QR code).</p><p>Every voucher has a QR code. The recipient scans it and taps <b>Redeem</b> – you see right here what has been redeemed (bell in the list). For paper without a phone, mark it as redeemed yourself.</p><p>Redeemed, expired and withdrawn vouchers are deleted automatically after 12 months.</p>",
      heft: "<h2>Voucher booklet</h2><p>All vouchers here belong to one booklet – with a shared design, “For” and “From”. You can print the cover (title and text) as the first card.</p><p>For another person, tap <b>New</b> at the top.</p>",
    },
  },
};
const t = TX[L];
const IDEEN = {
  de: [["1× Frühstück ans Bett", "kaffee"], ["Kinoabend", "film"], ["Massage", "spa"], ["Ich koche für dich", "essen"], ["Ausflug nach Wahl", "reise"],
    ["Spieleabend", "wuerfel"], ["Konzertbesuch", "musik"], ["Hilfe im Garten", "blatt"], ["Ich backe dir einen Kuchen", "kuchen"], ["Ein Tag ganz für dich", "stern"]],
  en: [["Breakfast in bed", "kaffee"], ["Movie night", "film"], ["Massage", "spa"], ["I’ll cook for you", "essen"], ["Day trip of your choice", "reise"],
    ["Game night", "wuerfel"], ["Concert together", "musik"], ["Help in the garden", "blatt"], ["I’ll bake you a cake", "kuchen"], ["A day just for you", "stern"]],
}[L];
const I = {
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  zurueck: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg>',
  wieder: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5"/></svg>',
  weg: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  beenden: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4"/></svg>',
  kopie: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  oeffnen: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  glocke: '<svg viewBox="0 0 24 24" style="width:13px;height:13px"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16ZM10 20.5a2 2 0 0 0 4 0"/></svg>',
};

/* ---------- Zustand ---------- */
let ich = null, hefte = [], erhalten = [], akt = null, gs = [], sel = 0, offenAnz = 0, grenze = null, gesehenVorher = 0, zeigeDeck = false;
let timer = null, speichert = false, nochmal = false, offen = {}, gsGeaendert = false;
let format = "a7";

function toast(x) { const el = $("toast"); el.textContent = x; el.classList.add("an"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("an"), 2600); }
async function api(pfad, opts = {}) {
  const r = await fetch("/api/" + pfad, { method: opts.method || "GET", headers: opts.body ? { "Content-Type": "application/json" } : {}, body: opts.body ? JSON.stringify(opts.body) : undefined, credentials: "same-origin" });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401) { location.href = "/anmelden?zurueck=" + encodeURIComponent(location.pathname + location.search); throw new Error("anmelden"); }
  if (!r.ok) { const e = new Error(j.fehler || "Fehler " + r.status); e.daten = j; throw e; }
  return j;
}
const zeigeFehler = x => { $("fehler").textContent = x || ""; $("fehler").hidden = !x; };
const stand = x => { $("stand").textContent = x; };
const plus = () => !!(ich && ich.plus);
const heftLink = () => location.origin + "/h/" + akt.slug;
const gLink = g => g && g.slug ? location.origin + "/g/" + g.slug : "";
const tagFmt = ts => { try { return new Intl.DateTimeFormat(L === "en" ? "en-GB" : "de-AT", { day: "numeric", month: "numeric", year: "numeric" }).format(new Date(ts * 1000)); } catch { return ""; } };
const istNeu = e => e.durch === "empfaenger" && e.wann > gesehenVorher;
const saisonDesign = () => { const m = new Date().getMonth() + 1; return m >= 11 || m === 1 ? "weihnachten" : m === 2 ? "liebe" : m === 4 || m === 5 ? "blumen" : "geburtstag"; };

function sprache() {
  document.documentElement.lang = L;
  $("leiste").setAttribute("lang", L);
  document.querySelectorAll("[data-t]").forEach(el => { const v = t[el.dataset.t]; if (typeof v === "string") el.textContent = v; });
  document.querySelectorAll("[data-t-title]").forEach(el => { const v = t[el.dataset.tTitle]; if (v) { el.title = v; el.setAttribute("aria-label", v); } });
  document.querySelectorAll("[data-t-ph]").forEach(el => { const v = t[el.dataset.tPh]; if (v) el.placeholder = v; });
  document.querySelectorAll("[data-t-aria]").forEach(el => { const v = t[el.dataset.tAria]; if (v) el.setAttribute("aria-label", v); });
  document.title = (L === "en" ? "Voucher" : "Gutschein") + " · cleebration";
}

/* ---------- Heft (Für wen & Design) ---------- */
function fuelleHeft() {
  for (const el of document.querySelectorAll("[data-f]")) if (document.activeElement !== el) el.value = akt[el.dataset.f] || "";
  const muster = { titel: t.gutschein || "Gutschein", motiv: "geschenk", status: "offen" };
  $("designs").innerHTML = K.DESIGNS.map(d => `<button class="design" type="button" role="radio" data-design="${d}" aria-checked="${akt.design === d}" title="${esc(K.T(L).designs[d])}"><span class="mini">${K.karte({ design: d, hinweis_aus: true }, { ...muster, titel: K.T(L).gutschein }, { lang: L, qr: false })}</span><b>${esc(K.T(L).designs[d])}</b></button>`).join("");
  $("hinweis_aus").setAttribute("aria-checked", String(!!akt.hinweis_aus));
  $("hinweis-schloss").hidden = plus();
  bildZeile();
  $("ansehen").href = heftLink();
  const u = new URL(location.href); if (u.searchParams.get("h") !== akt.id) { u.searchParams.set("h", akt.id); history.replaceState(null, "", u.pathname + u.search); }
  stand(akt.gesperrt ? t.gesperrt : "");
}
function bildZeile() {
  const frei = plus();
  $("bild-schloss").hidden = frei;
  $("bild-waehlen").setAttribute("aria-disabled", String(!frei));
  $("bild-datei").disabled = !frei;
  $("bild-hilfe").textContent = frei ? t.fotoHilfe : t.plusNoetig;
  $("bild-vor").innerHTML = akt.bild ? `<img src="${esc(akt.bild)}" alt="">` : '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5-11 11"/></svg>';
  $("bild-weg").hidden = !akt.bild;
}
function aendereHeft(f, v) { akt[f] = v; offen[f] = v; planeSpeichern(); zeichneVorschau(); }
function aendereGs(sofort) { gsGeaendert = true; planeSpeichern(sofort); zeichneVorschau(); }
function planeSpeichern(sofort) { stand("…"); clearTimeout(timer); timer = setTimeout(speichern, sofort ? 0 : 600); }

async function speichern() {
  if (!akt) return;
  if (speichert) { nochmal = true; return; }
  const body = { ...offen }; offen = {};
  if (gsGeaendert) { gsGeaendert = false; body.gutscheine = gs.map(g => ({ id: g.id, titel: g.titel, text: g.text, motiv: g.motiv, anzahl: g.anzahl, gueltig_bis: g.gueltig_bis || null, zurueckgezogen: !!g.zurueckgezogen })); }
  if (!Object.keys(body).length) { stand(t.gespeichert); return; }
  speichert = true;
  try {
    const j = await api("hefte/" + akt.id, { method: "PUT", body });
    uebernehme(j, true);
    zeigeFehler(""); stand(t.gespeichert);
  } catch (e) {
    if (e.message !== "anmelden") {
      zeigeFehler(e.message); stand("");
      // Grenze oder Plus-Funktion: lokalen Stand verwerfen und vom Server neu laden (sonst scheitert jedes weitere Speichern)
      try { uebernehme(await api("hefte/" + akt.id), false); } catch {}
    }
  }
  speichert = false;
  if (nochmal) { nochmal = false; speichern(); }
}

// Antwort des Servers übernehmen. leise = beim Tippen in der Liste nichts neu zeichnen (nur IDs/Status nachziehen)
function uebernehme(j, leise) {
  const tippt = $("gs-liste").contains(document.activeElement);
  akt = { ...akt, ...j.heft }; offenAnz = j.offen; grenze = j.grenze;
  if (leise && tippt && j.gutscheine.length === gs.length) {
    j.gutscheine.forEach((s, i) => { const { titel, text, ...rest } = s; Object.assign(gs[i], rest); });
    // Status-Chips der Zeilen nachziehen ohne Neuzeichnen
    gs.forEach((g, i) => { const c = document.querySelector(`.gs[data-i="${i}"] .chip.status`); if (c) { c.className = "chip status " + g.status; c.textContent = t.st[g.status]; } });
  } else { gs = j.gutscheine; if (sel >= gs.length) sel = Math.max(0, gs.length - 1); zeichneGs(); }
  const l = hefte.find(x => x.id === akt.id);
  if (l) Object.assign(l, { titel: akt.titel, fuer: akt.fuer, design: akt.design, anzeige: akt.titel || (gs[0] && gs[0].titel) || "", zahlen: j.zahlen, motive: gs.slice(0, 4).map(g => g.motiv) });
  zeichneListe(); grenzzeile(); zeichneVorschau();
}

document.addEventListener("input", e => { const f = e.target.dataset && e.target.dataset.f; if (f && akt) aendereHeft(f, e.target.value); });
$("designs").addEventListener("click", e => { const b = e.target.closest("[data-design]"); if (!b) return; aendereHeft("design", b.dataset.design); $("designs").querySelectorAll("[data-design]").forEach(x => x.setAttribute("aria-checked", String(x === b))); planeSpeichern(true); });
$("hinweis_aus").addEventListener("click", () => {
  if (!plus()) { toast(t.plusNoetig); return; }
  const an = $("hinweis_aus").getAttribute("aria-checked") !== "true"; $("hinweis_aus").setAttribute("aria-checked", String(an)); aendereHeft("hinweis_aus", an); planeSpeichern(true);
});
// Foto (Set Plus): auf höchstens 1600 px verkleinern, als JPEG speichern
$("bild-waehlen").addEventListener("click", e => { if (!plus()) { e.preventDefault(); toast(t.plusNoetig); } });
$("bild-datei").addEventListener("change", async e => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  try {
    const bmp = await createImageBitmap(f);
    const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    let q = .85, url = c.toDataURL("image/jpeg", q);
    while (url.length > 650000 && q > .4) { q -= .1; url = c.toDataURL("image/jpeg", q); }
    aendereHeft("bild", url); bildZeile(); planeSpeichern(true);
  } catch { toast(L === "en" ? "This picture cannot be read." : "Dieses Bild lässt sich nicht lesen."); }
});
$("bild-weg").addEventListener("click", () => { aendereHeft("bild", null); bildZeile(); planeSpeichern(true); });

/* ---------- Gutscheine ---------- */
function zeichneGs() {
  $("gs-liste").innerHTML = gs.map((g, i) => {
    const neuE = (g.einloesungen || []).some(istNeu);
    const einl = (g.einloesungen || []).map((e, k, a) => `<li>${I.check.replace("<svg", '<svg style="width:13px;height:13px"')}<span>${esc(t.eingeloestAm(tagFmt(e.wann), e.durch))}${e.notiz ? ` · „<b>${esc(e.notiz)}</b>“` : ""}</span>${istNeu(e) ? ` <span class="chip neu">${t.neuChip}</span>` : ""}${k === a.length - 1 ? ` <button class="knopf-text" type="button" data-undo="${i}">${t.rueckgaengig}</button>` : ""}</li>`).join("");
    return `<li class="gs" data-i="${i}" aria-current="${i === sel}">
<div class="gs-kopf"><span class="griff" title="⋮⋮" aria-hidden="true">⋮⋮</span>
<button class="motiv-knopf" type="button" data-motiv="${i}" aria-label="${t.motiv}" title="${t.motiv}">${K.svg(g.motiv)}</button>
<input class="gs-titel" data-g="titel" value="${esc(g.titel)}" maxlength="120" placeholder="${esc(t.phGs)}" aria-label="${esc(t.gutscheine)}">
${neuE ? `<span class="chip neu">${t.neuChip}</span>` : ""}<span class="chip status ${g.status}">${t.st[g.status]}${g.anzahl > 1 ? ` ${g.eingeloest}/${g.anzahl}` : ""}</span></div>
<div class="gs-mehr">
<textarea data-g="text" maxlength="600" placeholder="${esc(t.phText)}">${esc(g.text)}</textarea>
<div class="gs-reihe">
<label title="${plus() ? "" : esc(t.nurEinmal)}">${t.anzahl}<span class="menge"><button type="button" data-m="-1" aria-label="−">−</button><b>${g.anzahl}</b><button type="button" data-m="1" aria-label="+">+</button></span>${plus() ? "" : '<span class="schloss"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span>'}</label>
<label>${t.gueltig}<input type="date" data-g="gueltig_bis" value="${esc(g.gueltig_bis || "")}"></label>
<span class="gs-aktionen">
${g.status === "offen" && g.id ? `<button class="ib" type="button" data-einl="${i}" title="${t.alsEingeloest}" aria-label="${t.alsEingeloest}">${I.check}</button>` : ""}
${g.id ? (g.zurueckgezogen ? `<button class="ib" type="button" data-zur="${i}" title="${t.reaktivieren}" aria-label="${t.reaktivieren}">${I.wieder}</button>` : `<button class="ib" type="button" data-zur="${i}" title="${t.zurueckziehen}" aria-label="${t.zurueckziehen}">${I.zurueck}</button>`) : ""}
<button class="ib" type="button" data-weg="${i}" title="${t.entfernen}" aria-label="${t.entfernen}">${I.weg}</button></span></div>
${einl ? `<ul class="einl">${einl}</ul>` : ""}
${g.loeschen_am ? `<p class="loeschhinweis">${esc(t.loeschen(K.datum(g.loeschen_am, L)))}</p>` : ""}
</div></li>`;
  }).join("") || `<li class="leer">${esc(t.leer)}</li>`;
  document.querySelector(".gutscheine .stand").title = "";
}
function waehle(i, neuZeichnen) {
  if (i === sel && !neuZeichnen) return;
  sel = i; zeigeDeck = false; $("vor-deck").setAttribute("aria-checked", "false");
  document.querySelectorAll("#gs-liste .gs").forEach(li => li.setAttribute("aria-current", String(+li.dataset.i === sel)));
  zeichneVorschau();
}
function grenzzeile() {
  const z = $("grenzzeile");
  if (grenze == null) { z.hidden = true; return; }
  z.hidden = false;
  z.innerHTML = `<span>${esc(t.grenze(offenAnz, grenze))}</span><span class="balken"><i style="width:${Math.min(100, Math.round(offenAnz / grenze * 100))}%"></i></span>`;
}
function neuerGutschein(titel = "", motiv = "geschenk") {
  gs.push({ titel, text: "", motiv, anzahl: 1, gueltig_bis: null, status: "offen", eingeloest: 0, einloesungen: [] });
  sel = gs.length - 1; zeichneGs(); aendereGs(true);
  const inp = document.querySelector(`.gs[data-i="${sel}"] .gs-titel`); if (inp && !titel) inp.focus();
}
$("gs-neu").addEventListener("click", () => neuerGutschein());
$("ideen").addEventListener("click", e => { const b = e.target.closest("[data-idee]"); if (!b) return; const [ti, mo] = IDEEN[+b.dataset.idee]; neuerGutschein(ti, mo); });
$("gs-liste").addEventListener("focusin", e => { const li = e.target.closest(".gs"); if (li) waehle(+li.dataset.i); });
$("gs-liste").addEventListener("input", e => {
  const f = e.target.dataset.g; if (!f) return;
  const li = e.target.closest(".gs"), g = gs[+li.dataset.i];
  g[f] = f === "gueltig_bis" ? (e.target.value || null) : e.target.value;
  aendereGs(f === "gueltig_bis");
});
$("gs-liste").addEventListener("click", async e => {
  const li = e.target.closest(".gs"); if (!li) return;
  const i = +li.dataset.i, g = gs[i];
  if (!e.target.closest("input,textarea,button")) waehle(i);
  const m = e.target.closest("[data-m]");
  if (m) {
    const neu = Math.max(Math.max(1, g.eingeloest || 0), Math.min(20, g.anzahl + +m.dataset.m));
    if (neu > 1 && neu > g.anzahl && !plus()) { toast(t.nurEinmal); return; }
    g.anzahl = neu; li.querySelector(".menge b").textContent = neu; aendereGs(); return;
  }
  if (e.target.closest("[data-motiv]")) { motivWahl(i); return; }
  if (e.target.closest("[data-einl]")) {
    try { uebernehme(await api(`hefte/${akt.id}/gutscheine/${g.id}/einloesen`, { method: "POST", body: {} }), false); toast(t.st.eingeloest); } catch (er) { toast(er.message); }
    return;
  }
  if (e.target.closest("[data-undo]")) {
    try { uebernehme(await api(`hefte/${akt.id}/gutscheine/${g.id}/einloesen`, { method: "DELETE" }), false); } catch (er) { toast(er.message); }
    return;
  }
  if (e.target.closest("[data-zur]")) { g.zurueckgezogen = !g.zurueckgezogen; g.status = g.zurueckgezogen ? "zurueckgezogen" : "offen"; zeichneGs(); aendereGs(true); return; }
  if (e.target.closest("[data-weg]")) {
    if (!confirm(t.entfernenFrage(g.titel || t.ohneTitel))) return;
    if (!g.id) { gs.splice(i, 1); sel = Math.max(0, Math.min(sel, gs.length - 1)); zeichneGs(); zeichneVorschau(); return; }
    await speichern();
    try { const j = await api(`hefte/${akt.id}/gutscheine/${g.id}`, { method: "DELETE" }); sel = Math.max(0, Math.min(sel, j.gutscheine.length - 1)); uebernehme(j, false); if (j.zurueckgezogen) toast(t.entferntZurueck); } catch (er) { toast(er.message); }
  }
});
$("gs-liste").addEventListener("keydown", e => { if (e.target.classList.contains("gs-titel") && e.key === "Enter") { e.preventDefault(); e.target.blur(); } });
// Zeile am Griff ziehen (Maus, Finger, Stift) – Tool-Grundsätze 10: nie Pfeile
$("gs-liste").addEventListener("pointerdown", e => {
  const gr = e.target.closest(".griff"); if (!gr) return;
  const li = gr.closest("li"), ul = $("gs-liste"); e.preventDefault(); li.classList.add("zieht"); gr.setPointerCapture(e.pointerId);
  const zug = ev => { const nach = [...ul.children].find(x => x !== li && ev.clientY < x.getBoundingClientRect().top + x.offsetHeight / 2); ul.insertBefore(li, nach || null); };
  const los = () => {
    gr.removeEventListener("pointermove", zug); li.classList.remove("zieht");
    const alt = gs[sel], neu = [...ul.children].map(x => gs[+x.dataset.i]);
    if (neu.some((p, i) => p !== gs[i])) { gs = neu; sel = Math.max(0, gs.indexOf(alt)); aendereGs(true); }
    zeichneGs();
  };
  gr.addEventListener("pointermove", zug); gr.addEventListener("pointerup", los, { once: true }); gr.addEventListener("pointercancel", los, { once: true });
});

function motivWahl(i) {
  $("motive-wahl").innerHTML = K.MOTIVE.map(m => `<button type="button" role="radio" data-m2="${m}" aria-checked="${gs[i].motiv === m}">${K.svg(m)}</button>`).join("");
  $("motive-wahl").onclick = e => { const b = e.target.closest("[data-m2]"); if (!b) return; gs[i].motiv = b.dataset.m2; $("motiv-dlg").close(); zeichneGs(); aendereGs(true); };
  $("motiv-dlg").showModal();
}

/* ---------- Vorschau ---------- */
function zeichneVorschau() {
  if (!akt) return;
  const g = gs[sel];
  $("vor-karte").innerHTML = zeigeDeck || !g ? K.deckblatt(akt, gs, { lang: L }) : K.karte(akt, g, { lang: L, link: gLink(g) || location.origin, stempel: true });
  $("vor-link").hidden = zeigeDeck || !g || !g.slug;
}
$("vor-deck").addEventListener("click", () => { zeigeDeck = !zeigeDeck; $("vor-deck").setAttribute("aria-checked", String(zeigeDeck)); zeichneVorschau(); });
$("vor-link").addEventListener("click", async () => { const u = gLink(gs[sel]); try { await navigator.clipboard.writeText(u); toast(t.kopiert); } catch { toast(u); } geteilt(); });

/* ---------- Meine Gutscheine + Erhalten ---------- */
function zeichneListe() {
  $("liste").innerHTML = hefte.map(x => `<li tabindex="0" data-id="${esc(x.id)}" aria-current="${akt && x.id === akt.id}"><span class="motive">${(x.motive || []).slice(0, 3).map(m => K.svg(m)).join("")}</span>
<div class="wer"><b>${esc(x.anzeige || x.titel || t.ohneTitel)}</b><small>${esc([x.fuer ? t.fuer + " " + x.fuer : "", t.zahlen(x.zahlen || {})].filter(Boolean).join(" · "))}</small></div>
${x.neu ? `<span class="glocke" title="${esc(t.neueEinl(x.neu))}">${I.glocke}${x.neu}</span>` : ""}
<button class="ib" type="button" data-beenden="${esc(x.id)}" aria-label="${t.beenden}" title="${t.beenden}">${I.beenden}</button></li>`).join("");
  $("anzahl").textContent = hefte.length > 1 ? hefte.length : "";
  $("erhalten-bereich").hidden = !erhalten.length;
  $("erhalten").innerHTML = erhalten.map(x => `<li data-slug="${esc(x.slug)}"><span class="motive">${(x.motive || []).slice(0, 3).map(m => K.svg(m)).join("")}</span>
<div class="wer"><b>${esc(x.titel || t.ohneTitel)}</b><small>${esc([t.erstelltVon(x.von), x.beendet ? "—" : t.zahlen(x.zahlen || {})].filter(Boolean).join(" · "))}</small></div>
<a class="ib" href="/h/${esc(x.slug)}" target="_blank" rel="noopener" aria-label="↗">${I.oeffnen}</a>
<button class="ib" type="button" data-vergessen="${esc(x.id)}" aria-label="${t.vergessen}" title="${t.vergessen}">${I.zurueck}</button></li>`).join("");
}
$("liste").addEventListener("click", async e => {
  const b = e.target.closest("[data-beenden]");
  if (b) {
    const x = hefte.find(y => y.id === b.dataset.beenden);
    if (!confirm(t.beendenFrage(x.anzeige || x.titel || t.ohneTitel))) return;
    try { await api("hefte/" + x.id, { method: "DELETE" }); hefte = hefte.filter(y => y.id !== x.id); if (akt.id === x.id) { hefte.length ? await lade(hefte[0].id) : await neu(); } else zeichneListe(); } catch (er) { toast(er.message); }
    return;
  }
  const li = e.target.closest("li[data-id]"); if (li && li.dataset.id !== akt.id) { await speichern(); lade(li.dataset.id); }
});
$("liste").addEventListener("keydown", e => { if (e.key === "Enter" && e.target.dataset.id) e.target.click(); });
$("erhalten").addEventListener("click", async e => {
  const b = e.target.closest("[data-vergessen]"); if (!b) return;
  try { await api("erhalten/" + b.dataset.vergessen, { method: "DELETE" }); erhalten = erhalten.filter(x => x.id !== b.dataset.vergessen); zeichneListe(); } catch (er) { toast(er.message); }
});

async function lade(id, still) {
  const j = await api("hefte/" + id);
  if (!still) { akt = j.heft; gesehenVorher = j.heft.gesehen; offen = {}; sel = 0; zeigeDeck = false; $("vor-deck").setAttribute("aria-checked", "false"); }
  akt = { ...akt, ...j.heft };
  if (still && ($("gs-liste").contains(document.activeElement) || gsGeaendert)) { offenAnz = j.offen; grenze = j.grenze; grenzzeile(); return; }
  gs = j.gutscheine; offenAnz = j.offen; grenze = j.grenze; if (sel >= gs.length) sel = 0;
  if (!still) fuelleHeft();
  zeichneGs(); grenzzeile(); zeichneVorschau();
  const l = hefte.find(x => x.id === id);
  if (l && l.neu) { l.neu = 0; api(`hefte/${id}/gesehen`, { method: "POST" }).catch(() => {}); }
  zeichneListe();
}
async function neu() {
  await speichern();
  const j = await api("hefte", { method: "POST", body: { von: ich.name || "", design: saisonDesign(), gutscheine: [] } });
  hefte.unshift({ ...j.heft, anzeige: "", zahlen: j.zahlen, neu: 0, motive: [] });
  akt = j.heft; gs = []; sel = 0; offenAnz = j.offen; grenze = j.grenze; offen = {}; gesehenVorher = j.heft.gesehen;
  fuelleHeft(); zeichneGs(); grenzzeile(); zeichneVorschau(); zeichneListe();
}
$("neu").addEventListener("click", () => neu().catch(e => toast(e.message)));

/* ---------- Teilen ---------- */
function geteilt() { if (window.cleeb) cleeb.ereignis("geteilt"); const p = $("tipp-platz"); if (p.firstChild) return; const x = document.createElement("cleebration-tipp"); x.setAttribute("tool", "gutschein"); x.setAttribute("anlass", "geteilt"); p.append(x); }
$("teilen").addEventListener("click", async () => {
  await speichern();
  const url = heftLink();
  $("link-text").textContent = url;
  $("link-senden").hidden = !navigator.share;
  if (customElements.get("cleebration-qr")) {
    const q = document.createElement("cleebration-qr"); q.setAttribute("text", url); q.setAttribute("name", "gutschein-" + (akt.titel || akt.slug).toLowerCase().replace(/[^a-z0-9äöüß]+/g, "-").slice(0, 40)); q.setAttribute("lang", L);
    $("qr-platz").replaceChildren(q);
  } else $("qr-platz").innerHTML = `<div style="width:180px;margin:0 auto">${K.qr(url)}</div>`;
  $("link-liste").innerHTML = gs.filter(g => g.slug).map(g => `<li>${K.svg(g.motiv).replace("<svg", '<svg style="width:16px;height:16px;color:var(--acc)"')}<span>${esc(g.titel || t.ohneTitel)}</span><span class="chip status ${g.status}">${t.st[g.status]}</span><button class="ib" type="button" data-kopie="${esc(gLink(g))}" aria-label="${t.kopieren}">${I.kopie}</button></li>`).join("");
  $("teilen-dlg").showModal();
});
$("link-liste").addEventListener("click", async e => { const b = e.target.closest("[data-kopie]"); if (!b) return; try { await navigator.clipboard.writeText(b.dataset.kopie); toast(t.kopiert); } catch { toast(b.dataset.kopie); } geteilt(); });
$("link-kopieren").addEventListener("click", async () => { try { await navigator.clipboard.writeText(heftLink()); toast(t.kopiert); } catch { toast(heftLink()); } geteilt(); });
$("link-senden").addEventListener("click", async () => { try { await navigator.share({ title: akt.titel || t.gutscheine, text: akt.fuer ? `${t.fuer} ${akt.fuer}` : "", url: heftLink() }); geteilt(); } catch {} });

/* ---------- Drucken ---------- */
const druckListe = () => gs.filter(g => g.slug && ($("d-alle").getAttribute("aria-checked") === "true" || g.status === "offen"));
function formatKnoepfe() {
  const bild = { a7: [2, 4, 18, 24], a6: [2, 2, 26, 18], klapp: [1, 2, 18, 24] };
  $("formate").innerHTML = Object.entries(t.formate).map(([k, [n, s]]) => { const [c, r, w, h] = bild[k];
    return `<button class="format" type="button" role="radio" data-format="${k}" aria-checked="${format === k}"><span class="blatt" style="width:${w}px;height:${h}px;grid-template-columns:repeat(${c},1fr);grid-template-rows:repeat(${r},1fr)">${"<i></i>".repeat(c * r)}</span><b>${esc(n)}</b>${esc(s)}</button>`; }).join("");
  druckInfo();
}
function druckInfo() {
  const n = druckListe().length + ($("d-deck").getAttribute("aria-checked") === "true" && druckListe().length ? 1 : 0);
  $("druck-info").textContent = n ? t.druckInfo(n, K.seitenAnzahl(format, n)) : t.druckLeer;
  $("druck-los").disabled = !n;
}
$("drucken").addEventListener("click", async () => { await speichern(); formatKnoepfe(); $("druck-dlg").showModal(); });
$("formate").addEventListener("click", e => { const b = e.target.closest("[data-format]"); if (!b) return; format = b.dataset.format; formatKnoepfe(); try { localStorage.setItem("gutschein.format", format); } catch {} });
for (const id of ["d-deck", "d-alle", "d-linien"]) $(id).addEventListener("click", () => { $(id).setAttribute("aria-checked", String($(id).getAttribute("aria-checked") !== "true")); druckInfo(); });
$("druck-los").addEventListener("click", () => {
  const liste = druckListe(); if (!liste.length) return;
  const items = [];
  if ($("d-deck").getAttribute("aria-checked") === "true") items.push({ html: K.deckblatt(akt, liste, { lang: L }), rueck: K.rueckseite(akt, {}, { lang: L, link: heftLink() }) });
  for (const g of liste) items.push({ html: K.karte(akt, g, { lang: L, link: gLink(g) }), rueck: K.rueckseite(akt, g, { lang: L, link: gLink(g) }) });
  $("druck").innerHTML = K.boegen(format, items, { linien: $("d-linien").getAttribute("aria-checked") === "true", falten: K.T(L).falten });
  let st = $("druck-seite"); if (!st) { st = document.createElement("style"); st.id = "druck-seite"; document.head.append(st); }
  st.textContent = `@page{size:${K.FORMATE[format].seite};margin:0}`;
  $("druck-dlg").close();
  if (window.cleeb) cleeb.ereignis("gedruckt");
  setTimeout(() => window.print(), 60);
});
$("druck-dlg").addEventListener("click", e => { if (e.target === $("druck-dlg")) $("druck-dlg").close(); });

/* ---------- Infos, Klick außen schließt ---------- */
document.addEventListener("click", e => { const b = e.target.closest("[data-info]"); if (!b) return; $("info-text").innerHTML = t.info[b.dataset.info] || ""; $("info").showModal(); });
for (const d of ["info", "teilen-dlg", "motiv-dlg"]) $(d).addEventListener("click", e => { if (e.target === $(d)) $(d).close(); });

/* ---------- Karten per Griff verschieben (Reihenfolge im Browser) ---------- */
const app = document.querySelector(".app"), KARTEN = ["gutscheine", "vorschau", "gestaltung", "hefte"];
try { const o = JSON.parse(localStorage.getItem("gutschein.karten") || "[]"); for (const k of o) { const el = app.querySelector("." + k); if (el) app.append(el); } } catch {}
app.addEventListener("pointerdown", e => {
  const g = e.target.closest(".kopf > .griff"); if (!g) return;
  const k = g.closest(".karte"); e.preventDefault(); k.classList.add("zieht"); g.setPointerCapture(e.pointerId);
  const zug = ev => { const ziel = [...app.children].find(x => { if (x === k) return false; const r = x.getBoundingClientRect(); return ev.clientY < r.top + r.height / 2 && ev.clientX < r.right; }); app.insertBefore(k, ziel || null); };
  const los = () => { g.removeEventListener("pointermove", zug); k.classList.remove("zieht");
    try { localStorage.setItem("gutschein.karten", JSON.stringify([...app.children].map(x => [...x.classList].find(c => KARTEN.includes(c))).filter(Boolean))); } catch {} };
  g.addEventListener("pointermove", zug); g.addEventListener("pointerup", los, { once: true }); g.addEventListener("pointercancel", los, { once: true });
});

/* ---------- Start ---------- */
window.addEventListener("beforeunload", () => { if (Object.keys(offen).length || gsGeaendert) speichern(); });
document.addEventListener("visibilitychange", () => { if (document.hidden) speichern(); });
// neue Einlösungen nachladen (Glocke)
setInterval(async () => {
  if (document.hidden || !akt || speichert) return;
  try {
    const j = await api("hefte");
    for (const x of j.hefte) { const l = hefte.find(y => y.id === x.id); if (l) Object.assign(l, { neu: x.id === akt.id ? 0 : x.neu, zahlen: x.zahlen }); }
    zeichneListe(); await lade(akt.id, true);
  } catch {}
}, 30000);
(async () => {
  sprache();
  $("ideen").innerHTML = IDEEN.map(([ti, mo], i) => `<button class="idee" type="button" data-idee="${i}">${K.svg(mo)}${esc(ti)}</button>`).join("");
  try { const f = localStorage.getItem("gutschein.format"); if (K.FORMATE[f]) format = f; } catch {}
  try {
    ich = await api("ich");
    if (!ich.angemeldet) { location.href = "/anmelden?zurueck=" + encodeURIComponent(location.pathname + location.search); return; }
    if (ich.name) $("leiste").setAttribute("name", ich.name);
    const [h, e] = await Promise.all([api("hefte"), api("erhalten")]);
    hefte = h.hefte; erhalten = e.erhalten;
    const summe = hefte.reduce((a, x) => a + (x.neu || 0), 0);
    const w = new URL(location.href).searchParams.get("h");
    const start = hefte.find(x => x.id === w) || hefte.find(x => x.neu) || hefte[0];
    if (start) await lade(start.id); else await neu(); // Grundsatz 6: sofort bearbeiten
    if (summe) toast(t.neueEinl(summe));
  } catch (er) { if (er.message !== "anmelden") zeigeFehler(er.message); }
})();
})();
