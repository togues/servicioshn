/* Prueba de punta a punta sobre index.html real, sin red: CDN → lib/, APIs → fixtures.json, Nominatim simulado.
   node js/pruebas-e2e.cjs  (desde la carpeta front) */
const { chromium } = require("playwright"); const fs = require("fs"); const path = require("path");
const raiz = process.cwd(); const fx = JSON.parse(fs.readFileSync(path.join(raiz, "js/fixtures.json"), "utf8"));
const cfg = fs.readFileSync(path.join(raiz, "js/config.js"), "utf8");
(async () => {
  const b = await chromium.launch(); const fallas = [];
  for (const [w, h, n] of [[1500, 900, "1500"], [400, 800, "400"]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } }); const errs = [];
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
    await p.goto(url + "#/analizar?t=predio,riesgo"); await p.waitForTimeout(600);
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
