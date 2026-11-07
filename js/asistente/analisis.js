/* Asistente de análisis · pasos 5 y 6: el resumen («Todo listo») y el análisis en curso («Consultando los satélites…»).
   Llama a los servicios con llamar/correr de herramienta.js. No conoce el resto del flujo: la vista le da lo que necesita.
   ESP.asistente.analisis.crear({ estado, pantalla, nota, boton, atras, pintarPie, ir, mapa, repintar, reiniciar }) → { listo, analizando, cancelar }.
     mapa()       el mapa del flujo (se crea si falta)      repintar(n)  vuelve a pintar el paso n
     reiniciar()  deja el asistente limpio (al llegar al atlas el flujo termina) */
window.ESP = window.ESP || {};
ESP.asistente = ESP.asistente || {};
ESP.asistente.analisis = (function () {
  const h = (...a) => ESP.util.h(...a);

  function crear(ctx) {
    const { estado, pantalla, nota, boton, atras, pintarPie, ir, mapa, repintar, reiniciar } = ctx;
    const t = ESP.t(), ta = t.asistente;
    let analisis = null;

    // Paso 5: resumen de lo que va a pasar. Cada parte tiene su «cambiar»; el botón grande dispara el análisis.
    function pasoListo() {
      const m = ta.listo, d = estado.datos, r = estado.resumen(), u = t.herramienta.estado.unidades;
      const mp = mapa(); mp.centrar(false); mp.invalidar();
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
      clearInterval(analisis.rotor); if (analisis.pixeles) analisis.pixeles.destruir(); analisis = null;
    }
    function pasoAnalizando() {
      const m = ta.analizando, tp = t.herramienta.progreso, r = estado.resumen(), d = estado.datos;
      estado.consumirAnalisis();
      const mp = mapa(); mp.centrar(false); mp.invalidar();
      const corrida = analisis = { activo: true, controles: [], rotor: null, pixeles: ESP.asistente.movimiento.pixeles(mp, d.anillo) };
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
          corrida.pixeles.avance(hechos / r.codigos.length, r.codigos.length);
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
          error.hidden = false; corrida.pixeles.destruir(); analisis = null;
          pintarPie(atras(5), [nota], boton(m.reintentar, () => { estado.autorizarAnalisis(); repintar(6); }, "btn-p as-principal"));
          return;
        }
        const id = ESP.resultados.nuevoId();
        ESP.resultados.guardar(id, { id, fecha: inicio.toISOString(), aoi, areaM2: d.evaluacion.m2, varas2: d.evaluacion.varas2, ha: d.evaluacion.ha, tarjetas: r.tarjetas, codigos: r.codigos, desde: r.desde, resultados });
        avance.textContent = m.entrando; corrida.pixeles.avance(1);
        // Un instante con el área encendida antes de abrir el atlas; con movimiento reducido, de una vez.
        setTimeout(() => { if (!corrida.activo) return; corrida.pixeles.destruir(); analisis = null; reiniciar(); location.hash = "#/informe/" + id + "/0"; }, ESP.asistente.movimiento.reducido() ? 0 : 1000);   // el flujo termina: un nuevo análisis abre un asistente limpio
      });
    }

    return { listo: pasoListo, analizando: pasoAnalizando, cancelar: cancelarAnalisis };
  }
  return { crear };
})();
