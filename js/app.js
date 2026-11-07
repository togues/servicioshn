/* Utilidades comunes: idioma, formato de números, html seguro. Sin frases sueltas: todo texto viene de i18n. */
window.ESP = window.ESP || {};
ESP.t = () => ESP.i18n[ESP.config.idioma] || ESP.i18n.es;

ESP.util = {
  // Busca "a.b.c" en el diccionario de idioma; reemplaza {clave} con los valores dados
  tx(ruta, vals) {
    const v = ruta.split(".").reduce((o, k) => (o && o[k] != null ? o[k] : null), ESP.t());
    if (v == null) return ruta;
    return typeof v === "string" && vals ? v.replace(/\{(\w+)\}/g, (_, k) => (vals[k] != null ? vals[k] : "")) : v;
  },
  // Solo https; cualquier otra cosa (javascript:, data:, http) se descarta
  urlSegura(u) { return typeof u === "string" && /^https:\/\//i.test(u.trim()) ? u.trim() : null; },
  esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); },
  // 1234567.8 → "1.234.568" (es) ; decimales con coma
  num(n, dec = 0) {
    if (n == null || isNaN(n)) return "–";
    const f = Number(n).toFixed(dec).split(".");
    f[0] = f[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return dec ? f.join(",") : f[0];
  },
  area(m2) {
    const u = ESP.t().herramienta.estado.unidades;
    if (m2 < 10000) return `${this.num(m2)} ${u.m2} (${this.num(m2 / 0.6987)} ${u.varas2})`;
    return `${this.num(m2 / 10000, 2)} ${u.ha} (${this.num(m2)} ${u.m2} · ${this.num(m2 / 0.6987)} ${u.varas2})`;
  },
  fecha(d) {
    const x = d instanceof Date ? d : new Date(d);
    return x.toLocaleDateString(ESP.config.idioma === "es" ? "es-HN" : ESP.config.idioma, { day: "numeric", month: "short", year: "numeric" });
  },
  id() { return Math.random().toString(36).slice(2, 8); },
  // Aplica data-t="ruta" a todo el documento o a un elemento
  traducir(raiz) {
    (raiz || document).querySelectorAll("[data-t]").forEach(el => { const v = this.tx(el.dataset.t); if (typeof v === "string") el.textContent = v; });
  },
  // Crea un elemento: h("div", {class:"x", onclick: fn}, hijos…). Los textos entran como nodos de texto (nunca como HTML).
  h(tag, attrs, ...hijos) {
    const el = document.createElement(tag);
    for (const k in (attrs || {})) {
      if (k === "class") el.className = attrs[k];
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null && attrs[k] !== false) el.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    }
    hijos.flat(Infinity).forEach(x => { if (x == null || x === false) return; el.append(x.nodeType ? x : document.createTextNode(String(x))); });
    return el;
  },
  // Logo completo en sus dos versiones (la de tema claro y la de oscuro; el CSS muestra la que toca). ancho en px, mínimo 120.
  logo(ancho) { const w = Math.max(120, ancho || 120), a = Math.round(w * 291 / 620); return [["logo-c", "img/logo.png"], ["logo-o", "img/logo-oscuro.png"]].map(([c, src]) => this.h("img", { class: "logo " + c, src, alt: "", width: w, height: a })); },
  // Solo el prisma, para espacios chicos (barras en celular, pies, favicon).
  marca(px) { return this.h("img", { class: "marca-img", src: "img/marca.png", alt: "", width: px, height: px }); },
  icono(nombre) { return `<span class="ms" aria-hidden="true">${nombre}</span>`; }
};

document.addEventListener("DOMContentLoaded", () => {
  ESP.util.traducir();
  const c = ESP.config.contacto;
  const correo = document.getElementById("pie-correo"); if (correo) { correo.textContent = c.correo; correo.href = "mailto:" + c.correo; }
  const web = document.getElementById("pie-web"); if (web) { web.textContent = c.web.replace(/^https?:\/\//, ""); web.href = c.web; }
  const ciudad = document.getElementById("pie-ciudad"); if (ciudad) ciudad.textContent = c.ciudad;
  const btn = document.getElementById("menu-btn"), velo = document.getElementById("velo");
  if (btn) {
    const cerrar = () => { document.body.classList.remove("menu-abierto"); btn.setAttribute("aria-expanded", "false"); velo.hidden = true; };
    btn.addEventListener("click", () => { const ab = !document.body.classList.contains("menu-abierto"); document.body.classList.toggle("menu-abierto", ab); btn.setAttribute("aria-expanded", String(ab)); velo.hidden = !ab; });
    velo.addEventListener("click", cerrar);
    document.querySelectorAll(".nav a").forEach(a => a.addEventListener("click", cerrar));
    document.addEventListener("keydown", e => { if (e.key === "Escape") cerrar(); });
  }
});
