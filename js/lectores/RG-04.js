/* RG-04 Sequía. Bloques: lluvia_y_spi, canicula, calor, vegetacion_terreno, anio_atipico. Sin vectores ni teselas:
   el clima es de zona (CHIRPS 5,5 km, ERA5 11 km) y la vegetación se da como serie. */
window.ESP = window.ESP || {}; ESP.lectores = ESP.lectores || {};
ESP.lectores["RG-04"] = {
  codigo: "RG-04",
  leer(resp, ctx) {
    const L = (k, v) => ESP.lectorBase.L("RG-04", k, v);
    const B = ESP.lectorBase;
    try {
      if (!resp || resp.status === "error") return B.errorLectura("RG-04", resp, L("respuesta_vacia"), ctx);
      const out = B.base("RG-04", resp, ctx), s = resp.stats || {};
      const llu = s.lluvia_y_spi, can = s.canicula, cal = s.calor, veg = s.vegetacion_terreno, at = s.anio_atipico;
      // Si la API desplegada aún no trae `lectura`, se arma la frase con las cifras del bloque (sin inventar nada más).
      const fraseLluvia = llu && (llu.lectura || (Array.isArray(llu.anios_secos) ? L("frase_anios_secos", { n: llu.anios_secos.length, m: llu.anios_con_dato || "", peor: (llu.anios_secos.slice().sort((p, q) => p.spi6_oct - q.spi6_oct)[0] || {}).anio || "" }) : null));
      out.frase = B.limpiar(fraseLluvia || (veg && veg.lectura) || (can && can.lectura) || L("sin_dato_de_sequia_para_esta_zona"));

      const secos = llu && llu.anios_secos && llu.anios_secos.length ? { columnas: [L("ano"), L("spi_6_de_octubre"), L("categoria"), L("lluvia_mm")],
        filas: llu.anios_secos.map(x => [x.anio, B.num(x.spi6_oct, 2), x.categoria || "", B.num(x.lluvia_mm)]) } : null;
      const cani = can && can.anios_canicula_prolongada && can.anios_canicula_prolongada.length ? { columnas: [L("ano"), L("dias_secos_seguidos"), L("clase")],
        filas: can.anios_canicula_prolongada.map(x => [x.anio, x.dias, x.clase]) } : null;
      out.hallazgos = [
        B.hallazgo("lluvia", L("anos_secos_segun_la_lluvia_chirps_spi"), llu, { escala: L("5_5_km"), sinDato: B.faltante(resp, "lluvia_y_spi"), tabla: secos }),
        B.hallazgo("vegetacion", L("como_respondio_la_vegetacion_del_area_"), veg, { escala: L("30_m"), sinDato: B.faltante(resp, "vegetacion_terreno"),
          nota: veg ? [veg.nota, veg.aviso].filter(Boolean).join(" ") : null }),
        B.hallazgo("canicula", L("canicula_dias_secos_seguidos_en_julio_"), can, { escala: L("5_5_km"), sinDato: B.faltante(resp, "canicula"), tabla: cani }),
        B.hallazgo("calor", L("calor_de_julio_agosto_por_ano_era5_lan"), cal, { escala: L("11_km"), sinDato: B.faltante(resp, "calor") }),
        B.hallazgo("anio_atipico", L("ano_que_se_vio_distinto_alphaearth"), at, { escala: L("10_m"), sinDato: B.faltante(resp, "anio_atipico"),
          texto: at && at.anio_mas_atipico ? `El año que más se aparta del resto es ${at.anio_mas_atipico}. No dice por qué.` : "" })
      ];
      // La serie de vegetación trae sólo años confiables en la gráfica
      const hv = out.hallazgos[1];
      if (hv.serie && veg && veg.por_anio) hv.serie.puntos = veg.por_anio.filter(x => x.confiable !== false && x.ndvi_ago_oct != null).map(x => ({ x: x.anio, y: x.ndvi_ago_oct }));
      return out;
    } catch (exc) { return B.errorLectura("RG-04", resp, exc, ctx); }
  }
};
