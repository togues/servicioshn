/* Almacén de resultados (ESP.resultados): memoria → IndexedDB → sessionStorage de respaldo.
   Un resultado completo (13 respuestas con vectores y teselas) pasa fácilmente de 5 MB, que es el tope de
   sessionStorage; IndexedDB no tiene ese tope y sobrevive al cierre de la pestaña, así que el atlas se puede
   reabrir. Se guardan los últimos 20; el resto se borra solo. Nada sale del navegador: solo la geometría
   dibujada y lo que las APIs devolvieron. Sin datos personales. */
window.ESP = window.ESP || {};
ESP.resultados = (function () {
  const mem = {}; const MAX = 20; const BD = "espacialhn-atlas", TABLA = "resultados";
  const clave = id => "esp-informe-" + id;
  let bdP = null;
  function bd() {
    if (bdP) return bdP;
    bdP = new Promise(res => {
      try {
        if (!window.indexedDB) return res(null);
        const req = indexedDB.open(BD, 1);
        req.onupgradeneeded = () => { const d = req.result; if (!d.objectStoreNames.contains(TABLA)) d.createObjectStore(TABLA, { keyPath: "id" }).createIndex("fecha", "fecha"); };
        req.onsuccess = () => res(req.result);
        req.onerror = () => res(null); req.onblocked = () => res(null);
      } catch { res(null); }
    });
    return bdP;
  }
  const tx = (d, modo, fn) => new Promise(res => { try { const t = d.transaction(TABLA, modo); const r = fn(t.objectStore(TABLA)); t.oncomplete = () => res(r && "result" in r ? r.result : true); t.onerror = () => res(null); t.onabort = () => res(null); } catch { res(null); } });
  async function podar(d) {
    const todos = await tx(d, "readonly", s => s.getAll());
    if (!Array.isArray(todos) || todos.length <= MAX) return;
    const sobran = todos.sort((a, b) => String(a.fecha).localeCompare(String(b.fecha))).slice(0, todos.length - MAX);
    await tx(d, "readwrite", s => { sobran.forEach(x => s.delete(x.id)); return null; });
  }
  return {
    guardar(id, datos) {
      mem[id] = datos;
      bd().then(d => { if (!d) { try { sessionStorage.setItem(clave(id), JSON.stringify(datos)); } catch { /* sin sitio */ } return; } tx(d, "readwrite", s => s.put(datos)).then(() => podar(d)); });
    },
    // Lectura inmediata: solo lo que ya está en memoria (o en sessionStorage). Para IndexedDB use cargar().
    leer(id) {
      if (mem[id]) return mem[id];
      try { const s = sessionStorage.getItem(clave(id)); if (s) { mem[id] = JSON.parse(s); return mem[id]; } } catch { /* nada */ }
      return null;
    },
    async cargar(id) {
      const r = this.leer(id); if (r) return r;
      const d = await bd(); if (!d) return null;
      const x = await tx(d, "readonly", s => s.get(id));
      if (x && x.id) mem[id] = x;
      return x && x.id ? x : null;
    },
    // Lista corta (sin respuestas) para «mis atlas», del más reciente al más antiguo
    async lista() {
      const d = await bd(); if (!d) return Object.values(mem).map(resumen);
      const todos = await tx(d, "readonly", s => s.getAll());
      return (Array.isArray(todos) ? todos : []).map(resumen).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
    },
    async borrar(id) { delete mem[id]; const d = await bd(); if (d) await tx(d, "readwrite", s => s.delete(id)); try { sessionStorage.removeItem(clave(id)); } catch { /* nada */ } },
    nuevoId() { return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3); }
  };
  function resumen(x) { return { id: x.id, fecha: x.fecha, areaM2: x.areaM2, codigos: x.codigos || [], tarjetas: x.tarjetas || [] }; }
})();
