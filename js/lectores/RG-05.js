/* RG-05 Huracanes y viento. Bloques: trayectorias (región), lluvia_y_viento_zona (zona), cambio_vegetacion_terreno (terreno).
   Vectores: trayectoria (nombre, temporada, categoria, distancia_min_km), caida_vegetacion (evento, fecha). Teselas: dndvi_<fecha>. */
window.ESP = window.ESP || {}; ESP.lectores = ESP.lectores || {};
ESP.lectores["RG-05"] = {
  codigo: "RG-05",
  leer(resp, ctx) {
    const L = k => ESP.lectorBase.L("RG-05", k);
    const B = ESP.lectorBase, P = ESP.paleta;
    try {
      if (!resp || resp.status === "error") return B.errorLectura("RG-05", resp, L("respuesta_vacia"), ctx);
      const out = B.base("RG-05", resp, ctx), s = resp.stats || {};
      const tr = s.trayectorias, lv = s.lluvia_y_viento_zona, dn = s.cambio_vegetacion_terreno;
      const conDano = dn && (dn.eventos || []).filter(e => e.estado === "observado" && (e.pct_terreno_con_caida_fuerte || 0) > 0);
      out.frase = B.limpiar((tr && tr.lectura) || (conDano && conDano.length && conDano[0].lectura) || L("sin_dato_de_ciclones_para_esta_zona"));

      const filasTr = tr && tr.eventos && tr.eventos.length ? tr.eventos.slice(0, 25).map(e => [`${e.nombre} ${e.temporada}`, B.fecha(e.fecha_aprox),
        e.aproximacion ? B.num(e.aproximacion.distancia_km) : "", e.aproximacion && e.aproximacion.viento_kt != null ? e.aproximacion.viento_kt : "",
        e.aproximacion ? e.aproximacion.categoria : "", e.viento_estimado_en_el_punto || ""]) : null;
      const filasDn = dn && dn.eventos && dn.eventos.length ? dn.eventos.map(e => [e.evento || "", B.fecha(e.fecha), e.estado === "observado" ? B.num(e.pct_terreno_con_caida_fuerte || 0, 1) : "",
        e.estado === "observado" ? (e.control_estacional || "") : (e.detalle || e.estado || "")]) : null;
      out.hallazgos = [
        B.hallazgo("trayectorias", L("ciclones_que_pasaron_cerca_ibtracs"), tr, { escala: L("linea_10_40_km_de_error"), sinDato: B.faltante(resp, "trayectorias"),
          tabla: filasTr ? { columnas: [L("ciclon"), L("fecha"), L("distancia_km"), L("viento_nudos"), L("categoria"), L("viento_estimado_en_el_punto")], filas: filasTr } : null }),
        B.hallazgo("dano", L("caida_de_vegetacion_en_el_area_tras_ca"), dn, { escala: L("10_m"), sinDato: B.faltante(resp, "cambio_vegetacion_terreno"),
          texto: conDano && conDano.length ? conDano.map(e => `${e.evento}: ${e.lectura}`).join(" ") : (dn && dn.eventos && dn.eventos.length ? L("sin_caida_de_vegetacion_atribuible_a_u") : ""),
          tabla: filasDn ? { columnas: [L("ciclon"), L("fecha"), L("del_area_con_caida"), L("control_estado")], filas: filasDn } : null }),
        B.hallazgo("lluvia_viento", L("lluvia_y_viento_de_la_zona_por_evento_"), lv, { escala: L("5_5_a_11_km"), sinDato: B.faltante(resp, "lluvia_y_viento_zona") })
      ];

      const feats = ((resp.vectors || {}).features) || [];
      const trF = feats.filter(f => f.properties.capa === "trayectoria");
      if (trF.length) {
        const cats = [...new Set(trF.map(f => f.properties.categoria || L("sin_dato")))];
        const colCat = c => /5/.test(c) ? "#7f1d1d" : /4/.test(c) ? "#b91c1c" : /3/.test(c) ? "#dc2626" : /2/.test(c) ? "#f97316" : /1/.test(c) ? "#f59e0b" : /tormenta/i.test(c) ? "#eab308" : P.neutro;
        const c = B.capaVector(resp, "trayectoria", L("trayectorias_de_ciclones"), {
          estilo: f => ({ color: colCat(f.properties.categoria || ""), weight: 2.5, opacity: .9, fill: false }),
          leyenda: cats.map(k => ({ color: colCat(k), etiqueta: k })),
          popup: f => `<b>${B.E(f.properties.nombre)} ${B.E(f.properties.temporada)}</b><br>${B.E(f.properties.categoria) || ""} · a ${B.num(f.properties.distancia_min_km)} km${f.properties.viento_kt != null ? " · " + B.E(f.properties.viento_kt) + L("nudos") : ""}` });
        if (c) out.capas.push(c);
      }
      const fechas = [...new Set(feats.filter(f => f.properties.capa === "caida_vegetacion").map(f => f.properties.fecha))].sort();
      const col = P.anios(fechas.map(f => +String(f).slice(0, 4)));
      fechas.forEach(fe => {
        const c = B.capaVector(resp, "caida_vegetacion", `Caída de vegetación ${B.fecha(fe)}`, {
          estilo: () => ({ color: col[+String(fe).slice(0, 4)] || P.vegetacion, weight: 1, fillColor: col[+String(fe).slice(0, 4)] || P.vegetacion, fillOpacity: .5 }),
          leyenda: [{ color: col[+String(fe).slice(0, 4)] || P.vegetacion, etiqueta: `Vegetación caída tras el ciclón (${B.fecha(fe)})` }],
          popup: f => `<b>${B.E(f.properties.evento) || ""}</b><br>${B.fecha(f.properties.fecha)} · ${B.E(f.properties.fuente) || ""}` });
        if (c) { c.geojson.features = c.geojson.features.filter(f => f.properties.fecha === fe); c.id = "caida_" + fe; out.capas.push(c); }
      });
      Object.keys(resp.tile_url || {}).filter(k => k.startsWith("dndvi_")).forEach(k => {
        const c = B.capaTile(resp, k, `Intensidad de la caída ${B.fecha(k.slice(6))}`, [{ color: "#fde68a", etiqueta: L("leve") }, { color: "#f59e0b", etiqueta: L("media") }, { color: "#7f1d1d", etiqueta: L("fuerte") }], .6); if (c) out.capas.push(c);
      });
      return out;
    } catch (exc) { return B.errorLectura("RG-05", resp, exc, ctx); }
  }
};
