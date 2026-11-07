/* Llamadas a los servicios: una con tiempo máximo (llamar) y una lista con N simultáneos (correr), con progreso por servicio.
   La interfaz que las usa es el asistente (js/asistente/); aquí no hay pantalla. Todo texto visible viene de ESP.i18n. */
window.ESP = window.ESP || {};
ESP.t = ESP.t || (() => (ESP.i18n && ESP.i18n[(ESP.config && ESP.config.idioma) || "es"]) || {});

/* El almacén de resultados (ESP.resultados) vive en js/almacen.js (IndexedDB). */

ESP.herramienta = (function () {
  /* Llama a un servicio con tiempo máximo. Devuelve {codigo, estado, resp|error, segundos}. */
  async function llamar(codigo, aoi, params, alProgreso, controles) {
    const t0 = Date.now();
    const cfg = ESP.config;
    const url = cfg.usarOrquestador ? cfg.orquestador : cfg.servicios[codigo];
    const cuerpo = cfg.usarOrquestador ? { aoi, params: { servicios: [codigo], ...params } } : { aoi, params: params || {} };
    const ctrl = new AbortController();
    if (controles) controles.push(ctrl);
    const reloj = setInterval(() => alProgreso(codigo, "corriendo", Math.round((Date.now() - t0) / 1000)), 1000);
    const tope = setTimeout(() => ctrl.abort(), cfg.tiempoMaximoMs || 300000);
    alProgreso(codigo, "corriendo", 0);
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo), signal: ctrl.signal });
      let j = null;
      try { j = await r.json(); } catch { j = null; }
      const seg = Math.round((Date.now() - t0) / 1000);
      if (cfg.usarOrquestador && j && j.secciones && j.secciones[codigo]) j = j.secciones[codigo];
      if (!j || j.status === "error" || !r.ok) {
        console.warn("servicio " + codigo, r.status, j && j.error, j && j.details);
        const motivo = ESP.t().herramienta.errores.servicio;
        alProgreso(codigo, "error", seg, motivo);
        return { codigo, estado: "error", motivo, segundos: seg, resp: j };
      }
      const estado = j.status === "partial" ? "parcial" : "listo";
      alProgreso(codigo, estado, seg);
      return { codigo, estado, resp: j, segundos: seg };
    } catch (e) {
      const seg = Math.round((Date.now() - t0) / 1000);
      const motivo = e.name === "AbortError" ? ESP.t().herramienta.errores.servicio : ESP.t().herramienta.errores.red;
      alProgreso(codigo, "error", seg, motivo);
      return { codigo, estado: "error", motivo, segundos: seg };
    } finally { clearInterval(reloj); clearTimeout(tope); }
  }

  /* Corre una lista de códigos con N simultáneos. */
  async function correr(codigos, aoi, params, alProgreso, controles) {
    const n = (ESP.config.llamadasSimultaneas || 4);
    const porCodigo = typeof params === "function" ? params : (() => params || {});
    const cola = codigos.slice();
    const out = {};
    codigos.forEach(c => alProgreso(c, "enCola", 0));
    async function obrero() {
      while (cola.length) {
        const c = cola.shift();
        if (controles && controles.cancelado) return;
        out[c] = await llamar(c, aoi, porCodigo(c), alProgreso, controles);
      }
    }
    await Promise.all(Array.from({ length: Math.min(n, codigos.length) }, obrero));
    return out;
  }

  return { llamar, correr };
})();

