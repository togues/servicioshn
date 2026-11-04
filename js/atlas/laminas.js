/* Atlas · láminas. Lógica pura, sin DOM: toma las lecturas que devuelven los lectores y las reparte en láminas.
   Una lámina responde una pregunta con UNA capa protagonista (o un grupo de capas hermanas: la misma cicatriz
   en varias fechas). Los textos siguen saliendo de los lectores; aquí solo se ordenan.

   Reglas de reparto, por lectura:
   · Las capas vectoriales se agrupan por `capa.lamina` o, si no lo declaran, por su id sin el último tramo con
     dígitos (cicatriz_2020-11-18 y cicatriz_2021-10-02 → una lámina «cicatriz»). Cada grupo es una lámina.
   · Los rásteres (teselas) van apagados como capas secundarias de la primera lámina; si la lectura no trae
     vectores, cada tesela con leyenda es su propia lámina (pendiente, zonas bajo 5 m).
   · Los hallazgos (bloques de texto, series, tablas) se asignan a la lámina que los reclama en `capa.hallazgos`;
     si nadie los reclama, por coincidencia de palabras con el título de la lámina; lo que sobra queda en la
     primera lámina de la lectura, junto con la frase.
   · Una lectura sin capas pero con hallazgos da una lámina de gráfica (clima, sequía).
   · Una lectura con galería da además una lámina de imágenes por fecha.
   · Las lecturas con error no dan lámina: se listan en la portada y la contraportada.

   Se puede cargar en Node para probar: module.exports = ESP.atlasLaminas. */
