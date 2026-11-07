/* Asistente de análisis · paso 4, la cartelera. Cada tarjeta del catálogo es una «película»: póster, título, cuántos
   análisis incluye y cuánto tarda. Tocar el póster elige o quita; «Ver más» abre la ficha sobre la cartelera.
   No conoce el flujo: recibe el estado (js/asistente/estado.js) y avisa con alCambiar().
   ESP.asistente.cartelera.crear({ estado, alCambiar }) → { el, cerrarFicha }. */
window.ESP = window.ESP || {};
ESP.asistente = ESP.asistente || {};
ESP.asistente.cartelera = (function () {
  const h = (...a) => ESP.util.h(...a);
  const ic = n => h("span", { class: "ms", "aria-hidden": "true" }, n);

  // 20 → «unos 20 segundos», 60 → «cerca de 1 minuto», 113 → «unos 2 minutos». Es un estimado: nunca se promete al segundo.
  function tiempoTexto(seg, T) {
    const x = T.tiempo;
    if (seg < 50) return x.segundos.replace("{n}", Math.max(10, Math.round(seg / 10) * 10));
    const min = Math.round(seg / 60);
    return min <= 1 ? x.minuto : x.minutos.replace("{n}", min);
  }

  function crear(o) {
    const t = ESP.t(), T = t.asistente.cartelera, estado = o.estado, cat = ESP.catalogo;
    const avisar = () => { if (o.alCambiar) o.alCambiar(); };
    const tarjetas = cat.tarjetas.map(tj => ({ tj, tx: (t.tarjetas || {})[tj.id] || { nombre: tj.id }, info: estado.info(tj.id) }));
    const hay = e => e.info.analisis > 0;
    const marcas = {};            // id → { poster, tarjeta }  para repintar el estado sin reconstruir

    // Póster real si existe; si no, el icono de la tarjeta sobre un degradado de la marca (la tarjeta nunca se rompe).
    function poster(e, grande) {
      const caja = h("span", { class: "as-poster" + (grande ? " as-poster-g" : "") }, h("span", { class: "as-poster-ic" }, ic(e.tj.icono)));
      if (hay(e)) {
        const img = h("img", { src: "img/posters/" + e.tj.id + ".webp", alt: "", loading: "lazy", decoding: "async" });
        img.addEventListener("error", () => img.remove());
        caja.append(img);
      }
      return caja;
    }
    const meta = e => (e.info.analisis === 1 ? T.analisis1 : T.analisisN.replace("{n}", e.info.analisis)) + " · " + tiempoTexto(e.info.segundos, T);

    function tarjeta(e) {
      const elegida = estado.datos.tarjetas.includes(e.tj.id);
      const pos = h("button", { class: "as-card-poster", type: "button", "aria-pressed": String(elegida), "aria-label": T.elegir1.replace("{nombre}", e.tx.nombre),
        onclick: () => { estado.alternarTarjeta(e.tj.id); pintarEstados(); avisar(); } }, poster(e), h("span", { class: "as-card-ok" }, ic("check")));
      const card = h("article", { class: "as-card" + (hay(e) ? "" : " as-card-prox"), "data-id": e.tj.id },
        hay(e) ? pos : h("div", { class: "as-card-poster", "aria-disabled": "true" }, poster(e)),
        h("h3", {}, e.tx.nombre),
        hay(e) ? h("p", { class: "as-card-meta" }, meta(e)) : h("p", { class: "as-card-meta" }, T.proximamente),
        hay(e) ? h("button", { class: "as-card-mas", type: "button", onclick: () => ficha(e) }, T.verMas) : "");
      marcas[e.tj.id] = { card, pos: hay(e) ? pos : null };
      return card;
    }
    function pintarEstados() {
      Object.keys(marcas).forEach(id => {
        const m = marcas[id]; if (!m.pos) return;
        const on = estado.datos.tarjetas.includes(id);
        m.card.classList.toggle("as-card-elegida", on); m.pos.setAttribute("aria-pressed", String(on));
      });
    }

    // ── Ficha: qué responde, qué recibe, cuánto tarda y lo que no dice ───────
    let abierta = null;
    function ficha(e) {
      cerrarFicha();
      const on = () => estado.datos.tarjetas.includes(e.tj.id);
      const usa = cat.apisDe([e.tj.id]).includes("PR-05");
      const sec = (titulo, texto) => h("section", { class: "as-ficha-s" }, h("h4", {}, titulo), h("p", {}, texto));
      const desde = h("input", { type: "date", id: "as-desde", class: "as-desde", min: "2019-04-01", value: estado.datos.desde || "" });
      desde.addEventListener("change", () => { estado.ponerDesde(desde.value); avisar(); });
      const boton = h("button", { class: "btn btn-p as-ficha-elegir", type: "button" });
      const pintarBoton = () => { boton.textContent = on() ? T.quitar : T.elegir; };
      boton.addEventListener("click", () => { estado.alternarTarjeta(e.tj.id); pintarBoton(); pintarEstados(); avisar(); });
      pintarBoton();
      const d = h("dialog", { class: "as-ficha", "aria-labelledby": "as-ficha-t" },
        h("header", {}, poster(e, true), h("div", {}, h("h3", { id: "as-ficha-t" }, e.tx.nombre), h("p", { class: "as-card-meta" }, meta(e))),
          h("button", { class: "btn btn-icono as-ficha-x", type: "button", "aria-label": T.cerrar, onclick: cerrarFicha }, ic("close"))),
        sec(T.responde, e.tx.pregunta), sec(T.recibe, e.tx.corta),
        e.tx.sirve ? sec(T.sirve, e.tx.sirve) : "",
        h("section", { class: "as-ficha-s" }, h("h4", {}, T.tarda), h("p", {}, tiempoTexto(e.info.segundos, T)), h("small", {}, T.estimado)),
        e.tx.limites ? sec(T.noDice, e.tx.limites) : "",
        usa ? h("div", { class: "as-ficha-desde" }, h("label", { for: "as-desde" }, t.herramienta.paso2.desde), desde, h("small", {}, t.herramienta.paso2.desdeAyuda)) : "",
        h("div", { class: "as-ficha-b" }, boton));
      d.addEventListener("cancel", ev => { ev.preventDefault(); cerrarFicha(); });
      d.addEventListener("click", ev => { if (ev.target === d) cerrarFicha(); });        // un toque fuera de la ficha la cierra
      abierta = d; raiz.append(d); d.showModal(); boton.focus();
    }
    function cerrarFicha() { if (abierta) { abierta.close(); abierta.remove(); abierta = null; } }

    // ── Estructura ───────────────────────────────────────────────────────────
    const fila = (titulo, lista) => lista.length ? h("section", { class: "as-fila" }, h("h3", { class: "as-fila-t" }, titulo), h("div", { class: "as-fila-c" }, lista.map(tarjeta))) : "";
    const raiz = h("div", { class: "as-cartelera" }, h("h2", {}, T.t), h("p", { class: "as-cartelera-d" }, T.d),
      fila(T.disponibles, tarjetas.filter(hay)), fila(T.proximamente, tarjetas.filter(e => !hay(e))));
    pintarEstados();
    return { el: raiz, cerrarFicha, tiempoTexto: s => tiempoTexto(s, T) };
  }
  return { crear, tiempoTexto };
})();
