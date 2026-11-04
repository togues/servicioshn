/* RG-01 Inundaciones históricas. Bloques: historia_jrc, eventos_radar, exposicion, anio_atipico, barrido_radar_2015_hoy.
   Vectores: jrc_agua_episodica, s1_inundacion (evento, fecha), rio_mas_cercano. Teselas: jrc_occurrence, s1_<fecha>. */
window.ESP = window.ESP || {}; ESP.lectores = ESP.lectores || {};
ESP.lectores["RG-01"] = {
  codigo: "RG-01",
  leer(resp, ctx) {
    const L = k => ESP.lectorBase.L("RG-01", k);
    const B = ESP.lectorBase, P = ESP.paleta;
    try {
      if (!resp || resp.status === "error") return B.errorLectura("RG-01", resp, L("respuesta_vacia"), ctx);
      const out = B.base("RG-01", resp, ctx), s = resp.stats || {};
      const jrc = s.historia_jrc, ev = s.eventos_radar, ex = s.exposicion, at = s.anio_atipico, ba = s.barrido_radar_2015_hoy;

      // Frase: lo observado sobre el área (terreno) manda; la exposición es apoyo.
      const obsEv = ev && (ev.eventos || []).filter(e => e.estado === "observado" && (e.pct_terreno_inundado_max || 0) > 0);
      out.frase = B.limpiar((obsEv && obsEv.length && ev.lectura) || (ba && ba.lectura) || (jrc && jrc.lectura) || (ex && ex.lectura) || L("sin_dato_de_inundaciones_para_esta_are"));

      out.hallazgos = [
        B.hallazgo("historia_jrc", L("agua_observada_por_landsat_1984_2021"), jrc, { escala: L("30_m"), sinDato: B.faltante(resp, "historia_jrc") }),
        B.hallazgo("eventos_radar", L("tormentas_conocidas_vistas_por_radar"), ev, { escala: L("10_m"), sinDato: B.faltante(resp, "eventos_radar"),
          tabla: ev && ev.eventos && ev.eventos.length ? { columnas: [L("tormenta"), L("fecha"), L("del_area_con_agua"), L("estado")],
            filas: ev.eventos.map(e => [e.evento || e.nombre || "", B.fecha(e.pico || e.fecha_max), e.pct_terreno_inundado_max != null ? B.num(e.pct_terreno_inundado_max, 1) : "", e.estado === "observado" ? "observado" : (e.detalle || e.estado || "")]) } : null }),
        B.hallazgo("barrido", L("todas_las_pasadas_de_radar_desde_2015"), ba, { escala: L("10_m"), sinDato: B.faltante(resp, "barrido_radar_2015_hoy") || (ba && ba.estado === "sin_radar" ? ba.detalle : null) }),
        B.hallazgo("exposicion", L("cauce_mas_cercano_y_altura_sobre_el"), ex, { escala: L("500_m_cauce_30_m_relieve"), sinDato: B.faltante(resp, "exposicion") }),
        B.hallazgo("anio_atipico", L("ano_que_se_vio_distinto_alphaearth"), at, { escala: L("10_m"), sinDato: B.faltante(resp, "anio_atipico"),
          texto: at && at.anio_mas_atipico ? `El año que más se aparta del resto es ${at.anio_mas_atipico}; es una pista para mirar ese año, no una inundación.` : "" })
      ];

      // Capas
      const c1 = B.capaVector(resp, "jrc_agua_episodica", L("agua_episodica_1984_2021_landsat"), {
        estilo: () => ({ color: P.agua, weight: 1, fillColor: P.aguaSuave, fillOpacity: .45 }),
        leyenda: [{ color: P.aguaSuave, etiqueta: L("zona_que_tuvo_agua_alguna_vez_1984_202") }] });
      if (c1) { c1.hallazgos = ["historia_jrc", "anio_atipico"]; out.capas.push(c1); }
      const feats = ((resp.vectors || {}).features) || [];
      const eventos = [...new Set(feats.filter(f => f.properties.capa === "s1_inundacion").map(f => f.properties.evento))];
      const colEv = P.anios(eventos.map(e => { const m = String(e).match(/\d{4}/); return m ? +m[0] : null; }));
      eventos.forEach(e => {
        const m = String(e).match(/\d{4}/), col = m ? colEv[+m[0]] : P.agua;
        const c = B.capaVector(resp, "s1_inundacion", `Agua con ${e} (radar)`, {
          estilo: () => ({ color: col, weight: 1, fillColor: col, fillOpacity: .5 }), leyenda: [{ color: col, etiqueta: `Agua vista por radar: ${e}` }],
          popup: f => `<b>${B.E(f.properties.evento)}</b><br>${B.fecha(f.properties.fecha)} · órbita ${B.E(f.properties.orbita) || ""}` });
        if (c) { c.geojson.features = c.geojson.features.filter(f => f.properties.evento === e); c.id = "s1_" + e; c.lamina = "radar"; c.tituloLamina = L("tormentas_conocidas_vistas_por_radar"); c.hallazgos = ["eventos_radar", "barrido"]; out.capas.push(c); }
      });
      const rio = B.capaVector(resp, "rio_mas_cercano", L("cauce_mas_cercano_hydrosheds_500_m"), {
        estilo: () => ({ color: P.agua, weight: 3, dashArray: "8 6", fill: false }), leyenda: [{ color: P.agua, etiqueta: L("cauce_segun_hydrosheds_ubicacion_aprox") }],
        popup: f => `Cauce a unos ${B.num(f.properties.distancia_m)} m · ${B.E(f.properties.precision) || ""}` });
      if (rio) { rio.hallazgos = ["exposicion"]; out.capas.push(rio); }
      const occ = B.capaTile(resp, "jrc_occurrence", L("frecuencia_de_agua_1984_2021"), [{ color: "#fffcb8", etiqueta: L("agua_pocas_veces") }, { color: "#0905ff", etiqueta: L("agua_casi_siempre") }], .6);
      if (occ) out.capas.push(occ);
      Object.keys(resp.tile_url || {}).filter(k => k.startsWith("s1_")).forEach(k => {
        const c = B.capaTile(resp, k, `Agua por radar ${B.fecha(k.slice(3))}`, [{ color: "#0905ff", etiqueta: `Agua el ${B.fecha(k.slice(3))}` }], .6); if (c) out.capas.push(c);
      });
      return out;
    } catch (exc) { return B.errorLectura("RG-01", resp, exc, ctx); }
  }
};
