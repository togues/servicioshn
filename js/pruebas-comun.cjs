/* Piezas comunes de las pruebas con navegador (sin red): Leaflet, Geoman y GSAP salen de lib/, las APIs de fixtures.json
   y Nominatim está simulado. Las usan pruebas-e2e.cjs y pruebas-asistente.cjs; se corren desde la carpeta front con
   NODE_PATH apuntando a playwright@1.59.1 (que no vive en el repo, regla 9). */
const fs = require("fs"), path = require("path");
const raiz = process.cwd();
const fx = JSON.parse(fs.readFileSync(path.join(raiz, "js/fixtures.json"), "utf8"));
const LIBS = { "leaflet.min.js": ["lib/leaflet.min.js", "application/javascript"], "leaflet.min.css": ["lib/leaflet.css", "text/css"],
  "leaflet-geoman.min.js": ["lib/leaflet-geoman.min.js", "application/javascript"], "gsap.min.js": ["lib/gsap.min.js", "application/javascript"],
  "leaflet-geoman.css": ["lib/leaflet-geoman.css", "text/css"] };
const URL = "file://" + raiz + "/index.html";
const CUADRO = [[.40, .40], [.60, .40], [.60, .60], [.40, .60]];          // esquinas relativas al mapa
const CRUZADO = [[.40, .40], [.60, .60], [.60, .40], [.40, .60]];         // lados que se cruzan

/* Abre una página lista: o = { w, h, tema, reducido, latencia, vioBienvenida, geo }. Devuelve { p, errs, red } con red.pedidas / red.abortadas. */
async function abrir(b, o = {}) {
  const w = o.w || 1500, h = o.h || 900, red = { pedidas: 0, abortadas: 0 }, errs = [];
  const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: w < 500, colorScheme: o.tema || "light", reducedMotion: o.reducido ? "reduce" : "no-preference",
    geolocation: o.geo === false ? undefined : { latitude: 14.0116, longitude: -87.0974 }, permissions: o.geo === false ? [] : ["geolocation"] });
  p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  p.on("requestfailed", r => { if (/run\.app/.test(r.url())) red.abortadas++; });
  await p.route("**/*", async r => {
    const u = r.request().url();
    if (u.startsWith("file://")) return r.continue();
    for (const k in LIBS) if (u.includes(k)) return r.fulfill({ path: path.join(raiz, LIBS[k][0]), contentType: LIBS[k][1] });
    if (/nominatim/.test(u)) return r.fulfill({ contentType: "application/json", body: JSON.stringify([{ lat: "14.0116", lon: "-87.0974", display_name: "Tatumbla, Francisco Morazán, Honduras" }]) });
    const m = /esp-(rg|pr)-(\d\d)-/.exec(u);
    if (m) {
      red.pedidas++; await new Promise(x => setTimeout(x, o.latencia || 300));
      const c = m[1].toUpperCase() + "-" + m[2];
      return r.fulfill({ contentType: "application/json", body: JSON.stringify(fx[c] || { status: "error", error: "sin fixture" }) }).catch(() => {});   // cancelada a medias: no es un fallo
    }
    return r.abort();
  });
  if (o.vioBienvenida !== false) await p.addInitScript(() => { try { localStorage.setItem("esp.asistente.bienvenida", "1"); } catch { /* nada */ } });
  return { p, errs, red };
}
const ir = (p, hash) => p.evaluate(h => { location.hash = h; }, hash);
const hash = p => p.evaluate(() => location.hash);
const paso = p => p.getAttribute(".as", "data-paso");
const estado = (p, f) => p.evaluate(`(${f})(ESP.asistente.sesion.datos, ESP.asistente.sesion)`);

/* Busca unas coordenadas (el mapa se acerca) y pasa del paso 1 al 2. */
async function alPasoDos(p, lugar = "14.0116, -87.0974") {
  await p.fill(".as-buscar", lugar); await p.press(".as-buscar", "Enter"); await p.waitForTimeout(400);
  await p.click(".as-principal"); await p.waitForTimeout(300);
}
/* Marca puntos con clics reales sobre el mapa (esquinas relativas). */
async function marcar(p, puntos = CUADRO) {
  const box = await (await p.$(".as-mapa")).boundingBox();
  for (const [x, y] of puntos) { await p.mouse.click(box.x + box.width * x, box.y + box.height * y); await p.waitForTimeout(150); }
}
/* Del paso 1 al 3 con un dibujo cuadrado y válido. */
async function areaValida(p) { await alPasoDos(p); await marcar(p); await p.click("[data-terminar]"); await p.waitForTimeout(400); }
/* Del paso 3 al 4 y elige tarjetas por id (el pie «Siguiente» queda listo para ir al 5). */
async function elegir(p, ids) {
  await p.click(".as-principal"); await p.waitForTimeout(400);
  for (const id of ids) await p.click(`.as-card[data-id="${id}"] .as-card-poster`);
}
const sinRuido = errs => errs.filter(e => !/net::ERR|Failed to load resource|favicon/.test(e));
module.exports = { fx, URL, abrir, ir, hash, paso, estado, alPasoDos, marcar, areaValida, elegir, sinRuido, CUADRO, CRUZADO, raiz };
