// Gutschein · Seite für Beschenkte (gutschein.cleebration.com/h/<heft> und /g/<gutschein>). Kein Konto nötig – der Link ist der Gutschein.
(() => {
"use strict";
const $ = id => document.getElementById(id);
const K = window.GKarte, esc = K.esc;
const seite = $("seite"), art = seite.dataset.art, slug = seite.dataset.slug;
const L = document.documentElement.lang === "en" ? "en" : "de";
const TX = {
  de: {
    fuer: n => `Für ${n}`, von: n => `von ${n}`, einloesen: "Einlösen", einloesenMal: (n, a) => `Einlösen (${n} von ${a} übrig)`,
    frage: ti => `„${ti}“ jetzt einlösen?`, frageText: "Am besten zeigst du das der Person, die ihn dir geschenkt hat. Einlösen lässt sich nicht rückgängig machen – nur sie kann es zurücknehmen.",
    notiz: "Wann oder wie? (optional)", notizPh: "z. B. Samstag in der Früh", jetzt: "Jetzt einlösen", abbrechen: "Abbrechen",
    fertig: "Eingelöst – viel Freude!", eingeloestAm: d => `eingelöst am ${d}`, st: { abgelaufen: "abgelaufen", zurueckgezogen: "zurückgenommen" },
    beendet: "Dieses Gutscheinheft wurde beendet – die Gutscheine lassen sich nicht mehr einlösen.",
    merken: "In mein Konto übernehmen", gemerkt: "In deinem Konto unter „Erhalten“", anmeldenMerken: "Anmelden und aufheben",
    merkenText: "Damit nichts verloren geht – auch ohne diesen Link.", ganzesHeft: "Alle Gutscheine im Heft", melden: "Melden", gemeldet: "Gemeldet – danke",
    gruende: [["spam", "Spam"], ["anstoessig", "Anstößig"], ["betrug", "Betrug"], ["sonstiges", "Anderes"]], danke: "Danke, wir sehen uns das an.",
    hoppla: "Hoppla", drucken: "Drucken",
  },
  en: {
    fuer: n => `For ${n}`, von: n => `from ${n}`, einloesen: "Redeem", einloesenMal: (n, a) => `Redeem (${n} of ${a} left)`,
    frage: ti => `Redeem “${ti}” now?`, frageText: "Best show this to the person who gave it to you. Redeeming cannot be undone – only they can take it back.",
    notiz: "When or how? (optional)", notizPh: "e.g. Saturday morning", jetzt: "Redeem now", abbrechen: "Cancel",
    fertig: "Redeemed – enjoy!", eingeloestAm: d => `redeemed on ${d}`, st: { abgelaufen: "expired", zurueckgezogen: "withdrawn" },
    beendet: "This voucher booklet has been closed – its vouchers can no longer be redeemed.",
    merken: "Keep in my account", gemerkt: "In your account under “Received”", anmeldenMerken: "Sign in and keep",
    merkenText: "So nothing gets lost – even without this link.", ganzesHeft: "All vouchers in the booklet", melden: "Report", gemeldet: "Reported – thank you",
    gruende: [["spam", "Spam"], ["anstoessig", "Offensive"], ["betrug", "Fraud"], ["sonstiges", "Other"]], danke: "Thank you, we will take a look.",
    hoppla: "Oops", drucken: "Print",
  },
};
const t = TX[L];
const I = { check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>', konto: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>', heft: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>' };

let daten = null, frisch = null;

function toast(x) { let el = $("toast"); if (!el) { el = document.createElement("div"); el.id = "toast"; el.setAttribute("role", "status"); document.body.append(el); } el.textContent = x; el.classList.add("an"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("an"), 2600); }
async function api(pfad, opts = {}) {
  const r = await fetch("/api/" + pfad, { method: opts.method || "GET", headers: opts.body ? { "Content-Type": "application/json" } : {}, body: opts.body ? JSON.stringify(opts.body) : undefined, credentials: "same-origin" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.fehler || "Fehler " + r.status); e.daten = j; throw e; }
  return j;
}
const tagFmt = ts => { try { return new Intl.DateTimeFormat(L === "en" ? "en-GB" : "de-AT", { day: "numeric", month: "long", year: "numeric" }).format(new Date(ts * 1000)); } catch { return ""; } };

function kopf(h) {
  if (daten.einzeln) return "";
  return `<section class="karte-glas kopf">
${h.fuer ? `<p class="vorzeile">${esc(t.fuer(h.fuer))}</p>` : ""}
<h1>${esc(h.titel || K.T(L).heft)}</h1>
${h.deckblatt ? `<p class="text">${esc(h.deckblatt)}</p>` : ""}
${h.von ? `<p class="unterschrift">${esc(t.von(h.von))}</p>` : ""}
</section>`;
}

function aktion(g) {
  if (daten.beendet) return "";
  if (g.status === "offen") return `<button class="knopf" type="button" data-einl="${esc(g.slug)}">${I.check}${esc(g.anzahl > 1 ? t.einloesenMal(g.anzahl - g.eingeloest, g.anzahl) : t.einloesen)}</button>`;
  if (g.status === "eingeloest") { const e = g.einloesungen[g.einloesungen.length - 1]; return `<p class="status ok">${I.check}${esc(e ? t.eingeloestAm(tagFmt(e.wann)) : "")}</p>`; }
  return `<p class="status">${esc(t.st[g.status] || "")}</p>`;
}

function zeichne() {
  const h = daten.heft;
  const karten = daten.gutscheine.map(g => `<div class="platz-g${frisch === g.slug ? " frisch" : ""}" id="g-${esc(g.slug)}">${K.karte(h, g, { lang: L, qr: false, stempel: true })}<div class="unter">${aktion(g)}${g.anzahl > 1 && g.eingeloest && g.status === "offen" ? `<small>${g.einloesungen.map(e => esc(tagFmt(e.wann))).join(" · ")}</small>` : ""}</div></div>`).join("");
  let merken = "";
  if (!daten.meins) {
    if (daten.gemerkt) merken = `<p class="merken ok">${I.konto}${esc(t.gemerkt)}</p>`;
    else if (daten.angemeldet) merken = `<div class="merken"><button class="knopf zart" type="button" id="merken">${I.konto}${esc(t.merken)}</button><small>${esc(t.merkenText)}</small></div>`;
    else merken = `<div class="merken"><a class="knopf zart" href="/anmelden?zurueck=${encodeURIComponent(location.pathname + "?merken=1")}">${I.konto}${esc(t.anmeldenMerken)}</a><small>${esc(t.merkenText)}</small></div>`;
  }
  seite.innerHTML = kopf(h)
    + (daten.beendet ? `<p class="banner">${esc(t.beendet)}</p>` : "")
    + `<div class="karten">${karten}</div>` + merken + `<div id="tipp-platz"></div>`;
  document.title = (daten.einzeln && daten.gutscheine[0] ? daten.gutscheine[0].titel : h.titel) || K.T(L).gutschein;
}

seite.addEventListener("click", async e => {
  const b = e.target.closest("[data-einl]");
  if (b) { frage(daten.gutscheine.find(g => g.slug === b.dataset.einl)); return; }
  if (e.target.closest("#merken")) {
    try { daten = await api(`h/${daten.heft.slug}/merken`, { method: "POST" }); zeichne(); } catch (er) { toast(er.message); }
  }
});

// Bestätigen mit optionaler Notiz (z. B. „Samstag“) – der Schenker sieht sie
function frage(g) {
  const d = document.createElement("dialog"); d.className = "dlg";
  d.innerHTML = `<form method="dialog"><h2>${esc(t.frage(g.titel || K.T(L).gutschein))}</h2><p class="klein">${esc(t.frageText)}</p>
<label class="feld"><span>${esc(t.notiz)}</span><input id="notiz" maxlength="200" placeholder="${esc(t.notizPh)}" autocomplete="off"></label>
<p class="fehler" id="d-fehler" hidden></p>
<div class="knoepfe"><button class="knopf zart" value="nein">${esc(t.abbrechen)}</button><button class="knopf" type="button" id="ja">${I.check}${esc(t.jetzt)}</button></div></form>`;
  document.body.append(d); d.showModal();
  d.addEventListener("click", ev => { if (ev.target === d) d.close(); });
  d.addEventListener("close", () => d.remove());
  d.querySelector("#ja").addEventListener("click", async ev => {
    ev.target.disabled = true;
    try {
      const j = await api(`g/${g.slug}/einloesen`, { method: "POST", body: { notiz: d.querySelector("#notiz").value } });
      const neu = j.gutscheine.find(x => x.slug === g.slug);
      const i = daten.gutscheine.findIndex(x => x.slug === g.slug); if (i >= 0 && neu) daten.gutscheine[i] = neu;
      d.close(); frisch = g.slug; zeichne(); toast(t.fertig);
      const p = $("tipp-platz"); if (p && !p.firstChild) { const x = document.createElement("cleebration-tipp"); x.setAttribute("tool", "gutschein"); x.setAttribute("anlass", "eingeloest"); p.append(x); }
      const el = document.getElementById("g-" + g.slug); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (er) { const f = d.querySelector("#d-fehler"); f.textContent = er.message; f.hidden = false; ev.target.disabled = false; }
  });
}

// Melden (Spam, anstößig, Betrug) → Meldungen-Inbox im cleebration store. Ein Klick auf den Grund = gemeldet.
function meldenEinbauen() {
  const f = document.querySelector("footer.fuss"); if (!f || !daten) return;
  const d = document.createElement("details"); d.className = "melden";
  d.innerHTML = `<summary>${esc(t.melden)}</summary><div>` + t.gruende.map(([k, x]) => `<button type="button" data-grund="${k}">${esc(x)}</button>`).join("") + "</div>";
  d.addEventListener("click", async e => {
    const b = e.target.closest("button[data-grund]"); if (!b) return;
    try { await api(`h/${daten.heft.slug}/melden`, { method: "POST", body: { grund: b.dataset.grund } }); d.open = false; d.querySelector("summary").textContent = t.gemeldet; toast(t.danke); }
    catch (er) { toast(er.message); }
  });
  f.append(d);
}

(async () => {
  try {
    daten = await api(`${art}/${slug}`);
    const u = new URL(location.href);
    if (u.searchParams.get("merken") === "1") {
      history.replaceState(null, "", u.pathname);
      if (daten.angemeldet && !daten.meins && !daten.gemerkt) { try { daten = await api(`h/${daten.heft.slug}/merken`, { method: "POST" }); } catch {} }
    }
    zeichne(); meldenEinbauen();
  } catch (e) { seite.innerHTML = `<section class="karte-glas"><h1>${esc(t.hoppla)}</h1><p>${esc(e.message)}</p></section>`; }
})();
})();
