/* Ayudas compartidas por los lectores. Un lector traduce y ordena; estas funciones solo formatean lo que la
   API ya trae. Cargar antes que cualquier lector. */
window.ESP = window.ESP || {}; ESP.lectores = ESP.lectores || {};
ESP.lectores.comun = {
  E(v) { return v == null ? "" : (ESP.util && ESP.util.esc ? ESP.util.esc(v) : String(v)); },
  tx(ruta, defecto) { const T = ESP.t ? ESP.t() : (ESP.i18n && ESP.i18n.es) || {}; const v = ruta.split(".").reduce((o, k) => (o && o[k] != null ? o[k] : null), T); return v == null ? defecto : v; },
  // 1234567.8 -> "1.234.568"; decimales con coma
  num(v, dec) {
    if (v == null || isNaN(v)) return "—";
    const d = dec == null ? 0 : dec;
    const [e, f] = Number(v).toFixed(d).split(".");
    const ent = e.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return f ? ent + "," + f : ent;
  },
  m2(v) { return this.num(v) + " m²"; },
  pct(v, dec) { return this.num(v, dec == null ? 1 : dec) + " %"; },
  // Nombre y pregunta de la API desde el idioma
  titulo(t, codigo) { const a = t && t.apis && t.apis[codigo]; return a ? a.nombre : codigo; },
  // Serie a partir de `etiquetas` y la lista a la que apunta `serie`
  serie(bloque) {
    if (!bloque || !bloque.etiquetas || !bloque.etiquetas.serie) return null;
    const e = bloque.etiquetas, lista = bloque[e.serie];
    if (!Array.isArray(lista) || !lista.length || !e.x || !e.y) return null;
    const puntos = lista.filter(p => p && p[e.y] != null).map(p => ({ x: p[e.x], y: p[e.y], etiqueta: p[e.x] != null ? String(p[e.x]) : "" }));
    return puntos.length ? { titulo: e.titulo, unidad: e.unidad, x: e.x, y: e.y, puntos } : null;
  },
  observado(bloque) { return bloque && bloque.observado ? bloque.observado : null; },
  // Hallazgo estándar a partir de un bloque de stats
  hallazgo(id, titulo, bloque, extra) {
    const h = { id, titulo, texto: bloque && bloque.lectura ? bloque.lectura : "", nota: bloque && bloque.nota ? bloque.nota : null,
      observado: this.observado(bloque), escala: null, serie: this.serie(bloque), tabla: null, sinDato: null };
    return Object.assign(h, extra || {});
  },
  sinDato(id, titulo, motivo) {
    return { id, titulo, texto: "", nota: null, observado: null, escala: null, serie: null, tabla: null, sinDato: motivo || this.tx("comunes.sinDatoServicio", "sin dato") };
  },
  // Motivo en metadata.faltantes para un bloque
  motivo(resp, bloque) {
    const f = (resp && resp.metadata && resp.metadata.faltantes) || [];
    const x = f.find(y => y && y.bloque === bloque);
    if (!x) return null;
    if (x.motivo) console.warn("faltante " + bloque + ": " + x.motivo);
    return this.tx("comunes.sinDatoServicio", "sin dato");
  },
  features(resp, filtro) {
    const fs = (resp && resp.vectors && resp.vectors.features) || [];
    return fs.filter(f => f && f.properties && (!filtro || filtro(f.properties)));
  },
  fc(features) { return { type: "FeatureCollection", features }; },
  estado(resp) { return !resp || resp.status === "error" ? "error" : (resp.status === "partial" ? "parcial" : "ok"); },
  // Esqueleto de la lectura; cada lector llena frase, hallazgos, capas y galería
  base(codigo, resp, ctx) {
    const t = ctx && ctx.t;
    const m = (resp && resp.metadata) || {};
    return { codigo, titulo: this.titulo(t, codigo), estado: this.estado(resp), frase: "", hallazgos: [], capas: [], galeria: [],
      fuentes: m.fuentes || [], limites: m.limites || "", aviso: m.aviso || null, faltantes: m.faltantes || [], duracionS: m.duracion_s != null ? m.duracion_s : null };
  },
  error(codigo, ctx, mensaje) {
    const l = this.base(codigo, null, ctx); l.estado = "error"; l.frase = mensaje || ""; return l;
  },
  // Envoltura que nunca lanza
  seguro(codigo, fn) {
    return function (resp, ctx) {
      try {
        if (!resp || resp.status === "error") {
          const l = ESP.lectores.comun.base(codigo, resp || null, ctx); l.estado = "error";
          if (resp && (resp.error || resp.details)) console.warn("servicio " + codigo, resp.error, resp.details);
          l.frase = ESP.lectores.comun.tx("comunes.errorServicio", "El servicio no respondió"); l.motivo = l.frase;
          return l;
        }
        return fn(resp, ctx || {});
      } catch (e) {
        console.error("lector " + codigo, e);
        const l = ESP.lectores.comun.error(codigo, ctx, ESP.lectores.comun.tx("comunes.errorLectura", "No se pudo leer la respuesta del servicio")); l.motivo = l.frase; return l;
      }
    };
  },
  popup(pares) { return pares.filter(p => p[1] != null && p[1] !== "").map(p => "<b>" + this.E(p[0]) + "</b> " + this.E(p[1])).join("<br>"); }
};
