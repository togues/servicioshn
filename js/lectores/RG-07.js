/* RG-07 Costa. Si el área está a más de 10 km del mar, `stats.aplica` es false y solo viene distancia_al_mar + lectura.
   Bloques: distancia_al_mar, elevacion, tierra_y_agua_1984_2021, ciclones, manglar, tsunamis.
   Vectores: tsunami_runup (Point). Teselas: bajo_5_m, transicion_jrc. */
window.ESP = window.ESP || {}; ESP.lectores = ESP.lectores || {};
ESP.lectores["RG-07"] = {
  codigo: "RG-07",
  leer(resp, ctx) {
    const L = k => ESP.lectorBase.L("RG-07", k);
    const B = ESP.lectorBase, P = ESP.paleta;
    try {
      if (!resp || resp.status === "error") return B.errorLectura("RG-07", resp, L("respuesta_vacia"), ctx);
      const out = B.base("RG-07", resp, ctx), s = resp.stats || {};
      const dist = s.distancia_al_mar, el = s.elevacion, ja = s.tierra_y_agua_1984_2021, ci = s.ciclones, ma = s.manglar, ts = s.tsunamis;
      out.frase = B.limpiar(s.lectura || (el && el.lectura) || L("sin_dato_costero_para_esta_area"));

      const dTexto = dist ? (dist.distancia_m != null ? `El mar más cercano está a unos ${dist.distancia_m >= 2000 ? B.num(dist.distancia_m / 1000, 1) + L("km") : B.num(dist.distancia_m) + L("m")}${dist.lado ? L("del_lado_del") + dist.lado : ""}.` : `No hay mar a menos de ${B.num((dist.mas_de_m || 0) / 1000)} km.`) : "";
      out.hallazgos = [B.hallazgo("distancia", L("distancia_al_mar"), dist, { escala: L("30_m"), texto: dTexto, sinDato: B.faltante(resp, "distancia_al_mar") })];
      if (s.aplica === false) { out.aviso = out.aviso || s.lectura; return out; }

      const filasT = ja && ja.transiciones_franja_1km && ja.transiciones_franja_1km.length ? { columnas: [L("cambio_1984_2021_franja_de_1_km"), "ha"], filas: ja.transiciones_franja_1km.map(x => [x.clase, B.num(x.ha, 2)]) } : null;
      const filasC = ci && ci.eventos && ci.eventos.length ? { columnas: [L("ciclon"), L("fecha"), L("distancia_km"), L("viento_nudos"), L("categoria")],
        filas: ci.eventos.slice(0, 20).map(e => [`${e.nombre} ${e.temporada}`, B.fecha(e.fecha_aproximacion), B.num(e.distancia_min_km), e.viento_kt != null ? e.viento_kt : "", e.categoria || ""]) } : null;
      out.hallazgos.push(
        B.hallazgo("elevacion", L("que_tan_bajo_esta_respecto_al_mar"), el, { escala: el && el.fuente ? el.fuente : L("30_m"), sinDato: B.faltante(resp, "elevacion"), nota: el ? [el.nota, el.aviso].filter(Boolean).join(" ") : null }),
        B.hallazgo("tierra_agua", L("tierra_y_agua_1984_2021_landsat_jrc"), ja, { escala: L("30_m"), sinDato: B.faltante(resp, "tierra_y_agua_1984_2021"), tabla: filasT }),
        B.hallazgo("ciclones", L("ciclones_a_menos_de_200_km"), ci, { escala: L("linea_10_40_km_de_error"), sinDato: B.faltante(resp, "ciclones"), tabla: filasC }),
        B.hallazgo("manglar", L("manglar_en_2020"), ma, { escala: L("10_m"), sinDato: B.faltante(resp, "manglar"),
          texto: ma ? `Manglar en 2020: ${B.num(ma.manglar_2020_terreno_ha, 2)} ha dentro del área y ${B.num(ma.manglar_2020_franja_1km_ha, 2)} ha en la franja de 1 km.` : "" }),
        B.hallazgo("tsunamis", L("tsunamis_medidos_a_menos_de_300_km"), ts, { escala: "punto", sinDato: B.faltante(resp, "tsunamis"),
          texto: ts ? (ts.cantidad ? `${ts.cantidad} registro(s) de run-up de tsunami a menos de ${ts.radio_km} km.` : `Ningún run-up de tsunami en la lista a menos de ${ts.radio_km} km (la lista es mínima).`) : "" })
      );

      const feats = ((resp.vectors || {}).features) || [];
      if (feats.some(f => f.properties.capa === "tsunami_runup")) {
        const c = B.capaVector(resp, "tsunami_runup", L("run_ups_de_tsunami_medidos"), {
          estilo: () => ({ color: "#111", weight: 1, fillColor: P.agua, fillOpacity: .85 }), puntos: f => ({ radius: Math.max(5, 2 * (f.properties.runup_m || 1)) }),
          leyenda: [{ color: P.agua, etiqueta: L("altura_de_ola_medida_run_up") }],
          popup: f => `<b>${B.E(f.properties.evento) || ""}</b><br>run-up ${B.num(f.properties.runup_m, 1)} m · a ${B.num(f.properties.distancia_km)} km` });
        if (c) out.capas.push(c);
      }
      const b5 = B.capaTile(resp, "bajo_5_m", L("zonas_bajo_5_m_sobre_el_geoide"), [{ color: "#08306b", etiqueta: L("al_nivel_del_mar") }, { color: "#4292c6", etiqueta: L("2_3_m") }, { color: "#deebf7", etiqueta: L("cerca_de_5_m") }], .6);
      if (b5) out.capas.push(b5);
      const tr = B.capaTile(resp, "transicion_jrc", L("cambios_tierra_agua_1984_2021_jrc"), [{ color: "#0000ff", etiqueta: L("agua_permanente") }, { color: "#d1102d", etiqueta: L("tierra_que_paso_a_agua") }, { color: "#22b14c", etiqueta: L("agua_que_paso_a_tierra") }, { color: "#ffc90e", etiqueta: L("agua_estacional") }], .6);
      if (tr) out.capas.push(tr);
      return out;
    } catch (exc) { return B.errorLectura("RG-07", resp, exc, ctx); }
  }
};
