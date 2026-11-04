/* PR-01 Línea de tiempo de la construcción. Bloques: por_casa (serie anual, aparicion_por_anio, cambios, lectura),
   huellas_hoy (vectores `huella` con anio_aparicion, altura_2023_m, niveles_*), cambio_de_aspecto (AlphaEarth),
   por_manzana (GHSL + verdor Landsat), miniaturas.por_anio. Tiles: presencia_<año>, altura_<año>. */
(function () {
  const C = ESP.lectores.comun, P = ESP.paleta;
  ESP.lectores["PR-01"] = { codigo: "PR-01", leer: C.seguro("PR-01", function (resp, ctx) {
    const TX = k => ESP.lectorBase.L("PR-01", k);
    const L = C.base("PR-01", resp, ctx), s = resp.stats || {};
    const casa = s.por_casa, hu = s.huellas_hoy, asp = s.cambio_de_aspecto, man = s.por_manzana, mini = s.miniaturas;

    // Frase: la lectura por casa manda; si falta, la de huellas
    L.frase = (casa && casa.lectura) || (hu && hu.lectura) || "";

    // Hallazgo 1: techo nuevo por año (la serie que importa para fechar)
    if (casa) {
      const ap = Array.isArray(casa.aparicion_por_anio) ? casa.aparicion_por_anio : [];
      const h = C.hallazgo("por_casa", TX("techo_nuevo_por_ano"), casa, { escala: TX("4_m_open_buildings") });
      if (ap.length) h.serie = { titulo: TX("techo_que_aparece_por_primera_vez_cada"), unidad: TX("m2"), x: "anio", y: "m2_techo_nuevo",
        puntos: ap.map(a => ({ x: a.anio, y: a.m2_techo_nuevo, etiqueta: String(a.anio) + (a.nota ? " · " + a.nota : "") })) };
      const cambios = Array.isArray(casa.cambios) ? casa.cambios : [];
      if (cambios.length) h.tabla = { columnas: [TX("entre"), TX("cambio"), TX("m2"), TX("persistente"), TX("coincide_con_alphaearth")],
        filas: cambios.map(c => [c.entre, c.tipo, C.num(c.diferencia_m2), c.persistente === false ? TX("no_parpadeo") : TX("si"), c.coincide_con_cambio_de_aspecto ? TX("si") : "no"]) };
      L.hallazgos.push(h);
      // Hallazgo 2: área techada total por año
      const h2 = C.hallazgo("area_techada", TX("area_techada_total_por_ano"), casa, { escala: TX("4_m_open_buildings"), nota: null });
      h2.texto = casa.techo_ultimo_anio ? `En ${casa.techo_ultimo_anio.anio}: ${C.m2(casa.techo_ultimo_anio.area_m2)} de techo (${C.pct(casa.techo_ultimo_anio.pct_aoi || casa.techo_ultimo_anio.pct_lote || 0)} del área de interés)` + (casa.techo_ultimo_anio.altura_mediana_m != null ? `, altura mediana ${C.num(casa.techo_ultimo_anio.altura_mediana_m, 1)} m` : "") : "";
      if (casa.pixeles_efectivos_aoi != null && casa.pixeles_efectivos_aoi < 100) h2.texto += ` · El área equivale a unos ${casa.pixeles_efectivos_aoi} píxeles efectivos de 4 m`;
      L.hallazgos.push(h2);
    } else L.hallazgos.push(C.sinDato("por_casa", TX("techo_nuevo_por_ano"), C.motivo(resp, "por_casa")));

    // Hallazgo 3: huellas por año de aparición + coropleta
    const huellas = C.features(resp, p => p.capa === "huella");
    if (hu) {
      const h = C.hallazgo("huellas_hoy", TX("huellas_de_edificio_y_ano_de_aparicion"), hu, { escala: TX("4_m") + (hu.fuente || "huellas") + ")" });
      h.texto = hu.lectura || "";
      if (hu.huellas_que_cruzan_borde) h.texto += ` · ${hu.huellas_que_cruzan_borde} cruzan el borde del área de interés`;
      if (hu.pct_aoi_construido != null) h.texto += ` · ${C.pct(hu.pct_aoi_construido)} del área construida`;
      L.hallazgos.push(h);
    } else L.hallazgos.push(C.sinDato("huellas_hoy", TX("huellas_de_edificio"), C.motivo(resp, "huellas_hoy")));
    if (huellas.length) {
      const anios = huellas.map(f => f.properties.anio_aparicion).filter(a => a != null);
      const colores = P.anios(anios);
      const leyenda = Object.keys(colores).sort().map(a => ({ color: colores[a], etiqueta: String(a) === "2016" ? TX("en_o_antes_de_2016") : String(a) }));
      if (huellas.some(f => f.properties.anio_aparicion == null)) leyenda.push({ color: P.neutro, etiqueta: TX("sin_fecha") });
      L.capas.push({ id: "huellas_anio", titulo: TX("techos_por_ano_de_aparicion"), tipo: "vector", geojson: C.fc(huellas), hallazgos: ["por_casa", "area_techada", "huellas_hoy", "cambio_de_aspecto", "por_manzana"],
        estilo: f => ({ color: f.properties.estado === TX("cruza_el_borde") ? P.malo : P.tinta, weight: 1.2, fillColor: f.properties.anio_aparicion != null ? colores[f.properties.anio_aparicion] : P.neutro, fillOpacity: .65 }),
        leyenda,
        popup: f => C.popup([[TX("aparece"), f.properties.anio_aparicion_lectura], [TX("altura_2023"), f.properties.altura_2023_m != null ? C.num(f.properties.altura_2023_m, 1) + TX("m") : null], [TX("niveles"), f.properties.niveles_lectura], [TX("area"), f.properties.area_m2 != null ? C.m2(f.properties.area_m2) : null], [TX("origen"), f.properties.origen_huella], [TX("estado"), f.properties.estado]]) });
      // Los techos por niveles los dibuja PR-02 (misma huella y misma altura de 2023); repetirlos aquí daba dos láminas iguales.
    }

    // Hallazgo 4: cambio de aspecto (AlphaEarth)
    if (asp) {
      const marc = Array.isArray(asp.anios_con_cambio_de_aspecto) ? asp.anios_con_cambio_de_aspecto : [];
      const h = C.hallazgo("cambio_de_aspecto", TX("cambio_de_aspecto_entre_anos_alphaeart"), asp, { escala: TX("10_m") });
      h.texto = marc.length ? TX("cambio_de_aspecto_marcado_entre") + marc.join(", ") : TX("ningun_par_de_anos_con_cambio_de_aspec");
      L.hallazgos.push(h);
    } else L.hallazgos.push(C.sinDato("cambio_de_aspecto", TX("cambio_de_aspecto_alphaearth"), C.motivo(resp, "cambio_de_aspecto")));

    // Hallazgo 5: por manzana, antes de 2016
    if (man) {
      const h = C.hallazgo("por_manzana", TX("antes_de_2016_por_manzana"), man, { escala: TX("100_m_ghsl_30_m_landsat") });
      const ep = Array.isArray(man.ghsl_por_epoca) ? man.ghsl_por_epoca : [];
      if (ep.length) h.tabla = { columnas: [TX("epoca"), TX("construido_en_100_m")], filas: ep.map(e => [e.epoca, C.pct(e.pct_construido_entorno)]) };
      L.hallazgos.push(h);
    } else L.hallazgos.push(C.sinDato("por_manzana", TX("antes_de_2016_por_manzana"), C.motivo(resp, "por_manzana")));

    // Tiles del último año
    const tiles = resp.tile_url || {};
    Object.keys(tiles).forEach(k => {
      if (!tiles[k]) return;
      if (k.startsWith("presencia_")) L.capas.push({ id: k, titulo: TX("probabilidad_de_edificio") + k.slice(10), tipo: "tile", url: tiles[k], opacidad: .7, leyenda: [{ color: "#fde68a", etiqueta: "probable" }, { color: "#b91c1c", etiqueta: TX("muy_probable") }] });
      if (k.startsWith("altura_")) L.capas.push({ id: k, titulo: TX("altura_de_edificios") + k.slice(7), tipo: "tile", url: tiles[k], opacidad: .7, leyenda: [{ color: "#e0f2fe", etiqueta: TX("0_m") }, { color: "#0369a1", etiqueta: TX("6_m") }, { color: "#1e1b4b", etiqueta: TX("12_m") }] });
    });

    // Galería: miniaturas de probabilidad de edificio por año
    const por = mini && Array.isArray(mini.por_anio) ? mini.por_anio : [];
    // Sin título propio saldría «Imágenes por fecha», igual que la galería satelital de PR-06, aunque no son lo mismo.
    if (por.length) L.tituloGaleria = TX("presencia_de_edificios_por_ano");
    por.filter(m => m && m.url).forEach(m => L.galeria.push({ titulo: String(m.anio), sub: (m.capa || TX("presencia_de_edificios")) + TX("open_buildings"), url: m.url }));
    return L;
  }) };
})();
