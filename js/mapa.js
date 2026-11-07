/* Mapa de dibujo (Leaflet + Geoman). Expone ESP.mapa.crear(contenedor, opciones) → objeto con el polígono actual,
   dibujar/deshacer/borrar, buscador de lugar y vértice culpable. No sabe nada de las APIs. */
window.ESP = window.ESP || {};
ESP.mapa = (function () {
  const cfg = () => ESP.config.mapa;

  function bases() {
    const c = cfg();
    return {
      satelite: L.tileLayer(c.satelite, { maxZoom: 19, attribution: c.atribucionSatelite }),
      calles: L.tileLayer(c.calles, { maxZoom: 19, attribution: c.atribucionCalles, subdomains: "abcd" })
    };
  }

  /* «Mi ubicación»: centra el mapa donde está la persona. La posición se usa solo para mover el mapa en este navegador:
     no se guarda ni se envía a ningún servicio. Fuera de la región cubierta o sin permiso, el mapa se queda donde estaba. */
  function ubicacion(map, tm, cubierto) {
    let punto = null, aviso = null;
    const ir = (pos, suave) => {
      const lat = pos.coords.latitude, lon = pos.coords.longitude;
      if (ESP.validar && ESP.validar.enCobertura && !ESP.validar.enCobertura([lon, lat])) { if (!suave) mostrar(tm.ubicacionFuera || "Su ubicación está fuera de la región cubierta."); return false; }
      if (punto) map.removeLayer(punto);
      punto = L.circleMarker([lat, lon], { radius: 7, color: "#fff", weight: 2, fillColor: ESP.paleta.marca, fillOpacity: 1, interactive: false }).addTo(map);
      map.setView([lat, lon], Math.max(map.getZoom(), 16), { animate: false });
      const tapa = cubierto ? cubierto() : 0; if (tapa > 0) map.panBy([0, tapa / 2], { animate: false });   // lo que tapa la hoja inferior no cuenta como mapa visible
      return true;
    };
    const mostrar = txt => { if (!aviso) return; aviso.textContent = txt; aviso.hidden = !txt; clearTimeout(mostrar.t); if (txt) mostrar.t = setTimeout(() => { aviso.hidden = true; }, 5000); };
    const pedir = (suave, hayDibujo) => {
      if (!navigator.geolocation) { if (!suave) mostrar(tm.ubicacionNo || "Este navegador no puede dar su ubicación."); return; }
      navigator.geolocation.getCurrentPosition(pos => { if (!(suave && hayDibujo && hayDibujo())) ir(pos, suave); },
        () => { if (!suave) mostrar(tm.ubicacionNo || "No se pudo obtener su ubicación. Revise el permiso del navegador."); }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
    };
    const Ctl = L.Control.extend({
      options: { position: "topright" },
      onAdd() {
        const caja = L.DomUtil.create("div", "leaflet-bar h-ubic");
        const b = L.DomUtil.create("a", "h-ubic-b", caja); b.href = "#"; b.setAttribute("role", "button");
        b.title = b.ariaLabel = tm.miUbicacion || "Mi ubicación"; b.innerHTML = '<span class="ms" aria-hidden="true">my_location</span>';
        aviso = L.DomUtil.create("div", "h-ubic-aviso", caja); aviso.hidden = true; aviso.setAttribute("role", "status");
        L.DomEvent.disableClickPropagation(caja);
        L.DomEvent.on(b, "click", e => { L.DomEvent.preventDefault(e); pedir(false); });
        return caja;
      }
    });
    new Ctl().addTo(map);
    return { alIniciar(hayDibujo) { pedir(true, hayDibujo); }, ahora() { pedir(false); } };
  }

  /* opciones: { onCambio(coords), onTrazo(coords) mientras se dibuja punto a punto, cubierto() → px de abajo tapados por otra pieza } — coords es la lista [lon,lat] sin cerrar, o [] si no hay dibujo. */
  function crear(el, opciones) {
    const op = opciones || {};
    const c = cfg();
    const map = L.map(el, { zoomControl: false, attributionControl: true }).setView(c.centro, c.zoom);
    L.control.zoom({ position: "topright" }).addTo(map);
    const b = bases();
    b.satelite.addTo(map);
    let baseActual = "satelite";
    L.control.scale({ metric: true, imperial: false, position: "bottomleft" }).addTo(map);
    // Capas: imagen satelital y calles, ambas de Esri (sin llave). El control y la API `base()` quedan sincronizados.
    const tm = (ESP.t && ESP.t().mapa) || {};
    L.control.layers({ [tm.satelite || "Satélite"]: b.satelite, [tm.calles || "Calles"]: b.calles }, {}, { collapsed: true, position: "topright" }).addTo(map);
    map.on("baselayerchange", e => { baseActual = e.layer === b.calles ? "calles" : "satelite"; });
    const ubic = ubicacion(map, tm, op.cubierto);

    L.geoJSON(null, { style: { color: ESP.paleta.acento, weight: 3, fillOpacity: .12, fillColor: ESP.paleta.acento } }).addTo(map);
    let culpable = null;                       // marcador del vértice con problema
    let poligono = null;                       // capa Geoman activa (editable)
    let coords = [];

    if (map.pm) {
      map.pm.setLang("es");
      map.pm.setGlobalOptions({ allowSelfIntersection: true, snappable: true, snapDistance: 12, templineStyle: { color: ESP.paleta.acento }, hintlineStyle: { color: ESP.paleta.acento, dashArray: [5, 5] }, pathOptions: { color: ESP.paleta.acento, weight: 3, fillOpacity: .12 } });
    }

    function leer() {
      if (!poligono) return [];
      const g = poligono.toGeoJSON().geometry;
      const anillo = g.type === "Polygon" ? g.coordinates[0] : (g.coordinates[0] ? g.coordinates[0][0] : []);
      return ESP.validar.limpiar(anillo || []);
    }
    function avisar() { coords = leer(); if (op.onCambio) op.onCambio(coords); }

    function engancharEdicion(layer) {
      layer.on("pm:edit pm:markerdragend pm:vertexremoved pm:vertexadded pm:dragend", avisar);
    }

    map.on("pm:create", e => {
      if (poligono) { poligono.remove(); }
      poligono = e.layer;
      poligono.setStyle({ color: ESP.paleta.acento, weight: 3, fillOpacity: .12, fillColor: ESP.paleta.acento });
      engancharEdicion(poligono);
      if (map.pm) map.pm.disableDraw();
      poligono.pm.enable({ allowSelfIntersection: true });
      avisar();
    });
    // Puntos ya puestos mientras se dibuja (el polígono aún no existe): para guiar a cada toque y mostrar el área en curso.
    const enCurso = () => {
      const capa = map.pm && map.pm.Draw && map.pm.Draw.Polygon && map.pm.Draw.Polygon._layer;
      if (!capa) return [];
      const ll = capa.getLatLngs(); const fila = Array.isArray(ll[0]) ? ll[0] : ll;
      return fila.map(p => [p.lng, p.lat]);
    };
    const avisarTrazo = () => { if (op.onTrazo) op.onTrazo(api.dibujando() ? enCurso() : []); };
    map.on("pm:drawstart", e => {
      if (poligono) { poligono.remove(); poligono = null; avisar(); }
      if (e.workingLayer) e.workingLayer.on("pm:vertexadded", avisarTrazo);
      avisarTrazo();
    });
    map.on("pm:drawend", () => setTimeout(avisarTrazo, 0));

    const api = {
      map,
      // extra: opciones de Geoman. El asistente pasa { finishOn: null }: un toque dentro de la figura en curso no debe cerrarla; se cierra en el primer punto o con «Terminar».
      dibujar(extra) { if (map.pm) map.pm.enableDraw("Polygon", { finishOn: "click", continueDrawing: false, ...(extra || {}) }); },
      // Cierra el polígono en curso (el botón «Terminar»); sin tres puntos Geoman no lo cierra.
      terminar() { if (this.dibujando() && map.pm.Draw.Polygon._finishShape) map.pm.Draw.Polygon._finishShape(); },
      trazo: enCurso,
      tienePoligono() { return !!poligono; },
      ubicar() { ubic.ahora(); },
      dibujando() { return !!(map.pm && map.pm.globalDrawModeEnabled && map.pm.globalDrawModeEnabled()); },
      deshacer() {
        // Mientras se dibuja, Geoman quita el último vértice; si ya está cerrado, se quita el último punto del polígono.
        if (this.dibujando() && map.pm.Draw && map.pm.Draw.Polygon && map.pm.Draw.Polygon._removeLastVertex) { map.pm.Draw.Polygon._removeLastVertex(); avisarTrazo(); return; }
        if (!poligono) return;
        const a = leer();
        if (a.length <= 3) { this.borrar(); return; }
        a.pop();
        this.poner(a);
      },
      borrar() {
        if (poligono) { poligono.remove(); poligono = null; }
        if (map.pm && this.dibujando()) map.pm.disableDraw();
        this.marcarVertice(-1);
        avisar();
      },
      poner(anillo) {
        if (poligono) poligono.remove();
        poligono = L.polygon(anillo.map(p => [p[1], p[0]]), { color: ESP.paleta.acento, weight: 3, fillOpacity: .12, fillColor: ESP.paleta.acento }).addTo(map);
        if (poligono.pm) { engancharEdicion(poligono); poligono.pm.enable({ allowSelfIntersection: true }); }
        avisar();
        this.centrar();
      },
      // Con el polígono bloqueado (pasos de resumen y de análisis) no se pueden mover esquinas por accidente.
      editable(si) { if (poligono && poligono.pm) { if (si) poligono.pm.enable({ allowSelfIntersection: true }); else poligono.pm.disable(); } },
      coordenadas() { return coords.slice(); },
      centrar(animar) { if (poligono) map.fitBounds(poligono.getBounds(), { animate: animar !== false, paddingTopLeft: [40, 40], paddingBottomRight: [40, 40 + (op.cubierto ? op.cubierto() : 0)] }); },   // lo que tapa la hoja o el panel de abajo no cuenta como mapa visible
      marcarVertice(i) {
        if (culpable) { culpable.remove(); culpable = null; }
        if (i < 0 || !coords[i]) return;
        culpable = L.circleMarker([coords[i][1], coords[i][0]], { radius: 9, color: ESP.paleta.malo, weight: 3, fillColor: ESP.paleta.malo, fillOpacity: .5 }).addTo(map);
      },
      base(nombre) {
        if (nombre === baseActual) return;
        map.removeLayer(b[baseActual]); b[nombre].addTo(map); baseActual = nombre;
      },
      baseActual() { return baseActual; },
      irA(lat, lon, zoom) { map.setView([lat, lon], zoom || 17); },
      // Buscador: coordenadas pegadas «lat, lon» o nombre de lugar (Nominatim).
      async buscar(texto) {
        const m = /^\s*(-?\d+(?:[.,]\d+)?)\s*[,; ]\s*(-?\d+(?:[.,]\d+)?)\s*$/.exec(texto || "");
        if (m) {
          let a = parseFloat(m[1].replace(",", ".")), o = parseFloat(m[2].replace(",", "."));
          // «lat, lon» es lo esperado; si no cae en la región y el par invertido sí, se intercambia (lon, lat por error)
          const enRegion = (la, lo) => Math.abs(la) <= 90 && Math.abs(lo) <= 180 && (!ESP.validar || !ESP.validar.enCobertura || ESP.validar.enCobertura([lo, la]));
          if (!enRegion(a, o) && enRegion(o, a)) { const tmp = a; a = o; o = tmp; }
          if (!enRegion(a, o)) return { ok: false, mensaje: (ESP.t && ESP.t().herramienta.estado.coordenadasFuera) || "" };
          this.irA(a, o, 17); return { ok: true, lat: a, lon: o };
        }
        const url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(texto || "");
        try {
          const r = await fetch(url, { headers: { "Accept-Language": ESP.config.idioma || "es" } });
          const j = await r.json();
          if (!j || !j[0]) return { ok: false };
          this.irA(+j[0].lat, +j[0].lon, 16);
          return { ok: true, lat: +j[0].lat, lon: +j[0].lon, nombre: j[0].display_name };
        } catch (e) { return { ok: false, error: e }; }
      },
      // El temporizador se cancela al destruir: un invalidateSize sobre un mapa ya quitado lanza «_leaflet_pos».
      invalidar() { clearTimeout(api.temporizador); api.temporizador = setTimeout(() => map.invalidateSize(), 50); },
      destruir() { clearTimeout(api.temporizador); map.remove(); }
    };
    ubic.alIniciar(() => coords.length > 0);     // al abrir, si la persona lo permite, el mapa la lleva a donde está
    return api;
  }

  /* Mapa solo lectura para el informe: devuelve {map, agregar(capa), ajustar()} */
  function crearLectura(el, aoi) {
    const c = cfg();
    const map = L.map(el, { zoomControl: true, attributionControl: true, scrollWheelZoom: false }).setView(c.centro, c.zoom);
    const b = bases();
    b.satelite.addTo(map);
    const tm = (ESP.t && ESP.t().mapa) || {}; const grupoBase = { [tm.satelite || "Satélite"]: b.satelite, [tm.calles || "Calles"]: b.calles };
    const control = L.control.layers(grupoBase, {}, { collapsed: true, position: "topright" }).addTo(map);
    L.control.scale({ metric: true, imperial: false, position: "bottomleft" }).addTo(map);
    const contorno = L.geoJSON(aoi, { style: { color: ESP.paleta.acento, weight: 3, fill: false } }).addTo(map);
    return {
      map, control,
      agregar(titulo, capa, visible) { if (visible !== false) capa.addTo(map); control.addOverlay(capa, titulo); return capa; },
      ajustar() { try { map.fitBounds(contorno.getBounds(), { padding: [30, 30] }); } catch { /* sin aoi */ } },
      invalidar() { setTimeout(() => map.invalidateSize(), 50); },
      destruir() { map.remove(); }
    };
  }

  return { crear, crearLectura };
})();
