/* Atlas · vista. Sustituye al informe: portada, láminas numeradas y contraportada, que se hojean.
   Ruta: #/informe/<id>/<n>  (0 portada · 1…N láminas · N+1 contraportada). Todas las páginas se construyen de
   una vez en una pila; solo la actual es visible (las demás visibility:hidden, con tamaño, para que sus mapas
   carguen y se puedan imprimir). Los textos vienen de los lectores por medio de laminas.js; aquí solo se
   dibujan. Transiciones con GSAP si está cargado y el sistema no pide movimiento reducido. */
window.ESP = window.ESP || {}; ESP.vistas = ESP.vistas || {};
ESP.atlas = (function () {
  const UI = () => ESP.atlasUI, h = (...a) => ESP.atlasUI.h(...a);
  const t = () => ESP.t(), A = () => t().atlas;
  const tpl = (s, v) => String(s || "").replace(/\{(\w+)\}/g, (_, k) => (v[k] != null ? v[k] : ""));
  const fechaLarga = iso => new Date(iso).toLocaleDateString("es-HN", { day: "numeric", month: "long", year: "numeric" });
  const esMovil = () => window.matchMedia("(max-width: 64rem)").matches;
  const sinMovimiento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.gsap;
  const ic = n => h("span", { class: "ms", "aria-hidden": "true" }, n);

  /* ── Lecturas ─────────────────────────────────────────────── */
  function lecturaGenerica(codigo, resp, T) {
    const st = resp.stats || {}, md = resp.metadata || {}, hallazgos = [];
    Object.keys(st).forEach(k => { const b = st[k]; if (b && typeof b === "object" && (b.lectura || b.nota)) hallazgos.push({ id: k, titulo: (b.etiquetas && b.etiquetas.titulo) || k, texto: b.lectura || "", nota: b.nota || "", observado: b.observado || null, serie: null, tabla: null, sinDato: null }); });
    const frase = typeof st.lectura === "string" ? st.lectura : (hallazgos.find(x => x.texto) || {}).texto || "";
    return { codigo, titulo: ((T.apis || {})[codigo] || {}).nombre || codigo, estado: resp.status === "partial" ? "parcial" : "ok", frase, hallazgos, capas: [], galeria: [], fuentes: md.fuentes || [], limites: md.limites || "", aviso: md.aviso || null, faltantes: md.faltantes || [] };
  }
  function leerTodo(datos, T) {
    const ctx = { t: T, idioma: ESP.config.idioma, areaM2: datos.areaM2, aoi: datos.aoi };
    return datos.codigos.map(codigo => {
      const r = datos.resultados[codigo], nombre = ((T.apis || {})[codigo] || {}).nombre || codigo;
      if (!r || r.estado === "error" || !r.resp) return { codigo, titulo: nombre, estado: "error", motivo: (r && r.motivo) || "", hallazgos: [], capas: [], galeria: [], fuentes: [], faltantes: [] };
      const lector = ESP.lectores && ESP.lectores[codigo];
      try { return lector ? lector.leer(r.resp, ctx) : lecturaGenerica(codigo, r.resp, T); } catch (e) { console.error("lector " + codigo, e); return lecturaGenerica(codigo, r.resp, T); }
    });
  }

  /* ── Mapas ────────────────────────────────────────────────── */
  function mapaBase(el, aoi, opciones) {
    const c = ESP.config.mapa, o = opciones || {};
    const map = L.map(el, { zoomControl: false, attributionControl: true, scrollWheelZoom: false, dragging: !o.fijo, touchZoom: !o.fijo, doubleClickZoom: !o.fijo, boxZoom: false, keyboard: !o.fijo, tap: !o.fijo });
    // El contenedor aún no está en el documento: Leaflet no ve el `position:absolute` del CSS y le pone `relative` en línea,
    // lo que lo deja en altura 0 (mapa en blanco). Se quita para que mande atlas.css.
    if (el.style.position === "relative") el.style.position = "";
    map.attributionControl.setPrefix("");
    const base = o.calles ? L.tileLayer(c.calles, { maxZoom: 19, attribution: c.atribucionCalles }) : L.tileLayer(c.satelite, { maxZoom: 19, attribution: c.atribucionSatelite, opacity: o.opacidad != null ? o.opacidad : .78 });
    base.addTo(map);
    if (!o.fijo) { L.control.zoom({ position: "topright" }).addTo(map); L.control.scale({ metric: true, imperial: false, position: "bottomleft" }).addTo(map); }
    const contorno = L.geoJSON(aoi, { style: { color: ESP.paleta.acento, weight: 3, fill: false, dashArray: o.fijo ? null : "0" } }).addTo(map);
    const encuadrar = () => { try { map.fitBounds(contorno.getBounds(), { padding: o.padding || [28, 28], maxZoom: o.maxZoom || 19 }); } catch (e) { map.setView(c.centro, c.zoom); } };
    encuadrar();
    return { map, contorno, encuadrar, invalidar() { setTimeout(() => { map.invalidateSize(); encuadrar(); }, 30); }, destruir() { try { map.remove(); } catch (e) { /* nada */ } } };
  }
  function capaLeaflet(c) {
    if (c.tipo === "vector" && c.geojson && c.geojson.features && c.geojson.features.length) {
      return L.geoJSON(c.geojson, { style: f => (c.estilo ? c.estilo(f) : { color: ESP.paleta.marca, weight: 2, fillOpacity: .35 }),
        pointToLayer: (f, ll) => L.circleMarker(ll, Object.assign({ radius: 6, color: ESP.paleta.marca }, c.estilo ? c.estilo(f) : {}, c.puntos ? c.puntos(f) : {})),
        onEachFeature: (f, ly) => { if (c.popup) { const p = c.popup(f); if (p) ly.bindPopup(p); } } });
    }
    if (c.tipo === "tile" && ESP.util.urlSegura(c.url)) return L.tileLayer(ESP.util.urlSegura(c.url), { opacity: c.opacidad != null ? c.opacidad : .7, maxZoom: 20 });
    return null;
  }

  /* ── Piezas de la hoja ────────────────────────────────────── */
  function bloqueHallazgo(hz) {
    const b = h("section", { class: "at-hz" }, h("h4", {}, hz.titulo || ""));
    if (hz.sinDato) { b.append(h("p", { class: "at-sindato" }, tpl(A().sinDato, { motivo: hz.sinDato }))); return b; }
    if (hz.texto) b.append(h("p", {}, hz.texto));
    if (hz.serie) { const g = UI().grafica(hz.serie); if (g) b.append(h("figure", {}, g, h("figcaption", {}, hz.serie.titulo || ""))); }
    const tb = UI().tabla(hz.tabla); if (tb) b.append(hz.tabla.filas.length > 6 ? h("details", { class: "at-plegable" }, h("summary", {}, A().tabla + " (" + hz.tabla.filas.length + ")"), tb) : tb);
    const meta = [];
    if (hz.observado && (hz.observado.desde || hz.observado.hasta)) meta.push(tpl(A().observado, { desde: hz.observado.desde || "—", hasta: hz.observado.hasta || "—", n: hz.observado.cantidad != null ? hz.observado.cantidad : "—" }));
    if (hz.escala) meta.push(A().escala + ": " + hz.escala);
    if (meta.length) b.append(h("p", { class: "at-meta" }, meta.join(" · ")));
    if (hz.nota) b.append(h("p", { class: "at-nota" }, hz.nota));
    return b;
  }
  function notasCartografo(l) {
    const items = [];
    const esc = (l.hallazgos.find(x => x.escala) || {}).escala; if (esc) items.push(h("li", {}, h("b", {}, A().escala + ". "), esc));
    const ob = (l.hallazgos.find(x => x.observado && (x.observado.desde || x.observado.hasta)) || {}).observado;
    if (ob) items.push(h("li", {}, tpl(A().observado, { desde: ob.desde || "—", hasta: ob.hasta || "—", n: ob.cantidad != null ? ob.cantidad : "—" })));
    const nota = (l.hallazgos.find(x => x.nota) || {}).nota; if (nota && l.hallazgos.length === 1) { /* ya se ve en el hallazgo */ }
    if (l.fuentes && l.fuentes.length) items.push(h("li", {}, h("b", {}, A().fuente + ". "), l.fuentes.map(f => [f.nombre || f.id, f.resolucion_m != null ? f.resolucion_m + " m" : null, f.fechas].filter(Boolean).join(", ")).join(" · ")));
    if (!items.length) return null;
    return h("section", { class: "at-notas" }, h("h3", {}, A().notas), h("ul", {}, items));
  }
  function hojaDe(l, m, opciones) {
    const o = opciones || {};
    const hoja = h("div", { class: "at-hoja" });
    if (l.leyenda && l.leyenda.length && !o.sinLeyenda) hoja.append(h("section", { class: "at-ley" }, h("h3", {}, A().leyenda), UI().leyenda(l.leyenda)));
    if (l.frase) hoja.append(h("section", { class: "at-hallazgo" }, h("h3", {}, A().hallazgo), h("p", { class: "at-frase" }, l.frase)));
    if (l.aviso) hoja.append(h("p", { class: "at-aviso" }, l.aviso));
    // La frase ya se dijo en grande: el bloque que la repite no la vuelve a decir (y si no tiene más, no aparece)
    l.hallazgos.forEach(x => {
      let y = x;
      if (l.frase && x.texto === l.frase && !x.sinDato) { if (!x.serie && !x.tabla && !x.nota) return; y = Object.assign({}, x, { texto: "" }); }
      if (o.sinSerieGrande && x === o.sinSerieGrande) y = Object.assign({}, y, { serie: null });
      hoja.append(bloqueHallazgo(y));
    });
    if (l.secundarias && l.secundarias.length && m) {
      const sec = h("section", { class: "at-sec" }, h("h3", {}, A().secundarias));
      l.secundarias.forEach(c => {
        const capa = capaLeaflet(c); if (!capa) return;
        const id = "sec-" + l.n + "-" + c.id;
        const cb = h("input", { type: "checkbox", id });
        cb.addEventListener("change", () => { if (cb.checked) capa.addTo(m.map); else m.map.removeLayer(capa); });
        sec.append(h("div", { class: "at-sec-i" }, cb, h("label", { for: id }, c.titulo), c.leyenda && c.leyenda.length ? UI().leyenda(c.leyenda) : null));
      });
      if (sec.children.length > 1) hoja.append(sec);
    }
    const nc = notasCartografo(l); if (nc) hoja.append(nc);
    return hoja;
  }
  const pieLamina = l => h("footer", { class: "at-pie-l" },
    l.limites ? h("p", { class: "at-nodice" }, h("b", {}, A().noDice + ". "), l.limites) : h("p", { class: "at-nodice" }, A().pie),
    h("p", { class: "at-editor" }, h("img", { src: "img/logo.svg", alt: "", width: 18, height: 18 }), A().editor));
  const cabLamina = (l, total, T, ayuda) => h("header", { class: "at-cab-l" },
    h("div", { class: "at-num" }, h("span", {}, tpl(A().laminaDe, { n: l.n, m: total }))),
    h("div", { class: "at-tit" }, h("h2", {}, l.titulo), h("p", { class: "at-sub" }, [l.tarjeta && T.tarjetas[l.tarjeta] ? T.tarjetas[l.tarjeta].nombre : null, l.servicio].filter(Boolean).join(" · "))),
    // El botón solo aparece en las láminas que ya tienen su texto de ayuda en i18n (se van sumando de a una)
    ayuda && T.ayuda.laminas[l.ayuda] ? h("button", { type: "button", class: "at-info", "aria-haspopup": "dialog", "aria-label": T.ayuda.boton, title: T.ayuda.boton, onclick: e => ayuda(l, e.currentTarget) }, ic("info")) : null);

  /* ── Ayuda: pantalla completa que explica en lenguaje común qué muestra la lámina. Lo fijo (qué es un parche, qué
     significa cada clase) sale de i18n; lo que depende del análisis (leyenda, fuentes, escala, límites) sale de los datos. ── */
  function contenidoAyuda(l, T) {
    const AY = T.ayuda, e = AY.laminas[l.ayuda] || {};
    const sec = (titulo, ...hijos) => h("section", { class: "at-ay-s" }, h("h3", {}, titulo), ...hijos);
    const out = [sec(AY.queVes, (e.queVes || []).map(p => h("p", {}, p)))];
    if (l.leyenda && l.leyenda.length) {
      out.push(sec(AY.colores, e.colores ? h("p", {}, e.colores) : null,
        h("ul", { class: "at-ay-ley" }, l.leyenda.map(it => h("li", {}, h("i", { style: `background:${it.color}` }), h("span", {}, h("b", {}, it.etiqueta), e.clases && e.clases[it.etiqueta] ? " · " + e.clases[it.etiqueta] : ""))))));
    }
    if (e.terminos && e.terminos.length) out.push(sec(AY.palabras, h("dl", {}, e.terminos.map(x => [h("dt", {}, x.t), h("dd", {}, x.d)]))));
    const escalas = [...new Set((l.hallazgos || []).map(x => x.escala).filter(Boolean))];
    const obs = (l.hallazgos || []).map(x => x.observado).find(o => o && o.desde);
    const fuentes = (l.fuentes || []).map(f => [f.nombre || f.id, f.resolucion_m != null ? f.resolucion_m + " m" : null, f.fechas].filter(Boolean).join(", "));
    if (fuentes.length || escalas.length || obs) {
      out.push(sec(AY.dato, h("ul", {},
        fuentes.map(f => h("li", {}, f)),
        escalas.length ? h("li", {}, h("b", {}, A().escala + ". "), escalas.join(" · ")) : null,
        obs ? h("li", {}, tpl(A().observado, { desde: obs.desde, hasta: obs.hasta, n: obs.cantidad != null ? obs.cantidad : "—" })) : null)));
    }
    out.push(sec(AY.noDice, h("p", {}, l.limites || A().pie)));
    return out;
  }
  function dialogoAyuda(ctl, T) {
    const cerrar = h("button", { type: "button", class: "at-b", "aria-label": A().cerrar, onclick: () => ctl.ayuda(null) }, ic("close"));
    const cuerpo = h("div", { class: "at-ay-c" });
    const titulo = h("h2", { id: "at-ay-titulo" }, T.ayuda.titulo), sub = h("p", { class: "at-ay-sub" });
    const d = h("div", { class: "at-dialogo at-ayuda", role: "dialog", "aria-modal": "true", "aria-labelledby": "at-ay-titulo", hidden: true },
      h("div", { class: "at-dialogo-c" }, h("header", {}, h("div", {}, titulo, sub), cerrar), cuerpo,
        h("button", { type: "button", class: "btn btn-p at-ay-volver", onclick: () => ctl.ayuda(null) }, T.ayuda.volver)));
    d._llenar = l => { sub.textContent = l.titulo; cuerpo.replaceChildren(...contenidoAyuda(l, T)); };
    d._cerrar = cerrar;
    return d;
  }

  /* ── Páginas ──────────────────────────────────────────────── */
  function paginaLamina(l, datos, total, T, mapas, ayuda) {
    const pag = h("article", { class: "at-pag at-lam at-tipo-" + l.tipo, "data-n": l.n, "aria-label": tpl(A().laminaDe, { n: l.n, m: total }) });
    pag.append(cabLamina(l, total, T, ayuda));
    const cuerpo = h("div", { class: "at-cuerpo" }); pag.append(cuerpo);
    if (l.tipo === "mapa") {
      const mEl = h("div", { class: "at-mapa" });
      const btn = h("button", { class: "at-encuadrar", type: "button", title: A().verArea, "aria-label": A().verArea }, ic("center_focus_strong"));
      const caja = h("div", { class: "at-mapa-caja" }, mEl, btn); cuerpo.append(caja);
      const m = mapaBase(mEl, datos.aoi);
      btn.addEventListener("click", () => m.encuadrar());
      l.capas.forEach(c => { const capa = capaLeaflet(c); if (capa) capa.addTo(m.map); });
      mapas.push(m); pag._mapa = m;
      cuerpo.append(hojaDe(l, m));
    } else if (l.tipo === "grafica") {
      const conSerie = l.hallazgos.find(x => x.serie && x.serie.puntos && x.serie.puntos.length > 1);
      const g = conSerie ? UI().grafica(conSerie.serie, true) : null;
      const conTabla = !g && l.hallazgos.find(x => x.tabla && x.tabla.filas && x.tabla.filas.length);
      const izq = h("div", { class: "at-lienzo" }, g ? h("figure", {}, g, h("figcaption", {}, conSerie.serie.titulo || conSerie.titulo || "")) : (conTabla ? UI().tabla(conTabla.tabla, "at-tabla-g") : h("p", { class: "at-sindato" }, A().sinDato.replace("{motivo}", t().comunes.sinDatoServicio))));
      cuerpo.append(izq, hojaDe(l, null, { sinSerieGrande: conSerie || null }));
    } else if (l.tipo === "imagenes") {
      const mEl = h("div", { class: "at-mapa" }), img = h("img", { class: "at-img-g", alt: "" }), caja = h("div", { class: "at-mapa-caja at-img-caja" }, mEl, img);
      cuerpo.append(caja);
      const m = mapaBase(mEl, datos.aoi, { opacidad: .35 }); mapas.push(m); pag._mapa = m;
      let tileActual = null;
      const ficha = h("p", { class: "at-img-ficha" });
      const tira = h("div", { class: "at-tira", role: "list" });
      const mostrar = g => {
        tira.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b._g === g)));
        ficha.textContent = ""; ficha.append(h("b", {}, g.titulo || ""), g.sub ? " · " + g.sub : ""); if (g.aviso) ficha.append(h("em", {}, " " + g.aviso));
        if (tileActual) { m.map.removeLayer(tileActual); tileActual = null; }
        const tl = g.tile ? capaLeaflet(g.tile) : null;
        if (tl) { tileActual = tl.addTo(m.map); caja.classList.remove("at-img-sinmapa"); m.invalidar(); }
        else { caja.classList.add("at-img-sinmapa"); const u = ESP.util.urlSegura(g.url); if (u) img.src = u; img.alt = g.titulo || ""; }
      };
      l.galeria.forEach(g => {
        const u = ESP.util.urlSegura(g.url);
        const b = h("button", { type: "button", role: "listitem", "aria-pressed": "false" }, u ? h("img", { src: u, alt: g.titulo || "", loading: "lazy" }) : h("span", { class: "at-img-vacia" }), h("span", {}, g.titulo || ""));
        b._g = g; b.addEventListener("click", () => mostrar(g)); tira.append(b);
      });
      const hoja = hojaDe(l, m, { sinLeyenda: true });
      hoja.prepend(h("section", { class: "at-imgs" }, h("h3", {}, A().imagenes), tira, ficha));
      cuerpo.append(hoja);
      if (l.galeria.length) mostrar(l.galeria[0]);
    }
    pag.append(pieLamina(l));
    return pag;
  }

  function paginaPortada(datos, atlas, T, mapas, irA) {
    const total = atlas.laminas.length;
    const pag = h("article", { class: "at-pag at-portada", "data-n": 0, "aria-label": A().portada });
    const mEl = h("div", { class: "at-mapa at-situacion" });
    const areaTxt = ESP.validar.textoArea({ m2: datos.areaM2, varas2: datos.varas2, ha: datos.ha }, T);
    const esencial = h("ol", { class: "at-esencial" }, atlas.esencial.map(e => h("li", {}, h("button", { type: "button", onclick: () => irA(e.n) }, h("span", { class: "at-n" }, e.n), h("span", {}, h("b", {}, e.servicio + ". "), e.frase)))));
    atlas.errores.forEach(e => esencial.append(h("li", { class: "at-sindato" }, h("span", { class: "at-n" }, "—"), h("span", {}, h("b", {}, e.servicio + ". "), tpl(A().sinDato, { motivo: e.motivo || t().comunes.errorServicio })))));
    const indice = h("div", { class: "at-indice" }, atlas.indice.map(g => h("section", {}, h("h3", {}, g.tarjeta && T.tarjetas[g.tarjeta] ? T.tarjetas[g.tarjeta].nombre : ""),
      h("ul", {}, g.laminas.map(l => h("li", {}, h("button", { type: "button", onclick: () => irA(l.n) }, h("span", { class: "at-n" }, l.n), h("span", {}, h("b", {}, l.titulo), h("small", {}, l.servicio + " · " + A().tipos[l.tipo])))))))));
    pag.append(
      h("div", { class: "at-portada-g" },
        h("div", { class: "at-mapa-caja" }, mEl),
        h("div", { class: "at-portada-t" },
          h("p", { class: "at-sobre" }, A().subtitulo),
          h("h1", {}, A().titulo),
          h("p", { class: "at-cab-txt" }, tpl(A().cabecera, { area: areaTxt, lugar: datos.lugar ? datos.lugar + " · " : "", fecha: A().fechaDe + fechaLarga(datos.fecha), n: total })),
          h("div", { class: "at-empezar" },
            h("button", { type: "button", class: "btn btn-p btn-lg", onclick: () => irA(1) }, A().empezar, ic("arrow_forward")),
            h("p", { class: "at-pista" }, h("span", { class: "at-pista-teclado" }, A().pistaTeclado), h("span", { class: "at-pista-toque" }, A().pistaToque))),
          h("section", { class: "at-esencial-s" }, h("h2", {}, A().esencial), esencial),
          h("section", { class: "at-como" }, h("h3", {}, A().comoLeer), h("ul", {}, A().comoLeerTexto.map(x => h("li", {}, x)))))),
      h("section", { class: "at-indice-s" }, h("h2", {}, A().indice), indice),
      h("footer", { class: "at-pie-l" }, h("p", { class: "at-nodice" }, A().pie), h("p", { class: "at-editor" }, h("img", { src: "img/logo.svg", alt: "", width: 18, height: 18 }), A().editor)));
    const m = mapaBase(mEl, datos.aoi, { calles: true, fijo: true, padding: [60, 60], maxZoom: 13 });
    // Situación: el área en su entorno, no a tope
    m.encuadrar = () => { try { const b = m.contorno.getBounds(); m.map.setView(b.getCenter(), Math.min(13, m.map.getBoundsZoom(b.pad(1)) - 3)); } catch (e) { /* nada */ } }; m.encuadrar();
    mapas.push(m); pag._mapa = m;
    return pag;
  }

  function paginaContraportada(datos, atlas, T) {
    const pag = h("article", { class: "at-pag at-contra", "data-n": atlas.laminas.length + 1, "aria-label": A().contraportada });
    const cols = A().fuentesCols;
    const fuentes = atlas.fuentes.length ? UI().tabla({ columnas: cols, filas: atlas.fuentes.map(f => [f.nombre || f.id || "", f.resolucion_m != null ? f.resolucion_m + " m" : (f.detalle || ""), f.fechas || "", f.licencia || ""]) }) : h("p", { class: "at-sindato" }, "—");
    pag.append(h("header", { class: "at-cab-l" }, h("div", { class: "at-num" }, h("span", {}, A().contraportada)), h("div", { class: "at-tit" }, h("h2", {}, A().fuentes))),
      h("div", { class: "at-cuerpo at-contra-g" },
        h("section", {}, h("h3", {}, A().fuentes), fuentes),
        h("section", {}, h("h3", {}, A().limites), h("ul", { class: "at-limites" }, atlas.limites.map(x => h("li", {}, h("b", {}, x.servicio + ". "), x.texto))),
          atlas.faltantes.length ? h("div", {}, h("h3", {}, A().sinDatoTitulo), h("ul", { class: "at-limites" }, atlas.faltantes.map(x => h("li", {}, h("b", {}, x.servicio + ". "), x.bloques.join(", "))))) : null,
          atlas.errores.length ? h("div", {}, h("h3", {}, A().errores), h("ul", { class: "at-limites" }, atlas.errores.map(x => h("li", {}, h("b", {}, x.servicio + ". "), x.motivo || t().comunes.errorServicio)))) : null)),
      h("div", { class: "at-contra-acc" }, h("button", { class: "btn btn-p", type: "button", onclick: () => window.print() }, ic("print"), A().pdf), h("a", { class: "btn", href: "#/analizar" }, ic("draw"), A().nuevo), h("a", { class: "btn btn-s", href: "#/informe/" + datos.id + "/0" }, ic("menu_book"), A().volverPortada)),
      h("footer", { class: "at-pie-l" }, h("p", { class: "at-nodice" }, A().pie + " " + tpl(A().generado, { fecha: fechaLarga(new Date().toISOString()) })), h("p", { class: "at-editor" }, h("img", { src: "img/logo.svg", alt: "", width: 18, height: 18 }), A().editor)));
    return pag;
  }

  /* ── Barra de controles e índice emergente ────────────────── */
  function barra(ctl, total) {
    const b = h("nav", { class: "at-barra", "aria-label": A().titulo });
    const bPort = h("button", { type: "button", class: "at-b", title: A().portada, "aria-label": A().portada, onclick: () => ctl.irA(0) }, ic("menu_book"));
    const bAnt = h("button", { type: "button", class: "at-nav at-nav-ant", title: A().anterior, "aria-label": A().anterior, onclick: () => ctl.irA(ctl.actual - 1) }, ic("chevron_left"), h("span", { class: "at-nav-t" }, A().anteriorCorto));
    const sigT = h("span", { class: "at-nav-t" });
    const bSig = h("button", { type: "button", class: "at-nav at-nav-sig", title: A().siguiente, "aria-label": A().siguiente, onclick: () => ctl.irA(ctl.actual + 1) }, sigT, ic("chevron_right"));
    const pos = h("button", { type: "button", class: "at-pos", "aria-haspopup": "dialog", title: A().irIndice, onclick: () => ctl.indice(true) }, h("span", { class: "at-pos-t" }), ic("expand_more"));
    const puntos = h("div", { class: "at-puntos", "aria-hidden": "true" }, Array.from({ length: total + 2 }, (_, i) => h("i", { "data-i": i })));
    const bTema = ESP.tema ? ESP.tema.boton("at-b") : null;
    const bPdf = h("button", { type: "button", class: "at-b", title: A().pdf, "aria-label": A().pdf, onclick: () => window.print() }, ic("print"));
    const bNuevo = h("a", { class: "at-b", href: "#/analizar", title: A().nuevo, "aria-label": A().nuevo }, ic("draw"));
    b.append(h("div", { class: "at-barra-i" }, bPort, bAnt, pos, bSig), puntos, h("div", { class: "at-barra-d" }, bTema, bPdf, bNuevo));
    b.actualizar = n => {
      const txt = n === 0 ? A().portada : (n > total ? A().contraportada : tpl(A().laminaDe, { n, m: total }));
      pos.querySelector(".at-pos-t").textContent = txt;
      bAnt.disabled = n <= 0; bSig.disabled = n >= total + 1;
      sigT.textContent = n === 0 ? A().empezar : A().siguienteCorto;
      puntos.querySelectorAll("i").forEach(i => i.classList.toggle("on", +i.dataset.i === n));
    };
    return b;
  }
  function dialogoIndice(ctl, atlas, T) {
    const d = h("div", { class: "at-dialogo", role: "dialog", "aria-modal": "true", "aria-label": A().indice, hidden: true });
    const cerrar = h("button", { type: "button", class: "at-b", "aria-label": A().cerrar, onclick: () => ctl.indice(false) }, ic("close"));
    const lista = h("div", { class: "at-indice" },
      h("section", {}, h("ul", {}, h("li", {}, h("button", { type: "button", onclick: () => ctl.irA(0) }, h("span", { class: "at-n" }, "0"), h("span", {}, h("b", {}, A().portada)))))),
      atlas.indice.map(g => h("section", {}, h("h3", {}, g.tarjeta && T.tarjetas[g.tarjeta] ? T.tarjetas[g.tarjeta].nombre : ""), h("ul", {}, g.laminas.map(l => h("li", {}, h("button", { type: "button", onclick: () => ctl.irA(l.n) }, h("span", { class: "at-n" }, l.n), h("span", {}, h("b", {}, l.titulo), h("small", {}, l.servicio)))))))),
      h("section", {}, h("ul", {}, h("li", {}, h("button", { type: "button", onclick: () => ctl.irA(atlas.laminas.length + 1) }, h("span", { class: "at-n" }, atlas.laminas.length + 1), h("span", {}, h("b", {}, A().contraportada)))))));
    d.append(h("div", { class: "at-dialogo-c" }, h("header", {}, h("h2", {}, A().indice), cerrar), lista));
    d.addEventListener("click", e => { if (e.target === d) ctl.indice(false); });
    return d;
  }

  /* ── Vista ────────────────────────────────────────────────── */
  function vista(el, id, nInicial) {
    const T = t();
    el.innerHTML = ""; el.className = "at"; document.body.classList.add("en-atlas");
    const estado = { id, actual: null, paginas: [], mapas: [], destruido: false, enTransicion: false };
    el.append(h("p", { class: "at-cargando" }, h("span", { class: "spin" }), " ", A().cargando));
    const ctl = {
      ruta: "informe", id, get actual() { return estado.actual; },
      irA(n, opciones) {
        if (estado.destruido || !estado.paginas.length) return;
        const total = estado.paginas.length - 1; n = Math.max(0, Math.min(total, +n || 0));
        if (n === estado.actual) return;
        const o = opciones || {};
        const dir = estado.actual == null ? 0 : (n > estado.actual ? 1 : -1);
        const sale = estado.actual != null ? estado.paginas[estado.actual] : null, entra = estado.paginas[n];
        estado.actual = n; estado.barra.actualizar(n);
        if (!o.sinRuta) { const nuevo = "#/informe/" + id + "/" + n; if (location.hash !== nuevo) history.replaceState(null, "", nuevo); }
        const mostrar = () => { entra.classList.add("at-on"); entra.inert = false; if (entra._mapa) entra._mapa.invalidar(); entra.scrollTop = 0; const hoja = entra.querySelector(".at-hoja"); if (hoja) hoja.scrollTop = 0; };
        const ocultar = () => { if (sale) { sale.classList.remove("at-on"); sale.inert = true; } };
        if (!sale || dir === 0 || sinMovimiento()) { ocultar(); mostrar(); return; }
        estado.enTransicion = true;
        const piezas = Array.from(entra.querySelectorAll(".at-hoja > *, .at-portada-t > *, .at-contra-g > section"));
        gsap.timeline({ onComplete: () => { estado.enTransicion = false; gsap.set([sale, entra, piezas], { clearProps: "all" }); } })
          .to(sale, { x: -36 * dir, opacity: 0, duration: .22, ease: "power2.in", onComplete: ocultar })
          .add(() => { mostrar(); gsap.set(entra, { x: 36 * dir, opacity: 0 }); gsap.set(piezas, { y: 14, opacity: 0 }); })
          .to(entra, { x: 0, opacity: 1, duration: .3, ease: "power2.out" })
          .to(piezas, { y: 0, opacity: 1, duration: .32, ease: "power2.out", stagger: .05 }, "-=.15");
      },
      indice(abrir) { estado.dialogo.hidden = !abrir; document.body.classList.toggle("at-dialogo-abierto", !!abrir); if (abrir) { const b = estado.dialogo.querySelector("button"); if (b) b.focus(); } },
      // ayuda(l, botón) abre la pantalla completa de esa lámina; ayuda(null) la cierra y devuelve el foco al botón
      ayuda(l, origen) {
        const d = estado.ayuda; if (!d) return;
        if (l) { estado.ayudaOrigen = origen || null; d._llenar(l); d.hidden = false; d.querySelector(".at-dialogo-c").scrollTop = 0; document.body.classList.add("at-dialogo-abierto"); d._cerrar.focus(); }
        else { d.hidden = true; document.body.classList.remove("at-dialogo-abierto"); if (estado.ayudaOrigen) estado.ayudaOrigen.focus(); estado.ayudaOrigen = null; }
      },
      destruir() {
        estado.destruido = true; document.body.classList.remove("en-atlas", "at-dialogo-abierto");
        window.removeEventListener("keydown", alTeclado); window.removeEventListener("beforeprint", antesImprimir); window.removeEventListener("afterprint", despuesImprimir);
        estado.mapas.forEach(m => m.destruir());
      }
    };
    const alTeclado = e => {
      if (estado.ayuda && !estado.ayuda.hidden) { if (e.key === "Escape") ctl.ayuda(null); return; }
      if (estado.dialogo && !estado.dialogo.hidden) { if (e.key === "Escape") ctl.indice(false); return; }
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") { ctl.irA(estado.actual + 1); e.preventDefault(); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { ctl.irA(estado.actual - 1); e.preventDefault(); }
      else if (e.key === "Home") ctl.irA(0); else if (e.key === "End") ctl.irA(estado.paginas.length - 1);
    };
    const antesImprimir = () => { el.classList.add("at-imprimiendo"); estado.mapas.forEach(m => { try { m.map.invalidateSize(); m.encuadrar(); } catch (e) { /* nada */ } }); };
    const despuesImprimir = () => el.classList.remove("at-imprimiendo");

    Promise.resolve(ESP.resultados.leer(id) || ESP.resultados.cargar(id)).then(datos => {
      if (estado.destruido) return;
      el.innerHTML = "";
      if (!datos) { el.append(h("div", { class: "at-vacio" }, h("p", {}, A().noExiste), h("a", { class: "btn btn-p", href: "#/analizar" }, T.nav.analizar))); return; }
      const lecturas = leerTodo(datos, T);
      const atlas = ESP.atlasLaminas.armar(lecturas, { tarjetas: datos.tarjetas || [], catalogo: ESP.catalogo.tarjetas, tituloImagenes: A().imagenes });
      const total = atlas.laminas.length;
      const pila = h("div", { class: "at-pila" });
      estado.barra = barra(ctl, total);
      estado.dialogo = dialogoIndice(ctl, atlas, T); estado.ayuda = dialogoAyuda(ctl, T);
      el.append(estado.barra, pila, estado.dialogo, estado.ayuda);
      const portada = paginaPortada(datos, atlas, T, estado.mapas, n => ctl.irA(n));
      estado.paginas = [portada, ...atlas.laminas.map(l => paginaLamina(l, datos, total, T, estado.mapas, (lam, btn) => ctl.ayuda(lam, btn))), paginaContraportada(datos, atlas, T)];
      estado.paginas.forEach(p => { p.inert = true; pila.append(p); });
      // Deslizar en celular (fuera del mapa)
      let x0 = null, y0 = null;
      pila.addEventListener("touchstart", e => { if (e.target.closest(".at-mapa")) { x0 = null; return; } x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
      pila.addEventListener("touchend", e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) ctl.irA(estado.actual + (dx < 0 ? 1 : -1)); }, { passive: true });
      window.addEventListener("keydown", alTeclado); window.addEventListener("beforeprint", antesImprimir); window.addEventListener("afterprint", despuesImprimir);
      ctl.irA(nInicial != null && nInicial !== "" ? +nInicial : 0, { sinRuta: true });
      estado.mapas.forEach(m => m.invalidar());
      // Primera vez: la portada entra con un desvanecido corto
      if (!sinMovimiento()) gsap.from(estado.paginas[estado.actual].querySelectorAll(".at-portada-t > *, .at-indice-s, .at-hoja > *"), { y: 14, opacity: 0, duration: .4, stagger: .05, ease: "power2.out", clearProps: "all" });
    }).catch(e => { console.error(e); el.innerHTML = ""; el.append(h("p", { class: "aviso bad" }, T.comunes.errorLectura)); });
    return ctl;
  }

  return { vista, leerTodo, lecturaGenerica };
})();
ESP.vistas.informe = (el, id, n) => ESP.atlas.vista(el, id, n);
