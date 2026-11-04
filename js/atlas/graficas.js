/* Atlas · piezas de dibujo sin librerías: creador de nodos, gráfica SVG (barras o línea), leyenda y tabla.
   Las usan la vista del atlas y su impresión. Colores: la serie trae los suyos (misma paleta que la leyenda)
   o se usa el color de marca. */
window.ESP = window.ESP || {};
ESP.atlasUI = (function () {
  const h = (tag, attrs, ...hijos) => {
    const el = document.createElement(tag);
    for (const k in (attrs || {})) {
      if (k === "class") el.className = attrs[k];
      else if (k === "html") el.innerHTML = attrs[k];
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null && attrs[k] !== false) el.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    }
    hijos.flat(Infinity).forEach(x => { if (x == null || x === false) return; el.append(x.nodeType ? x : document.createTextNode(String(x))); });
    return el;
  };
  const ns = (tag, a) => { const e = document.createElementNS("http://www.w3.org/2000/svg", tag); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const fmt = (n, d) => (ESP.validar && ESP.validar.fmt ? ESP.validar.fmt(n, d) : ESP.util.num(n, d));

  /* serie: { titulo, unidad, puntos: [{x, y, etiqueta?, color?}] }; grande = true para la lámina de gráfica */
  function grafica(serie, grande) {
    const pts = (serie.puntos || []).filter(p => p && p.y != null && !isNaN(+p.y));
    if (pts.length < 2) return null;
    const W = 640, H = grande ? 360 : 220, ml = 52, mr = 14, mt = 18, mb = 42;
    const ys = pts.map(p => +p.y), ymax = Math.max(...ys, 0), ymin = Math.min(...ys, 0), rango = (ymax - ymin) || 1;
    const sx = i => ml + (W - ml - mr) * (pts.length === 1 ? .5 : i / (pts.length - 1));
    const sy = v => mt + (H - mt - mb) * (1 - (v - ymin) / rango);
    const svg = ns("svg", { viewBox: `0 0 ${W} ${H}`, class: "at-grafica" + (grande ? " at-grafica-g" : ""), role: "img", "aria-label": serie.titulo || "" });
    for (let k = 0; k <= 4; k++) {
      const v = ymin + rango * k / 4, y = sy(v);
      svg.append(ns("line", { x1: ml, x2: W - mr, y1: y, y2: y, class: "at-rejilla" }));
      const tx = ns("text", { x: ml - 6, y: y + 4, class: "at-eje", "text-anchor": "end" }); tx.textContent = fmt(v, Math.abs(rango) < 5 ? 2 : 0); svg.append(tx);
    }
    const barras = pts.length <= 16;
    if (barras) {
      const ancho = (W - ml - mr) / pts.length * 0.62;
      pts.forEach((p, i) => {
        const x = ml + (W - ml - mr) * (i + .5) / pts.length - ancho / 2, y0 = sy(0), y1 = sy(+p.y);
        const r = ns("rect", { x, y: Math.min(y0, y1), width: ancho, height: Math.abs(y0 - y1) || 1, rx: 2, class: "at-barra-svg" }); if (p.color) r.setAttribute("fill", p.color);
        r.append(ns("title", {})); r.firstChild.textContent = (p.etiqueta != null ? p.etiqueta : p.x) + ": " + fmt(+p.y, Math.abs(rango) < 5 ? 2 : 0) + (serie.unidad ? " " + serie.unidad : "");
        svg.append(r);
      });
    } else {
      const d = pts.map((p, i) => (i ? "L" : "M") + sx(i) + " " + sy(+p.y)).join(" ");
      svg.append(ns("path", { d: d + ` L${sx(pts.length - 1)} ${sy(ymin)} L${sx(0)} ${sy(ymin)} Z`, class: "at-area" }));
      svg.append(ns("path", { d, class: "at-linea" }));
      pts.forEach((p, i) => { if (p.color) svg.append(ns("circle", { cx: sx(i), cy: sy(+p.y), r: 4, fill: p.color, class: "at-punto" })); });
      const u = pts[pts.length - 1]; svg.append(ns("circle", { cx: sx(pts.length - 1), cy: sy(+u.y), r: 4, class: "at-punto" }));
    }
    const paso = Math.max(1, Math.ceil(pts.length / (grande ? 12 : 8)));
    pts.forEach((p, i) => {
      if (i % paso && i !== pts.length - 1) return;
      const x = barras ? ml + (W - ml - mr) * (i + .5) / pts.length : sx(i);
      const tx = ns("text", { x, y: H - mb + 16, class: "at-eje", "text-anchor": "middle" }); tx.textContent = String(p.etiqueta != null ? String(p.etiqueta).split(" · ")[0] : p.x); svg.append(tx);
    });
    if (serie.unidad) { const tu = ns("text", { x: ml, y: mt - 5, class: "at-eje at-unidad" }); tu.textContent = serie.unidad; svg.append(tu); }
    return svg;
  }

  function leyenda(items) {
    if (!items || !items.length) return null;
    return h("ul", { class: "at-leyenda" }, items.map(it => h("li", {}, h("i", { style: `background:${it.color}` }), it.etiqueta)));
  }

  function tabla(tb, clase) {
    if (!tb || !tb.filas || !tb.filas.length) return null;
    return h("div", { class: "at-tabla-caja " + (clase || "") }, h("table", { class: "at-tabla" },
      tb.columnas && tb.columnas.length ? h("thead", {}, h("tr", {}, tb.columnas.map(c => h("th", {}, c)))) : null,
      h("tbody", {}, tb.filas.map(f => h("tr", {}, f.map(c => h("td", {}, c == null || c === "" ? "—" : c)))))));
  }

  return { h, grafica, leyenda, tabla };
})();
