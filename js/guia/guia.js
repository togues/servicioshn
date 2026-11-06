/* Visita guiada. Motor autónomo: no conoce lectores, APIs ni router; solo lee el DOM por selector.
   Quitarla = borrar js/guia, css/guia.css y sus tres líneas en index.html.
   Uso: ESP.guia.iniciar("herramienta"). Sale sola la primera vez que se entra a la ruta del recorrido. */
(() => {
  const ESP = window.ESP;
  const G = () => ESP.t().guia;
  const clave = n => "esp.guia." + n;
  const visto = n => { try { return localStorage.getItem(clave(n)) === "1"; } catch { return false; } };
  const marcar = n => { try { localStorage.setItem(clave(n), "1"); } catch { /* sin almacenamiento: se ofrecerá otra vez */ } };
  const sinMovimiento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const movil = () => window.matchMedia("(max-width: 64rem)").matches;

  function el(tag, attrs, ...hijos) {
    const e = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => { if (k === "onclick") e.addEventListener("click", v); else if (v != null) e.setAttribute(k, v); });
    hijos.flat().forEach(c => { if (c != null) e.append(c); });
    return e;
  }

  let activa = null;

  function iniciar(nombre, opc) {
    const rec = ESP.guiaRecorridos[nombre];
    if (!rec || activa) return;
    const textos = G()[nombre];
    // Un paso cuyo elemento no existe o no se ve (otra pantalla, otro tamaño) se salta en vez de romper el recorrido.
    const visible = s => { if (!s.sel) return true; const e = document.querySelector(s.sel); return !!e && e.getClientRects().length > 0; };
    const pasos = rec.pasos.map((p, i) => ({ ...p, ...textos[i] })).filter(visible);
    if (!pasos.length) return;

    const origenFoco = document.activeElement, scrollInicial = window.scrollY;
    const bloqueo = el("div", { class: "guia-bloqueo" });
    const foco = el("div", { class: "guia-foco", "aria-hidden": "true" });
    const tit = el("h2", { class: "guia-t", id: "guia-t" }), desc = el("p", { class: "guia-d", id: "guia-d" }), cuenta = el("span", { class: "guia-n" });
    const bAtras = el("button", { type: "button", class: "btn", onclick: () => ir(i - 1) }, G().atras);
    const bSig = el("button", { type: "button", class: "btn btn-p", onclick: () => (i >= pasos.length - 1 ? cerrar(true) : ir(i + 1)) });
    const bSaltar = el("button", { type: "button", class: "guia-saltar", onclick: () => cerrar(false) }, G().saltar);
    const caja = el("div", { class: "guia-caja", role: "dialog", "aria-modal": "true", "aria-labelledby": "guia-t", "aria-describedby": "guia-d" },
      el("div", { class: "guia-cab" }, cuenta, bSaltar), tit, desc, el("div", { class: "guia-pie" }, bAtras, bSig));
    const raiz = el("div", { class: "guia" }, bloqueo, foco, caja);
    let i = 0, objetivo = null;

    function colocar() {
      const vw = window.innerWidth, vh = window.innerHeight, m = 12;
      const r = objetivo ? objetivo.getBoundingClientRect() : null;
      if (r) { const pad = 6; Object.assign(foco.style, { display: "block", top: r.top - pad + "px", left: r.left - pad + "px", width: r.width + pad * 2 + "px", height: r.height + pad * 2 + "px" }); }
      else foco.style.display = "none";
      const w = Math.min(22 * 16, vw - m * 2); caja.style.width = w + "px";
      const h = caja.offsetHeight;
      let top, left;
      if (!r || r.height > vh * .6) { top = (vh - h) / 2; left = (vw - w) / 2; }     // sin foco, o foco enorme (el mapa): al centro
      else {
        const abajo = vh - r.bottom - m, arriba = r.top - m;
        top = abajo >= h + 8 || abajo >= arriba ? r.bottom + 14 : r.top - h - 14;
        left = r.left + r.width / 2 - w / 2;
      }
      caja.style.top = Math.max(m, Math.min(top, vh - h - m)) + "px";
      caja.style.left = Math.max(m, Math.min(left, vw - w - m)) + "px";
    }

    function ir(n) {
      i = Math.max(0, Math.min(pasos.length - 1, n));
      const p = pasos[i];
      tit.textContent = p.t; desc.textContent = p.d;
      cuenta.textContent = G().pasoDe.replace("{n}", i + 1).replace("{m}", pasos.length);
      bAtras.hidden = i === 0;
      bSig.textContent = i >= pasos.length - 1 ? G().terminar : G().continuar;
      objetivo = p.sel ? document.querySelector(p.sel) : null;
      // Celular: la hoja de pasos se abre o cierra con su propio botón, como lo haría la persona.
      let espera = 0;
      if (p.hoja && movil()) {
        const asa = document.querySelector(".h-asa");
        if (asa && asa.getClientRects().length && (asa.getAttribute("aria-expanded") === "true") !== (p.hoja === "abierta")) { asa.click(); espera = sinMovimiento() ? 30 : 320; }
      }
      setTimeout(() => {
        if (!activa) return;
        if (objetivo) {   // solo se desplaza si el elemento cabe en pantalla y no se ve entero (un mapa más alto que la pantalla no se persigue)
          const r = objetivo.getBoundingClientRect(), vh = window.innerHeight;
          if (r.height < vh * .6 && (r.top < 70 || r.bottom > vh - 10)) objetivo.scrollIntoView({ block: "center", behavior: "instant" });
        }
        colocar(); bSig.focus({ preventScroll: true });
      }, espera);
    }

    function alTeclado(e) {
      if (e.key === "Escape") { e.preventDefault(); cerrar(false); }
      else if (e.key === "ArrowRight") { e.preventDefault(); if (i < pasos.length - 1) ir(i + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); if (i > 0) ir(i - 1); }
      else if (e.key === "Tab") {       // el foco no sale de la burbuja
        const f = [...caja.querySelectorAll("button")].filter(b => !b.hidden);
        const a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
        else if (!caja.contains(document.activeElement)) { e.preventDefault(); a.focus(); }
      }
    }
    const reubicar = () => colocar();

    function cerrar(completa) {
      marcar(nombre);                 // terminar y saltar valen lo mismo: no se vuelve a ofrecer sola
      window.removeEventListener("keydown", alTeclado, true); window.removeEventListener("resize", reubicar);
      raiz.remove(); document.body.classList.remove("guia-abierta"); activa = null;
      window.scrollTo({ top: scrollInicial });
      try { (opc && opc.origen || origenFoco).focus(); } catch { /* nada */ }
      if (opc && opc.alCerrar) opc.alCerrar(completa);
    }

    document.body.append(raiz); document.body.classList.add("guia-abierta");
    window.addEventListener("keydown", alTeclado, true); window.addEventListener("resize", reubicar);
    activa = { cerrar: () => cerrar(false) };
    ir(0);
  }

  /* Lanzador «?» y arranque automático la primera vez. Observa #vista: no hay que tocar el router ni la herramienta. */
  function vigilar() {
    const vista = document.getElementById("vista"); if (!vista) return;
    let lanzador = null;
    const revisar = () => {
      const nombre = Object.keys(ESP.guiaRecorridos).find(n => location.hash.startsWith("#/" + ESP.guiaRecorridos[n].ruta));
      const rec = nombre && ESP.guiaRecorridos[nombre];
      const listo = rec && vista.querySelector(rec.espera);
      if (!listo) { if (lanzador) { lanzador.remove(); lanzador = null; } return; }
      if (lanzador && lanzador.dataset.n === nombre) return;
      if (lanzador) lanzador.remove();
      lanzador = el("button", { type: "button", class: "guia-lanzador", "data-n": nombre, title: G().abrir, "aria-label": G().abrir, onclick: () => iniciar(nombre, { origen: lanzador }) },
        el("span", { class: "ms", "aria-hidden": "true" }, "help"), el("span", { class: "guia-lanzador-t" }, G().abrir));
      document.body.append(lanzador);
      if (!visto(nombre)) setTimeout(() => { if (!activa && lanzador && location.hash.startsWith("#/" + rec.ruta)) iniciar(nombre, { origen: lanzador }); }, 900);
    };
    new MutationObserver(revisar).observe(vista, { childList: true });
    window.addEventListener("hashchange", revisar); revisar();
  }

  ESP.guia = { iniciar, visto };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", vigilar); else vigilar();
})();
