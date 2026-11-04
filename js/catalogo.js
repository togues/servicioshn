/* Catálogo: las nueve tarjetas (lo que el cliente marca) y las APIs que llama cada una (lo que se ejecuta).
   Los textos viven en js/i18n/<idioma>.js; aquí solo la estructura. Una API compartida por varias tarjetas se
   ejecuta y se cobra una sola vez. */
window.ESP = window.ESP || {};
ESP.catalogo = {
  tarjetas: [
    { id: "riesgo",        icono: "flood",        publico: ["alcaldias", "ciudadanos", "bancos"], apis: ["RG-01", "RG-02", "RG-03", "RG-04", "RG-05", "RG-06", "RG-07"] },
    { id: "predio",        icono: "history",      publico: ["ciudadanos", "bancos", "alcaldias"], apis: ["PR-01", "PR-02", "PR-06", "PR-04"] },
    { id: "construccion",  icono: "apartment",    publico: ["alcaldias", "bancos"],                apis: ["PR-02", "PR-05", "GF-01", "GF-05", "GF-08"] },
    { id: "normativa",     icono: "gavel",        publico: ["ciudadanos", "alcaldias"],            apis: ["PR-03"] },
    { id: "identificacion",icono: "square_foot",  publico: ["ciudadanos", "alcaldias"],            apis: ["PR-04"] },
    { id: "suelo",         icono: "terrain",      publico: ["campo", "alcaldias"],                 apis: ["RG-02", "TS-05", "PR-03"] },
    { id: "clima",         icono: "water_drop",   publico: ["campo", "alcaldias"],                 apis: ["RG-04", "GA-03", "CL-01", "TS-06", "TS-09"] },
    { id: "cobertura",     icono: "forest",       publico: ["campo", "alcaldias", "bancos"],       apis: ["PR-06", "RG-01", "CB-01", "GF-04", "OO-01"] },
    { id: "aptitud",       icono: "agriculture",  publico: ["campo"],                              apis: ["TS-05", "GA-03", "CL-01", "TS-09", "TS-02"] }
  ],
  // Cada API: servicio en Cloud Run, familia, escala del dato y qué tipo de área admite.
  apis: {
    "RG-01": { familia: "RG", servicio: "esp-rg-01-inundacion",          clase: "area" },
    "RG-02": { familia: "RG", servicio: "esp-rg-02-deslizamiento",       clase: "area" },
    "RG-03": { familia: "RG", servicio: "esp-rg-03-incendio",            clase: "area" },
    "RG-04": { familia: "RG", servicio: "esp-rg-04-sequia",              clase: "punto" },
    "RG-05": { familia: "RG", servicio: "esp-rg-05-huracan-viento",      clase: "area" },
    "RG-06": { familia: "RG", servicio: "esp-rg-06-sismo-volcan",        clase: "area" },
    "RG-07": { familia: "RG", servicio: "esp-rg-07-costa",               clase: "area" },
    "PR-01": { familia: "PR", servicio: "esp-pr-01-linea-tiempo",        clase: "area" },
    "PR-02": { familia: "PR", servicio: "esp-pr-02-niveles-ampliaciones",clase: "area" },
    "PR-03": { familia: "PR", servicio: "esp-pr-03-traslapes",           clase: "area" },
    "PR-04": { familia: "PR", servicio: "esp-pr-04-coherencia-poligono", clase: "area" },
    "PR-05": { familia: "PR", servicio: "esp-pr-05-vigilancia",          clase: "area" },
    "PR-06": { familia: "PR", servicio: "esp-pr-06-imagenes-fecha",      clase: "area" },
    "GF-01": { familia: "GF", servicio: "esp-cat-huellas",    clase: "area" },
    "GF-02": { familia: "GF", servicio: "esp-cat-alturas",    clase: "area" },
    "GF-04": { familia: "GF", servicio: "sp-cat-cambios",     clase: "area" },
    "GF-05": { familia: "GF", servicio: "esp-cat-vias",       clase: "area" },
    "GF-08": { familia: "GF", servicio: "esp-cat-poblacion",  clase: "area" },
    "TS-02": { familia: "TS", servicio: "territory-score",    clase: "area" },
    "TS-05": { familia: "TS", servicio: "esp-aptitudsuelo",   clase: "area" },
    "TS-06": { familia: "TS", servicio: "esp-alertasclimaticas", clase: "punto" },
    "TS-09": { familia: "TS", servicio: "esp-huellahidrica",  clase: "punto" },
    "GA-03": { familia: "GA", servicio: "iica-precipitacion", clase: "punto" },
    "CL-01": { familia: "CL", servicio: "iica-temperatura",   clase: "punto" },
    "OO-01": { familia: "OO", servicio: "eudr-esp",           clase: "area" },
    "CB-01": { familia: "CB", servicio: "esp-cb-01-cobertura",clase: "area" }
  },
  disponible(codigo) { return !!(ESP.config.servicios[codigo] && ESP.lectores && ESP.lectores[codigo]); },
  apisDe(ids) { const s = new Set(); ids.forEach(id => { const t = this.tarjetas.find(x => x.id === id); if (t) t.apis.forEach(a => s.add(a)); }); return [...s]; }
};
