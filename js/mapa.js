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

  /* opciones: { onCambio(coords) } — coords es la lista [lon,lat] sin cerrar, o [] si no hay dibujo. */
  function crear(el, opciones) {
    const op = opciones || {};
    const c = cfg();
    const map = L.map(el, { zoomControl: false, attributionControl: true }).setView(c.centro, c.zoom);
    L.control.zoom({ position: "topright" }).addTo(map);
    const b = bases();
    b.satelite.addTo(map);
    let baseActual = "satelite";
    L.control.scale({ metric: true, imperial: false, position: "bottomleft" }).addTo(map);

    const capa = L.geoJSON(null, { style: { color: ESP.paleta.acento, weight: 3, fillOpacity: .12, fillColor: ESP.paleta.acento } }).addTo(map);
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
    map.on("pm:drawstart", () => { if (poligono) { poligono.remove(); poligono = null; avisar(); } });

    const api = {
      map,
      dibujar() { if (map.pm) map.pm.enableDraw("Polygon", { finishOn: "click", continueDrawing: false }); },
      dibujando() { return !!(map.pm && map.pm.globalDrawModeEnabled && map.pm.globalDrawModeEnabled()); },
      deshacer() {
        // Mientras se dibuja, Geoman quita el último vértice; si ya está cerrado, se quita el último punto del polígono.
        if (this.dibujando() && map.pm.Draw && map.pm.Draw.Polygon && map.pm.Draw.Polygon._removeLastVertex) { map.pm.Draw.Polygon._removeLastVertex(); return; }
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
      coordenadas() { return coords.slice(); },
      centrar() { if (poligono) map.fitBounds(poligono.getBounds(), { padding: [40, 40] }); },
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
      invalidar() { setTimeout(() => map.invalidateSize(), 50); },
      destruir() { map.remove(); }
    };
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
      ajustar() { try { map.fitBounds(contorno.getBounds(), { padding: [30, 30] }); } catch (e) { /* sin aoi */ } },
      invalidar() { setTimeout(() => map.invalidateSize(), 50); },
      destruir() { map.remove(); }
    };
  }

  return { crear, crearLectura };
})();
