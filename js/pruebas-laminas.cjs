/* Prueba de reparto en láminas con los fixtures, sin navegador. Carga i18n, paleta, catálogo, lectores y laminas.js
   en un `window` mínimo.  node js/pruebas-laminas.cjs  (desde la carpeta front) */
const fs = require("fs"), path = require("path"), vm = require("vm");
const raiz = process.cwd();
const ctx = { console, window: null, document: { addEventListener() {} } }; ctx.window = ctx; vm.createContext(ctx);
const cargar = f => vm.runInContext(fs.readFileSync(path.join(raiz, f), "utf8"), ctx, { filename: f });
["js/config.js", "js/i18n/es.js", "js/paleta.js", "js/catalogo.js", "js/app.js", "js/lectores/base.js", "js/lectores/comun.js",
 ...fs.readdirSync(path.join(raiz, "js/lectores")).filter(f => /^(RG|PR)-\d\d\.js$/.test(f)).sort().map(f => "js/lectores/" + f), "js/atlas/laminas.js"].forEach(cargar);
const ESP = ctx.ESP, fx = JSON.parse(fs.readFileSync(path.join(raiz, "js/fixtures.json"), "utf8"));
const t = ESP.t(); const codigos = Object.keys(fx);
const lecturas = codigos.map(c => ESP.lectores[c].leer(fx[c], { t, idioma: "es", areaM2: 1240, aoi: null }));
const atlas = ESP.atlasLaminas.armar(lecturas, { tarjetas: ["riesgo", "predio"], catalogo: ESP.catalogo.tarjetas });
const fallas = [];
console.log("láminas:", atlas.laminas.length, "· esencial:", atlas.esencial.length, "· errores:", atlas.errores.length, "· fuentes:", atlas.fuentes.length);
atlas.laminas.forEach(l => console.log(String(l.n).padStart(2), l.codigo, l.tipo.padEnd(8), (l.titulo || "").slice(0, 52).padEnd(52), "capas:" + l.capas.length, "sec:" + l.secundarias.length, "ley:" + l.leyenda.length, "hz:" + l.hallazgos.length, "gal:" + l.galeria.length, l.frase ? "frase" : "-"));
// Reglas
atlas.laminas.forEach(l => {
  if (!l.titulo) fallas.push(l.n + " sin título");
  if (l.tipo === "mapa" && !l.capas.length) fallas.push(l.n + " mapa sin capa protagonista");
  if (l.tipo === "mapa" && !l.leyenda.length) fallas.push(l.n + " mapa sin leyenda");
});
codigos.forEach(c => { const lec = lecturas.find(x => x.codigo === c); if (lec.estado !== "error") { const ls = atlas.laminas.filter(l => l.codigo === c); if (!ls.length) fallas.push(c + " sin lámina"); const hz = ls.reduce((n, l) => n + l.hallazgos.length, 0); if (hz !== lec.hallazgos.length) fallas.push(c + " hallazgos repartidos " + hz + " de " + lec.hallazgos.length); } });
if (!atlas.laminas.some(l => l.tipo === "grafica")) fallas.push("ninguna lámina de gráfica (RG-04)");
if (!atlas.laminas.some(l => l.tipo === "imagenes")) fallas.push("ninguna lámina de imágenes (PR-06)");
console.log(fallas.length ? "FALLAS:\n" + fallas.join("\n") : "TODO OK");
process.exit(fallas.length ? 1 : 0);
