/* Visita guiada · recorridos. Solo datos: a qué elemento apunta cada paso. Los textos están en i18n (guia.<recorrido>[i]).
   `sel` vacío = paso centrado, sin foco. `hoja`: en celular, si la hoja de pasos debe verse abierta o cerrada. */
window.ESP = window.ESP || {};
ESP.guiaRecorridos = {
  herramienta: {
    ruta: "analizar",
    espera: ".h-cuerpo",
    pasos: [
      { sel: "" },
      { sel: ".h-mapa", hoja: "cerrada" },
      { sel: ".h-buscar-form", hoja: "abierta" },
      { sel: ".h-botones", hoja: "abierta" },
      { sel: ".h-tarjetas", hoja: "abierta" },
      { sel: ".btn-grande", hoja: "abierta" }
    ]
  }
};
