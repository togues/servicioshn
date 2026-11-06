/* Rutas por hash. Una sola página; cada vista pinta dentro de <main id="vista">.
   #/                      portada
   #/servicios[?p=filtro]  catálogo
   #/servicio/<id>         ficha de una tarjeta
   #/como-funciona         portada, sección pasos
   #/analizar[?t=a,b]      herramienta guiada (tarjetas preseleccionadas)
   #/informe/<id>[/<n>]     atlas del resultado (n: 0 portada, 1…N láminas, N+1 contraportada) */
window.ESP = window.ESP || {};
ESP.router = {
  actual: null,
  leer() {
    const h = location.hash.replace(/^#\/?/, "");
    const [ruta, q] = h.split("?");
    const partes = ruta.split("/").filter(Boolean);
    const dec = x => { try { return decodeURIComponent(x); } catch { return x; } };
    const params = {}; (q || "").split("&").forEach(p => { const [k, v] = p.split("="); if (k) params[dec(k)] = dec(v || ""); });
    return { nombre: partes[0] || "", id: partes[1] || "", extra: partes[2] || "", params };
  },
  ir(h) { location.hash = h; },
  pintar() {
    const r = this.leer(), el = document.getElementById("vista"), V = ESP.vistas;
    // Misma vista, mismo resultado: solo cambia de lámina (el atlas no se vuelve a construir)
    if (this.actual && this.actual.ruta === r.nombre && this.actual.id === r.id && this.actual.irA) { this.actual.irA(r.extra, { sinRuta: true }); return; }
    if (this.actual) { const f = this.actual.destruir || this.actual.salir; if (f) { try { f.call(this.actual); } catch { /* nada */ } } }
    el.innerHTML = ""; el.className = "vista vista-" + (r.nombre || "portada");
    document.body.classList.toggle("en-herramienta", r.nombre === "analizar" || r.nombre === "informe");
    document.querySelectorAll(".nav a[data-ruta]").forEach(a => a.toggleAttribute("aria-current", a.dataset.ruta === r.nombre));
    let v = null;
    try {
      if (r.nombre === "servicios") v = V.servicios(el, r.params.p || "todos");
      else if (r.nombre === "servicio" && r.id) v = V.ficha(el, r.id);
      else if (r.nombre === "analizar") v = V.analizar ? V.analizar(el, { tarjetas: (r.params.t || "").split(",").filter(Boolean) }) : V.proximamente(el);
      else if (r.nombre === "informe" && r.id) v = V.informe ? V.informe(el, r.id, r.extra) : V.proximamente(el);
      else v = V.portada(el, r.nombre === "como-funciona" ? "como" : null);
    } catch (e) { console.error(e); el.innerHTML = `<section class="bloque"><p class="aviso bad">${ESP.util.esc(e.message)}</p></section>`; }
    this.actual = v || null;
    ESP.util.traducir(el);
    if (r.nombre !== "como-funciona") window.scrollTo({ top: 0 });
    document.title = (r.nombre && r.nombre !== "" ? (ESP.util.tx("nav." + ({ servicios: "servicios", analizar: "analizar", informe: "analizar" }[r.nombre] || "inicio")) + " · ") : "") + ESP.t().marca.nombre;
  }
};
window.addEventListener("hashchange", () => ESP.router.pintar());
document.addEventListener("DOMContentLoaded", () => { if (!location.hash) history.replaceState(null, "", "#/"); ESP.router.pintar(); });
