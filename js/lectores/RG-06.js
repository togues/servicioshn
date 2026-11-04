/* RG-06 Sismos y volcanes. Bloques: sismos, volcanes (región), cambio_anual_terreno (terreno).
   Vectores: sismo (Point: magnitud, fecha, profundidad_km, profundidad_clase, distancia_km, url), volcan (Point: nombre,
   distancia_km, ultima_erupcion, con_erupcion_historica). Tesela: relieve. */
window.ESP = window.ESP || {}; ESP.lectores = ESP.lectores || {};
ESP.lectores["RG-06"] = {
  codigo: "RG-06",
  leer(resp, ctx) {
    const L = k => ESP.lectorBase.L("RG-06", k);
    const B = ESP.lectorBase, P = ESP.paleta;
    try {
      if (!resp || resp.status === "error") return B.errorLectura("RG-06", resp, L("respuesta_vacia"), ctx);
      const out = B.base("RG-06", resp, ctx), s = resp.stats || {};
      const sis = s.sismos, vol = s.volcanes, cam = s.cambio_anual_terreno;
      out.frase = B.limpiar((sis && sis.lectura) || (vol && vol.lectura) || L("sin_dato_de_sismos_ni_volcanes_para_es"));

      const filasS = sis && sis.sismos && sis.sismos.length ? sis.sismos.slice(0, 20).map(x => [B.fecha(x.fecha), x.magnitud != null ? B.num(x.magnitud, 1) : "", x.profundidad_km != null ? B.num(x.profundidad_km) : "",
        x.profundidad_clase || "", B.num(x.distancia_km), x.lugar || ""]) : null;
      const filasV = vol && vol.volcanes && vol.volcanes.length ? vol.volcanes.map(v => [v.nombre, v.pais || "", B.num(v.distancia_km, 1), v.rumbo || "", v.ultima_erupcion || "",
        v.linea_de_vista_desde_el_centro === true ? L("si") : (v.linea_de_vista_desde_el_centro === false ? "no" : "")]) : null;
      out.hallazgos = [
        B.hallazgo("sismos", L("sismos_registrados_cerca_usgs_desde_19"), sis, { escala: "punto", sinDato: B.faltante(resp, "sismos"),
          tabla: filasS ? { columnas: [L("fecha"), L("magnitud"), L("profundidad_km"), L("clase"), L("distancia_km"), L("lugar")], filas: filasS } : null }),
        B.hallazgo("volcanes", L("volcanes_a_menos_de_100_km"), vol, { escala: "punto", sinDato: B.faltante(resp, "volcanes"),
          tabla: filasV ? { columnas: [L("volcan"), L("pais"), L("distancia_km"), L("rumbo"), L("ultima_erupcion"), L("se_ve_desde_el_area")], filas: filasV } : null }),
        B.hallazgo("cambio", L("cambio_del_area_ano_a_ano_alphaearth"), cam, { escala: L("10_m"), sinDato: B.faltante(resp, "cambio_anual_terreno") })
      ];

      const feats = ((resp.vectors || {}).features) || [];
      const sF = feats.filter(f => f.properties.capa === "sismo");
      if (sF.length) {
        const clases = [...new Set(sF.map(f => f.properties.profundidad_clase || L("sin_dato")))];
        const colP = { superficial: "#b91c1c", intermedia: "#f59e0b", profunda: "#1d4ed8" };
        const c = B.capaVector(resp, "sismo", L("sismos_tamano_segun_magnitud_color_seg"), {
          estilo: f => ({ color: "#111", weight: 1, fillColor: colP[f.properties.profundidad_clase] || P.neutro, fillOpacity: .75 }),
          puntos: f => ({ radius: Math.max(4, 2 * ((f.properties.magnitud || 3) - 2)) }),
          leyenda: clases.map(k => ({ color: colP[k] || P.neutro, etiqueta: k === "superficial" ? L("superficial_menos_de_70_km_el_que_mas_") : k })),
          popup: f => `<b>M ${B.num(f.properties.magnitud, 1)}</b> · ${B.fecha(f.properties.fecha)}<br>${f.properties.profundidad_km != null ? B.num(f.properties.profundidad_km) + L("km_de_profundidad") : ""}a ${B.num(f.properties.distancia_km)} km<br>${B.E(f.properties.lugar) || ""}${ESP.util.urlSegura(f.properties.url) ? `<br><a href="${ESP.util.urlSegura(f.properties.url)}" target="_blank" rel="noopener">USGS</a>` : ""}` });
        if (c) out.capas.push(c);
      }
      const vF = feats.filter(f => f.properties.capa === "volcan");
      if (vF.length) {
        const c = B.capaVector(resp, "volcan", L("volcanes"), {
          estilo: f => ({ color: "#111", weight: 1, fillColor: f.properties.con_erupcion_historica ? P.fuego : P.neutro, fillOpacity: .9 }),
          puntos: () => ({ radius: 7 }),
          leyenda: [...(vF.some(f => f.properties.con_erupcion_historica) ? [{ color: P.fuego, etiqueta: L("con_erupcion_historica") }] : []), ...(vF.some(f => !f.properties.con_erupcion_historica) ? [{ color: P.neutro, etiqueta: L("sin_erupcion_historica") }] : [])],
          popup: f => `<b>${B.E(f.properties.nombre)}</b> (${B.E(f.properties.pais) || ""})<br>a ${B.num(f.properties.distancia_km, 1)} km al ${B.E(f.properties.rumbo) || ""}<br>Última erupción: ${B.E(f.properties.ultima_erupcion) || L("sin_dato")}` });
        if (c) out.capas.push(c);
      }
      const rel = B.capaTile(resp, "relieve", L("relieve_sombreado"), [], .45);
      if (rel) out.capas.push(rel);
      return out;
    } catch (exc) { return B.errorLectura("RG-06", resp, exc, ctx); }
  }
};
