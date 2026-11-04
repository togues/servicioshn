/* Componente · hoja inferior (bottom sheet) de altura libre. Independiente: no conoce la herramienta, el mapa ni las APIs;
   recibe elementos y funciones. ESP.hoja.crear({ hoja, asa, contenido, marco, activo }) → { abrir, cerrar, alternar, poner, alto, ajustar, destruir }.
     hoja      elemento que se redimensiona (también es el que se desplaza por dentro)
     asa       botón con el que se arrastra, se toca y se maneja con teclado
     contenido parte que se oculta a lectores y al foco cuando la hoja está escondida
     marco()   alto máximo disponible en px (la hoja a pantalla completa)
     activo()  false cuando la hoja no aplica (p. ej. en escritorio): el componente se aparta y limpia lo que puso
   Gesto: se agarra desde el asa o desde cualquier parte del cuerpo. Un toque sigue siendo clic (botones, campos); sostener y deslizar
   mueve la hoja, salvo que el contenido deba desplazarse: hacia arriba con la hoja a tope, o hacia abajo con el contenido ya desplazado.
   Se queda donde se suelta; cerca del asa se esconde del todo y cerca del tope se abre del todo. */
window.ESP = window.ESP || {};
ESP.hoja = (function () {
  const BORDE = 40;                 // px: a esta distancia del asa o del tope, la hoja termina de esconderse o de abrirse
  let ultima = null;                // proporción de la última altura abierta; se recuerda entre usos para volver a ella

  function crear(o) {
    const MIN = o.minimo || 56, INICIAL = o.inicial || .58;
    const marco = () => Math.max(MIN, o.marco() || 600);
    let alto = null, g = null, ultimoArrastre = 0;

    function poner(px, animar) {
      if (!o.activo()) { o.hoja.style.height = ""; o.hoja.style.transition = ""; alto = null; estado(true); return; }
      alto = Math.max(MIN, Math.min(marco(), Math.round(px)));
      o.hoja.style.transition = animar ? "" : "none";
      o.hoja.style.height = alto + "px";
      const abierta = alto > MIN + 8;
      if (abierta) ultima = alto / marco();                // proporción: sirve aunque gire la pantalla
      estado(abierta);
      if (o.alCambiar) o.alCambiar(abierta, alto);
    }
    function estado(abierta) {
      o.hoja.classList.toggle("abierta", abierta);
      o.asa.setAttribute("aria-expanded", String(abierta));
      if ("inert" in o.contenido) o.contenido.inert = !abierta;
      o.contenido.setAttribute("aria-hidden", abierta ? "false" : "true");
    }
    const porDefecto = () => marco() * (ultima || INICIAL);
    const abrir = () => poner(porDefecto(), true);
    const cerrar = () => poner(MIN, true);
    const alternar = () => (o.hoja.classList.contains("abierta") ? cerrar() : abrir());
    const ajustar = () => poner(o.activo() ? (alto == null ? porDefecto() : alto) : 0, false);

    // ── Gesto ────────────────────────────────────────────────────────────────
    function inicio(x, y, desdeAsa) { if (!o.activo()) return; g = { x, y, h: o.hoja.offsetHeight, modo: desdeAsa ? "arrastre" : null, movio: false }; }
    function mover(x, y, e, umbral) {
      if (!g) return; const dx = x - g.x, dy = y - g.y;
      if (!g.modo) {                                       // una sola decisión por gesto: mover la hoja, o dejar que el contenido se desplace
        if (Math.hypot(dx, dy) < umbral) return;
        if (Math.abs(dx) > Math.abs(dy)) g.modo = "ignorar";
        else if (dy < 0) g.modo = o.hoja.offsetHeight < marco() - 1 ? "arrastre" : "desplazar";
        else g.modo = o.hoja.scrollTop <= 0 ? "arrastre" : "desplazar";
      }
      if (g.modo !== "arrastre") return;
      if (e.cancelable) e.preventDefault();                 // sin esto el navegador lo toma como «jalar para recargar»
      if (Math.abs(dy) < 3 && !g.movio) return;            // un toque quieto es un clic, no un arrastre
      g.movio = true; ultimoArrastre = performance.now();
      poner(g.h - dy, false);
    }
    function fin() {
      if (!g) return; const fue = g.modo === "arrastre" && g.movio; g = null;
      if (!fue) return;
      ultimoArrastre = performance.now();
      const px = o.hoja.offsetHeight;
      poner(px < MIN + BORDE ? MIN : px > marco() - BORDE ? marco() : px, true);
    }
    const ts = e => inicio(e.touches[0].clientX, e.touches[0].clientY, o.asa.contains(e.target));
    const tm = e => mover(e.touches[0].clientX, e.touches[0].clientY, e, 0);   // el primer movimiento decide: después el navegador ya no deja cancelarlo
    // Ratón (pruebas y escritorio táctil): solo desde el asa; en pantallas táctiles lo hacen los eventos de toque.
    const pd = e => { if (e.pointerType !== "mouse") return; inicio(e.clientX, e.clientY, true); o.asa.setPointerCapture(e.pointerId); };
    const pm = e => { if (e.pointerType === "mouse") mover(e.clientX, e.clientY, e, 6); };
    const pu = e => { if (e.pointerType === "mouse") fin(); };
    // Lo que sigue a un arrastre no es un clic: ni el botón bajo el dedo ni el asa se activan.
    const clic = e => { if (performance.now() - ultimoArrastre < 400) { e.preventDefault(); e.stopPropagation(); } };
    const clicAsa = () => alternar();
    const tecla = e => {
      if (!o.activo()) return; const paso = Math.max(48, marco() * .1);
      const nuevo = { ArrowUp: o.hoja.offsetHeight + paso, ArrowDown: o.hoja.offsetHeight - paso, Home: MIN, End: marco() }[e.key];
      if (nuevo != null) { e.preventDefault(); poner(nuevo, true); }
    };
    o.hoja.addEventListener("touchstart", ts, { passive: true });
    o.hoja.addEventListener("touchmove", tm, { passive: false });
    o.hoja.addEventListener("touchend", fin); o.hoja.addEventListener("touchcancel", fin);
    o.asa.addEventListener("pointerdown", pd); o.asa.addEventListener("pointermove", pm);
    o.asa.addEventListener("pointerup", pu); o.asa.addEventListener("pointercancel", pu);
    o.hoja.addEventListener("click", clic, true);
    o.asa.addEventListener("click", clicAsa); o.asa.addEventListener("keydown", tecla);
    window.addEventListener("resize", ajustar);

    ajustar();
    return {
      abrir, cerrar, alternar, poner, ajustar,
      alto: () => o.hoja.offsetHeight,
      destruir() { window.removeEventListener("resize", ajustar); }
    };
  }
  return { crear };
})();
