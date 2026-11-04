/* PR-06 Imágenes por fecha. Bloque: imagenes.lista (por pedido: estado observado/sin_imagen, satelite, resolucion_m,
   escenas, pct_despejado_aoi, fecha_imagen, thumb_url, tile_url, lectura, aviso_escala, pixeles_por_lado).
   Sin vectores. Tiles: img_<pedido>. */
(function () {
  const C = ESP.lectores.comun;
  ESP.lectores["PR-06"] = { codigo: "PR-06", leer: C.seguro("PR-06", function (resp, ctx) {
    const TX = k => ESP.lectorBase.L("PR-06", k);
    const L = C.base("PR-06", resp, ctx), s = resp.stats || {};
    const im = s.imagenes, lista = im && Array.isArray(im.lista) ? im.lista : [];
    const obs = lista.filter(i => i && i.estado === "observado");
    if (!im) { L.hallazgos.push(C.sinDato("imagenes", TX("imagenes_por_fecha"), C.motivo(resp, "imagenes"))); return L; }

    L.frase = obs.length
      ? `${obs.length} de ${lista.length} fechas con imagen (${im.modo || ""})` + (obs[0] && obs[0].lectura ? ". " + obs[0].lectura : "")
      : TX("ninguna_fecha_con_imagen_despejada_sob");
    const h = C.hallazgo("imagenes", TX("imagenes_del_area_de_interes_por_fecha"), im, { escala: TX("10_m_sentinel_2_30_m_landsat") });
    h.texto = L.frase;
    h.tabla = lista.length ? { columnas: [TX("fecha_pedida"), TX("imagen"), TX("satelite"), TX("resolucion"), TX("escenas"), TX("despejado")],
      filas: lista.map(i => i.estado === "observado"
        ? [i.pedido, i.fecha_imagen || "", i.satelite || "", i.resolucion_m != null ? i.resolucion_m + TX("m") : "", i.escenas != null ? i.escenas : "", i.pct_despejado_aoi != null ? C.pct(i.pct_despejado_aoi) : ""]
        : [i.pedido, TX("sin_imagen"), i.detalle || "", "", "", ""]) } : null;
    const avisos = obs.filter(i => i.aviso_escala).map(i => i.pedido + ": " + i.aviso_escala);
    if (avisos.length) h.nota = (h.nota ? h.nota + " " : "") + avisos.join(". ");
    L.hallazgos.push(h);

    obs.forEach(i => {
      if (i.thumb_url) L.galeria.push({ titulo: i.pedido, sub: [i.satelite, i.resolucion_m != null ? i.resolucion_m + TX("m") : null, i.escenas != null ? i.escenas + TX("escena") + (i.escenas === 1 ? "" : "s") : null, i.pct_despejado_aoi != null ? C.pct(i.pct_despejado_aoi) + TX("despejado_2") : null].filter(Boolean).join(" · "), url: i.thumb_url, aviso: i.aviso_escala || null, fecha: i.fecha_imagen || null });
      if (i.tile_url) L.capas.push({ id: "img_" + i.pedido, titulo: TX("imagen_2") + i.pedido + " (" + (i.satelite || "") + ")", tipo: "tile", url: i.tile_url, opacidad: 1, leyenda: [] });
    });
    const sin = lista.filter(i => i.estado !== "observado");
    if (sin.length) L.hallazgos.push({ id: "sin_imagen", titulo: TX("fechas_sin_imagen"), texto: sin.map(i => i.pedido + (i.detalle ? " (" + i.detalle + ")" : "")).join(", "), nota: null, observado: null, escala: null, serie: null, tabla: null, sinDato: null });
    return L;
  }) };
})();
