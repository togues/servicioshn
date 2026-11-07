/* Prueba de punta a punta sobre index.html real, sin red: portada → asistente → atlas, a 1500 y 400 px. Los casos del
   asistente están en pruebas-asistente.cjs; aquí se comprueba que el recorrido completo desemboca en un atlas sano
   (láminas, teclado, índice, ayuda, impresión) y que el mapa trae sus controles.  node js/pruebas-e2e.cjs  (desde la carpeta front) */
const { chromium } = require("playwright"); const C = require("./pruebas-comun.cjs");
(async () => {
  const b = await chromium.launch(); const fallas = [];
  for (const [w, h, n] of [[1500, 900, "1500"], [400, 800, "400"]]) {
    const { p, errs } = await C.abrir(b, { w, h, latencia: 300 });
    await p.goto(C.URL + "#/"); await p.waitForTimeout(400); await p.screenshot({ path: `capturas/e2e-portada-${n}.png`, fullPage: true });
    await p.goto(C.URL + "#/servicios"); await p.waitForTimeout(300);
    const disponibles = await p.$$eval(".tarjeta .chip.ok", x => x.length); console.log(n, "tarjetas disponibles:", disponibles);
    // La ficha de una tarjeta entra al asistente con esa tarjeta ya elegida
    await p.goto(C.URL + "#/analizar?t=predio,riesgo,construccion"); await p.waitForTimeout(600);
    if ((await C.hash(p)) !== "#/analizar/1") fallas.push(n + ": el asistente debía abrir en el paso 1 (" + (await C.hash(p)) + ")");
    // Mapa: control de capas (satélite / calles) y centrado en la ubicación de la persona
    if (!(await p.$(".as-mapa .leaflet-control-layers"))) fallas.push(n + ": falta el control de capas");
    if (!(await p.$(".as-mapa .mapa-ubic-b"))) fallas.push(n + ": falta el botón Mi ubicación");
    await p.waitForTimeout(600);
    const centro = await p.evaluate(() => { const m = ESP.router.actual.mapa(); const c = m.map.getCenter(); return [c.lat, c.lng]; });
    if (Math.abs(centro[0] - 14.0116) > .01 || Math.abs(centro[1] + 87.0974) > .01) fallas.push(n + ": el mapa no se centró en la ubicación " + JSON.stringify(centro));
    // Dibujar con clics reales, revisar, elegir (llegan marcadas las tres de la ficha) y analizar
    await C.alPasoDos(p); await C.marcar(p); await p.click("[data-terminar]"); await p.waitForTimeout(500);
    console.log(n, "estado del dibujo:", await p.evaluate(() => ESP.asistente.sesion.datos.evaluacion.estado));
    await p.screenshot({ path: `capturas/e2e-analizar-${n}.png`, fullPage: false });
    await p.click(".as-principal"); await p.waitForTimeout(500);
    const marcadas = await p.$$eval(".as-card-elegida", x => x.length); if (marcadas !== 3) fallas.push(n + ": debían llegar tres tarjetas elegidas desde el enlace (" + marcadas + ")");
    await p.click(".as-principal"); await p.waitForTimeout(500); await p.click(".as-analizar");
    {
      await p.waitForFunction(() => /#\/informe\//.test(location.hash), null, { timeout: 30000 }).catch(() => fallas.push(n + ": no llegó al atlas"));
      await p.waitForSelector(".at-pag.at-on", { timeout: 15000 }).catch(() => fallas.push(n + ": el atlas no abrió"));
      await p.waitForTimeout(1200);
      const esencial = await p.$$eval(".at-esencial li", x => x.length); if (!esencial) fallas.push(n + ": portada sin frases esenciales");
      const laminas = await p.$$eval(".at-lam", x => x.length); if (laminas < 5) fallas.push(n + ": pocas láminas " + laminas);
      const mapas = await p.$$eval(".at-lam .leaflet-container", x => x.length);
      console.log(n, "esencial:", esencial, "láminas:", laminas, "mapas:", mapas, "hash:", await p.evaluate(() => location.hash));
      await p.screenshot({ path: `capturas/atlas-portada-${n}.png`, fullPage: false });
      // hojear: lámina 1, una de gráfica, la de imágenes y la contraportada
      const ir = async (k, nombre) => { await p.evaluate(k => ESP.router.actual.irA(k), k); await p.waitForTimeout(900); const vis = await p.$$eval(".at-pag.at-on", x => x.map(e => e.dataset.n)); if (vis.length !== 1 || vis[0] !== String(k)) fallas.push(n + ": lámina " + k + " no visible (" + vis + ")"); await p.screenshot({ path: `capturas/atlas-${nombre}-${n}.png`, fullPage: false }); };
      await ir(1, "lamina1");
      const kG = await p.evaluate(() => { const e = document.querySelector(".at-tipo-grafica"); return e ? +e.dataset.n : 0; }); if (kG) await ir(kG, "grafica");
      const kI = await p.evaluate(() => { const e = document.querySelector(".at-tipo-imagenes"); return e ? +e.dataset.n : 0; }); if (kI) await ir(kI, "imagenes");
      await ir(laminas + 1, "contraportada");
      // teclado y ruta
      await p.keyboard.press("ArrowLeft"); await p.waitForTimeout(700);
      const hashN = await p.evaluate(() => location.hash.split("/").pop()); if (hashN !== String(laminas)) fallas.push(n + ": la ruta no siguió al teclado (" + hashN + ")");
      // índice emergente
      await p.click(".at-pos"); await p.waitForTimeout(300); const dlg = await p.$(".at-dialogo:not([hidden])"); if (!dlg) fallas.push(n + ": índice no abre"); await p.keyboard.press("Escape"); await p.waitForTimeout(200);
      // Ayuda de la lámina (piloto PR-05): el botón «i» abre la pantalla completa, trae texto, Esc cierra y el foco vuelve al botón
      const conAyuda = await p.$$eval(".at-lam", ls => ls.map((e, i) => e.querySelector(".at-info") ? i + 1 : 0).filter(Boolean));
      if (!conAyuda.length) fallas.push(n + ": ninguna lámina tiene botón de ayuda");
      else {
        await p.evaluate(k => ESP.router.actual.irA(k), conAyuda[0]); await p.waitForTimeout(900);
        await p.click(`.at-pag[data-n="${conAyuda[0]}"] .at-info`); await p.waitForTimeout(300);
        const ay = await p.$eval(".at-ayuda", e => ({ visible: !e.hidden, hojas: e.querySelectorAll(".at-ay-s").length, desborde: e.querySelector(".at-dialogo-c").scrollWidth > e.querySelector(".at-dialogo-c").clientWidth }));
        if (!ay.visible || ay.hojas < 2) fallas.push(n + ": la ayuda no abre o viene vacía"); if (ay.desborde) fallas.push(n + ": la ayuda se desborda");
        await p.keyboard.press("Escape"); await p.waitForTimeout(200);
        const cierra = await p.$eval(".at-ayuda", e => e.hidden), foco = await p.evaluate(() => document.activeElement.className);
        if (!cierra) fallas.push(n + ": Esc no cierra la ayuda"); if (foco !== "at-info") fallas.push(n + ": el foco no vuelve al botón de ayuda (" + foco + ")");
      }
      // impresión: emular y capturar
      await p.emulateMedia({ media: "print" }); await p.waitForTimeout(500); await p.screenshot({ path: `capturas/atlas-print-${n}.png`, fullPage: true }); await p.emulateMedia({ media: "screen" });
    }
    const sw = await p.evaluate(() => document.documentElement.scrollWidth);
    if (sw > w + 1) fallas.push(n + ": desborde horizontal " + sw);
    const e2 = C.sinRuido(errs); if (e2.length) fallas.push(n + ": errores " + e2.slice(0, 3).join(" | "));
    await p.close();
  }
  await b.close();
  console.log(fallas.length ? "FALLAS:\n" + fallas.join("\n") : "TODO OK");
  process.exit(fallas.length ? 1 : 0);
})();
