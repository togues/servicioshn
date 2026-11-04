/* PR-03 Traslapes. Bloques: traslapes (capas del cliente; estado sin_informacion si no vinieron), areas_protegidas
   (WDPA), rio_mas_cercano (HydroSHEDS), quebradas_relieve. Vectores: `rio_hydrosheds` (línea ±500 m),
   `area_protegida`, y las capas del cliente con properties.capa = nombre de la capa y tipo traslape/retiro. */
(function () {
  const C = ESP.lectores.comun, P = ESP.paleta;
  ESP.lectores["PR-03"] = { codigo: "PR-03", leer: C.seguro("PR-03", function (resp, ctx) {
    const TX = k => ESP.lectorBase.L("PR-03", k);
    const L = C.base("PR-03", resp, ctx), s = resp.stats || {};
    const tr = s.traslapes, ap = s.areas_protegidas, rio = s.rio_mas_cercano, qb = s.quebradas_relieve;

    // La frase: primero una capa municipal con traslape, luego el río, luego áreas protegidas
    const capasObs = tr && Array.isArray(tr.capas) ? tr.capas.filter(c => c.estado === "observado") : [];
    const conTraslape = capasObs.filter(c => (c.area_en_retiro_m2 || 0) > 0 || (c.traslape_m2 || 0) > 0 || c.toca_como_linea);
    L.frase = (conTraslape[0] && conTraslape[0].lectura) || (rio && rio.lectura) || (ap && ap.lectura) || "";

    if (tr) {
      if (tr.estado === "sin_informacion") {
        L.hallazgos.push(C.sinDato("traslapes", TX("capas_municipales"), tr.detalle || TX("sin_informacion_no_vinieron_capas_del_")));
      } else {
        const h = C.hallazgo("traslapes", TX("capas_municipales"), tr, { escala: TX("la_de_cada_capa") });
        h.texto = capasObs.length ? capasObs.map(c => c.lectura).filter(Boolean).join(" · ") : TX("sin_capas_con_geometria_legible");
        const sinInfo = (tr.capas || []).filter(c => c.estado !== "observado");
        if (sinInfo.length) h.texto += TX("sin_informacion") + sinInfo.map(c => (c.capa || "capa") + (c.detalle ? " (" + c.detalle + ")" : "")).join(", ");
        L.hallazgos.push(h);
      }
    } else L.hallazgos.push(C.sinDato("traslapes", TX("capas_municipales"), C.motivo(resp, "traslapes")));

    if (rio) L.hallazgos.push(C.hallazgo("rio", TX("rio_mas_cercano"), rio, { escala: TX("500_m_hydrosheds") }));
    else L.hallazgos.push(C.sinDato("rio", TX("rio_mas_cercano"), C.motivo(resp, "rio_mas_cercano")));
    if (qb) L.hallazgos.push(C.hallazgo("quebradas", TX("cauce_derivado_del_relieve"), qb, { escala: TX("450_m_celda_de_acumulacion"), serie: null }));
    else L.hallazgos.push(C.sinDato("quebradas", TX("cauce_derivado_del_relieve"), C.motivo(resp, "quebradas_relieve")));
    if (ap) {
      const h = C.hallazgo("areas_protegidas", TX("areas_protegidas"), ap, { escala: TX("decenas_a_cientos_de_m_wdpa") });
      const lista = Array.isArray(ap.areas_en_5km) ? ap.areas_en_5km : [];
      if (lista.length) h.tabla = { columnas: [TX("area_protegida"), TX("designacion"), TX("distancia"), TX("traslape")], filas: lista.map(a => [a.nombre, a.designacion || "", a.distancia_m != null ? C.num(a.distancia_m) + TX("m") : "", a.traslape_m2 ? C.m2(a.traslape_m2) + (a.traslape_marginal ? TX("marginal") : "") : "—"]) };
      L.hallazgos.push(h);
    } else L.hallazgos.push(C.sinDato("areas_protegidas", TX("areas_protegidas"), C.motivo(resp, "areas_protegidas")));

    // Capas al mapa
    const rioF = C.features(resp, p => p.capa === "rio_hydrosheds");
    if (rioF.length) L.capas.push({ id: "rio", titulo: TX("rio_mas_cercano_hydrosheds_500_m"), tipo: "vector", geojson: C.fc(rioF),
      estilo: () => ({ color: P.agua, weight: 3, dashArray: "8 6", fill: false }), leyenda: [{ color: P.agua, etiqueta: TX("rio_hydrosheds_ubicacion_aproximada_50") }],
      popup: f => C.popup([[TX("orden_de_rio"), f.properties.orden_rio], [TX("distancia"), f.properties.distancia_m != null ? C.num(f.properties.distancia_m) + TX("m") : null], [TX("precision"), f.properties.precision]]) });
    const apF = C.features(resp, p => p.capa === "area_protegida");
    if (apF.length) L.capas.push({ id: "areas_protegidas", titulo: TX("areas_protegidas_wdpa"), tipo: "vector", geojson: C.fc(apF),
      estilo: () => ({ color: P.vegetacion, weight: 2, fillColor: P.vegetacion, fillOpacity: .15 }), leyenda: [{ color: P.vegetacion, etiqueta: TX("area_protegida_2") }],
      popup: f => C.popup([[TX("area_protegida"), f.properties.nombre], [TX("fuente"), f.properties.fuente]]) });
    const cliente = C.features(resp, p => p.capa && p.capa !== "rio_hydrosheds" && p.capa !== "area_protegida" && (p.tipo === "traslape" || p.tipo === "retiro"));
    if (cliente.length) {
      const hayRetiro = cliente.some(f => f.properties.tipo === "retiro"), hayTraslape = cliente.some(f => f.properties.tipo === "traslape");
      const leyenda = [];
      if (hayRetiro) leyenda.push({ color: P.fuego, etiqueta: TX("dentro_del_retiro") });
      if (hayTraslape) leyenda.push({ color: P.suelo, etiqueta: TX("traslape_con_la_capa") });
      L.capas.push({ id: "capas_cliente", titulo: TX("traslapes_con_capas_municipales"), tipo: "vector", geojson: C.fc(cliente),
        estilo: f => ({ color: f.properties.tipo === "retiro" ? P.fuego : P.suelo, weight: 2, fillColor: f.properties.tipo === "retiro" ? P.fuego : P.suelo, fillOpacity: .35 }), leyenda,
        popup: f => C.popup([[TX("capa"), f.properties.capa], [TX("fuente"), f.properties.fuente], [f.properties.tipo === "retiro" ? TX("retiro") : TX("traslape"), f.properties.tipo === "retiro" && f.properties.retiro_m != null ? f.properties.retiro_m + TX("m") : null], [TX("superficie"), f.properties.m2 != null ? C.m2(f.properties.m2) : null]]) });
    }
    return L;
  }) };
})();
