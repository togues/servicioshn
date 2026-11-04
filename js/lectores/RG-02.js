/* RG-02 Deslizamientos y pendiente. Bloques: relieve, cicatrices, anios_cambio, catalogo, sismos, lluvia.
   Vectores: cicatriz (evento, fecha). Teselas: pendiente, cicatriz_<fecha>. */
window.ESP = window.ESP || {}; ESP.lectores = ESP.lectores || {};
ESP.lectores["RG-02"] = {
  codigo: "RG-02",
  leer(resp, ctx) {
    const L = k => ESP.lectorBase.L("RG-02", k);
    const B = ESP.lectorBase, P = ESP.paleta;
    try {
      if (!resp || resp.status === "error") return B.errorLectura("RG-02", resp, L("respuesta_vacia"), ctx);
      const out = B.base("RG-02", resp, ctx), s = resp.stats || {};
      const rel = s.relieve, cic = s.cicatrices, emb = s.anios_cambio, cat = s.catalogo, sis = s.sismos, llu = s.lluvia;
      const conCic = cic && (cic.eventos || []).filter(e => e.estado === "observado" && ((e.pct_terreno_con_cicatriz || 0) > 0 || (e.ha_cicatriz_en_entorno_250m || 0) > 0));
      out.frase = B.limpiar((conCic && conCic.length && cic.lectura) || (rel && rel.lectura) || (cic && cic.lectura) || L("sin_dato_de_relieve_ni_de_cicatrices_p"));

      const filasCic = cic && cic.eventos && cic.eventos.length ? cic.eventos.map(e => [e.evento || "", B.fecha(e.fecha || e.pico), e.origen || "",
        e.estado === "observado" ? B.num(e.pct_terreno_con_cicatriz || 0, 1) : "", e.estado === "observado" ? B.num(e.ha_cicatriz_en_entorno_250m || 0, 2) : "",
        e.pista || (e.estado !== "observado" ? (e.detalle || e.estado || "") : L("sin_cicatriz"))]) : null;
      out.hallazgos = [
        B.hallazgo("relieve", L("pendiente_del_area_y_de_la_ladera_de_a"), rel, { escala: L("30_m"), sinDato: B.faltante(resp, "relieve") }),
        B.hallazgo("cicatrices", L("cicatrices_en_las_fechas_revisadas"), cic, { escala: L("10_m"), sinDato: B.faltante(resp, "cicatrices"),
          tabla: filasCic ? { columnas: [L("fecha_revisada"), L("fecha"), L("origen"), L("del_area"), L("ha_en_250_m"), L("pista")], filas: filasCic } : null }),
        B.hallazgo("lluvia", L("lluvias_extremas_registradas_chirps"), llu, { escala: L("5_5_km"), sinDato: B.faltante(resp, "lluvia") }),
        B.hallazgo("anios_cambio", L("anos_en_que_la_ladera_cambio_de_aspect"), emb, { escala: L("10_m"), sinDato: B.faltante(resp, "anios_cambio") }),
        B.hallazgo("catalogo", L("deslizamientos_registrados_a_10_km_nas"), cat, { escala: "punto", sinDato: B.faltante(resp, "catalogo") }),
        B.hallazgo("sismos", L("sismos_cercanos_usgs"), sis, { escala: "punto", sinDato: B.faltante(resp, "sismos") })
      ];

      const feats = ((resp.vectors || {}).features) || [];
      const fechas = [...new Set(feats.filter(f => f.properties.capa === "cicatriz").map(f => f.properties.fecha))].sort();
      const col = P.anios(fechas.map(f => +String(f).slice(0, 4)));
      fechas.forEach(fe => {
        const c = B.capaVector(resp, "cicatriz", `Cicatriz ${B.fecha(fe)}`, {
          estilo: () => ({ color: col[+String(fe).slice(0, 4)] || P.suelo, weight: 1, fillColor: col[+String(fe).slice(0, 4)] || P.suelo, fillOpacity: .55 }),
          leyenda: [{ color: col[+String(fe).slice(0, 4)] || P.suelo, etiqueta: `Cicatriz vista el ${B.fecha(fe)}` }],
          popup: f => `<b>${B.E(f.properties.evento) || ""}</b><br>${B.fecha(f.properties.fecha)} · ${B.E(f.properties.fuente) || ""}` });
        if (c) { c.geojson.features = c.geojson.features.filter(f => f.properties.fecha === fe); c.id = "cicatriz_" + fe; out.capas.push(c); }
      });
      const pend = B.capaTile(resp, "pendiente", L("pendiente_grados"), [{ color: "#fde68a", etiqueta: L("suave_10") }, { color: "#f59e0b", etiqueta: L("media_10_25") }, { color: "#b91c1c", etiqueta: L("fuerte_35") }], .55);
      if (pend) out.capas.push(pend);
      Object.keys(resp.tile_url || {}).filter(k => k.startsWith("cicatriz_")).forEach(k => {
        const c = B.capaTile(resp, k, `Cicatriz fuerte ${B.fecha(k.slice(9))}`, [{ color: "#c97b4f", etiqueta: L("suelo_expuesto_en_ladera") }], .6); if (c) out.capas.push(c);
      });
      return out;
    } catch (exc) { return B.errorLectura("RG-02", resp, exc, ctx); }
  }
};
