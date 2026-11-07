/* Pruebas del asistente de análisis (ASISTENTE.md): el flujo feliz hasta el atlas y cada caso de «Cómo se verifica».
   Sin red (ver pruebas-comun.cjs).  node js/pruebas-asistente.cjs  (desde la carpeta front, con NODE_PATH a playwright@1.59.1)
   Deja capturas de cada paso a 1500 y 400 px, claro y oscuro, en capturas/asistente-<paso>-<ancho>-<tema>.png. */
const { chromium } = require("playwright");
const C = require("./pruebas-comun.cjs");
const fallas = [], quiero = (c, m) => { if (!c) fallas.push(m); };
const igual = (a, b, m) => quiero(JSON.stringify(a) === JSON.stringify(b), `${m}: esperaba ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);
const sinDesborde = async (p, w, m) => quiero(!(await p.evaluate(w => document.documentElement.scrollWidth > w + 1, w)), m + ": desborde horizontal");
const foto = (p, n, w, tema) => p.screenshot({ path: `capturas/asistente-${n}-${w}-${tema}.png` });

(async () => {
  const b = await chromium.launch();

  // ── 1 · Flujo feliz completo hasta el atlas, con capturas a 1500 y 400 px, claro y oscuro ──────────
  for (const [w, h, tema] of [[1500, 900, "light"], [400, 800, "light"], [1500, 900, "dark"], [400, 800, "dark"]]) {
    const id = `${w}-${tema}`, { p, errs } = await C.abrir(b, { w, h, tema, vioBienvenida: false, latencia: 1500 });
    await p.goto(C.URL + "#/analizar"); await p.waitForTimeout(500);
    igual(await C.hash(p), "#/analizar/0", id + ": primera visita abre la bienvenida");
    await foto(p, 0, w, tema); await sinDesborde(p, w, id + " paso 0");
    await p.click(".as-empezar"); await p.waitForTimeout(400);
    igual(await C.hash(p), "#/analizar/1", id + ": Empezar lleva al paso 1");
    quiero(await p.$(".as-mapa .leaflet-control-layers"), id + ": falta el control de capas (satélite / calles)");
    quiero(await p.$(".as-mapa .mapa-ubic-b"), id + ": falta el botón Mi ubicación");
    await p.fill(".as-buscar", "Tatumbla"); await p.press(".as-buscar", "Enter"); await p.waitForTimeout(500);
    await foto(p, 1, w, tema); await sinDesborde(p, w, id + " paso 1");
    await p.click(".as-principal"); await p.waitForTimeout(300);
    quiero(/Toque la primera esquina/.test(await p.textContent(".as-frase")), id + ": la frase del paso 2 debía pedir la primera esquina");
    igual(await p.getAttribute("[data-terminar]", "disabled"), "", id + ": Terminar debe estar apagado sin puntos");
    await foto(p, "2a", w, tema); await C.marcar(p);
    igual(await p.getAttribute("[data-terminar]", "disabled"), null, id + ": Terminar debe activarse con cuatro puntos");
    quiero(/Ya puede terminar/.test(await p.textContent(".as-frase")) && /4 puntos/.test(await p.textContent(".as-frase")), id + ": la frase debía decir que ya puede terminar y cuántos puntos");
    await foto(p, "2b", w, tema); await sinDesborde(p, w, id + " paso 2");
    await p.click("[data-terminar]"); await p.waitForTimeout(500);
    igual(await C.hash(p), "#/analizar/3", id + ": Terminar lleva al paso 3");
    quiero(/m²/.test(await p.textContent(".as-medida")) && /varas²/.test(await p.textContent(".as-medida")), id + ": el paso 3 debía mostrar m² y varas²");
    await foto(p, 3, w, tema); await sinDesborde(p, w, id + " paso 3");
    await p.click(".as-principal"); await p.waitForTimeout(500);
    igual(await p.$$eval(".as-card", x => x.length), 9, id + ": la cartelera debía traer las nueve tarjetas");
    igual(await p.getAttribute(".as-principal", "disabled"), "", id + ": Siguiente debe estar apagado sin nada elegido");
    quiero(/Elija al menos un análisis/.test(await p.textContent(".as-nota")), id + ": el pie debía decir por qué Siguiente está apagado");
    await foto(p, "4a", w, tema);
    await p.click('.as-card[data-id="predio"] .as-card-poster'); await p.click('.as-card[data-id="identificacion"] .as-card-poster');
    quiero(/2 elegidos/.test(await p.textContent(".as-nota")), id + ": el pie debía decir «2 elegidos»");
    await p.click('.as-card[data-id="construccion"] .as-card-mas'); await p.waitForSelector(".as-ficha");
    quiero(await p.$("#as-desde"), id + ": la ficha de Construcción debía traer «Cambios desde»");
    await foto(p, "4b", w, tema); await p.keyboard.press("Escape"); await p.waitForTimeout(200);
    quiero(!(await p.$(".as-ficha")), id + ": Esc debía cerrar la ficha");
    await sinDesborde(p, w, id + " paso 4");
    await p.click(".as-principal"); await p.waitForTimeout(500);
    igual(await C.hash(p), "#/analizar/5", id + ": Siguiente lleva al paso 5");
    await foto(p, 5, w, tema); await sinDesborde(p, w, id + " paso 5");
    await p.click(".as-analizar"); await p.waitForTimeout(400);
    igual(await C.hash(p), "#/analizar/6", id + ": Analizar ahora lleva al paso 6");
    quiero(await p.$(".as-barra-av"), id + ": el paso 6 debía tener barra de avance");
    await foto(p, 6, w, tema); await sinDesborde(p, w, id + " paso 6");
    await p.waitForFunction(() => /#\/informe\//.test(location.hash), null, { timeout: 30000 }).catch(() => fallas.push(id + ": no llegó al atlas"));
    await p.waitForSelector(".at-pag.at-on", { timeout: 15000 }).catch(() => fallas.push(id + ": el atlas no abrió"));
    igual(await C.hash(p).then(x => x.endsWith("/0")), true, id + ": el atlas debía abrir en la portada");
    const guardado = await p.evaluate(async () => { const x = await ESP.resultados.leer(location.hash.split("/")[2]); return x && { n: Object.keys(x.resultados).length, tj: x.tarjetas, aoi: x.aoi && x.aoi.type, m2: !!x.areaM2 }; });
    quiero(guardado && guardado.n >= 1 && guardado.aoi === "Polygon" && guardado.m2 && guardado.tj.join() === "predio,identificacion", id + ": el resultado guardado no tiene la forma esperada " + JSON.stringify(guardado));
    quiero(!(await C.estado(p, "(d, e) => e.hayAlgoQuePerder()")), id + ": al llegar al atlas el flujo debía quedar limpio");
    await sinDesborde(p, w, id + " atlas");
    quiero(!C.sinRuido(errs).length, id + ": errores de consola " + C.sinRuido(errs).slice(0, 2).join(" | "));
    // «Retomar mi último atlas» aparece en el paso 1 cuando hay uno guardado
    await C.ir(p, "#/analizar/1"); await p.waitForTimeout(700);
    quiero(await p.$(".as-retomar:not([hidden]) a"), id + ": el paso 1 debía ofrecer retomar el último atlas");
    await p.close();
  }

  // ── 2 · Bienvenida: la segunda vez se salta ────────────────────────────────────────────────────
  { const { p } = await C.abrir(b, { vioBienvenida: true }); await p.goto(C.URL + "#/analizar"); await p.waitForTimeout(400);
    igual(await C.hash(p), "#/analizar/1", "la bienvenida debía saltarse en la segunda visita"); await p.close(); }

  // ── 3 · Condiciones de entrada con enlaces escritos a mano ─────────────────────────────────────
  { const { p } = await C.abrir(b); await p.goto(C.URL + "#/analizar/1"); await p.waitForTimeout(400);
    await C.ir(p, "#/analizar/4"); await p.waitForTimeout(300); igual(await C.hash(p), "#/analizar/1", "#/analizar/4 sin área debía llevar al paso 1");
    await C.ir(p, "#/analizar/6"); await p.waitForTimeout(300); igual(await C.hash(p), "#/analizar/1", "#/analizar/6 sin haber pulsado Analizar debía llevar al paso 1");
    await C.areaValida(p); await p.click(".as-principal"); await p.waitForTimeout(400);
    await C.ir(p, "#/analizar/5"); await p.waitForTimeout(300); igual(await C.hash(p), "#/analizar/4", "#/analizar/5 sin análisis elegido debía llevar al paso 4");
    await C.ir(p, "#/analizar/9"); await p.waitForTimeout(300); quiero(/^#\/analizar\/[0-6]$/.test(await C.hash(p)), "un paso inexistente debía corregirse a uno válido");
    await p.close(); }

  // ── 4 · Atrás no pierde nada · Corregir conserva el dibujo ─────────────────────────────────────
  { const { p } = await C.abrir(b); await p.goto(C.URL + "#/analizar/1"); await p.waitForTimeout(400);
    await C.areaValida(p); await C.elegir(p, ["riesgo", "predio"]);
    await p.click(".as-atras"); await p.waitForTimeout(500);
    igual(await C.hash(p), "#/analizar/3", "Atrás desde el 4 debía volver al 3");
    igual(await C.estado(p, "d => d.anillo.length"), 4, "volver del 4 al 3 debía conservar el área");
    igual(await C.estado(p, "d => d.tarjetas"), ["riesgo", "predio"], "volver del 4 al 3 debía conservar lo elegido");
    await p.click(".as-principal"); await p.waitForTimeout(400);
    quiero((await p.$$eval(".as-card-elegida", x => x.length)) === 2, "al volver al 4 las dos tarjetas debían seguir elegidas");
    await p.goBack(); await p.waitForTimeout(400); igual(await C.hash(p), "#/analizar/3", "el Atrás del navegador debía volver al paso 3");
    await p.click(".as-atras"); await p.waitForTimeout(500);                   // «Corregir»
    igual(await C.hash(p), "#/analizar/2", "Corregir debía volver al paso 2");
    igual(await C.estado(p, "d => d.anillo.length"), 4, "Corregir debía conservar el dibujo");
    quiero((await p.$$(".as-mapa path.leaflet-interactive")).length > 0, "el polígono debía seguir en el mapa al corregir");
    quiero(/Mueva las esquinas/.test(await p.textContent(".as-frase")), "al corregir la frase debía invitar a mover esquinas");
    await p.click("[data-terminar]"); await p.waitForTimeout(500); igual(await C.hash(p), "#/analizar/3", "Terminar tras corregir debía volver al 3");
    // Desde el 5, «cambiar» junto al área lleva al 2 con el dibujo editable y lo elegido se conserva
    await p.click(".as-principal"); await p.waitForTimeout(300); await p.click(".as-principal"); await p.waitForTimeout(400);
    igual(await C.hash(p), "#/analizar/5", "debía llegar al 5"); await p.click(".as-resumen-f .as-cambiar >> nth=0"); await p.waitForTimeout(400);
    igual(await C.hash(p), "#/analizar/2", "«cambiar» el área debía llevar al paso 2");
    igual(await C.estado(p, "d => d.tarjetas"), ["riesgo", "predio"], "cambiar el área debía conservar lo elegido");
    await p.close(); }

  // ── 5 · Empezar de nuevo pide confirmación y borra ─────────────────────────────────────────────
  { const { p } = await C.abrir(b); await p.goto(C.URL + "#/analizar/1"); await p.waitForTimeout(400);
    await C.alPasoDos(p); await C.marcar(p, [[.4, .4], [.6, .4]]);
    await p.click(".as-reiniciar"); await p.waitForSelector(".as-confirma");
    quiero(/Se borrará el dibujo actual/.test(await p.textContent(".as-confirma")), "la confirmación debía decir «Se borrará el dibujo actual»");
    await p.click("[data-no]"); await p.waitForTimeout(200);
    quiero(/2 puntos/.test(await p.textContent(".as-frase")), "conservar debía dejar los dos puntos");
    await p.click(".as-reiniciar"); await p.waitForSelector(".as-confirma"); await p.click("[data-si]"); await p.waitForTimeout(300);
    quiero(/Toque la primera esquina/.test(await p.textContent(".as-frase")), "tras borrar la frase debía pedir la primera esquina");
    await p.click(".as-reiniciar"); await p.waitForTimeout(200); quiero(!(await p.$(".as-confirma")), "sin dibujo, Empezar de nuevo no debía preguntar");
    await p.close(); }

  // ── 6 · Salir pregunta solo si hay algo que perder ─────────────────────────────────────────────
  { const { p } = await C.abrir(b); await p.goto(C.URL + "#/analizar/1"); await p.waitForTimeout(400);
    await p.click(".as-salir"); await p.waitForTimeout(300);
    igual(await C.hash(p), "#/", "Salir sin dibujo ni elección debía salir directo"); quiero(!(await p.$(".as-confirma")), "Salir sin nada que perder no debía preguntar");
    await p.goto(C.URL + "#/analizar/1"); await p.waitForTimeout(400); await C.alPasoDos(p); await C.marcar(p, [[.4, .4], [.6, .4]]);
    await p.click(".as-salir"); await p.waitForSelector(".as-confirma");
    quiero(/se pierde el dibujo/.test(await p.textContent(".as-confirma")), "Salir con un dibujo a medias debía advertir que se pierde");
    await p.keyboard.press("Escape"); await p.waitForTimeout(200);
    quiero(!(await p.$(".as-confirma")) && (await C.hash(p)) === "#/analizar/2", "Esc en la confirmación debía quedarse");
    await p.click(".as-salir"); await p.waitForSelector(".as-confirma"); await p.click("[data-si]"); await p.waitForTimeout(400);
    igual(await C.hash(p), "#/", "confirmar Salir debía ir a la portada"); quiero(!(await C.estado(p, "(d, e) => e.hayAlgoQuePerder()")), "tras salir el flujo debía quedar limpio");
    await p.close(); }

  // ── 7 · Atrás durante el análisis cancela las llamadas y vuelve al 5 intacto ───────────────────
  { const { p, red } = await C.abrir(b, { latencia: 6000 }); await p.goto(C.URL + "#/analizar/1"); await p.waitForTimeout(400);
    await C.areaValida(p); await C.elegir(p, ["predio", "identificacion"]); await p.click(".as-principal"); await p.waitForTimeout(400);
    await p.click(".as-analizar"); await p.waitForTimeout(900); igual(await C.hash(p), "#/analizar/6", "debía estar analizando");
    await p.click(".as-atras"); await p.waitForTimeout(700);
    igual(await C.hash(p), "#/analizar/5", "Atrás durante el análisis debía volver al 5");
    quiero(red.abortadas > 0 && red.abortadas === red.pedidas, `Atrás debía cancelar todas las llamadas (${red.abortadas} de ${red.pedidas})`);
    igual(await C.estado(p, "d => [d.anillo.length, d.tarjetas]"), [4, ["predio", "identificacion"]], "el 5 debía volver con el área y lo elegido intactos");
    igual(await p.evaluate(async () => (await ESP.resultados.lista()).length), 0, "un análisis cancelado no debía guardar nada");
    await p.goBack().catch(() => {});
    await p.close(); }

  // ── 8 · Si fallan todos se queda con el error y puede reintentar ───────────────────────────────
  { const { p } = await C.abrir(b); await p.route("**/*run.app*/**", r => r.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ status: "error", error: "x" }) }));
    await p.goto(C.URL + "#/analizar/1"); await p.waitForTimeout(400); await C.areaValida(p); await C.elegir(p, ["identificacion"]); await p.click(".as-principal"); await p.waitForTimeout(400);
    await p.click(".as-analizar"); await p.waitForSelector(".as-estado-invalido:not([hidden])", { timeout: 15000 }).catch(() => fallas.push("si fallan todos debía mostrarse el error"));
    igual(await C.hash(p), "#/analizar/6", "si fallan todos debía quedarse en el 6"); quiero(/Reintentar/.test(await p.textContent(".as-principal")), "debía ofrecer Reintentar");
    await p.close(); }

  // ── 9 · Dibujo con lados cruzados: la frase lo dice, el vértice se marca y no se puede confirmar ─
  { const { p } = await C.abrir(b); await p.goto(C.URL + "#/analizar/1"); await p.waitForTimeout(400); await C.alPasoDos(p); await C.marcar(p, C.CRUZADO);
    quiero(/cruzan/.test(await p.textContent(".as-frase")) && (await p.getAttribute(".as-frase", "class")).includes("mala"), "la frase debía avisar que dos lados se cruzan");
    quiero((await p.$$(".as-mapa path.leaflet-interactive")).length >= 1, "el vértice culpable debía marcarse en el mapa");
    await p.click("[data-terminar]"); await p.waitForTimeout(500); igual(await C.hash(p), "#/analizar/3", "un dibujo cruzado debía poder revisarse en el 3");
    igual(await p.getAttribute(".as-principal", "disabled"), "", "con lados cruzados Confirmar debía estar apagado");
    quiero(/Corrija el dibujo/.test(await p.textContent(".as-nota")), "el pie debía decir qué falta, no apagarse en silencio");
    await C.ir(p, "#/analizar/4"); await p.waitForTimeout(300); quiero((await C.hash(p)) !== "#/analizar/4", "un dibujo inválido no debía llegar a la cartelera");
    await p.close(); }

  // ── 10 · Teclado: Enter elige una tarjeta, Esc cierra la ficha ─────────────────────────────────
  { const { p } = await C.abrir(b); await p.goto(C.URL + "#/analizar/1"); await p.waitForTimeout(400); await C.areaValida(p); await p.click(".as-principal"); await p.waitForTimeout(400);
    await p.focus('.as-card[data-id="riesgo"] .as-card-poster'); await p.keyboard.press("Enter"); await p.waitForTimeout(100);
    igual(await p.getAttribute('.as-card[data-id="riesgo"] .as-card-poster', "aria-pressed"), "true", "Enter sobre el póster debía elegir la tarjeta");
    quiero(!(await p.$('.as-card[data-id="aptitud"] .as-card-poster[aria-pressed]')), "una tarjeta «próximamente» no debía poder elegirse");
    await p.click('.as-card[data-id="riesgo"] .as-card-mas'); await p.waitForSelector(".as-ficha"); await p.keyboard.press("Escape"); await p.waitForTimeout(200);
    quiero(!(await p.$(".as-ficha")), "Esc debía cerrar la ficha"); await p.close(); }

  // ── 11 · Movimiento reducido: sin animaciones ni transiciones ──────────────────────────────────
  { const { p } = await C.abrir(b, { reducido: true }); await p.goto(C.URL + "#/analizar/1"); await p.waitForTimeout(400);
    await C.areaValida(p); await C.elegir(p, ["identificacion"]); await p.click(".as-principal"); await p.waitForTimeout(300); await p.evaluate(() => { ESP.config.tiempoMaximoMs = 300000; });
    await p.route("**/*run.app*/**", async r => { await new Promise(x => setTimeout(x, 3000)); r.abort(); });
    await p.click(".as-analizar"); await p.waitForTimeout(1200);
    const an = await p.evaluate(() => ({ barrido: getComputedStyle(document.querySelector(".as-mapa"), "::after").animationName,
      giro: getComputedStyle(document.querySelector(".as-prog-p")).animationName, barra: getComputedStyle(document.querySelector(".as-barra-av span")).transitionDuration }));
    igual(an.barrido, "none", "con movimiento reducido el barrido del mapa no debía animarse"); igual(an.giro, "none", "con movimiento reducido el indicador no debía girar");
    igual(an.barra, "0s", "con movimiento reducido la barra no debía hacer transición"); await p.close(); }

  await b.close();
  console.log(fallas.length ? "FALLAS:\n" + fallas.join("\n") : "TODO OK");
  process.exit(fallas.length ? 1 : 0);
})();
