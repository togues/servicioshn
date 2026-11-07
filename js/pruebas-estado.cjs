/* Prueba del estado del asistente (lógica pura, sin navegador).  node js/pruebas-estado.cjs  (desde la carpeta front) */
const fs = require("fs"), path = require("path"), vm = require("vm");
const ctx = { console, window: null }; ctx.window = ctx; vm.createContext(ctx);
ctx.document = { addEventListener() {} };   // disponible() consulta los lectores: se cargan como en laminas
["js/config.js", "js/i18n/es.js", "js/paleta.js", "js/catalogo.js", "js/app.js", "js/lectores/base.js", "js/lectores/comun.js",
 ...fs.readdirSync(path.join(process.cwd(), "js/lectores")).filter(f => /^(RG|PR)-\d\d\.js$/.test(f)).sort().map(f => "js/lectores/" + f),
 "js/asistente/estado.js"].forEach(f =>
  vm.runInContext(fs.readFileSync(path.join(process.cwd(), f), "utf8"), ctx, { filename: f }));
const ESP = ctx.ESP, fallas = [];
const quiero = (c, m) => { if (!c) fallas.push(m); };
const igual = (a, b, m) => quiero(a === b, `${m}: esperaba ${b}, salió ${a}`);

const nuevo = vio => ESP.asistente.estado.crear({ catalogo: ESP.catalogo, vioBienvenida: vio });
const cuadro = [[-87.1, 14.1], [-87.099, 14.1], [-87.099, 14.101], [-87.1, 14.101]];
const valida = { estado: "valido", m2: 1240 };
const dibujar = (e, ev = valida, fin = true) => e.ponerDibujo(cuadro, ev, fin);

// Entradas sin nada hecho
let e = nuevo(false);
igual(e.corregir(0), 0, "0 sin haberla visto"); igual(e.corregir(1), 1, "1 sin nada"); igual(e.corregir(2), 2, "2 sin nada");
igual(e.corregir(3), 1, "3 sin dibujo"); igual(e.corregir(4), 1, "4 sin área"); igual(e.corregir(5), 1, "5 sin área"); igual(e.corregir(6), 1, "6 sin nada");
igual(e.corregir(NaN), 0, "ruta sin número abre la bienvenida"); igual(e.corregir(9), 0, "paso inexistente"); igual(e.corregir(-1), 0, "paso negativo");
igual(nuevo(true).corregir(0), 1, "la bienvenida se salta la segunda vez"); igual(nuevo(true).corregir(NaN), 1, "sin número y ya vista → 1");

// Dibujo en curso no basta; terminado e inválido solo llega al 3; válido llega al 4
e = nuevo(true); dibujar(e, { estado: "valido" }, false);
igual(e.corregir(3), 1, "dibujo sin terminar no se revisa");
dibujar(e, { estado: "invalido", mensaje: "se cruza" }, true);
igual(e.corregir(3), 3, "dibujo terminado inválido se revisa"); igual(e.corregir(4), 3, "inválido no pasa al 4");
dibujar(e, { estado: "aviso" }); igual(e.corregir(4), 4, "área con aviso pasa al 4");

// Elección
e = nuevo(true); dibujar(e);
igual(e.corregir(5), 4, "5 sin análisis elegido → 4");
igual(e.alternarTarjeta("riesgo"), true, "elegir riesgo"); igual(e.corregir(5), 5, "5 con una elegida");
igual(e.alternarTarjeta("riesgo"), false, "quitar riesgo"); igual(e.corregir(5), 4, "quitada → vuelve al 4");
e.alternarTarjeta("riesgo");
igual(e.alternarTarjeta("aptitud"), false, "una tarjeta sin API disponible no se elige"); igual(e.datos.tarjetas.length, 1, "solo queda la disponible");