(function (raiz) {
  const ESP = raiz.ESP = raiz.ESP || {};

  const STOP = new Set(["de", "del", "la", "el", "los", "las", "y", "o", "en", "por", "con", "a", "al", "un", "una", "que", "se", "sobre", "segun", "según", "hoy", "m", "km", "2"]);
  const palabras = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ ]+/g, " ").split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
  const grupoDe = c => c.lamina || String(c.id || "").replace(/_[^_]*\d[^_]*$/, "");
  const prefijoComun = titulos => {
    const ws = titulos.map(t => String(t || "").split(/\s+/)); let n = 0;
    while (ws.every(w => w[n] && w[n] === ws[0][n])) n++;
    const p = ws[0].slice(0, n).join(" ").replace(/[\s:·,-]+$/, "");
    return p.length >= 4 ? p : titulos[0];
  };
  const unirLeyenda = capas => { const vistos = new Set(), out = []; capas.forEach(c => (c.leyenda || []).forEach(it => { const k = it.color + "|" + it.etiqueta; if (!vistos.has(k)) { vistos.add(k); out.push(it); } })); return out; };

  function laminasDeLectura(lec, tarjeta, ctx) {
    const vectores = (lec.capas || []).filter(c => c.tipo === "vector" && c.geojson && c.geojson.features && c.geojson.features.length);
    const teselas = (lec.capas || []).filter(c => c.tipo === "tile" && c.url);
    const base = () => ({ codigo: lec.codigo, servicio: lec.titulo, tarjeta, estado: lec.estado, frase: "", hallazgos: [], capas: [], secundarias: [], leyenda: [], galeria: [], ayuda: "", fuentes: lec.fuentes || [], limites: lec.limites || "", aviso: null, primera: false });
    const out = [];

    // 1 · grupos de vectores
    const grupos = []; const idx = {};
    vectores.forEach(c => { const g = grupoDe(c); if (idx[g] == null) { idx[g] = grupos.length; grupos.push({ clave: g, capas: [] }); } grupos[idx[g]].capas.push(c); });
    grupos.forEach(g => {
      const l = base(); l.tipo = "mapa"; l.capas = g.capas; l.leyenda = unirLeyenda(g.capas); l.ayuda = lec.codigo + "." + g.clave;
      l.titulo = g.capas.length === 1 ? g.capas[0].titulo : (g.capas[0].tituloLamina || prefijoComun(g.capas.map(c => c.titulo)));
      l.reclama = [].concat(...g.capas.map(c => c.hallazgos || []));
      out.push(l);
    });
    // 2 · teselas: secundarias de la primera lámina, o láminas propias si no hay vectores
    if (out.length) out[0].secundarias = teselas;
    else teselas.filter(c => c.leyenda && c.leyenda.length).forEach(c => { const l = base(); l.tipo = "mapa"; l.capas = [c]; l.leyenda = c.leyenda; l.titulo = c.titulo; l.ayuda = lec.codigo + "." + c.id; l.reclama = c.hallazgos || []; out.push(l); });
    // 3 · sin mapa
    if (!out.length && !(lec.galeria && lec.galeria.length) && (lec.hallazgos || []).some(h => !h.sinDato)) { const l = base(); l.tipo = "grafica"; l.titulo = lec.titulo; l.reclama = []; l.ayuda = lec.codigo + ".grafica"; out.push(l); }

    // 4 · hallazgos → láminas
    const hs = lec.hallazgos || [], tomados = new Set();
    const explicitos = out.some(l => l.reclama && l.reclama.length);
    out.forEach(l => { (l.reclama || []).forEach(id => { const h = hs.find(x => x.id === id); if (h && !tomados.has(h)) { l.hallazgos.push(h); tomados.add(h); } }); });
    if (!explicitos && out.length > 1) {
      hs.forEach(h => {
        if (tomados.has(h)) return;
        const pw = new Set(palabras(h.titulo)); let mejor = null, max = 0;
        out.forEach(l => { const n = palabras(l.titulo).filter(w => pw.has(w)).length; if (n > max) { max = n; mejor = l; } });
        if (mejor && max >= 1) { mejor.hallazgos.push(h); tomados.add(h); }
      });
    }
    if (out.length) { hs.forEach(h => { if (!tomados.has(h)) out[0].hallazgos.push(h); }); out[0].frase = lec.frase || ""; out[0].aviso = lec.aviso || null; out[0].primera = true; }
    // Las láminas secundarias sin texto propio toman como frase el texto de su primer hallazgo
    out.forEach(l => { if (!l.frase && l.hallazgos.length && l.hallazgos[0].texto) l.frase = l.hallazgos[0].texto; });

    // 5 · imágenes por fecha
    if (lec.galeria && lec.galeria.length) {
      const l = base(); l.tipo = "imagenes"; l.ayuda = lec.codigo + ".imagenes"; l.titulo = lec.tituloGaleria || (ctx && ctx.tituloImagenes) || "Imágenes por fecha"; l.galeria = lec.galeria.map(g => ({ ...g, tile: teselas.find(c => c.id === "img_" + g.titulo) || null }));
      if (!out.length) { l.frase = lec.frase || ""; l.hallazgos = hs.slice(); l.primera = true; l.aviso = lec.aviso || null; }
      out.push(l);
    }
    out.forEach(l => delete l.reclama);
    return out;
  }

  /* lecturas: salida de los lectores en el orden de datos.codigos. ctx: { tarjetas: ids elegidos, catalogo } */
  function armar(lecturas, ctx) {
    const cat = (ctx && ctx.catalogo) || [], elegidas = (ctx && ctx.tarjetas) || [];
    const tarjetaDe = codigo => { const t = cat.find(x => elegidas.includes(x.id) && x.apis.includes(codigo)) || cat.find(x => x.apis.includes(codigo)); return t ? t.id : null; };
    const laminas = [], errores = [];
    lecturas.forEach(lec => {
      if (!lec || lec.estado === "error") { if (lec) errores.push({ codigo: lec.codigo, servicio: lec.titulo, motivo: lec.motivo || lec.frase || "" }); return; }
      laminasDeLectura(lec, tarjetaDe(lec.codigo), ctx).forEach(l => { l.n = laminas.length + 1; laminas.push(l); });
    });
    // Lo esencial: una frase por lectura, con la lámina donde empieza
    const esencial = laminas.filter(l => l.primera && l.frase).map(l => ({ n: l.n, codigo: l.codigo, servicio: l.servicio, frase: l.frase }));
    // Índice agrupado por tarjeta, en el orden del catálogo
    const indice = []; const porT = {};
    laminas.forEach(l => { const k = l.tarjeta || "_"; if (!porT[k]) { porT[k] = { tarjeta: l.tarjeta, laminas: [] }; indice.push(porT[k]); } porT[k].laminas.push(l); });
    // Fuentes sin repetir (por nombre) y límites por servicio
    const fuentes = []; const vistas = new Set();
    lecturas.forEach(lec => (lec && lec.fuentes || []).forEach(f => { const k = (f.nombre || f.id || "").toLowerCase(); if (k && !vistas.has(k)) { vistas.add(k); fuentes.push(f); } }));
    const limites = lecturas.filter(l => l && l.estado !== "error" && l.limites).map(l => ({ codigo: l.codigo, servicio: l.titulo, texto: l.limites }));
    const faltantes = lecturas.filter(l => l && l.estado !== "error" && l.faltantes && l.faltantes.length).map(l => ({ codigo: l.codigo, servicio: l.titulo, bloques: l.faltantes.map(f => f.bloque).filter(Boolean) }));
    return { laminas, esencial, indice, errores, fuentes, limites, faltantes };
  }

  ESP.atlasLaminas = { armar, laminasDeLectura, _grupoDe: grupoDe };
  if (typeof module !== "undefined" && module.exports) module.exports = ESP.atlasLaminas;
})(typeof window !== "undefined" ? window : globalThis);
