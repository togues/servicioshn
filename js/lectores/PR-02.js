/* PR-02 Niveles y ampliaciones. Bloques: altura_por_anio (serie con altura_mediana_m, niveles, altura_omitida;
   saltos, resumen_saltos, lectura), radar_por_anio (vv_db, saltos), techos (vectores `techo` con altura_mediana_m,
   altura_p90_m, niveles_*), comparacion_con_declarado. Tile: altura_<año>. */
(function () {
  const C = ESP.lectores.comun, P = ESP.paleta;
  ESP.lectores["PR-02"] = { codigo: "PR-02", leer: C.seguro("PR-02", function (resp, ctx) {
    const TX = k => ESP.lectorBase.L("PR-02", k);
    const L = C.base("PR-02", resp, ctx), s = resp.stats || {};
    const alt = s.altura_por_anio, rad = s.radar_por_anio, te = s.techos, comp = s.comparacion_con_declarado;
    L.frase = (alt && alt.lectura) || (te && te.lectura) || "";

    if (alt) {
      const h = C.hallazgo("altura_por_anio", TX("altura_del_techo_por_ano"), alt, { escala: TX("4_m_open_buildings") });
      const serie = Array.isArray(alt.serie) ? alt.serie : [];
      const res = Array.isArray(alt.resumen_saltos) ? alt.resumen_saltos : [];
      if (res.length) h.texto = (h.texto ? h.texto + " · " : "") + res.join("; ");
      h.tabla = serie.length ? { columnas: [TX("ano"), TX("techo"), TX("altura_mediana"), TX("niveles")],
        filas: serie.map(a => [a.anio, a.con_dato ? (a.area_techo_m2 > 0 ? C.m2(a.area_techo_m2) : TX("sin_techo")) : TX("sin_imagen"),
          a.altura_mediana_m != null ? C.num(a.altura_mediana_m, 1) + TX("m") : (a.altura_omitida ? "omitida" : "—"),
          a.niveles && a.niveles.lectura ? a.niveles.lectura : "—"]) } : null;
      const omit = serie.filter(a => a.altura_omitida).map(a => a.anio + ": " + a.altura_omitida);
      if (omit.length) h.nota = (h.nota ? h.nota + " " : "") + omit.join(". ");
      const saltos = Array.isArray(alt.saltos) ? alt.saltos : [];
      if (saltos.length && !res.length) h.texto += " · " + saltos.map(x => x.entre + " " + x.tipo + (x.confirmado_por_radar ? TX("radar_confirma") : "")).join("; ");
      L.hallazgos.push(h);
    } else L.hallazgos.push(C.sinDato("altura_por_anio", TX("altura_del_techo_por_ano"), C.motivo(resp, "altura_por_anio")));

    const techos = C.features(resp, p => p.capa === "techo");
    if (te) {
      L.hallazgos.push(C.hallazgo("techos", TX("techos_por_niveles_compatibles"), te, { escala: TX("4_m") + (te.fuente || "huellas") + ")" }));
    } else L.hallazgos.push(C.sinDato("techos", TX("techos_por_niveles"), C.motivo(resp, "techos")));
    if (techos.length) {
      const presentes = [...new Set(techos.map(f => f.properties.niveles_max).filter(n => n != null).map(n => Math.min(3, Math.max(1, n))))].sort();
      const leyenda = presentes.map(n => ({ color: P.niveles[n], etiqueta: n === 3 ? TX("3_o_mas_niveles") : (n === 1 ? TX("1_nivel") : TX("hasta_2_niveles")) }));
      if (techos.some(f => f.properties.niveles_max == null)) leyenda.push({ color: P.neutro, etiqueta: TX("sin_altura") });
      L.capas.push({ id: "techos_niveles", titulo: TX("techos_por_niveles_compatibles_altura_"), tipo: "vector", geojson: C.fc(techos),
        estilo: f => ({ color: f.properties.estado === TX("cruza_el_borde") ? P.malo : P.tinta, weight: 1.2, fillColor: P.deNiveles(f.properties.niveles_max), fillOpacity: .65 }),
        leyenda,
        popup: f => C.popup([[TX("niveles"), f.properties.niveles_lectura], [TX("altura_mediana"), f.properties.altura_mediana_m != null ? C.num(f.properties.altura_mediana_m, 1) + TX("m") : null], [TX("altura_p90"), f.properties.altura_p90_m != null ? C.num(f.properties.altura_p90_m, 1) + TX("m") : null], [TX("area"), f.properties.area_m2 != null ? C.m2(f.properties.area_m2) : null], [TX("origen"), f.properties.origen_huella]]) });
    }

    if (rad) {
      const h = C.hallazgo("radar_por_anio", TX("radar_sobre_el_techo_por_ano"), rad, { escala: TX("10_m_sentinel_1") });
      const saltos = Array.isArray(rad.saltos) ? rad.saltos : [];
      h.texto = saltos.length ? saltos.map(x => x.entre + ": " + x.lectura).join("; ") : TX("sin_saltos_de_radar_entre_anos_la_estr");
      L.hallazgos.push(h);
    } else L.hallazgos.push(C.sinDato("radar_por_anio", TX("radar_sobre_el_techo"), C.motivo(resp, "radar_por_anio")));

    if (comp) {
      const partes = [];
      if (comp.niveles) partes.push(`Niveles: declarado ${comp.niveles.declarado}, observado ${comp.niveles.observado}: ${comp.niveles.resultado}`);
      if (comp.area_construida) partes.push(`Área: declarada ${C.m2(comp.area_construida.declarado_m2)}, techo observado ${C.m2(comp.area_construida.techo_observado_m2)}: ${comp.area_construida.resultado}`);
      L.hallazgos.push({ id: "comparacion", titulo: TX("comparacion_con_lo_declarado"), texto: partes.join(" · "), nota: comp.area_construida && comp.area_construida.nota ? comp.area_construida.nota : null, observado: null, escala: null, serie: null, tabla: null, sinDato: null });
    }

    const tiles = resp.tile_url || {};
    Object.keys(tiles).forEach(k => { if (tiles[k] && k.startsWith("altura_")) L.capas.push({ id: k, titulo: TX("altura_de_edificios") + k.slice(7), tipo: "tile", url: tiles[k], opacidad: .7, leyenda: [{ color: "#e0f2fe", etiqueta: TX("0_m") }, { color: "#0369a1", etiqueta: TX("6_m") }, { color: "#1e1b4b", etiqueta: TX("12_m") }] }); });
    return L;
  }) };
})();
