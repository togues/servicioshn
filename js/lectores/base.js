/* Ayudas comunes a todos los lectores. Un lector traduce y ordena lo que la API devolvió; nunca calcula ni inventa.
   Cárguese antes que cualquier lector. */
window.ESP = window.ESP || {}; ESP.lectores = ESP.lectores || {};
ESP.lectorBase = (function () {
  const E = v => (v == null ? "" : (ESP.util && ESP.util.esc ? ESP.util.esc(v) : String(v)));
  const T = () => (ESP.t ? ESP.t() : (ESP.i18n && ESP.i18n.es) || {});
  const tx = (ruta, defecto) => { const v = ruta.split(".").reduce((o, k) => (o && o[k] != null ? o[k] : null), T()); return v == null ? defecto : v; };
  const num = (v, dec) => {
    if (v == null || isNaN(v)) return "";
    const d = dec == null ? (Math.abs(v) >= 100 ? 0 : (Math.abs(v) >= 10 ? 1 : 2)) : dec;
    const partes = Number(v).toFixed(d).split(".");
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return partes.length > 1 ? partes.join(",") : partes[0];
  };
  const fecha = s => {
    if (!s) return "";
    const m = String(s).match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
    if (!m) return E(s);
    const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    return (m[3] ? m[3] + " " : "") + meses[+m[2] - 1] + " " + m[1];
  };
  // Serie para gráfica: `etiquetas` apunta a la lista y a sus claves x/y.
  function serie(bloque) {
    if (!bloque || !bloque.etiquetas || !bloque.etiquetas.serie) return null;
    const e = bloque.etiquetas, lista = bloque[e.serie];
    if (!Array.isArray(lista) || !lista.length || !e.x || !e.y) return null;
    const puntos = lista.filter(p => p && p[e.y] != null && p[e.x] != null).map(p => ({ x: p[e.x], y: p[e.y] }));
    return puntos.length ? { titulo: e.titulo, unidad: e.unidad, x: e.x, y: e.y, puntos } : null;
  }
  function hallazgo(id, titulo, bloque, extra) {
    const h = Object.assign({ id, titulo, texto: "", nota: null, observado: null, escala: null, serie: null, tabla: null, sinDato: null }, extra || {});
    if (!bloque) { h.sinDato = h.sinDato || tx("comunes.sinBloque", "sin dato"); return h; }
    if (!h.texto) h.texto = bloque.lectura || "";
    if (h.nota == null) h.nota = bloque.nota || null;
    if (!h.observado) h.observado = bloque.observado || null;
    if (!h.serie) h.serie = serie(bloque);
    return h;
  }
  function faltante(resp, bloque) {
    const f = ((resp.metadata || {}).faltantes || []).find(x => x.bloque === bloque);
    if (!f) return null;
    if (f.motivo) console.warn("faltante " + bloque + ": " + f.motivo);
    return tx("comunes.sinDatoServicio", "sin dato");
  }
  // Vectores filtrados por `properties.capa`
  function capaVector(resp, id, titulo, opciones) {
    const feats = (((resp.vectors || {}).features) || []).filter(f => f.properties && (Array.isArray(id) ? id.includes(f.properties.capa) : f.properties.capa === id));
    if (!feats.length) return null;
    const o = opciones || {};
    return { id: Array.isArray(id) ? id[0] : id, titulo, tipo: "vector", geojson: { type: "FeatureCollection", features: feats },
             estilo: o.estilo || (() => ({ color: ESP.paleta.marca, weight: 2, fillColor: ESP.paleta.marca, fillOpacity: .3 })),
             leyenda: o.leyenda || [], popup: o.popup || (f => popupPlano(f.properties)), puntos: o.puntos || null };
  }
  function capaTile(resp, clave, titulo, leyenda, opacidad) {
    const url = ESP.util && ESP.util.urlSegura ? ESP.util.urlSegura((resp.tile_url || {})[clave]) : null;
    return url ? { id: clave, titulo, tipo: "tile", url, opacidad: opacidad == null ? .7 : opacidad, leyenda: leyenda || [] } : null;
  }
  function popupPlano(p, claves) {
    const omit = new Set(["capa"]);
    return Object.entries(p).filter(([k, v]) => !omit.has(k) && v != null && (!claves || claves.includes(k)) && typeof v !== "object")
      .map(([k, v]) => `<b>${E(k.replace(/_/g, " "))}</b>: ${typeof v === "number" ? num(v) : E(v)}`).join("<br>");
  }
  function base(codigo, resp, ctx) {
    const t = (ctx && ctx.t) || (ESP.i18n && ESP.i18n[(ctx && ctx.idioma) || "es"]) || {};
    const m = resp.metadata || {};
    return {
      codigo, titulo: ((t.apis || {})[codigo] || {}).nombre || codigo,
      estado: resp.status === "success" ? "ok" : (resp.status === "partial" ? "parcial" : "error"),
      frase: "", hallazgos: [], capas: [], galeria: [],
      fuentes: m.fuentes || [], limites: m.limites || "", aviso: m.aviso || null, faltantes: m.faltantes || [], duracionS: m.duracion_s, t
    };
  }
  function errorLectura(codigo, resp, exc, ctx) {
    const out = base(codigo, resp || {}, ctx);
    out.estado = "error";
    console.error("lector " + codigo, exc || (resp && resp.error), resp && resp.details);
    out.frase = tx("comunes.errorLectura", "No se pudo leer la respuesta del servicio");
    out.motivo = out.frase;
    return out;
  }
  const limpiar = s => (s == null ? "" : String(s)).replace(/\s+/g, " ").trim();
  // Texto visible de un lector: t.lectores[codigo][clave]; si falta la traducción se muestra la clave para que se note
  const L = (codigo, clave, vals) => { const d = (T().lectores || {})[codigo] || {}; const v = d[clave] != null ? d[clave] : clave; return vals ? String(v).replace(/\{(\w+)\}/g, (_, k) => (vals[k] != null ? vals[k] : "")) : v; };
  return { num, fecha, serie, hallazgo, faltante, capaVector, capaTile, popupPlano, base, errorLectura, limpiar, E, tx, L };
})();
