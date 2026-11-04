/* Validación del polígono en el front. El backend solo comprueba que la geometría sea válida; aquí se corrige
   antes de enviar: vértices suficientes, anillo cerrado, sin lados cruzados, sin vértices repetidos, y el tamaño
   dentro de las reglas de ESP.config.area. Devuelve también el área en m², varas² y ha. */
window.ESP = window.ESP || {};
ESP.validar = (function () {
  const R = 6378137;
  const VARA2 = 0.6987;           // m² por vara²
  const DUPLICADO_M = 0.2;

  function metros(lat0) {
    const kx = (Math.PI / 180) * R * Math.cos(lat0 * Math.PI / 180), ky = (Math.PI / 180) * R;
    return ([lon, lat]) => [lon * kx, lat * ky];
  }

  // Área geodésica aproximada: proyección equirectangular local + fórmula del zapato. Error < 0,1 % hasta 500 ha.
  function areaM2(anillo) {
    if (anillo.length < 3) return 0;
    const lat0 = anillo.reduce((s, p) => s + p[1], 0) / anillo.length;
    const m = metros(lat0);
    const pts = anillo.map(m);
    let a = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
      a += x1 * y2 - x2 * y1;
    }
    return Math.abs(a) / 2;
  }

  function seCruzan(p, q, r, s) {
    const o = (a, b, c) => Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
    const o1 = o(p, q, r), o2 = o(p, q, s), o3 = o(r, s, p), o4 = o(r, s, q);
    return o1 !== o2 && o3 !== o4 && o1 !== 0 && o2 !== 0 && o3 !== 0 && o4 !== 0;
  }

  // Devuelve el índice del primer vértice cuyo lado cruza otro no adyacente, o -1.
  function autointerseccion(anillo) {
    const n = anillo.length;
    if (n < 4) return -1;
    for (let i = 0; i < n; i++) {
      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;        // lados adyacentes por el cierre
        if (seCruzan(anillo[i], anillo[(i + 1) % n], anillo[j], anillo[(j + 1) % n])) return (i + 1) % n;
      }
    }
    return -1;
  }

  function duplicados(anillo) {
    const lat0 = anillo[0] ? anillo[0][1] : 0, m = metros(lat0);
    const pts = anillo.map(m);
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
      if (Math.hypot(x2 - x1, y2 - y1) < DUPLICADO_M) return (i + 1) % pts.length;
    }
    return -1;
  }

  function limpiar(coords) {
    // Quita el cierre si viene cerrado y vértices exactamente repetidos consecutivos.
    const a = coords.map(p => [+p[0], +p[1]]);
    if (a.length > 1 && a[0][0] === a[a.length - 1][0] && a[0][1] === a[a.length - 1][1]) a.pop();
    return a.filter((p, i) => i === 0 || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]);
  }

  function fmt(n, dec) {
    return n.toLocaleString("es-HN", { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
  }

  /* anillo: lista de [lon, lat] sin cerrar (o cerrada). Devuelve:
     { estado: 'vacio'|'invalido'|'aviso'|'valido', mensaje, vertice (índice culpable o -1), m2, varas2, ha, geojson } */
  function evaluar(coords, t) {
    const e = (t && t.herramienta && t.herramienta.estado) || {};
    const cfg = (ESP.config && ESP.config.area) || { minimoM2: 50, avisoHa: 100, maximoHa: 500 };
    const anillo = limpiar(coords || []);
    const base = { vertice: -1, m2: 0, varas2: 0, ha: 0, geojson: null, anillo };
    if (anillo.length === 0) return { ...base, estado: "vacio", mensaje: e.sinDibujo || "" };
    if (anillo.length < 3) return { ...base, estado: "invalido", mensaje: e.pocosPuntos || "" };
    for (const p of anillo) if (Math.abs(p[0]) > 180 || Math.abs(p[1]) > 90) return { ...base, estado: "invalido", mensaje: e.invalido || "" };
    const d = duplicados(anillo);
    if (d >= 0) {
      const sin = anillo.filter((_, i) => i !== d);
      return evaluar(sin, t);                       // un vértice repetido se quita en silencio
    }
    const cruce = autointerseccion(anillo);
    if (cruce >= 0) return { ...base, estado: "invalido", mensaje: e.cruzado || "", vertice: cruce };
    const m2 = areaM2(anillo), varas2 = m2 / VARA2, ha = m2 / 10000;
    const geojson = { type: "Polygon", coordinates: [[...anillo, anillo[0]]] };
    const out = { ...base, m2, varas2, ha, geojson };
    if (m2 < cfg.minimoM2) return { ...out, estado: "invalido", mensaje: e.muyChico || "" };
    if (ha > cfg.maximoHa) return { ...out, estado: "invalido", mensaje: e.muyGrande || "" };
    if (ha > cfg.avisoHa) return { ...out, estado: "aviso", mensaje: (e.grande || "").replace("{ha}", fmt(ha)) };
    return { ...out, estado: "valido", mensaje: e.valido || "" };
  }

  function textoArea(r, t) {
    const u = (t && t.herramienta && t.herramienta.estado && t.herramienta.estado.unidades) || { m2: "m²", varas2: "varas²", ha: "ha" };
    if (!r || !r.m2) return "";
    if (r.ha >= 1) return `${fmt(r.ha, 2)} ${u.ha} (${fmt(r.m2)} ${u.m2} · ${fmt(r.varas2)} ${u.varas2})`;
    return `${fmt(r.m2)} ${u.m2} (${fmt(r.varas2)} ${u.varas2})`;
  }

  // Centroide simple, para clima y para centrar el mapa.
  function centroide(anillo) {
    const n = anillo.length || 1;
    return [anillo.reduce((s, p) => s + p[0], 0) / n, anillo.reduce((s, p) => s + p[1], 0) / n];
  }

  // Cobertura razonable de los datos: Centroamérica y vecinos.
  function enCobertura([lon, lat]) { return lon > -93 && lon < -76 && lat > 6 && lat < 19; }

  return { evaluar, areaM2, textoArea, fmt, centroide, enCobertura, autointerseccion, limpiar, VARA2 };
})();
