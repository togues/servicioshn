/* Prueba del componente js/componentes/hoja.js (hoja inferior de altura libre) con ratón, teclado y gestos de toque reales
   (CDP), sobre js/pruebas-hoja.html.  node js/pruebas-hoja.cjs  (desde la carpeta front, con NODE_PATH a playwright@1.59.1) */
const { chromium } = require("playwright");
const fallas = [], quiero = (c, m) => { if (!c) fallas.push(m); };
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 400, height: 800 }, hasTouch: true });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + __dirname + "/pruebas-hoja.html"); await p.waitForTimeout(400);
  const alto = () => p.$eval("#hoja", e => Math.round(e.getBoundingClientRect().height));
  const abierta = () => p.getAttribute("#asa", "aria-expanded");
  const marco = await p.$eval("#marco", e => e.clientHeight);
  const arrastrar = async dy => { const c = await (await p.$("#asa")).boundingBox(); const x = c.x + c.width / 2, y = c.y + 20; await p.mouse.move(x, y); await p.mouse.down(); await p.mouse.move(x, y + dy, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(450); };

  // Altura libre con el ratón sobre el asa
  const h0 = await alto(); quiero(Math.abs(h0 - marco * .58) > 6 ? false : (await abierta()) === "true", "la hoja debía empezar al 58 % y abierta (" + h0 + " de " + marco + ")");
  await arrastrar(120); const h1 = await alto(); quiero(Math.abs(h1 - (h0 - 120)) <= 8 && (await abierta()) === "true", "arrastrar 120 px debía dejarla a media altura (" + h0 + "→" + h1 + ")");
  await arrastrar(-60); const h2 = await alto(); quiero(Math.abs(h2 - (h1 + 60)) <= 8, "la hoja debía quedarse donde se soltó (" + h1 + "→" + h2 + ")");
  await arrastrar(-2000); quiero((await alto()) === marco, "arrastrar hasta arriba debía abrirla a pantalla completa");
  await arrastrar(2000); quiero((await alto()) === 56 && (await abierta()) === "false", "arrastrar hasta abajo debía dejar solo el asa");
  quiero(await p.$eval("#contenido", e => e.inert === true && e.getAttribute("aria-hidden") === "true"), "escondida, el contenido debía quedar inerte y oculto a lectores");
  const c3 = await (await p.$("#asa")).boundingBox(); await p.mouse.click(c3.x + c3.width / 2, c3.y + 20); await p.waitForTimeout(450);
  quiero((await abierta()) === "true" && (await alto()) >= 100, "tocar el asa cerrada debía abrir la hoja");

  // Teclado en el asa
  await p.focus("#asa"); const k0 = await alto(); await p.keyboard.press("ArrowDown"); await p.waitForTimeout(450); quiero((await alto()) < k0, "la flecha abajo debía bajar la hoja");
  await p.keyboard.press("Home"); await p.waitForTimeout(450); quiero((await alto()) === 56, "Inicio debía esconder la hoja");
  await p.keyboard.press("End"); await p.waitForTimeout(450); quiero((await alto()) === marco, "Fin debía abrirla del todo");

  // Gestos de toque desde el cuerpo: sostener y deslizar mueve la hoja; un toque sigue siendo clic
  const cdp = await p.context().newCDPSession(p);
  const deslizar = async (x, y, dy) => { await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] }); for (let i = 1; i <= 8; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y + dy * i / 8 }] }); await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await p.waitForTimeout(450); };
  const scroll = () => p.$eval("#hoja", e => Math.round(e.scrollTop));
  await p.$eval("#hoja", e => { e.scrollTop = 0; });
  await deslizar(200, 500, 150); const t1 = await alto(); quiero(Math.abs(t1 - (marco - 150)) <= 10, "deslizar el cuerpo hacia abajo debía bajar la hoja (" + t1 + ")");
  await deslizar(200, 500, -80); const t2 = await alto(); quiero(Math.abs(t2 - (t1 + 80)) <= 10, "deslizar el cuerpo hacia arriba debía subir la hoja (" + t1 + "→" + t2 + ")");
  await deslizar(200, 600, -1000); quiero((await alto()) === marco, "deslizar el cuerpo hasta arriba debía abrir la hoja del todo");
  await deslizar(200, 600, -250); const sc = await scroll(); quiero(sc >= 100 && (await alto()) === marco, "con la hoja a tope, deslizar debía desplazar el contenido (scroll " + sc + ")");
  await deslizar(200, 300, 120); const sc2 = await scroll(); quiero(sc2 < sc && (await alto()) === marco, "con contenido desplazado, deslizar hacia abajo debía subir el contenido, no bajar la hoja (" + sc + "→" + sc2 + ")");
  await p.$eval("#hoja", e => { e.scrollTop = 0; });
  await p.touchscreen.tap(200, 400); quiero((await alto()) === marco, "un toque en el cuerpo no debía mover la hoja");
  const bb = await (await p.$("#btn")).boundingBox(); await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(300);
  quiero((await p.evaluate(() => window.__clics)) === 1, "un toque sobre un botón del cuerpo debía seguir siendo clic");
  await deslizar(bb.x + bb.width / 2, bb.y + bb.height / 2 + 2, 60);          // arrastrar empezando sobre el botón no lo activa
  quiero((await p.evaluate(() => window.__clics)) === 1, "arrastrar desde un botón no debía activarlo");
  const ca = await (await p.$("#asa")).boundingBox(); await p.touchscreen.tap(ca.x + ca.width / 2, ca.y + 20); await p.waitForTimeout(500);
  quiero((await alto()) === 56, "tocar el asa con el dedo debía esconder la hoja abierta");

  quiero(!errs.length, "errores: " + errs.slice(0, 2).join(" | "));
  await b.close();
  console.log(fallas.length ? "FALLAS:\n" + fallas.join("\n") : "TODO OK");
  process.exit(fallas.length ? 1 : 0);
})();
