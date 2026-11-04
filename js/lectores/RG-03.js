/* RG-03 Incendios. Bloques: area_quemada_modis, focos_de_calor, cicatrices, cobertura_hoy.
   Vectores: cicatriz_quema (evento, fecha). Teselas: quema_<fecha>, area_quemada_modis. */
window.ESP = window.ESP || {}; ESP.lectores = ESP.lectores || {};
ESP.lectores["RG-03"] = {
  codigo: "RG-03",
  leer(resp, ctx) {
    const L = k => ESP.lectorBase.L("RG-03", k);
    const B = ESP.lectorBase, P = ESP.paleta;
    try {
      if (!resp || resp.status === "error") return B.errorLectura("RG-03", resp, L("respuesta_vacia"), ctx);
      const out = B.base("RG-03", resp, ctx), s = resp.stats || {};
      const mod = s.area_quemada_modis, foc = s.focos_de_calor, cic = s.cicatrices, cob = s.cobertura_hoy;
      const conCic = cic && (cic.eventos || []).filter(e => e.estado === "observado" && (e.pct_terreno_quemado || 0) > 0);
      out.frase = B.limpiar((conCic && conCic.length && cic.lectura) || (foc && foc.cantidad && foc.lectura) || (mod && mod.lectura) || (cic && cic.lectura) || L("sin_dato_de_quemas_para_esta_area"));

      const filas = cic && cic.eventos && cic.eventos.length ? cic.eventos.map(e => [e.evento || "", B.fecha(e.fecha), e.origen || "",
        e.estado === "observado" ? B.num(e.pct_terreno_quemado || 0, 1) : "", e.estado === "observado" ? B.num(e.ha_quemadas_entorno_1km || 0, 2) : "",
        e.estado === "observado" ? (e.fuego_confirmado ? L("fuego_confirmado_por_foco_o_modis") : L("cambio_sin_fuego_confirmado")) : (e.detalle || e.estado || ""),
        e.pistas ? (e.pistas.advertencia || e.pistas.lectura || "") : ""]) : null;
      out.hallazgos = [
        B.hallazgo("cicatrices", L("cicatriz_de_quema_dentro_del_area_sent"), cic, { escala: L("20_m"), sinDato: B.faltante(resp, "cicatrices"),
          tabla: filas ? { columnas: [L("evento"), L("fecha"), L("origen"), L("del_area"), L("ha_en_1_km"), L("fuego"), L("pista")], filas } : null }),
        B.hallazgo("focos", L("focos_de_calor_a_menos_de_1_km_nasa"), foc, { escala: L("375_m_a_1_km"), sinDato: B.faltante(resp, "focos_de_calor") }),
        B.hallazgo("modis", L("area_quemada_en_la_zona_modis_celdas_d"), mod, { escala: L("500_m"), sinDato: B.faltante(resp, "area_quemada_modis") }),
        B.hallazgo("cobertura", L("cobertura_del_suelo_hoy_y_que_tan_infl"), cob, { escala: L("10_m"), sinDato: B.faltante(resp, "cobertura_hoy") })
      ];

      const feats = ((resp.vectors || {}).features) || [];
      const fechas = [...new Set(feats.filter(f => f.properties.capa === "cicatriz_quema").map(f => f.properties.fecha))].sort();
      const col = P.anios(fechas.map(f => +String(f).slice(0, 4)));
      fechas.forEach(fe => {
        const c = B.capaVector(resp, "cicatriz_quema", `Quema ${B.fecha(fe)}`, {
          estilo: () => ({ color: col[+String(fe).slice(0, 4)] || P.fuego, weight: 1, fillColor: col[+String(fe).slice(0, 4)] || P.fuego, fillOpacity: .55 }),
          leyenda: [{ color: col[+String(fe).slice(0, 4)] || P.fuego, etiqueta: `Cicatriz de quema ${B.fecha(fe)}` }],
          popup: f => `<b>${B.E(f.properties.evento) || ""}</b><br>${B.fecha(f.properties.fecha)} · ${B.E(f.properties.fuente) || ""}` });
        if (c) { c.geojson.features = c.geojson.features.filter(f => f.properties.fecha === fe); c.id = "quema_" + fe; out.capas.push(c); }
      });
      Object.keys(resp.tile_url || {}).filter(k => k.startsWith("quema_")).forEach(k => {
        const c = B.capaTile(resp, k, `Intensidad de quema ${B.fecha(k.slice(6))}`, [{ color: "#fde68a", etiqueta: L("baja") }, { color: "#f59e0b", etiqueta: L("moderada") }, { color: "#7f1d1d", etiqueta: L("alta") }], .65); if (c) out.capas.push(c);
      });
      const m = B.capaTile(resp, "area_quemada_modis", L("veces_quemado_2001_hoy_modis_500_m"), [{ color: "#fde68a", etiqueta: L("1_vez") }, { color: "#ef4444", etiqueta: L("varias_veces") }, { color: "#450a0a", etiqueta: L("10_o_mas") }], .5);
      if (m) out.capas.push(m);
      return out;
    } catch (exc) { return B.errorLectura("RG-03", resp, exc, ctx); }
  }
};
