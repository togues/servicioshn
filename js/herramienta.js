/* Herramienta guiada: 1 marcar el área · 2 elegir qué saber · 3 analizar. Llama a las APIs en paralelo con
   progreso por servicio, guarda el resultado y navega al informe. Todo texto visible viene de ESP.i18n. */
window.ESP = window.ESP || {};
ESP.vistas = ESP.vistas || {};
ESP.t = ESP.t || (() => (ESP.i18n && ESP.i18n[(ESP.config && ESP.config.idioma) || "es"]) || {});

/* El almacén de resultados (ESP.resultados) vive en js/almacen.js (IndexedDB). */

ESP.herramienta = (function () {
  const h = (tag, attrs, ...hijos) => {
    const el = document.createElement(tag);
    for (const k in (attrs || {})) {
      if (k === "class") el.className = attrs[k];
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) el.setAttribute(k, attrs[k]);
    }
    hijos.flat(Infinity).forEach(x => { if (x == null) return; el.append(x.nodeType ? x : document.createTextNode(String(x))); });
    return el;
  };
  const esMovil = () => window.matchMedia("(max-width: 64rem)").matches;

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

  /* Vista principal. opciones: { tarjetas: [ids], apis: [codes] } */
  function analizar(el, opciones) {
    const t = ESP.t(), th = t.herramienta, cat = ESP.catalogo;
    const op = opciones || {};
    el.innerHTML = "";
    el.className = "h-analizar";
    const preMarcadas = new Set(op.tarjetas || []);
    if (op.apis && op.apis.length) cat.tarjetas.forEach(tj => { if (tj.apis.some(a => op.apis.includes(a))) preMarcadas.add(tj.id); });

    // ── Estructura ───────────────────────────────────────────────────────────
    const mapaEl = h("div", { class: "h-mapa", id: "h-mapa" });
    const estadoDibujo = h("div", { class: "h-estado h-estado-vacio", role: "status", "aria-live": "polite" }, th.estado.sinDibujo);
    const btnDibujar = h("button", { class: "btn btn-p", type: "button" }, th.paso1.dibujar);
    const btnDeshacer = h("button", { class: "btn", type: "button" }, th.paso1.deshacer);
    const btnBorrar = h("button", { class: "btn", type: "button" }, th.paso1.borrar);
    const buscador = h("input", { class: "h-buscar", type: "search", placeholder: th.paso1.buscar, "aria-label": th.paso1.buscar, id: "h-buscar" });
    const busqueda = h("form", { class: "h-buscar-form" }, buscador, h("button", { class: "btn btn-icono", type: "submit", "aria-label": th.paso1.buscar }, h("span", { class: "ms", "aria-hidden": "true" }, "search")));

    const listaTarjetas = h("div", { class: "h-tarjetas", role: "group" });
    cat.tarjetas.forEach(tj => {
      const tx = (t.tarjetas || {})[tj.id] || { nombre: tj.id, corta: "" };
      const disponibles = tj.apis.filter(a => cat.disponible(a));
      const hay = disponibles.length > 0;
      const input = h("input", { type: "checkbox", id: "tj-" + tj.id, value: tj.id, ...(hay ? {} : { disabled: "disabled" }) });
      if (hay && preMarcadas.has(tj.id)) input.checked = true;
      const etiqueta = h("label", { class: "h-tarjeta" + (hay ? "" : " h-tarjeta-prox"), for: "tj-" + tj.id },
        input,
        h("span", { class: "h-tarjeta-t" }, tx.nombre, hay ? null : h("em", { class: "h-prox" }, t.servicios.proximamente)),
        h("span", { class: "h-tarjeta-d" }, tx.corta));
      listaTarjetas.append(etiqueta);
    });

    const desdeInput = h("input", { type: "date", id: "h-desde", class: "h-desde", min: "2019-04-01" });
    const campoDesde = h("div", { class: "h-campo" }, h("label", { for: "h-desde" }, th.paso2.desde), desdeInput, h("small", {}, th.paso2.desdeAyuda));
    const btnAnalizar = h("button", { class: "btn btn-p btn-grande", type: "button", disabled: "disabled" }, th.paso3.boton);
    const progreso = h("ul", { class: "h-progreso", hidden: "hidden", "aria-live": "polite" });
    const errorGlobal = h("p", { class: "h-error", hidden: "hidden", role: "alert" });

    const contenido = h("div", { class: "h-pasos-contenido", id: "h-pasos-contenido" });
    const asa = h("button", { class: "h-asa", type: "button", "aria-expanded": "true", "aria-controls": "h-pasos-contenido" }, h("span", { class: "visually-hidden" }, th.hoja));
    const pasos = h("aside", { class: "h-pasos" }, asa, contenido);
    contenido.append(
      h("section", { class: "h-paso" },
        h("h2", {}, h("i", {}, "1"), th.paso1.t), h("p", {}, th.paso1.d),
        busqueda,
        h("div", { class: "h-botones" }, btnDibujar, btnDeshacer, btnBorrar),
        estadoDibujo),
      h("section", { class: "h-paso" },
        h("h2", {}, h("i", {}, "2"), th.paso2.t), h("p", {}, th.paso2.d),
        listaTarjetas, campoDesde),
      h("section", { class: "h-paso" },
        h("h2", {}, h("i", {}, "3"), th.paso3.t), h("p", {}, th.paso3.d),
        btnAnalizar, progreso, errorGlobal));
    const cuerpo = h("div", { class: "h-cuerpo" }, mapaEl, pasos);
    el.append(h("h1", { class: "h-titulo" }, th.titulo), cuerpo);
    // La hoja de pasos en celular es un componente aparte (js/componentes/hoja.js): aquí solo se le dan los elementos.
    const hojaCtl = ESP.hoja.crear({ hoja: pasos, asa, contenido, marco: () => cuerpo.clientHeight, activo: esMovil });
    const hoja = abierta => (abierta ? hojaCtl.abrir() : hojaCtl.cerrar());

    // ── Mapa y validación ────────────────────────────────────────────────────
    let evaluacion = { estado: "vacio" };
    const mapa = ESP.mapa.crear(mapaEl, { cubierto: () => (esMovil() ? hojaCtl.alto() : 0), onCambio: coords => {
      evaluacion = ESP.validar.evaluar(coords, t);
      mapa.marcarVertice(evaluacion.vertice);
      pintarEstado();
    } });
    function pintarEstado() {
      estadoDibujo.className = "h-estado h-estado-" + evaluacion.estado;
      estadoDibujo.innerHTML = "";
      if (evaluacion.estado === "vacio") { estadoDibujo.append(evaluacion.mensaje); }
      else {
        const area = ESP.validar.textoArea(evaluacion, t);
        if (area) estadoDibujo.append(h("b", {}, th.estado.area + ": " + area));
        estadoDibujo.append(h("span", {}, evaluacion.mensaje));
        if (evaluacion.geojson && !ESP.validar.enCobertura(ESP.validar.centroide(evaluacion.anillo))) estadoDibujo.append(h("span", { class: "h-nota" }, th.estado.fueraCobertura));
      }
      habilitar();
    }
    function tarjetasMarcadas() { return [...listaTarjetas.querySelectorAll("input:checked")].map(i => i.value); }
    function habilitar() {
      const ok = (evaluacion.estado === "valido" || evaluacion.estado === "aviso") && tarjetasMarcadas().length > 0;
      btnAnalizar.disabled = !ok;
    }
    listaTarjetas.addEventListener("change", habilitar);
    btnDibujar.addEventListener("click", () => { mapa.dibujar(); if (esMovil()) hoja(false); });
    btnDeshacer.addEventListener("click", () => mapa.deshacer());
    btnBorrar.addEventListener("click", () => mapa.borrar());
    busqueda.addEventListener("submit", async ev => {
      ev.preventDefault();
      buscador.classList.add("ocupado");
      const r = await mapa.buscar(buscador.value);
      buscador.classList.remove("ocupado");
      buscador.classList.toggle("sin-resultado", !r.ok);
      if (!r.ok && r.mensaje) { estadoDibujo.className = "h-estado h-estado-invalido"; estadoDibujo.textContent = r.mensaje; }
      if (r.ok && esMovil()) hoja(false);
    });

    mapa.invalidar();
    habilitar();

    // ── Analizar ─────────────────────────────────────────────────────────────
    const filas = {};
    function alProgreso(codigo, estado, seg, motivo) {
      const li = filas[codigo]; if (!li) return;
      const tp = th.progreso;
      const txt = estado === "corriendo" ? tp.corriendo.replace("{s}", seg) : (tp[estado] || estado);
      li.className = "h-prog-" + estado;
      li.querySelector(".h-prog-estado").textContent = txt + (motivo ? " · " + motivo : "");
    }
    btnAnalizar.addEventListener("click", async () => {
      const ids = tarjetasMarcadas();
      const codigos = cat.apisDe(ids).filter(c => cat.disponible(c));
      if (!codigos.length || !evaluacion.geojson) return;
      btnAnalizar.disabled = true; btnAnalizar.textContent = th.paso3.corriendo; btnAnalizar.classList.add("ocupado");
      errorGlobal.hidden = true;
      progreso.hidden = false; progreso.innerHTML = "";
      codigos.forEach(c => {
        const nombre = ((t.apis || {})[c] || {}).nombre || c;
        filas[c] = h("li", { class: "h-prog-enCola" }, h("span", { class: "h-prog-spin", "aria-hidden": "true" }), h("span", { class: "h-prog-nombre" }, nombre), h("span", { class: "h-prog-estado" }, th.progreso.enCola));
        progreso.append(filas[c]);
      });
      if (esMovil()) hoja(true);
      const aoi = evaluacion.geojson;
      const inicio = new Date();
      const desde = desdeInput.value && /^\d{4}-\d{2}-\d{2}$/.test(desdeInput.value) ? desdeInput.value : null;
      const params = c => (c === "PR-05" && desde ? { desde } : {});
      controles.length = 0; controles.cancelado = false;
      const resultados = await correr(codigos, aoi, params, alProgreso, controles);
      if (controles.cancelado || ESP.herramienta.activa !== handle) return;
      const ok = Object.values(resultados).filter(r => r.estado !== "error");
      if (!ok.length) {
        errorGlobal.textContent = th.errores.todo; errorGlobal.hidden = false;
        btnAnalizar.disabled = false; btnAnalizar.textContent = th.paso3.boton; btnAnalizar.classList.remove("ocupado");
        return;
      }
      const id = ESP.resultados.nuevoId();
      ESP.resultados.guardar(id, { id, fecha: inicio.toISOString(), aoi, areaM2: evaluacion.m2, varas2: evaluacion.varas2, ha: evaluacion.ha, tarjetas: ids, codigos, desde, resultados });
      btnAnalizar.textContent = th.paso3.listo; btnAnalizar.disabled = false; btnAnalizar.classList.remove("ocupado");
      if (ESP.herramienta.activa === handle) location.hash = "#/informe/" + id;
    });

    const controles = [];
    const handle = { mapa, poner: anillo => mapa.poner(anillo), evaluacion: () => evaluacion, controles,
      destruir() { hojaCtl.destruir(); controles.cancelado = true; controles.forEach(c => { try { c.abort(); } catch { /* nada */ } }); mapa.destruir(); if (ESP.herramienta.activa === handle) ESP.herramienta.activa = null; } };
    ESP.herramienta.activa = handle;   // para pruebas y para que el shell pueda centrar o cargar un polígono externo
    return handle;
  }

  return { analizar, llamar, correr, activa: null };
})();

ESP.vistas.analizar = (el, opciones) => ESP.herramienta.analizar(el, opciones);
