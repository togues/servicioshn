/* Asistente de análisis · vista de los pasos 0 a 3 (bienvenida, dónde, marcar, revisar). Solo pinta desde el estado
   (js/asistente/estado.js); reutiliza ESP.mapa y ESP.validar. La ruta lleva el paso: #/analizar/0 … #/analizar/6.
   La vista es una sola para todo el flujo: el mapa se crea una vez y se conserva entre los pasos 1, 2 y 3. */
window.ESP = window.ESP || {};
ESP.asistente = ESP.asistente || {};
ESP.asistente.vista = (function () {
  const h = (...a) => ESP.util.h(...a);
  const SIN_CIERRE_POR_TOQUE = { finishOn: null };
  const CLAVE_BIENVENIDA = "esp.asistente.bienvenida";
  const guardado = { leer() { try { return localStorage.getItem(CLAVE_BIENVENIDA) === "1"; } catch { return false; } }, poner() { try { localStorage.setItem(CLAVE_BIENVENIDA, "1"); } catch { /* sin almacenamiento: se mostrará otra vez */ } } };

  // El estado sobrevive a la vista: si la persona va al sitio y vuelve, conserva su dibujo y lo elegido.
  function sesion() {
    if (!ESP.asistente.sesion) ESP.asistente.sesion = ESP.asistente.estado.crear({ catalogo: ESP.catalogo, vioBienvenida: guardado.leer() });
    return ESP.asistente.sesion;
  }
  const reiniciarSesion = () => { if (ESP.asistente.sesion) ESP.asistente.sesion.reiniciar(); };

  function crear(el, paso, opciones) {
    const t = ESP.t(), ta = t.asistente, estado = sesion();
    const op = opciones || {};
    (op.tarjetas || []).forEach(id => { if (!estado.datos.tarjetas.includes(id)) estado.alternarTarjeta(id); });
    el.innerHTML = ""; el.className = "vista vista-analizar as";

    // ── Estructura fija: barra, cuerpo (mapa + pantalla), pie ────────────────
    const hitosEl = h("ol", { class: "as-hitos", "aria-label": ta.hitos.area + ", " + ta.hitos.analisis + ", " + ta.hitos.resultado },
      ["area", "analisis", "resultado"].map(k => h("li", { "data-hito": k }, h("span", { class: "as-hito-n" }), ta.hitos[k])));
    const barra = h("header", { class: "as-barra" },
      h("a", { class: "as-logo", href: "#/", "aria-label": ta.logo, onclick: ev => { ev.preventDefault(); salir(); } },
        h("img", { src: "img/logo.svg", alt: "", width: 28, height: 28 }), h("b", {}, t.marca.nombre)),
      hitosEl,
      h("button", { class: "btn as-salir", type: "button", onclick: () => salir() }, ta.salirBoton));
    const mapaEl = h("div", { class: "as-mapa", id: "as-mapa" });
    const frase = h("p", { class: "as-frase", role: "status", "aria-live": "polite" });
    const pantalla = h("section", { class: "as-pantalla", tabindex: "-1" });
    const cuerpo = h("div", { class: "as-cuerpo" }, mapaEl, frase, pantalla);
    const nota = h("p", { class: "as-nota", role: "status", "aria-live": "polite" });
    const izq = h("div", { class: "as-pie-i" }), centro = h("div", { class: "as-pie-c" }, nota), der = h("div", { class: "as-pie-d" });
    const pie = h("footer", { class: "as-pie" }, izq, centro, der);
    el.append(barra, cuerpo, pie);

    // ── Diálogo de confirmación (accesible; Esc = no) ─────────────────────────
    function confirmar(texto, si, no) {
      return new Promise(res => {
        const d = h("dialog", { class: "as-confirma" }, h("p", {}, texto),
          h("div", { class: "as-confirma-b" },
            h("button", { class: "btn", type: "button", "data-no": "1" }, no),
            h("button", { class: "btn btn-p", type: "button", "data-si": "1" }, si)));
        const fin = v => { d.close(); d.remove(); res(v); };
        d.querySelector("[data-si]").addEventListener("click", () => fin(true));
        d.querySelector("[data-no]").addEventListener("click", () => fin(false));
        d.addEventListener("cancel", ev => { ev.preventDefault(); fin(false); });
        el.append(d); d.showModal();
      });
    }

    // ── Mapa (se crea al primer paso que lo necesita y se conserva) ──────────
    let cartelera = null, analisis = null;
    let mapa = null, modo = "inicio", ev = estado.datos.evaluacion, restaurando = false;
    const esMovil = () => window.matchMedia("(max-width: 48rem)").matches;
    function asegurarMapa() {
      if (mapa) return mapa;
      mapa = ESP.mapa.crear(mapaEl, {
        cubierto: () => (esMovil() ? pantalla.offsetHeight : 0),
        onTrazo: coords => {
          if (restaurando || (!coords.length && modo !== "trazando")) return;
          if (coords.length) modo = "trazando"; else if (modo === "trazando") modo = "inicio";
          ev = coords.length >= 3 ? ESP.validar.evaluar(coords, t) : { estado: "vacio" };
          mapa.marcarVertice(ev.vertice != null ? ev.vertice : -1);
          pintarFrase(coords);
        },
        onCambio: coords => {
          if (restaurando) return;
          ev = coords.length ? ESP.validar.evaluar(coords, t) : { estado: "vacio" };
          mapa.marcarVertice(ev.vertice != null ? ev.vertice : -1);
          const p = estado.datos.paso;
          if (!coords.length) { estado.ponerDibujo([], ev, false); modo = "inicio"; }
          else if (p === 2 && modo === "trazando") { estado.ponerDibujo(coords, ev, true); modo = "corrigiendo"; ir(3); return; }
          else estado.ponerDibujo(coords, ev, p === 3);
          if (p === 2) pintarFrase(coords); else if (p === 3) pintarRevision();
        }
      });
      if (estado.datos.anillo.length >= 3) { restaurando = true; mapa.poner(estado.datos.anillo); restaurando = false; modo = "corrigiendo"; }
      return mapa;
    }

    // ── Navegación ───────────────────────────────────────────────────────────
    const ir = n => { location.hash = "#/analizar/" + n; };
    // Un dibujo a medias (puntos puestos, polígono aún sin cerrar) también es trabajo que se pierde.
    const hayAlgoQuePerder = () => estado.hayAlgoQuePerder() || (!!mapa && mapa.dibujando() && mapa.trazo().length > 0);
    async function salir() {
      if (hayAlgoQuePerder() && !(await confirmar(ta.salir.confirma, ta.salir.salir, ta.salir.quedarme))) return;
      reiniciarSesion(); location.hash = "#/";
    }
    const alCerrar = e => { if (hayAlgoQuePerder()) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", alCerrar);

    // ── Piezas de pantalla ───────────────────────────────────────────────────
    const boton = (txt, fn, clase, extra) => h("button", { class: "btn " + (clase || ""), type: "button", onclick: fn, ...(extra || {}) }, txt);
    const atras = n => boton(ta.atras, () => ir(n), "as-atras", { "aria-label": ta.atras });
    function pintarPie(izqHijos, centroHijos, derHijos) {
      izq.replaceChildren(...[].concat(izqHijos || [])); der.replaceChildren(...[].concat(derHijos || []));
      centro.replaceChildren(...[].concat(centroHijos || [])); nota.textContent = "";
      if (!centroHijos) centro.append(nota);
    }
    function pintarHitos(n) {
      const actual = estado.hito(n), orden = ["area", "analisis", "resultado"], i = orden.indexOf(actual);
      barra.classList.toggle("as-sin-hitos", !actual);
      hitosEl.querySelectorAll("li").forEach((li, k) => {
        li.classList.toggle("hecho", k < i); li.classList.toggle("actual", k === i);
        li.querySelector(".as-hito-n").textContent = k < i ? "✓" : String(k + 1);
        if (k === i) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
      });
    }
    // La frase de guía del paso 2: cambia a cada toque y vive en una región aria-live.
    function pintarFrase(coords) {
      if (estado.datos.paso !== 2) return;
      const m = ta.marcar, n = (coords || []).length;
      let txt, cruz = false;
      if (modo === "corrigiendo") txt = ev.estado === "invalido" ? ev.mensaje : m.corregir;
      else if (n === 0) txt = m.primera;
      else if (n < 3) txt = m.siguiente + " · " + (n === 1 ? m.punto : m.puntos.replace("{n}", n));
      else if (ev.estado === "invalido" && ev.vertice != null) { txt = ev.mensaje; cruz = true; }
      else txt = m.puedeTerminar + " · " + m.puntos.replace("{n}", n);
      if (n >= 3 && !cruz && ev.m2) txt += " · " + ESP.util.area(ev.m2);
      frase.textContent = txt; frase.classList.toggle("as-frase-mala", cruz);
      const listo = modo === "corrigiendo" ? n >= 3 : n >= 3;
      const terminar = der.querySelector("[data-terminar]"); if (terminar) terminar.disabled = !listo;
      nota.textContent = listo ? "" : m.faltanPuntos;
    }

    // ── Pasos ────────────────────────────────────────────────────────────────
    function pasoBienvenida() {
      const b = ta.bienvenida;
      const url = (ESP.config.mapa.satelite || "");
      const fondo = h("div", { class: "as-fondo", "aria-hidden": "true" });
      if (url) for (let y = 7542; y <= 7544; y++) for (let x = 4228; x <= 4231; x++)
        fondo.append(h("img", { src: url.replace("{z}", 14).replace("{y}", y).replace("{x}", x), alt: "", loading: "lazy", decoding: "async" }));
      pantalla.append(fondo, h("div", { class: "as-bv" },
        h("p", { class: "as-bv-et" }, b.etiqueta), h("h1", {}, b.titulo), h("p", { class: "as-bv-tx" }, b.texto),
        h("ol", { class: "as-bv-pasos" }, b.pasos.map((p, i) => h("li", {}, h("b", {}, String(i + 1)), h("span", {}, h("strong", {}, p.t), p.d)))),
        h("p", { class: "as-bv-tarda" }, b.tarda),
        boton(b.empezar, () => { guardado.poner(); estado.marcarBienvenida(); ir(1); }, "btn-p btn-g as-empezar")));
      pintarPie();
    }

    function pasoDonde() {
      const d = ta.donde;
      const buscador = h("input", { class: "as-buscar", type: "search", id: "as-buscar", placeholder: d.buscar, "aria-label": d.buscar, autocomplete: "off" });
      const aviso = h("p", { class: "as-aviso", role: "status", "aria-live": "polite", hidden: true });
      const form = h("form", { class: "as-buscar-form" }, buscador, boton(d.buscarBoton, null, "btn-s", { type: "submit" }));
      form.addEventListener("submit", async e => {
        e.preventDefault(); const q = buscador.value.trim(); if (!q) return;
        buscador.classList.add("ocupado"); const r = await asegurarMapa().buscar(q); buscador.classList.remove("ocupado");
        aviso.hidden = r.ok; if (!r.ok) aviso.textContent = r.mensaje || d.sinResultado;
        if (r.ok) estado.ponerLugar(r.nombre ? r.nombre.split(",").slice(0, 2).join(",") : "");   // coordenadas pegadas no son un lugar
      });
      const retomar = h("div", { class: "as-retomar", hidden: true });
      ESP.resultados.lista().then(l => {
        const u = l && l[0]; if (!u) return;
        retomar.hidden = false;
        retomar.append(h("a", { href: "#/informe/" + u.id + "/0" }, h("span", { class: "ms", "aria-hidden": "true" }, "history"),
          h("span", {}, h("b", {}, d.retomar), h("small", {}, d.retomarDe.replace("{area}", ESP.util.area(u.areaM2 || 0).split(" (")[0]).replace("{fecha}", ESP.util.fecha(u.fecha))))));
      }).catch(() => {});
      pantalla.append(retomar, h("h2", {}, d.t), h("p", {}, d.d), form, aviso,
        boton(d.ubicacion, () => asegurarMapa().ubicar(), "as-ubic", {}));
      pintarPie(atras(0), null, boton(d.dibujar, () => ir(2), "btn-p as-principal"));
      asegurarMapa().invalidar();
    }

    function pasoMarcar() {
      const m = ta.marcar, mp = asegurarMapa();
      if (estado.datos.anillo.length >= 3) { estado.reabrirDibujo(); modo = "corrigiendo"; }
      else if (!mp.dibujando()) { modo = "inicio"; mp.dibujar(SIN_CIERRE_POR_TOQUE); }
      const reiniciar = async () => {
        if (hayAlgoQuePerder()) { if (!(await confirmar(m.confirmaReiniciar, m.borrar, m.conservar))) return; }
        mp.borrar(); modo = "inicio"; estado.borrarDibujo(); mp.dibujar(SIN_CIERRE_POR_TOQUE); pintarFrase([]);
      };
      pintarPie(atras(1), [boton(m.deshacer, () => { mp.deshacer(); }, "as-deshacer", { "data-deshacer": "1" }), boton(m.reiniciar, reiniciar, "as-reiniciar"), nota],
        boton(m.terminar, () => {
          if (modo === "trazando") mp.terminar();
          else { estado.ponerDibujo(mp.coordenadas(), ev.estado ? ev : estado.datos.evaluacion, true); ir(3); }
        }, "btn-p as-principal", { "data-terminar": "1", disabled: true }));
      mp.invalidar();
      pintarFrase(modo === "trazando" ? mp.trazo() : mp.coordenadas());
    }

    function pintarRevision() {
      if (estado.datos.paso !== 3) return;
      const r = ta.revisar, e = estado.datos.evaluacion, u = t.herramienta.estado.unidades, num = ESP.util.num;
      const valido = estado.areaValida();
      pantalla.replaceChildren();
      const fuera = e.anillo && !ESP.validar.enCobertura(ESP.validar.centroide(e.anillo));
      pantalla.append(h("h2", {}, r.t),
        h("p", { class: "as-medida", "aria-label": r.medida }, e.m2 ? [h("b", {}, num(e.m2) + " " + u.m2), " · " + num(e.varas2) + " " + u.varas2 + " · " + num(e.ha, 2) + " " + u.ha] : ""),
        h("p", { class: "as-estado as-estado-" + e.estado }, h("span", { class: "ms", "aria-hidden": "true" }, valido ? (e.estado === "aviso" ? "info" : "check_circle") : "error"), e.mensaje || ""),
        fuera ? h("p", { class: "as-estado as-estado-aviso" }, h("span", { class: "ms", "aria-hidden": "true" }, "public"), t.herramienta.estado.fueraCobertura) : "",
        h("p", { class: "as-ayuda" }, r.arrastre));
      const confirmarBtn = boton(r.confirmar, () => ir(4), "btn-p as-principal", valido ? {} : { disabled: true });
      pintarPie(boton(r.corregir, () => ir(2), "as-atras"), null, confirmarBtn);
      if (!valido) nota.textContent = r.falta.replace("{motivo}", e.mensaje || "");
    }
    function pasoRevisar() { const mp = asegurarMapa(); mp.centrar(); mp.invalidar(); pintarRevision(); }

    // Paso 5: resumen de lo que va a pasar. Cada parte tiene su «cambiar»; el botón grande dispara el análisis.
    function pasoListo() {
      const m = ta.listo, d = estado.datos, r = estado.resumen(), u = t.herramienta.estado.unidades;
      const mp = asegurarMapa(); mp.centrar(false); mp.invalidar();
      const area = d.evaluacion.m2 ? ESP.util.num(d.evaluacion.m2) + " " + u.m2 + " · " + ESP.util.num(d.evaluacion.varas2) + " " + u.varas2 : "";
      const fila = (etq, valor, cambiar, accion) => h("div", { class: "as-resumen-f" }, h("div", {}, h("small", {}, etq), valor),
        boton(m.cambiar, accion, "as-cambiar", { "aria-label": cambiar }));
      const nombres = r.tarjetas.map(id => h("li", {}, ((t.tarjetas || {})[id] || { nombre: id }).nombre));
      pantalla.append(h("h2", {}, m.t),
        fila(m.area, [h("b", {}, area), d.lugar ? h("span", {}, m.lugar.replace("{lugar}", d.lugar)) : ""], m.cambiarArea, () => ir(2)),
        fila(m.analisis, [h("ul", { class: "as-resumen-l" }, nombres), r.desde ? h("span", {}, m.desde.replace("{fecha}", ESP.util.fecha(r.desde))) : ""], m.cambiarAnalisis, () => ir(4)),
        h("p", { class: "as-ayuda" }, (r.servicios === 1 ? m.servicio1 : m.serviciosN.replace("{n}", r.servicios)) + ". " + m.tarda.replace("{tiempo}", ESP.asistente.cartelera.tiempoTexto(r.segundos, ta.cartelera))));
      pintarPie(atras(4), null, boton(m.boton, () => { estado.autorizarAnalisis(); ir(6); }, "btn-p as-principal as-analizar"));
    }

    // Paso 6: llama a los servicios con llamar/correr de herramienta.js. Atrás, Salir o el Atrás del navegador cancelan las
    // llamadas (AbortController) y dejan todo intacto en el 5. Al terminar guarda con la misma forma que la herramienta anterior.
    function cancelarAnalisis() {
      if (!analisis) return;
      analisis.activo = false; analisis.controles.cancelado = true;
      analisis.controles.forEach(c => { try { c.abort(); } catch { /* ya terminó */ } });
      clearInterval(analisis.rotor); analisis = null;
    }
    function pasoAnalizando() {
      const m = ta.analizando, tp = t.herramienta.progreso, r = estado.resumen(), d = estado.datos;
      estado.consumirAnalisis();
      const mp = asegurarMapa(); mp.centrar(false); mp.invalidar();
      const corrida = analisis = { activo: true, controles: [], rotor: null };
      const filas = {}; let hechos = 0;
      const barra = h("div", { class: "as-barra-av", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(r.codigos.length), "aria-valuenow": "0", "aria-label": m.t }, h("span", {}));
      const avance = h("p", { class: "as-avance", role: "status", "aria-live": "polite" }, m.avance.replace("{n}", 0).replace("{m}", r.codigos.length));
      const lista = h("ul", { class: "as-prog" }, r.codigos.map(c => {
        filas[c] = h("li", { class: "as-prog-enCola" }, h("span", { class: "as-prog-p", "aria-hidden": "true" }), h("span", { class: "as-prog-n" }, ((t.apis || {})[c] || {}).nombre || c), h("span", { class: "as-prog-e" }, tp.enCola));
        return filas[c];
      }));
      const curioso = h("p", { class: "as-curioso" }, h("b", {}, m.sabia + " "), h("span", {}, m.curiosos[0]));
      const error = h("p", { class: "as-estado as-estado-invalido", role: "alert", hidden: true }, t.herramienta.errores.todo);
      let k = 0; corrida.rotor = setInterval(() => { k = (k + 1) % m.curiosos.length; curioso.lastChild.textContent = m.curiosos[k]; }, 8000);
      pantalla.append(h("h2", {}, m.t), barra, avance, lista, curioso, error);
      pintarPie(atras(5), [h("p", { class: "as-nota" }, m.atras)], "");

      function alProgreso(codigo, est, seg, motivo) {
        if (!corrida.activo) return;
        const li = filas[codigo]; if (!li) return;
        li.className = "as-prog-" + est;
        li.querySelector(".as-prog-e").textContent = (est === "corriendo" ? tp.corriendo.replace("{s}", seg) : (tp[est] || est)) + (motivo ? " · " + motivo : "");
        if (est === "listo" || est === "error" || est === "parcial") {
          hechos = Object.values(filas).filter(x => /as-prog-(listo|error|parcial)/.test(x.className)).length;
          barra.setAttribute("aria-valuenow", String(hechos)); barra.firstChild.style.width = Math.round(hechos / r.codigos.length * 100) + "%";
          avance.textContent = m.avance.replace("{n}", hechos).replace("{m}", r.codigos.length);
        }
      }
      const inicio = new Date(), aoi = d.evaluacion.geojson;
      const params = c => (c === "PR-05" && r.desde ? { desde: r.desde } : {});
      ESP.herramienta.correr(r.codigos, aoi, params, alProgreso, corrida.controles).then(resultados => {
        if (!corrida.activo) return;                         // se canceló: nada que guardar
        clearInterval(corrida.rotor);
        const bien = Object.values(resultados).filter(x => x.estado !== "error");
        if (!bien.length) {                                  // fallaron todos: se queda aquí con el error y puede reintentar
          error.hidden = false; analisis = null;
          pintarPie(atras(5), [nota], boton(m.reintentar, () => { estado.autorizarAnalisis(); pintar(6); }, "btn-p as-principal"));
          return;
        }
        const id = ESP.resultados.nuevoId();
        ESP.resultados.guardar(id, { id, fecha: inicio.toISOString(), aoi, areaM2: d.evaluacion.m2, varas2: d.evaluacion.varas2, ha: d.evaluacion.ha, tarjetas: r.tarjetas, codigos: r.codigos, desde: r.desde, resultados });
        avance.textContent = m.entrando; analisis = null;
        reiniciarSesion(); location.hash = "#/informe/" + id + "/0";   // el flujo termina: un nuevo análisis abre un asistente limpio
      });
    }

    // Paso 4: la cartelera. El pie dice cuántos hay elegidos y cuánto tardará; Siguiente se apaga sin nada elegido, y lo dice.
    function pasoCartelera() {
      const m = ta.cartelera;
      const pintarPieCartelera = () => {
        const r = estado.resumen(), n = r.tarjetas.length;
        pintarPie(atras(3), [nota], boton(m.siguiente, () => ir(5), "btn-p as-principal", n ? {} : { disabled: true }));
        nota.textContent = n ? (n === 1 ? m.elegido1 : m.elegidosN.replace("{n}", n)) + " · " + ESP.asistente.cartelera.tiempoTexto(r.segundos, m) : m.ninguno;
      };
      cartelera = ESP.asistente.cartelera.crear({ estado, alCambiar: pintarPieCartelera });
      pantalla.append(cartelera.el); pintarPieCartelera();
    }

    // ── Pintar un paso ───────────────────────────────────────────────────────
    function pintar(n) {
      if (cartelera) { cartelera.cerrarFicha(); cartelera = null; }
      cancelarAnalisis();                                   // salir del paso 6 por cualquier camino cancela las llamadas
      const p = estado.ir(n);
      if (String(p) !== String(n) && location.hash !== "#/analizar/" + p) history.replaceState(null, "", "#/analizar/" + p);   // corrige sin dejar rastro en el historial
      el.dataset.paso = p; pantalla.replaceChildren(); frase.textContent = ""; frase.classList.remove("as-frase-mala");
      if (mapa) { mapa.marcarVertice(-1); }
      pintarHitos(p);
      ({ 0: pasoBienvenida, 1: pasoDonde, 2: pasoMarcar, 3: pasoRevisar, 4: pasoCartelera, 5: pasoListo, 6: pasoAnalizando }[p])();
      document.title = t.asistente.hitos[estado.hito(p)] ? t.asistente.hitos[estado.hito(p)] + " · " + t.marca.nombre : t.marca.nombre;
      if (p !== 2 && mapa && mapa.dibujando()) mapa.borrar();
      if (mapa) mapa.editable(p === 2 || p === 3);          // en 5 y 6 el polígono queda quieto
    }
    pintar(paso);

    return {
      ruta: "analizar", asistente: true,
      irA(n) { pintar(n); },
      destruir() { cancelarAnalisis(); window.removeEventListener("beforeunload", alCerrar); if (mapa) mapa.destruir(); }
    };
  }
  return { crear, sesion, reiniciarSesion };
})();

ESP.vistas.asistente = (el, paso, opciones) => ESP.asistente.vista.crear(el, paso, opciones);
