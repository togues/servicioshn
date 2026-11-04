/* PR-05 Vigilancia. Bloques: alertas (alertas[], cambio_general[], por_tipo, m2_con_cambio, pct_aoi_con_cambio),
   meses_comparados (meses[], meses_comparados, meses_sin_imagen), radar (orbita, pasadas). Vectores: `parche_cambio`
   con tipo, fecha_primera_imagen, confianza, m2, meses_con_cambio, persistencia_pct. Tile: primera_fecha. */
(function () {
  const C = ESP.lectores.comun, P = ESP.paleta;
  const NOMBRE_DE = TX => ({ construccion: TX("construccion"), movimiento_tierra: TX("movimiento_de_tierra"), desmonte: "desmonte", indeterminado: "indeterminado" });
  ESP.lectores["PR-05"] = { codigo: "PR-05", leer: C.seguro("PR-05", function (resp, ctx) {
    const TX = k => ESP.lectorBase.L("PR-05", k);
    const NOMBRE = NOMBRE_DE(TX);
    const L = C.base("PR-05", resp, ctx), s = resp.stats || {}, m = resp.metadata || {};
    const al = s.alertas, me = s.meses_comparados, ra = s.radar;
    const alertas = al && Array.isArray(al.alertas) ? al.alertas : [];
    const general = al && Array.isArray(al.cambio_general) ? al.cambio_general : [];
    const periodo = m.periodo ? ` entre ${m.periodo.desde} y ${m.periodo.hasta}` : "";

    if (al) {
      const porTipo = al.por_tipo || {};
      const partes = Object.keys(porTipo).filter(k => porTipo[k]).map(k => `${porTipo[k]} de ${NOMBRE[k] || k}`);
      L.frase = alertas.length
        ? `${alertas.length} parche${alertas.length > 1 ? "s" : ""} con cambio${periodo} (${C.m2(al.m2_con_cambio)}, ${C.pct(al.pct_aoi_con_cambio)} del área de interés)` + (partes.length ? ": " + partes.join(", ") : "")
        : (general.length ? general[0].lectura : `Sin parches de cambio persistente${periodo}`);
      const h = C.hallazgo("alertas", TX("parches_con_cambio"), al, {});
      h.texto = alertas.length ? alertas.slice(0, 12).map(a => `${a.fecha_primera_imagen}: ${NOMBRE[a.tipo] || a.tipo}, ${C.m2(a.m2)}, confianza ${a.confianza}, visto ${a.meses_con_cambio} meses (${a.persistencia_pct} %) · ${a.lectura}`).join(" · ") : L.frase;
      h.tabla = alertas.length ? { columnas: [TX("primer_mes"), TX("tipo"), TX("m2"), TX("del_area"), TX("confianza"), TX("meses"), TX("persistencia")],
        filas: alertas.map(a => [a.fecha_primera_imagen, NOMBRE[a.tipo] || a.tipo, C.num(a.m2) + (a.varas2 != null ? " (" + C.num(a.varas2) + " v²)" : ""), C.pct(a.pct_aoi), a.confianza, a.meses_con_cambio, a.persistencia_pct + " %"]) } : null;
      L.hallazgos.push(h);
      if (general.length) L.hallazgos.push({ id: "cambio_general", titulo: TX("cambio_general_no_es_alerta"), texto: general.map(g => `${C.pct(g.pct_aoi)} del área desde ${g.desde_mes}: ${g.lectura}`).join(" · "), nota: null, observado: null, escala: TX("10_m"), serie: null, tabla: null, sinDato: null });
    } else L.hallazgos.push(C.sinDato("alertas", TX("parches_con_cambio"), C.motivo(resp, "alertas")));

    if (me) {
      const h = C.hallazgo("meses", TX("meses_comparados"), me, { escala: TX("10_m_sentinel_2") });
      h.texto = `${me.meses_comparados || 0} meses comparados contra su misma temporada` + (me.meses_sin_imagen ? `, ${me.meses_sin_imagen} sin escena despejada` : "");
      L.hallazgos.push(h);
    } else L.hallazgos.push(C.sinDato("meses", TX("meses_comparados"), C.motivo(resp, "meses_comparados")));
    if (ra) {
      const h = C.hallazgo("radar", TX("radar"), ra, { escala: TX("10_m_sentinel_1"), serie: null });
      h.texto = `Órbita ${ra.orbita_relativa}: ${ra.escenas_antes} pasadas antes y ${ra.escenas_despues} después`;
      L.hallazgos.push(h);
    } else L.hallazgos.push(C.sinDato("radar", TX("radar"), C.motivo(resp, "radar")));

    const parches = C.features(resp, p => p.capa === "parche_cambio");
    if (parches.length) {
      const tipos = [...new Set(parches.map(f => f.properties.tipo))];
      L.capas.push({ id: "parches", titulo: TX("parches_con_cambio_por_tipo"), tipo: "vector", geojson: C.fc(parches),
        estilo: f => ({ color: P.tinta, weight: 1.5, fillColor: P.de(f.properties.tipo), fillOpacity: .6 }),
        leyenda: tipos.map(t => ({ color: P.de(t), etiqueta: NOMBRE[t] || t })),
        popup: f => C.popup([[TX("primer_mes"), f.properties.fecha_primera_imagen], [TX("tipo"), NOMBRE[f.properties.tipo] || f.properties.tipo], [TX("superficie"), f.properties.m2 != null ? C.m2(f.properties.m2) + (f.properties.varas2 != null ? " (" + C.num(f.properties.varas2) + " varas²)" : "") : null], [TX("confianza"), f.properties.confianza], [TX("meses_con_cambio"), f.properties.meses_con_cambio], [TX("persistencia"), f.properties.persistencia_pct != null ? f.properties.persistencia_pct + " %" : null], [TX("lectura"), f.properties.lectura]]) });
      const fechas = [...new Set(parches.map(f => f.properties.fecha_primera_imagen).filter(Boolean))].sort();
      if (fechas.length > 1) {
        const cols = P.secuencial(fechas.length), idx = {}; fechas.forEach((f, i) => { idx[f] = cols[i]; });
        L.capas.push({ id: "parches_fecha", titulo: TX("parches_por_primer_mes_visto"), tipo: "vector", geojson: C.fc(parches),
          estilo: f => ({ color: P.tinta, weight: 1.5, fillColor: idx[f.properties.fecha_primera_imagen] || P.neutro, fillOpacity: .6 }),
          leyenda: fechas.map(f => ({ color: idx[f], etiqueta: f })), popup: f => C.popup([[TX("primer_mes"), f.properties.fecha_primera_imagen], [TX("tipo"), NOMBRE[f.properties.tipo] || f.properties.tipo]]) });
      }
    }
    const t = resp.tile_url || {};
    if (t.primera_fecha) L.capas.push({ id: "primera_fecha", titulo: TX("primer_mes_con_cambio_raster"), tipo: "tile", url: t.primera_fecha, opacidad: .7, leyenda: [{ color: "#fde68a", etiqueta: "temprano" }, { color: "#f97316", etiqueta: "intermedio" }, { color: "#7f1d1d", etiqueta: "reciente" }] });
    return L;
  }) };
})();
