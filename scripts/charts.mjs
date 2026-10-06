// Grafici generati al build, senza librerie. Barre in HTML/CSS (scalano bene su telefono),
// grafico a punti in SVG. Colori e spessori sono nel CSS (variabili --viz-*).
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const fmtInt = (n) => Math.round(n).toLocaleString("en-US");
export const fmtPop = (n) => (n >= 1e9 ? `${(n / 1e9).toFixed(2)} billion` : `${(n / 1e6).toFixed(n < 1e7 ? 1 : 0)} million`);
const fmtM = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(n < 1e7 ? 1 : 0)} M` : `${Math.round(n / 1e3)} k`);
const pct = (x) => `${(x * 100).toFixed(x < 0.1 ? 1 : 0)}%`;

// Barre orizzontali: le prime `accent` in evidenza, le altre in grigio (enfasi, non categorie).
export function barList(rows, { accent = 0 } = {}) {
  const max = Math.max(...rows.map((r) => r.value));
  return `<div class="bars" role="list">${rows.map((r, i) => `<div class="brow" role="listitem" data-tip="${esc(r.tip)}" data-sub="${esc(r.sub || "")}" tabindex="0">
  <span class="bname">${esc(r.label)}</span>
  <span class="btrack"><span class="bfill${i < accent ? "" : " mute"}" style="width:${(r.value / max * 100).toFixed(2)}%"></span></span>
  <span class="bval">${esc(r.text)}</span>
</div>`).join("")}</div>`;
}

// Due barre per riga (due serie, con legenda).
export function pairedBars(rows, series) {
  const max = Math.max(...rows.flatMap((r) => r.values));
  const legend = `<ul class="vlegend">${series.map((s, i) => `<li><span class="vkey s${i + 1}"></span>${esc(s)}</li>`).join("")}</ul>`;
  const body = rows.map((r) => `<div class="prow" data-sub="${esc(r.sub)}"><span class="bname">${esc(r.label)}</span>${r.values.map((v, i) =>
    `<div class="pline" data-tip="${esc(r.tips[i])}" tabindex="0"><span class="btrack"><span class="bfill s${i + 1}" style="width:${(v / max * 100).toFixed(2)}%"></span></span><span class="bval">${pct(v)}</span></div>`).join("")}</div>`).join("");
  return `${legend}<div class="paired" role="list">${body}</div>`;
}

// Grafico a punti: superficie (x) contro popolazione (y), scale logaritmiche.
// Le diagonali sono linee di uguale densità (persone per km²).
export function scatter(points, { labels = {} } = {}) {
  const W = 640, H = 440, m = { l: 52, r: 78, t: 28, b: 54 };
  const x0 = 300, x1 = 3e6, y0 = 8e4, y1 = 4e8;
  const lx = (v) => Math.log10(v);
  const sx = (v) => m.l + (lx(v) - lx(x0)) / (lx(x1) - lx(x0)) * (W - m.l - m.r);
  const sy = (v) => H - m.b - (lx(v) - lx(y0)) / (lx(y1) - lx(y0)) * (H - m.t - m.b);
  const r1 = (n) => Math.round(n * 10) / 10;
  const xt = [[1e3, "1k"], [1e4, "10k"], [1e5, "100k"], [1e6, "1M"]];
  const yt = [[1e5, "100k"], [1e6, "1M"], [1e7, "10M"], [1e8, "100M"]];
  const grid = xt.map(([v]) => `<line class="grid" x1="${r1(sx(v))}" x2="${r1(sx(v))}" y1="${m.t}" y2="${H - m.b}"/>`).join("") +
    yt.map(([v]) => `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${r1(sy(v))}" y2="${r1(sy(v))}"/>`).join("");
  const ticks = xt.map(([v, t]) => `<text class="tick" x="${r1(sx(v))}" y="${H - m.b + 18}" text-anchor="middle">${t}</text>`).join("") +
    yt.map(([v, t]) => `<text class="tick" x="${m.l - 8}" y="${r1(sy(v) + 4)}" text-anchor="end">${t}</text>`).join("");
  // linee di uguale densità, tagliate al riquadro; le etichette stanno fuori dal riquadro, dove la linea esce
  const dens = [1, 10, 100, 1000].map((d) => {
    const xa = Math.max(x0, y0 / d), xb = Math.min(x1, y1 / d);
    if (xa >= xb) return "";
    const a = [r1(sx(xa)), r1(sy(xa * d))], b = [r1(sx(xb)), r1(sy(xb * d))];
    const right = x1 * d <= y1;
    const text = `${fmtInt(d)} / km²`;
    const label = right
      ? `<text class="isot" x="${W - m.r + 6}" y="${b[1] + 4}">${text}</text>`
      : `<text class="isot" x="${b[0]}" y="${m.t - 8}" text-anchor="middle">${text}</text>`;
    return { line: `<line class="iso" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`, label };
  }).filter(Boolean);
  const dots = points.map((p) => `<circle class="dot" cx="${r1(sx(p.area))}" cy="${r1(sy(p.population))}" r="5" data-sub="${esc(p.sub)}" data-tip="${esc(p.tip)}" tabindex="0"><title>${esc(p.tip)}</title></circle>`).join("");
  const labs = points.filter((p) => labels[p.name]).map((p) => {
    const [dx, dy, anchor] = labels[p.name];
    return `<text class="plab" x="${r1(sx(p.area) + dx)}" y="${r1(sy(p.population) + dy)}" text-anchor="${anchor}">${esc(p.name)}</text>`;
  }).join("");
  return `<svg class="sc" viewBox="0 0 ${W} ${H}" role="group" aria-label="Scatter chart of area against population for each African country, both on logarithmic scales. The table below has the same figures.">
<defs><clipPath id="scclip"><rect x="${m.l}" y="${m.t}" width="${W - m.l - m.r}" height="${H - m.t - m.b}"/></clipPath></defs>
${grid}<g clip-path="url(#scclip)">${dens.map((d) => d.line).join("")}</g>${dens.map((d) => d.label).join("")}${ticks}
<text class="axt" x="${(m.l + W - m.r) / 2}" y="${H - 10}" text-anchor="middle">Area (km², logarithmic scale)</text>
<text class="axt" transform="translate(14 ${(m.t + H - m.b) / 2}) rotate(-90)" text-anchor="middle">Population (logarithmic scale)</text>
<g class="dots">${dots}</g>${labs}</svg>`;
}
