/* Asistente de análisis · estado del flujo y condiciones de entrada. Lógica pura: no toca el DOM, el mapa ni la red,
   y por eso se prueba en Node (js/pruebas-estado.cjs). La vista de los pasos solo pinta desde este objeto; ir atrás
   nunca pierde nada porque nada vive en el DOM.

   ESP.asistente.estado.crear({ catalogo, vioBienvenida }) → objeto con:
     datos            { paso, anillo, evaluacion, terminado, tarjetas[], desde, lugar, vioBienvenida, puedeAnalizar }
     entrada(n)       true si el paso n admite entrar con lo que hay
     corregir(n)      el paso al que realmente corresponde ir al pedir el n (el primero que falta); n no entero → inicial
     ir(n)            aplica corregir(n), fija datos.paso y devuelve ese paso
     ponerDibujo(anillo, evaluacion, terminado)   el dibujo en curso o terminado (sin red ni almacenamiento)
     reabrirDibujo()  Corregir: el dibujo sigue intacto pero vuelve a ser editable (terminado = false)
     borrarDibujo()   Empezar de nuevo: único gesto que destruye trabajo
     alternarTarjeta(id) / ponerDesde(texto) / ponerLugar(texto)
     resumen()        { codigos[], servicios, tarjetas[], desde } para el paso 5 y para llamar()
     autorizarAnalisis() / consumirAnalisis()   el 6 solo se entra desde el botón «Analizar ahora»
     hayAlgoQuePerder()   Salir y beforeunload preguntan solo si esto es true
     reiniciar()      asistente limpio (Nuevo análisis desde el atlas) */
window.ESP = window.ESP || {};
ESP.asistente = ESP.asistente || {};
ESP.asistente.estado = (function () {
  const PASOS = 7;                                   // 0 bienvenida … 6 analizando
  const HITOS = [null, "area", "area", "area", "analisis", "resultado", "resultado"];   // paso → hito de la barra superior

  function crear(o) {
    const cat = o.catalogo;
    const inicial = () => ({ paso: null, anillo: [], evaluacion: { estado: "vacio" }, terminado: false, tarjetas: [], desde: "", lugar: "", puedeAnalizar: false });
    let d = { ...inicial(), vioBienvenida: !!o.vioBienvenida };

    // ── Qué hay hecho ────────────────────────────────────────────────────────
    const areaValida = () => d.terminado && (d.evaluacion.estado === "valido" || d.evaluacion.estado === "aviso");
    const hayDibujoTerminado = () => d.terminado && d.anillo.length >= 3;
    const disponibles = id => cat.apisDe([id]).filter(c => cat.disponible(c)).length > 0;
    const elegidas = () => d.tarjetas.filter(disponibles);   // una tarjeta que dejó de estar disponible no cuenta

    // ── Condiciones de entrada (se revisan siempre: botón, Atrás del navegador o enlace escrito a mano) ──
    function entrada(n) {
      if (!Number.isInteger(n) || n < 0 || n >= PASOS) return false;
      if (n <= 2) return true;
      if (n === 3) return hayDibujoTerminado();       // se revisa un dibujo terminado, aunque sea inválido: la pantalla dice qué falta
      if (n === 4) return areaValida();
      if (n === 5) return areaValida() && elegidas().length > 0;
      return areaValida() && elegidas().length > 0 && d.puedeAnalizar;   // 6
    }
    // El primer paso que falta, sin mensaje de error. Del 3 en adelante se retrocede al más alto que sí admite entrar;
    // si ninguno, al 1 (donde se busca y se empieza a dibujar). El 2 se admite tal cual, como dice la especificación.
    function corregir(n) {
      if (!Number.isInteger(n) || n < 0 || n >= PASOS) return inicialPaso();
      if (n === 0) return d.vioBienvenida ? 1 : 0;
      for (let p = n; p >= 3; p--) if (entrada(p)) return p;
      return n === 2 ? 2 : 1;
    }
    const inicialPaso = () => (d.vioBienvenida ? 1 : 0);
    function ir(n) { d.paso = corregir(n); if (d.paso !== 6) d.puedeAnalizar = false; return d.paso; }

    // ── Dibujo ───────────────────────────────────────────────────────────────
    function ponerDibujo(anillo, evaluacion, terminado) {
      d.anillo = (anillo || []).map(p => [p[0], p[1]]);
      d.evaluacion = evaluacion || { estado: "vacio" };
      d.terminado = !!terminado && d.anillo.length >= 3;
    }
    const reabrirDibujo = () => { d.terminado = false; };
    function borrarDibujo() { d.anillo = []; d.evaluacion = { estado: "vacio" }; d.terminado = false; }   // lo elegido se conserva

    // ── Elección ─────────────────────────────────────────────────────────────
    function alternarTarjeta(id) {
      if (!disponibles(id)) return false;               // «próximamente» no se elige
      const i = d.tarjetas.indexOf(id);
      if (i >= 0) d.tarjetas.splice(i, 1); else d.tarjetas.push(id);
      return i < 0;
    }
    // El campo «Cambios desde» solo cuenta si la tarjeta que usa (la de PR-05) está elegida.
    const usaDesde = () => elegidas().some(id => cat.apisDe([id]).includes("PR-05"));
    const ponerDesde = t => { d.desde = /^\d{4}-\d{2}-\d{2}$/.test(t || "") ? t : ""; };
    const ponerLugar = t => { d.lugar = String(t || "").trim(); };

    function resumen() {
      const ids = elegidas();
      const codigos = cat.apisDe(ids).filter(c => cat.disponible(c));
      return { tarjetas: ids, codigos, servicios: codigos.length, desde: usaDesde() && d.desde ? d.desde : null };
    }
    const autorizarAnalisis = () => { d.puedeAnalizar = true; };
    const consumirAnalisis = () => { const v = d.puedeAnalizar; d.puedeAnalizar = false; return v; };
    const hayAlgoQuePerder = () => d.anillo.length > 0 || d.tarjetas.length > 0;
    const reiniciar = () => { d = { ...inicial(), vioBienvenida: d.vioBienvenida }; };

    return {
      get datos() { return d; }, PASOS, hito: n => HITOS[n] || null,
      entrada, corregir, ir, ponerDibujo, reabrirDibujo, borrarDibujo, alternarTarjeta, ponerDesde, ponerLugar,
      resumen, autorizarAnalisis, consumirAnalisis, hayAlgoQuePerder, reiniciar, areaValida, elegidas,
      marcarBienvenida() { d.vioBienvenida = true; }
    };
  }
  return { crear, PASOS };
})();