// El 6 solo desde el botón
igual(e.corregir(6), 5, "6 sin autorización → 5"); e.autorizarAnalisis(); igual(e.corregir(6), 6, "6 autorizado");
igual(e.ir(6), 6, "ir(6)"); igual(e.consumirAnalisis(), true, "autorización se consume"); igual(e.corregir(6), 5, "ya consumida → 5");
e.autorizarAnalisis(); e.ir(5); igual(e.datos.puedeAnalizar, false, "salir del 6 revoca el permiso");

// Atrás no pierde nada
e = nuevo(true); dibujar(e); e.alternarTarjeta("riesgo"); e.alternarTarjeta("predio"); e.ponerLugar(" Tatumbla ");
e.ir(5); e.ir(4); e.ir(3);
igual(e.datos.anillo.length, 4, "volver al 3 conserva el área"); igual(e.datos.tarjetas.join(), "riesgo,predio", "volver al 3 conserva lo elegido"); igual(e.datos.lugar, "Tatumbla", "lugar");
e.reabrirDibujo(); igual(e.datos.anillo.length, 4, "Corregir conserva el dibujo"); igual(e.datos.terminado, false, "Corregir lo deja editable"); igual(e.corregir(4), 1, "editable no avanza");
dibujar(e); igual(e.corregir(5), 5, "al terminar de nuevo se puede seguir");

// Cambiar el área conserva lo elegido; Empezar de nuevo lo borra solo a él
dibujar(e, { estado: "aviso" }); igual(e.datos.tarjetas.length, 2, "cambiar el área conserva lo elegido");
e.borrarDibujo(); igual(e.datos.anillo.length, 0, "borrar vacía el dibujo"); igual(e.datos.tarjetas.length, 2, "borrar el dibujo no borra lo elegido"); igual(e.corregir(4), 1, "sin dibujo vuelve al 1");

// Salir pregunta solo si hay algo que perder
e = nuevo(true); igual(e.hayAlgoQuePerder(), false, "nada que perder"); dibujar(e, valida, false); igual(e.hayAlgoQuePerder(), true, "dibujo a medias");
e.reiniciar(); igual(e.hayAlgoQuePerder(), false, "reiniciar"); e.alternarTarjeta("riesgo"); igual(e.hayAlgoQuePerder(), true, "algo elegido");
e.reiniciar(); igual(e.datos.vioBienvenida, true, "reiniciar conserva que ya vio la bienvenida");

// Resumen: «Cambios desde» solo cuenta con su tarjeta elegida; PR-02 compartida se llama una vez
e = nuevo(true); dibujar(e); e.ponerDesde("2026-01-15"); e.alternarTarjeta("riesgo");
igual(e.resumen().desde, null, "fecha sin tarjeta de vigilancia no cuenta"); e.alternarTarjeta("construccion"); igual(e.resumen().desde, "2026-01-15", "fecha con su tarjeta");
e.alternarTarjeta("predio"); const r = e.resumen(); igual(new Set(r.codigos).size, r.codigos.length, "una API compartida se llama una sola vez");
e.ponerDesde("15/01/2026"); igual(e.datos.desde, "", "fecha mal escrita se descarta");
const inf = e.info("identificacion"); igual(inf.analisis, 1, "identificación incluye 1 análisis"); igual(inf.segundos, 20, "identificación ≈ 20 s");
igual(e.info("riesgo").analisis, 5, "riesgo incluye los 5 que corren hoy"); igual(e.info("riesgo").segundos, 113, "riesgo: 5 de 90 s en 4 a la vez");
igual(e.info("aptitud").analisis, 0, "aptitud sin servicios"); igual(e.info("aptitud").segundos, 0, "aptitud sin tiempo");
igual(nuevo(true).resumen().segundos, 0, "sin elegir no hay tiempo");
igual(e.hito(3), "area", "hito del 3"); igual(e.hito(4), "analisis", "hito del 4"); igual(e.hito(6), "resultado", "hito del 6"); igual(e.hito(0), null, "la bienvenida no tiene hito");

console.log(fallas.length ? "FALLAS:\n" + fallas.join("\n") : "TODO OK");
process.exit(fallas.length ? 1 : 0);
