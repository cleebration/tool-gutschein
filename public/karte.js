// Gutschein · gemeinsame Karte für Editor, Empfänger-Seite und Druck (gutschein.cleebration.com).
// Eine Karte = ein Gutschein im Querformat (Seitenverhältnis √2 wie A5/A6/A7). Schriftgrößen in cqw → dieselbe Karte passt in Vorschau und Druck.
// Druck-Kern nach dem Vorbild Rückenschild: Bögen in mm, @page mit Rand 0, Schnittlinien; QR als SVG (qrcode-generator, MIT, public/vendor).
(() => {
"use strict";
const esc = t => String(t == null ? "" : t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const ICON = {
  geschenk: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M3 12h18M12 8v13"/><path d="M12 8c-1.5-3.5-6-4-6-1.5S10 8 12 8Zm0 0c1.5-3.5 6-4 6-1.5S14 8 12 8Z"/>',
  herz: '<path d="M12 20s-7.5-4.6-9-9.3C2 7.4 4.2 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.8 1.1-1.7 2.7-2.8 4.7-2.8 3.1 0 5.3 2.9 4.3 6.2-1.5 4.7-9 9.3-9 9.3Z"/>',
  kaffee: '<path d="M4 9h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6V9Z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17M8 2.5c-.7 1 .7 2-.1 3M12 2.5c-.7 1 .7 2-.1 3"/>',
  film: '<rect x="3" y="9" width="18" height="12" rx="2"/><path d="m3 9 16.5-4.5.8 3L3.8 12M7.5 7.8l2 3.2M12.5 6.4l2 3.3"/>',
  spa: '<path d="M12 21c-4-2-7-5.5-7-10 3 0 5.5 1.3 7 3.5 1.5-2.2 4-3.5 7-3.5 0 4.5-3 8-7 10Z"/><path d="M12 14.5C10 11 10.5 6.5 12 3c1.5 3.5 2 8 0 11.5Z"/>',
  essen: '<path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 11v10M17 21V3c-2.5 1.5-3.5 4.5-3.5 8H17"/>',
  reise: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7M8 7v13M16 7v13"/>',
  stern: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>',
  wuerfel: '<rect x="3.5" y="3.5" width="17" height="17" rx="3.5"/><circle cx="8.5" cy="8.5" r="1.2"/><circle cx="15.5" cy="15.5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="15.5" cy="8.5" r="1.2"/><circle cx="8.5" cy="15.5" r="1.2"/>',
  musik: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  blatt: '<path d="M5 19C4 10 9 4 20 4c0 11-6 16-15 15Z"/><path d="M5 19 13 11"/>',
  kuchen: '<path d="M4 21V13a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8M3 21h18M4 15.5c2 1.5 3.5 1.5 5.3 0s3.5-1.5 5.4 0 3.5 1.5 5.3 0M12 11V8"/><path d="M12 8c-1-1-1-2.5 0-4 1 1.5 1 3 0 4Z"/>',
};
const MOTIVE = Object.keys(ICON);
const svg = (k, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICON[k] || ICON.geschenk}</svg>`;

const TEXT = {
  de: {
    gutschein: "Gutschein", heft: "Gutscheinheft", fuer: "Für", von: "von", gueltig: "gültig bis", scan: "Scannen zum Einlösen", mal: "×",
    fertig: "eingelöst", abgelaufen: "abgelaufen", zurueck: "zurückgenommen", offen: "offen", stueck: n => n === 1 ? "1 Gutschein" : `${n} Gutscheine`,
    falten: "hier falten", innen: "innen Platz für persönliche Worte", erstellt: "mit cleebration erstellt · gutschein.cleebration.com",
    designs: { weihnachten: "Weihnachten", geburtstag: "Geburtstag", liebe: "Liebe", blumen: "Blumen", konfetti: "Konfetti", elegant: "Elegant" },
  },
  en: {
    gutschein: "Voucher", heft: "Voucher booklet", fuer: "For", von: "from", gueltig: "valid until", scan: "Scan to redeem", mal: "×",
    fertig: "redeemed", abgelaufen: "expired", zurueck: "withdrawn", offen: "open", stueck: n => n === 1 ? "1 voucher" : `${n} vouchers`,
    falten: "fold here", innen: "room inside for your own words", erstellt: "made with cleebration · gutschein.cleebration.com",
    designs: { weihnachten: "Christmas", geburtstag: "Birthday", liebe: "Love", blumen: "Flowers", konfetti: "Confetti", elegant: "Elegant" },
  },
};
const DESIGNS = Object.keys(TEXT.de.designs);
const T = L => TEXT[L] || TEXT.de;
const datum = (d, L) => { if (!d) return ""; try { return new Intl.DateTimeFormat(L === "en" ? "en-GB" : "de-AT", { day: "numeric", month: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(d + "T12:00:00Z")); } catch { return d; } };

/* ---------- QR als SVG (für Druck und Vorschau) ---------- */
function qr(text) {
  if (!window.qrcode || !text) return "";
  const q = window.qrcode(0, "M"); q.addData(text); q.make();
  const n = q.getModuleCount(); let p = "";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) p += `M${x} ${y}h1v1h-1z`;
  return `<svg class="qr" style="stroke:none" viewBox="-1 -1 ${n + 2} ${n + 2}" shape-rendering="crispEdges" aria-hidden="true"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="#fff"/><path d="${p}" fill="#111" stroke="none"/></svg>`;
}

/* ---------- Karte ---------- */
// heft: { titel, fuer, von, design, bild, hinweis_aus, deckblatt } · g: { titel, text, motiv, anzahl, eingeloest, gueltig_bis, status, slug }
// opts: { lang, link (URL für QR), qr (true/false), stempel (Status zeigen), druck }
function karte(heft, g, opts = {}) {
  const L = opts.lang || "de", t = T(L), d = DESIGNS.includes(heft.design) ? heft.design : "weihnachten";
  const st = g.status || "offen";
  const fuer = heft.fuer ? `<span>${t.fuer} <b>${esc(heft.fuer)}</b></span>` : "";
  const von = heft.von ? `<span>${t.von} <b>${esc(heft.von)}</b></span>` : "";
  const bis = g.gueltig_bis ? `<span class="bis">${t.gueltig} ${esc(datum(g.gueltig_bis, L))}</span>` : "";
  const mehr = g.anzahl > 1 ? `<span class="mal">${g.anzahl}${t.mal}${opts.stempel && g.eingeloest ? ` <small>· ${g.eingeloest}/${g.anzahl}</small>` : ""}</span>` : "";
  const stempel = opts.stempel && st !== "offen" ? `<span class="stempel s-${st}">${st === "eingeloest" ? t.fertig : st === "abgelaufen" ? t.abgelaufen : t.zurueck}</span>` : "";
  const code = opts.qr !== false && opts.link ? `<div class="qr-box">${qr(opts.link)}<small>${t.scan}</small></div>` : "";
  return `<article class="gk d-${d}${heft.bild ? " mit-bild" : ""} st-${st}" data-slug="${esc(g.slug || "")}">
${heft.bild ? `<div class="gk-bild"><img src="${esc(heft.bild)}" alt=""></div>` : ""}
<div class="gk-deko" aria-hidden="true"></div>
<div class="gk-inhalt">
  <div class="gk-kopf"><span class="gk-label">${t.gutschein}</span>${mehr}</div>
  <div class="gk-mitte">${svg(g.motiv, "gk-motiv")}<h3 class="gk-titel">${esc(g.titel || t.gutschein)}</h3>${g.text ? `<p class="gk-text">${esc(g.text)}</p>` : ""}</div>
  <div class="gk-fuss"><div class="gk-wer">${fuer}${von}${bis}</div>${code}</div>
</div>
${heft.hinweis_aus ? "" : `<span class="gk-hinweis">${t.erstellt}</span>`}
${stempel}
</article>`;
}

// Deckblatt eines Gutscheinhefts (gleiche Größe wie eine Karte)
function deckblatt(heft, liste, opts = {}) {
  const L = opts.lang || "de", t = T(L), d = DESIGNS.includes(heft.design) ? heft.design : "weihnachten";
  const motive = [...new Set(liste.map(g => g.motiv))].slice(0, 6);
  return `<article class="gk gk-deck d-${d}${heft.bild ? " mit-bild" : ""}">
${heft.bild ? `<div class="gk-bild"><img src="${esc(heft.bild)}" alt=""></div>` : ""}
<div class="gk-deko" aria-hidden="true"></div>
<div class="gk-inhalt">
  <div class="gk-kopf"><span class="gk-label">${t.heft}</span><span class="mal">${t.stueck(liste.length)}</span></div>
  <div class="gk-mitte"><h3 class="gk-titel">${esc(heft.titel || t.heft)}</h3>${heft.fuer ? `<p class="gk-fuer">${t.fuer} ${esc(heft.fuer)}</p>` : ""}${heft.deckblatt ? `<p class="gk-text">${esc(heft.deckblatt)}</p>` : ""}</div>
  <div class="gk-fuss"><div class="gk-wer">${heft.von ? `<span>${t.von} <b>${esc(heft.von)}</b></span>` : ""}</div><div class="gk-motivreihe">${motive.map(m => svg(m)).join("")}</div></div>
</div>
${heft.hinweis_aus ? "" : `<span class="gk-hinweis">${t.erstellt}</span>`}
</article>`;
}

// Rückseite der Klappkarte (wird um 180° gedreht gedruckt): QR groß + Hinweis
function rueckseite(heft, g, opts = {}) {
  const L = opts.lang || "de", t = T(L), d = DESIGNS.includes(heft.design) ? heft.design : "weihnachten";
  return `<article class="gk gk-rueck d-${d}"><div class="gk-deko" aria-hidden="true"></div><div class="gk-inhalt">
${opts.link ? `<div class="qr-box gross">${qr(opts.link)}<small>${t.scan}</small></div>` : ""}<p class="gk-innen">${t.innen}</p>
${heft.hinweis_aus ? "" : `<span class="gk-hinweis">${t.erstellt}</span>`}</div></article>`;
}

/* ---------- Druckbögen (mm) ---------- */
// Formate: a7 = 8 je A4 hoch (98 × 69,3 mm) · a6 = 4 je A4 quer (141,5 × 100 mm) · klapp = A4 hoch, einmal quer gefaltet → A5 quer (Vorderseite unten, Rückseite oben gedreht)
const FORMATE = {
  a7: { seite: "A4 portrait", b: 210, h: 297, rand: 7, sp: 2, zl: 4, w: 98, hh: 69.3 },
  a6: { seite: "A4 landscape", b: 297, h: 210, rand: 7, sp: 2, zl: 2, w: 141.5, hh: 100 },
  klapp: { seite: "A4 portrait", b: 210, h: 297, rand: 7, sp: 1, zl: 1, w: 196, hh: 138.6 },
};
// items: [{ html, rueck }] – fertige Karten (Deckblatt zuerst, falls gewünscht). opts: { linien }
function boegen(format, items, opts = {}) {
  const F = FORMATE[format] || FORMATE.a7, je = F.sp * F.zl, seiten = [];
  for (let i = 0; i < items.length; i += je) seiten.push(items.slice(i, i + je));
  const x0 = (F.b - F.sp * F.w) / 2, y0 = (F.h - F.zl * F.hh) / 2;
  return seiten.map(s => {
    if (format === "klapp") {
      const it = s[0], halb = F.h / 2, y = (halb - F.hh) / 2;
      return `<div class="bogen" style="width:${F.b}mm;height:${F.h}mm">
<div class="platz gedreht${opts.linien ? " linie" : ""}" style="left:${x0}mm;top:${y}mm;width:${F.w}mm;height:${F.hh}mm">${it.rueck || ""}</div>
<div class="falz" style="top:${halb}mm"><span>${esc(opts.falten || "")}</span></div>
<div class="platz${opts.linien ? " linie" : ""}" style="left:${x0}mm;top:${halb + y}mm;width:${F.w}mm;height:${F.hh}mm">${it.html}</div></div>`;
    }
    return `<div class="bogen" style="width:${F.b}mm;height:${F.h}mm">${s.map((it, n) => `<div class="platz${opts.linien ? " linie" : ""}" style="left:${x0 + (n % F.sp) * F.w}mm;top:${y0 + Math.floor(n / F.sp) * F.hh}mm;width:${F.w}mm;height:${F.hh}mm">${it.html}</div>`).join("")}</div>`;
  }).join("");
}
const seitenAnzahl = (format, n) => { const F = FORMATE[format] || FORMATE.a7; return Math.ceil(n / (F.sp * F.zl)); };

window.GKarte = { ICON, MOTIVE, DESIGNS, TEXT, T, svg, qr, karte, deckblatt, rueckseite, boegen, seitenAnzahl, FORMATE, datum, esc };
})();
