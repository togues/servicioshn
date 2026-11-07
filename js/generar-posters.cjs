/* Genera los pósteres de la cartelera del asistente: una imagen real de una lámina típica de cada tarjeta, sacada del
   atlas armado con los fixtures sobre el área de Tatumbla. Se corre una vez y los .webp se versionan en img/posters/.
   Necesita red (las teselas base de Esri) y playwright fuera del repo (regla 9):
     NODE_PATH=<carpeta>/node_modules node js/generar-posters.cjs [id ...]      (desde la carpeta front)
   Convierte a webp con Pillow (python3). Si una tarjeta no tiene lámina con fixtures, no hay póster y la cartelera
   muestra su icono sobre un degradado de la marca. */
const { chromium } = require("playwright"); const fs = require("fs"); const path = require("path"); const { execFileSync } = require("child_process");
const raiz = process.cwd(), salida = path.join(raiz, "img/posters"), tmp = path.join(raiz, "capturas");
const fx = JSON.parse(fs.readFileSync(path.join(raiz, "js/fixtures.json"), "utf8"));
const ANCHO = 480, ALTO = 300;          // 8:5, para pantallas de doble densidad; sigue pesando pocos KB
// Misma área que usan las pruebas (unos 500 m² en Tatumbla): los fixtures se recortaron para ella.
// Sin póster (queda el icono de respaldo): la lámina de imágenes con los fixtures sale negra; vuelve cuando haya una respuesta real.
const OMITIR = ["cobertura"];
const AOI = [[-87.0975, 14.0115], [-87.0973, 14.0115], [-87.0973, 14.0117], [-87.0975, 14.0117]];

(async () => {
  fs.mkdirSync(salida, { recursive: true }); fs.mkdirSync(tmp, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1500, height: 900 } });
  await p.goto("file://" + raiz + "/index.html#/"); await p.waitForTimeout(500);
  const pedidas = process.argv.slice(2);
  const ids = await p.evaluate(() => ESP.catalogo.tarjetas.filter(t => ESP.catalogo.apisDe([t.id]).some(c => ESP.catalogo.disponible(c))).map(t => t.id));
  const hechas = [], sin = [];
  for (const id of ids.filter(i => !OMITIR.includes(i) && (!pedidas.length || pedidas.includes(i)))) {
    const codigos = await p.evaluate(i => ESP.catalogo.apisDe([i]).filter(c => ESP.catalogo.disponible(c)), id);
    const resultados = {}; codigos.forEach(c => { if (fx[c]) resultados[c] = { codigo: c, estado: "listo", resp: fx[c], segundos: 1 }; });
    if (!Object.keys(resultados).length) { sin.push(id); continue; }
    await p.evaluate(() => { location.hash = "#/"; });
    const infoId = await p.evaluate(({ id, resultados, AOI }) => {
      const rid = "poster-" + id, anillo = AOI.concat([AOI[0]]);
      ESP.resultados.guardar(rid, { id: rid, fecha: new Date().toISOString(), aoi: { type: "Polygon", coordinates: [anillo] }, areaM2: 500, varas2: 500 / 0.6987, ha: 0.05, tarjetas: [id], codigos: Object.keys(resultados), desde: null, resultados });
      return rid;
    }, { id, resultados, AOI });
    await p.evaluate(h => { location.hash = h; }, "#/informe/" + infoId + "/1");
    await p.waitForSelector(".at-pag.at-on", { timeout: 20000 }).catch(() => null);
    await p.waitForTimeout(4500);                                    // teselas base y capas
    // El póster es la lámina entera (mapa, hallazgo y leyenda): lo que la persona va a recibir. Recorte 8:5 desde arriba.
    const caja = await p.evaluate(() => {
      const pag = document.querySelector(".at-pag.at-on"); if (!pag) return null;
      document.querySelectorAll(".at-pag.at-on .leaflet-control-container").forEach(e => { e.style.display = "none"; });   // sin botones de zoom en la imagen
      const r = pag.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    if (!caja || caja.w < 50) { sin.push(id); continue; }
    const w = caja.w, hh = Math.min(caja.h, w * ALTO / ANCHO), clip = { x: caja.x, y: caja.y, width: hh < w * ALTO / ANCHO ? hh * ANCHO / ALTO : w, height: hh };
    const png = path.join(tmp, "poster-" + id + ".png");
    await p.screenshot({ path: png, clip });
    execFileSync("python3", ["-I", "-c", "import sys; from PIL import Image; i=Image.open(sys.argv[1]).convert('RGB'); i=i.resize((int(sys.argv[3]),int(sys.argv[4])), Image.LANCZOS); i.save(sys.argv[2],'WEBP',quality=78,method=6)", png, path.join(salida, id + ".webp"), String(ANCHO), String(ALTO)]);
    hechas.push(id + " (" + Math.round(fs.statSync(path.join(salida, id + ".webp")).size / 1024) + " KB)");
  }
  console.log("pósteres:", hechas.join(", ") || "ninguno"); if (sin.length) console.log("sin póster (icono de respaldo):", sin.join(", "));
  await b.close();
})();
