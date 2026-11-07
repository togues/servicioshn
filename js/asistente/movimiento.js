/* Asistente de análisis · movimiento. Tres piezas independientes, sin librerías nuevas (solo canvas y GSAP, que ya están):
     relieve(host)          malla de relieve en facetas de la escala Prisma con partículas cuadradas (píxeles); fondo de la bienvenida.
     pixeles(mapa, anillo)  cuadrícula de «píxeles de satélite» sobre el área que se va encendiendo con el avance del análisis.
     entrar(el, opciones)   entrada suave de los hijos de una pantalla (GSAP).
   Con movimiento reducido se dibuja un cuadro fijo y no se anima nada; con la pestaña oculta el navegador detiene el bucle.
   Colores: solo los tokens (--prisma-*, --accent). ESP.asistente.movimiento.activos() cuenta los bucles vivos (para las pruebas). */
window.ESP = window.ESP || {};
ESP.asistente = ESP.asistente || {};
ESP.asistente.movimiento = (function () {
  let vivos = 0;
  const reducido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const token = (n, respaldo) => (getComputedStyle(document.documentElement).getPropertyValue(n).trim() || respaldo);
  const rgba = (hex, a) => { const h = hex.replace("#", ""), n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };

  /* Bucle con tope de cuadros por segundo; devuelve la función que lo detiene. */
  function bucle(dibujar, fps) {
    let id = 0, ultimo = 0, vivo = true; vivos++;
    const paso = t => { if (!vivo) return; id = requestAnimationFrame(paso); if (t - ultimo < 1000 / fps) return; ultimo = t; dibujar(t / 1000); };
    id = requestAnimationFrame(paso);
    return () => { if (vivo) { vivo = false; vivos--; cancelAnimationFrame(id); } };
  }
  function lienzo(host) {
    const c = document.createElement("canvas"); c.setAttribute("aria-hidden", "true"); host.append(c);
    const ctx = c.getContext("2d");
    const ajustar = () => { const d = Math.min(2, window.devicePixelRatio || 1), r = host.getBoundingClientRect(); c.width = Math.max(1, Math.round(r.width * d)); c.height = Math.max(1, Math.round(r.height * d)); c.style.width = r.width + "px"; c.style.height = r.height + "px"; ctx.setTransform(d, 0, 0, d, 0, 0); return [r.width, r.height]; };
    return { c, ctx, ajustar };
  }

  /* ── Relieve: malla triangulada que ondula despacio ─────────────────────── */
  function relieve(host) {
    const { c, ctx, ajustar } = lienzo(host);
    c.className = "as-relieve";
    const C = { l300: token("--prisma-300", "#82cbdc"), l500: token("--prisma-500", "#329fb8"), l100: token("--prisma-100", "#c5ecf2") };
    const COLS = 34, FILAS = 18, parts = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), v: .004 + Math.random() * .01, s: 2 + Math.floor(Math.random() * 3), f: Math.random() * 6 }));
    let w = 0, h = 0;
    const altura = (x, z, t) => Math.sin(x * .8 + t * .22) * .55 + Math.sin(z * 1.15 - t * .16) * .42 + Math.sin((x + z) * .5 + t * .09) * .75 + Math.max(0, 1.1 - Math.abs(x + 2.2) * .35) * 1.1;
    function pt(i, j, t) {                                      // columna i, fila j (0 = cerca de la cámara) → pantalla
      const x = (i / (COLS - 1) - .5) * 20, z = j * .85 + 2, y = altura(x, z, t);
      const e = 9 / (z + 3.2);                                    // perspectiva sencilla
      return [w * .5 + x * e * (w / 22), h * .78 - (y * 1.15 - 1.6) * e * (h / 9) + (1 - e) * h * .02, e];
    }
    function dibujar(t) {
      ctx.clearRect(0, 0, w, h);
      const P = []; for (let j = 0; j < FILAS; j++) { P[j] = []; for (let i = 0; i < COLS; i++) P[j][i] = pt(i, j, t); }
      for (let j = FILAS - 2; j >= 0; j--) {                      // de lejos a cerca: lo cercano tapa lo lejano
        const prof = 1 - j / FILAS;
        for (let i = 0; i < COLS - 1; i++) {
          const a = P[j][i], b = P[j][i + 1], d = P[j + 1][i], e = P[j + 1][i + 1];
          const luz = Math.max(0, Math.min(1, .5 + (b[1] - a[1]) * .012 + (d[1] - a[1]) * -.004));
          ctx.fillStyle = rgba(C.l500, .05 + .17 * luz * prof); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); ctx.fill();
          ctx.fillStyle = rgba(C.l500, .03 + .12 * (1 - luz) * prof); ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(e[0], e[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = rgba(C.l300, .08 + .3 * prof); ctx.lineWidth = .8;
          ctx.beginPath(); ctx.moveTo(d[0], d[1]); ctx.lineTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(d[0], d[1]); ctx.stroke();
        }
      }
      for (let j = 0; j < FILAS; j += 2) for (let i = 0; i < COLS; i += 2) { const p = P[j][i]; ctx.fillStyle = rgba(C.l100, .25 + .5 * (1 - j / FILAS)); ctx.fillRect(p[0] - 1.5, p[1] - 1.5, 3, 3); }
      parts.forEach(q => {                                       // píxeles que suben y titilan
        q.y -= q.v * .016; if (q.y < 0) { q.y = 1; q.x = Math.random(); }
        const a = .15 + .45 * Math.abs(Math.sin(t * 1.4 + q.f)); ctx.fillStyle = rgba(C.l100, a); ctx.fillRect(q.x * w, q.y * h * .8, q.s, q.s);
      });
    }
    const medir = () => { [w, h] = ajustar(); if (reducido()) dibujar(4); };
    medir(); window.addEventListener("resize", medir);
    const parar = reducido() ? () => {} : bucle(dibujar, 30);
    return { destruir() { parar(); window.removeEventListener("resize", medir); c.remove(); } };
  }

  /* ── Píxeles de satélite sobre el área ──────────────────────────────────── */
  const azar = (i, j) => { let n = (Math.imul(i, 73856093) ^ Math.imul(j, 19349663)) >>> 0; n = Math.imul(n ^ (n >>> 15), 2246822519) >>> 0; return ((n ^ (n >>> 13)) >>> 0) / 4294967296; };
  function pixeles(mp, anillo) {
    const map = mp.map, host = map.getContainer(), { c, ctx, ajustar } = lienzo(host);
    c.className = "as-pixeles";
    const L = { luz: token("--accent", "#f2a516"), frio: token("--prisma-300", "#82cbdc") };
    let w = 0, h = 0, pts = [], lado = 12, cel = [], f = 0, meta = 0, creep = 0, parar = () => {};
    const geometria = () => {
      [w, h] = ajustar(); pts = anillo.map(p => map.latLngToContainerPoint([p[1], p[0]]));
      const xs = pts.map(p => p.x), ys = pts.map(p => p.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      lado = Math.max(8, Math.round(Math.sqrt(((x1 - x0) * (y1 - y0)) / 240))); cel = [];
      const dentro = (x, y) => { let r = false; for (let i = 0, k = pts.length - 1; i < pts.length; k = i++) { if ((pts[i].y > y) !== (pts[k].y > y) && x < (pts[k].x - pts[i].x) * (y - pts[i].y) / (pts[k].y - pts[i].y) + pts[i].x) r = !r; } return r; };
      for (let j = Math.floor(y0 / lado); j * lado < y1; j++) for (let i = Math.floor(x0 / lado); i * lado < x1; i++) if (dentro(i * lado + lado / 2, j * lado + lado / 2)) cel.push({ x: i * lado, y: j * lado, r: azar(i, j) });
    };
    function dibujar(t) {
      if (!reducido()) f += (Math.max(meta, Math.min(creep, f + .0007)) - f) * .11; else f = meta;
      ctx.clearRect(0, 0, w, h);
      cel.forEach(q => {
        const encendida = Math.max(0, Math.min(1, (f - q.r) * 9));
        if (encendida > 0) { ctx.fillStyle = rgba(L.luz, .15 + .5 * encendida); ctx.fillRect(q.x + 1, q.y + 1, lado - 2, lado - 2); }
        else if (!reducido()) { const a = .1 * Math.pow(Math.sin(t * 1.8 + q.r * 40), 2); if (a > .02) { ctx.fillStyle = rgba(L.frio, a); ctx.fillRect(q.x + 1, q.y + 1, lado - 2, lado - 2); } }
        else { ctx.fillStyle = rgba(L.frio, .06); ctx.fillRect(q.x + 1, q.y + 1, lado - 2, lado - 2); }
      });
      c.dataset.encendido = String(Math.round(f * 100));
    }
    geometria(); dibujar(0);
    const regeo = () => { geometria(); dibujar(0); };
    map.on("zoomend moveend resize", regeo);
    if (!reducido()) parar = bucle(dibujar, 30);
    return {
      // frac: parte de los servicios ya terminados (0–1). El brillo avanza solo un poco más allá hasta el siguiente aviso.
      avance(frac, total) { meta = Math.max(meta, Math.min(1, frac)); creep = Math.min(1, meta + (total ? .8 / total : 0)); if (reducido()) dibujar(0); },
      destruir() { parar(); map.off("zoomend moveend resize", regeo); c.remove(); }
    };
  }

  /* ── Entrada suave de una pantalla ──────────────────────────────────────── */
  function entrar(el, o) {
    if (reducido() || !window.gsap || !el) return;
    const op = o || {}, hijos = op.hijos ? [...el.querySelectorAll(op.hijos)] : [...el.children];
    if (!hijos.length) return;
    window.gsap.fromTo(hijos, { opacity: 0, y: op.y != null ? op.y : 14, scale: op.escala || 1 }, { opacity: 1, y: 0, scale: 1, duration: op.duracion || .4, ease: "power2.out", stagger: op.escalonado != null ? op.escalonado : .05, clearProps: "opacity,transform" });
  }
  /* El contorno del área se dibuja como con un lápiz (trazo que avanza). */
  function trazar(path) {
    if (reducido() || !window.gsap || !path || !path.getTotalLength) return;
    const largo = path.getTotalLength(); path.style.strokeDasharray = largo; path.style.strokeDashoffset = largo;
    window.gsap.to(path, { strokeDashoffset: 0, duration: .9, ease: "power2.inOut", onComplete: () => { path.style.strokeDasharray = ""; path.style.strokeDashoffset = ""; } });
  }

  return { relieve, pixeles, entrar, trazar, activos: () => vivos, reducido };
})();
