/* PR-04 Coherencia del polígono. Bloques: resumen (hallazgos, lectura), dibujo (avisos, vértices, compacidad),
   huellas (detalle_cruzan con direccion_salida/m2_fuera, fuente_huellas), vecinos (traslapes, franjas o
   sin_informacion). Vectores: `huella` con relacion dentro/cruza, `vecino` con relacion traslape/franja. */
(function () {
  const C = ESP.lectores.comun, P = ESP.paleta;
  ESP.lectores["PR-04"] = { codigo: "PR-04", leer: C.seguro("PR-04", function (resp, ctx) {
    const TX = k => ESP.lectorBase.L("PR-04", k);
    const L = C.base("PR-04", resp, ctx), s = resp.stats || {};
    const res = s.resumen, dib = s.dibujo, hu = s.huellas, ve = s.vecinos;
    L.frase = (res && res.lectura) || "";

    if (res) {
      const h = C.hallazgo("resumen", TX("puntos_a_revisar"), res, { serie: null });
      const lista = Array.isArray(res.hallazgos) ? res.hallazgos : [];
      h.texto = lista.length ? lista.join(" · ") : (res.lectura || "");
      L.hallazgos.push(h);
    }
    if (dib) {
      const h = C.hallazgo("dibujo", TX("el_dibujo_del_poligono"), dib, { escala: TX("metros_proyeccion_local"), serie: null });
      h.texto = `${dib.vertices} vértices · perímetro ${C.num(dib.perimetro_m)} m · ${C.m2(dib.area_m2)}` + (dib.compacidad != null ? ` · compacidad ${C.num(dib.compacidad, 2)}` : "");
      const av = Array.isArray(dib.avisos) ? dib.avisos : [];
      if (av.length) h.tabla = { columnas: [TX("aviso"), TX("donde"), TX("sugerencia")], filas: av.map(a => [a.tipo, a.vertice != null ? TX("vertice") + a.vertice : "", a.sugerencia || ""]) };
      L.hallazgos.push(h);
    } else L.hallazgos.push(C.sinDato("dibujo", TX("el_dibujo_del_poligono"), C.motivo(resp, "dibujo")));
    if (hu) {
      const h = C.hallazgo("huellas", TX("techos_y_borde_del_area"), hu, { escala: TX("1_4_m_de_borde") + (hu.fuente_huellas || "huellas") + ")", serie: null });
      h.texto = `${hu.huellas_dentro || 0} techos dentro, ${hu.huellas_que_cruzan || 0} salen del área` + (hu.pct_aoi_construido != null ? ` · ${C.pct(hu.pct_aoi_construido)} del área construida` : "");
      const cr = Array.isArray(hu.detalle_cruzan) ? hu.detalle_cruzan : [];
      if (cr.length) h.tabla = { columnas: [TX("techo"), TX("sale_hacia"), TX("m2_fuera"), TX("sugerencia")], filas: cr.map((c, i) => [i + 1, c.direccion_salida || "", C.num(c.m2_fuera), c.sugerencia || ""]) };
      L.hallazgos.push(h);
    } else L.hallazgos.push(C.sinDato("huellas", TX("techos_y_borde_del_area"), C.motivo(resp, "huellas")));
    if (ve) {
      if (ve.estado === "sin_informacion") L.hallazgos.push(C.sinDato("vecinos", TX("predios_vecinos"), ve.detalle || TX("sin_informacion")));
      else {
        const h = C.hallazgo("vecinos", TX("predios_vecinos"), ve, { serie: null });
        const tr = Array.isArray(ve.traslapes) ? ve.traslapes : [], fr = Array.isArray(ve.franjas) ? ve.franjas : [];
        h.texto = [...tr, ...fr].map(x => x.sugerencia).filter(Boolean).join(" · ") || `${ve.vecinos_revisados || 0} vecinos revisados sin traslape ni franja`;
        L.hallazgos.push(h);
      }
    }

    const huellas = C.features(resp, p => p.capa === "huella");
    if (huellas.length) {
      const leyenda = [];
      if (huellas.some(f => f.properties.relacion === "dentro")) leyenda.push({ color: P.de("dentro"), etiqueta: TX("techo_dentro_del_area") });
      if (huellas.some(f => f.properties.relacion === "cruza")) leyenda.push({ color: P.de(TX("cruza_el_borde")), etiqueta: TX("techo_que_sale_del_area") });
      L.capas.push({ id: "huellas", titulo: TX("techos_respecto_al_borde"), tipo: "vector", geojson: C.fc(huellas),
        estilo: f => ({ color: f.properties.relacion === "cruza" ? P.de(TX("cruza_el_borde")) : P.de("dentro"), weight: 1.5, fillColor: f.properties.relacion === "cruza" ? P.de(TX("cruza_el_borde")) : P.de("dentro"), fillOpacity: .4 }), leyenda,
        popup: f => C.popup([[TX("relacion"), f.properties.relacion === "cruza" ? TX("sale_del_area") : "dentro"], [TX("sale_hacia"), f.properties.direccion_salida], [TX("m2_fuera"), f.properties.m2_fuera != null ? C.num(f.properties.m2_fuera, 1) : null], [TX("m2_dentro"), f.properties.m2_dentro != null ? C.num(f.properties.m2_dentro, 1) : (f.properties.m2 != null ? C.num(f.properties.m2, 1) : null)], [TX("fuente"), f.properties.fuente]]) });
    }
    const vecinos = C.features(resp, p => p.capa === "vecino");
    if (vecinos.length) {
      const leyenda = [];
      if (vecinos.some(f => f.properties.relacion === "traslape")) leyenda.push({ color: P.fuego, etiqueta: TX("se_monta_con_un_vecino") });
      if (vecinos.some(f => f.properties.relacion === "franja")) leyenda.push({ color: P.aviso, etiqueta: TX("franja_entre_dibujos") });
      L.capas.push({ id: "vecinos", titulo: TX("traslapes_y_franjas_con_vecinos"), tipo: "vector", geojson: C.fc(vecinos),
        estilo: f => ({ color: f.properties.relacion === "traslape" ? P.fuego : P.aviso, weight: 2, fillColor: f.properties.relacion === "traslape" ? P.fuego : P.aviso, fillOpacity: .45 }), leyenda,
        popup: f => C.popup([[TX("vecino"), f.properties.vecino], [f.properties.relacion === "traslape" ? TX("traslape") : TX("separacion"), f.properties.relacion === "traslape" ? (f.properties.m2 != null ? C.m2(f.properties.m2) : null) : (f.properties.separacion_m != null ? C.num(f.properties.separacion_m, 2) + TX("m") : null)]]) });
    }
    return L;
  }) };
})();
