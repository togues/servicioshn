/* Prueba de punta a punta sobre index.html real, sin red: CDN → lib/, APIs → fixtures.json, Nominatim simulado.
   node js/pruebas-e2e.cjs  (desde la carpeta front) */
const { chromium } = require("playwright"); const fs = require("fs"); const path = require("path");
const raiz = process.cwd(); const fx = JSON.parse(fs.readFileSync(path.join(raiz, "js/fixtures.json"), "utf8"));
const cfg = fs.readFileSync(path.join(raiz, "js/config.js"), "utf8");
(async () => {
  const b = await chromium.launch(); const fallas = [];
  for (const [w, h, n] of [[1500, 900, "1500"], [400, 800, "400"]]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, geolocation: { latitude: 14.0116, longitude: -87.0974 }, permissions: ["geolocation"], hasTouch: w < 500 }); const errs = [];
    // La visita guiada sale sola la primera vez; aquí se marca como vista y se prueba aparte.
    await p.addInitScript(() => { try { localStorage.setItem("esp.guia.herramienta", "1"); } catch (e) { /* nada */ } });
    p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
    await p.route("**/*", async r => {
      const u = r.request().url();
      if (u.startsWith("file://")) return r.continue();
      if (/leaflet\.min\.js/.test(u)) return r.fulfill({ path: path.join(raiz, "lib/leaflet.min.js"), contentType: "application/javascript" });
      if (/leaflet\.min\.css/.test(u)) return r.fulfill({ path: path.join(raiz, "lib/leaflet.css"), contentType: "text/css" });
      if (/leaflet-geoman\.min\.js/.test(u)) return r.fulfill({ path: path.join(raiz, "lib/leaflet-geoman.min.js"), contentType: "application/javascript" });
      if (/gsap\.min\.js/.test(u)) return r.fulfill({ path: path.join(raiz, "lib/gsap.min.js"), contentType: "application/javascript" });
      if (/leaflet-geoman\.css/.test(u)) return r.fulfill({ path: path.join(raiz, "lib/leaflet-geoman.css"), contentType: "text/css" });
      if (/nominatim/.test(u)) return r.fulfill({ contentType: "application/json", body: JSON.stringify([{ lat: "14.0116", lon: "-87.0974", display_name: "Tatumbla" }]) });
      const cod = Object.keys(fx).find(c => u.includes(c.toLowerCase().replace("-", "-") ) || u.includes("esp-" + c.toLowerCase().replace("rg-", "rg-").replace("pr-", "pr-")));
      const m = /esp-(rg|pr)-(\d\d)-/.exec(u);
      if (m) { const c = m[1].toUpperCase() + "-" + m[2]; await new Promise(x => setTimeout(x, 300)); return r.fulfill({ contentType: "application/json", body: JSON.stringify(fx[c] || { status: "error", error: "sin fixture" }) }); }
      return r.abort();
    });
    const url = "file://" + raiz + "/index.html";
    await p.goto(url + "#/"); await p.waitForTimeout(400); await p.screenshot({ path: `capturas/e2e-portada-${n}.png`, fullPage: true });
    await p.goto(url + "#/servicios"); await p.waitForTimeout(300);
    const disponibles = await p.$$eval(".tarjeta .chip.ok", x => x.length); console.log(n, "tarjetas disponibles:", disponibles);
    await p.goto(url + "#/analizar?t=predio,riesgo,construccion"); await p.waitForTimeout(600);
    // Visita guiada: sale sola la primera vez, se recorre con Continuar/Atrás, se sale con Saltar y Esc, y no vuelve sola.
    await p.evaluate(() => { localStorage.removeItem("esp.guia.herramienta"); location.hash = "#/servicios"; });
    await p.waitForTimeout(300); await p.evaluate(() => { location.hash = "#/analizar?t=predio,riesgo,construccion"; }); await p.waitForTimeout(1800);
    if (!(await p.$(".guia-caja"))) fallas.push(n + ": la visita guiada no salió sola");
    else {
      const total = +(/de (\d+)/.exec(await p.textContent(".guia-n")) || [])[1];
      await p.click(".guia-caja .btn-p"); await p.waitForTimeout(500); await p.click(".guia-caja .btn:not(.btn-p)"); await p.waitForTimeout(300);
      if (!/Paso 1 /.test(await p.textContent(".guia-n"))) fallas.push(n + ": Atrás no volvió al paso 1");
      for (let k = 1; k <= total; k++) { await p.click(".guia-caja .btn-p"); await p.waitForTimeout(450); if (k === 3) await p.screenshot({ path: `capturas/e2e-guia-${n}.png` }); }
      if (await p.$(".guia-caja")) fallas.push(n + ": Terminar no cerró la visita");
      if (await p.evaluate(() => localStorage.getItem("esp.guia.herramienta")) !== "1") fallas.push(n + ": no recordó la visita vista");
      const dib = await p.evaluate(() => !!document.querySelector(".h-mapa.leaflet-container")); if (!dib) fallas.push(n + ": el mapa quedó mal tras la visita");
      await p.click(".guia-lanzador"); await p.waitForSelector(".guia-caja"); await p.keyboard.press("Escape"); await p.waitForTimeout(200);
      if (await p.$(".guia-caja")) fallas.push(n + ": Esc no cerró la visita");
      await p.click(".guia-lanzador"); await p.click(".guia-saltar"); await p.waitForTimeout(200);
      if (await p.$(".guia-caja")) fallas.push(n + ": Saltar no cerró la visita");
      console.log(n, "visita guiada: pasos", total, "OK");
    }
    // Mapa: control de capas (satélite / calles), centrado en la ubicación y hoja de pasos arrastrable en celular.
    await p.waitForTimeout(800);
    if (!(await p.$(".h-mapa .leaflet-control-layers"))) fallas.push(n + ": falta el control de capas");
    if (!(await p.$(".h-mapa .h-ubic-b"))) fallas.push(n + ": falta el botón Mi ubicación");
    const centro = await p.evaluate(() => { const c = ESP.herramienta.activa.mapa.map.getCenter(); return [c.lat, c.lng]; }).catch(() => null);
    if (!centro || Math.abs(centro[0] - 14.0116) > .01 || Math.abs(centro[1] + 87.0974) > .01) fallas.push(n + ": el mapa no se centró en la ubicación " + JSON.stringify(centro));
    if (w < 500) {
      // Hoja de pasos: altura libre. Se queda donde se suelta; cerca del asa se esconde, cerca del tope se abre del todo.
      const alto = () => p.$eval(".h-pasos", e => Math.round(e.getBoundingClientRect().height));
      const abierta = () => p.getAttribute(".h-asa", "aria-expanded");
      const marco = await p.$eval(".h-cuerpo", e => e.clientHeight);
      const arrastrar = async dy => { const c = await (await p.$(".h-asa")).boundingBox(); const x = c.x + c.width / 2, y = c.y + 20; await p.mouse.move(x, y); await p.mouse.down(); await p.mouse.move(x, y + dy, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(450); };
      const h0 = await alto(); if (Math.abs(h0 - marco * .58) > 6 || (await abierta()) !== "true") fallas.push(n + ": la hoja debía empezar al 58 % y abierta (" + h0 + " de " + marco + ")");
      await arrastrar(120); const h1 = await alto(); if (Math.abs(h1 - (h0 - 120)) > 8 || (await abierta()) !== "true") fallas.push(n + ": arrastrar 120 px debía dejar la hoja a media altura (" + h0 + "→" + h1 + ")");
      await arrastrar(-60); const h2 = await alto(); if (Math.abs(h2 - (h1 + 60)) > 8) fallas.push(n + ": la hoja no se quedó donde se soltó (" + h1 + "→" + h2 + ")");
      await arrastrar(-2000); if ((await alto()) !== marco) fallas.push(n + ": arrastrar hasta arriba debía abrirla a pantalla completa");
      await arrastrar(2000); if ((await alto()) !== 56 || (await abierta()) !== "false") fallas.push(n + ": arrastrar hasta abajo debía dejar solo el asa");
      const c3 = await (await p.$(".h-asa")).boundingBox(); await p.mouse.click(c3.x + c3.width / 2, c3.y + 20); await p.waitForTimeout(450);
      if ((await abierta()) !== "true" || (await alto()) < 100) fallas.push(n + ": tocar el asa cerrada debía abrir la hoja");
      await p.focus(".h-asa"); const k0 = await alto(); await p.keyboard.press("ArrowDown"); await p.waitForTimeout(450); if ((await alto()) >= k0) fallas.push(n + ": la flecha abajo no bajó la hoja");
      await p.keyboard.press("Home"); await p.waitForTimeout(450); if ((await alto()) !== 56) fallas.push(n + ": Inicio no escondió la hoja");
      await p.keyboard.press("End"); await p.waitForTimeout(450); if ((await alto()) !== marco) fallas.push(n + ": Fin no abrió la hoja del todo");
      // Gesto de toque desde el cuerpo de la hoja (no solo el asa): sostener y deslizar mueve la hoja; un toque sigue siendo clic.
      const cdp = await p.context().newCDPSession(p);
      const deslizar = async (x, y, dy) => { await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] }); for (let i = 1; i <= 8; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y + dy * i / 8 }] }); await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await p.waitForTimeout(500); };
      const scroll = () => p.$eval(".h-pasos", e => Math.round(e.scrollTop));
      await p.$eval(".h-pasos", e => { e.scrollTop = 0; });
      await deslizar(200, 500, 150); const t1 = await alto(); if (Math.abs(t1 - (marco - 150)) > 10) fallas.push(n + ": deslizar el cuerpo hacia abajo no bajó la hoja (" + t1 + ")");
      await deslizar(200, 500, -80); const t2 = await alto(); if (Math.abs(t2 - (t1 + 80)) > 10) fallas.push(n + ": deslizar el cuerpo hacia arriba no subió la hoja (" + t1 + "→" + t2 + ")");
      await deslizar(200, 600, -1000); if ((await alto()) !== marco) fallas.push(n + ": deslizar el cuerpo hasta arriba no abrió la hoja del todo");
      await deslizar(200, 600, -250); const sc = await scroll(); if (sc < 100 || (await alto()) !== marco) fallas.push(n + ": con la hoja a tope, deslizar debía desplazar el contenido (scroll " + sc + ")");
      await deslizar(200, 300, 120); const sc2 = await scroll(); if (sc2 >= sc || (await alto()) !== marco) fallas.push(n + ": con contenido desplazado, deslizar hacia abajo debía subir el contenido, no bajar la hoja (" + sc + "→" + sc2 + ")");
      await p.$eval(".h-pasos", e => { e.scrollTop = 0; });
      await p.touchscreen.tap(200, 400); // un toque en el cuerpo no mueve la hoja
      if ((await alto()) !== marco) fallas.push(n + ": un toque en el cuerpo movió la hoja");
      const bD = await (await p.$(".h-botones .btn-p")).boundingBox(); await p.touchscreen.tap(bD.x + bD.width / 2, bD.y + bD.height / 2); await p.waitForTimeout(500);
      if ((await alto()) !== 56) fallas.push(n + ": tocar «Dibujar» debía seguir funcionando como clic (la hoja baja al asa)");
      await p.evaluate(() => ESP.herramienta.activa.mapa.map.pm.disableDraw());
      const ca = await (await p.$(".h-asa")).boundingBox(); await p.touchscreen.tap(ca.x + ca.width / 2, ca.y + 20); await p.waitForTimeout(500);
      if ((await abierta()) !== "true") fallas.push(n + ": tocar el asa con el dedo debía abrir la hoja");
      await arrastrar(Math.round(marco * .42)); // vuelve a ~58 % para el resto de la prueba
    }
    // dibujar un polígono por código
    const ok = await p.evaluate(() => { const h = ESP.herramienta && ESP.herramienta.activa; if (!h) return "sin herramienta"; h.poner([[-87.0975, 14.0115], [-87.0973, 14.0115], [-87.0973, 14.0117], [-87.0975, 14.0117]]); return h.evaluacion().estado; });
    console.log(n, "estado del dibujo:", ok);
    await p.screenshot({ path: `capturas/e2e-analizar-${n}.png`, fullPage: false });
    const btn = await p.$("button.btn-grande:not([disabled])");
    if (!btn) { fallas.push(n + ": botón analizar deshabilitado"); } else {
      await btn.click();
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
    const e2 = errs.filter(e => !/net::ERR|Failed to load resource|favicon/.test(e)); if (e2.length) fallas.push(n + ": errores " + e2.slice(0, 3).join(" | "));
    await p.close();
  }
  await b.close();
  console.log(fallas.length ? "FALLAS:\n" + fallas.join("\n") : "TODO OK");
})();
