const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const errores = [];
  async function corrida(ancho, alto, tag) {
    const p = await b.newPage({ viewport: { width: ancho, height: alto }, hasTouch: ancho < 700 });
    p.on('console', m => { if (m.type() === 'error') errores.push(tag + ': ' + m.text()); });
    p.on('pageerror', e => errores.push(tag + ' pageerror: ' + e.message));
    await p.goto('file://' + __dirname + '/pruebas-herramienta.html#/analizar');
    await p.waitForSelector('#h-mapa.leaflet-container');
    await p.waitForTimeout(500);
    const r = {};
    r.deshabilitadoAlInicio = await p.$eval('.btn-grande', b => b.disabled);
    r.predioMarcada = await p.$eval('#tj-predio', i => i.checked);
    r.proximamente = await p.$$eval('.h-tarjeta-prox', l => l.length);
    await p.screenshot({ path: `${__dirname}/../capturas/analizar-vacio-${tag}.png`, fullPage: ancho >= 700 });
    // 1) polígono con lados cruzados → inválido con vértice marcado
    await p.evaluate(() => ESP.herramienta.activa.poner([[-87.0975, 14.0115], [-87.09731, 14.01169], [-87.09731, 14.0115], [-87.0975, 14.01169]]));
    await p.waitForTimeout(200);
    r.estadoCruzado = await p.$eval('.h-estado', e => e.className + ' | ' + e.textContent.trim());
    r.deshabilitadoCruzado = await p.$eval('.btn-grande', b => b.disabled);
    await p.screenshot({ path: `${__dirname}/../capturas/analizar-invalido-${tag}.png`, fullPage: ancho >= 700 });
    // 2) polígono válido (~400 m²)
    await p.evaluate(() => ESP.herramienta.activa.poner(window.__aoiRef()));
    await p.waitForTimeout(200);
    r.estadoValido = await p.$eval('.h-estado', e => e.className + ' | ' + e.textContent.trim());
    r.habilitado = await p.$eval('.btn-grande', b => !b.disabled);
    // marcar también riesgo
    await p.check('#tj-riesgo');
    await p.screenshot({ path: `${__dirname}/../capturas/analizar-valido-${tag}.png`, fullPage: ancho >= 700 });
    // 3) buscar (mock nominatim)
    await p.fill('#h-buscar', 'Tatumbla'); await p.press('#h-buscar', 'Enter'); await p.waitForTimeout(300);
    // 4) analizar (en móvil los pasos son una hoja inferior plegada: se abre con su asa)
    if (await p.$eval('.h-pasos', e => !e.classList.contains('abierta'))) await p.click('.h-asa');
    await p.waitForTimeout(300);
    await p.click('.btn-grande');
    await p.waitForTimeout(700);
    r.progresoEnCurso = await p.$$eval('.h-progreso li', ls => ls.map(l => l.className + ':' + l.querySelector('.h-prog-estado').textContent));
    await p.screenshot({ path: `${__dirname}/../capturas/analizar-corriendo-${tag}.png`, fullPage: ancho >= 700 });
    await p.waitForFunction(() => location.hash.startsWith('#/informe/'), null, { timeout: 15000 });
    // el atlas se prueba en pruebas-e2e.cjs; aquí basta con que el resultado quede guardado y la ruta cambie
    r.hash = await p.evaluate(() => location.hash);
    r.guardado = await p.evaluate(async () => { const id = location.hash.split('/')[2]; const x = await ESP.resultados.leer(id); return !!x; });
    r.desborde = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    await p.close();
    return r;
  }
  const d = await corrida(1500, 900, 'desk');
  const m = await corrida(400, 820, 'movil');
  console.log(JSON.stringify({ desk: d, movil: m }, null, 1));
  console.log('ERRORES:', errores);
  await b.close();
  // veredicto: cruzado inválido y bloqueado, válido habilitado, resultado guardado, sin desborde ni errores de consola
  const fallas = [];
  for (const [k, x] of [['desk', d], ['movil', m]]) {
    if (!x.deshabilitadoAlInicio) fallas.push(k + ': el botón debe estar deshabilitado sin área');
    if (!x.deshabilitadoCruzado) fallas.push(k + ': un polígono con lados cruzados no debe poder analizarse');
    if (!x.habilitado) fallas.push(k + ': un polígono válido debe habilitar el botón');
    if (!x.guardado) fallas.push(k + ': el resultado no quedó guardado');
    if (x.desborde) fallas.push(k + ': desborde horizontal');
  }
  errores.filter(e => !/ERR_FILE_NOT_FOUND|net::/.test(e)).forEach(e => fallas.push(e));
  console.log(fallas.length ? 'FALLAS:\n' + fallas.join('\n') : 'TODO OK');
  process.exit(fallas.length ? 1 : 0);
})();
