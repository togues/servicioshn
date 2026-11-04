/* Configuración de la plataforma. Es el único archivo que cambia entre implementación (Cloud Run directo) y
   producción (front → PHP → API). Sin secretos aquí: el secreto vive en el PHP, nunca en el navegador. */
window.ESP = window.ESP || {};
ESP.config = {
  // Base de cada servicio en Cloud Run. Deje vacía la URL de un servicio para que aparezca como «próximamente».
  servicios: {
    "RG-01": "https://esp-rg-01-inundacion-836767096392.us-south1.run.app",
    "RG-02": "https://esp-rg-02-deslizamiento-836767096392.us-south1.run.app",
    "RG-03": "https://esp-rg-03-incendio-836767096392.us-south1.run.app",
    "RG-04": "https://esp-rg-04-sequia-836767096392.us-south1.run.app",
    "RG-05": "https://esp-rg-05-huracan-viento-836767096392.us-south1.run.app",
    // RG-06 y RG-07 están escritas pero sin desplegar en Cloud Run (verificado 3 nov 2026): vacías = «próximamente».
    "RG-06": "",
    "RG-07": "",
    "PR-01": "https://esp-pr-01-linea-tiempo-836767096392.us-south1.run.app",
    "PR-02": "https://esp-pr-02-niveles-ampliaciones-836767096392.us-south1.run.app",
    "PR-03": "https://esp-pr-03-traslapes-836767096392.us-south1.run.app",
    "PR-04": "https://esp-pr-04-coherencia-poligono-836767096392.us-south1.run.app",
    "PR-05": "https://esp-pr-05-vigilancia-836767096392.us-south1.run.app",
    "PR-06": "https://esp-pr-06-imagenes-fecha-836767096392.us-south1.run.app",
    // Las APIs anteriores (GF, TS, GA, CL, OO) tienen otro contrato: entran cuando el orquestador PHP las traduzca.
    "GF-01": "", "GF-02": "", "GF-04": "", "GF-05": "", "GF-08": "", "TS-02": "", "TS-05": "", "TS-06": "", "TS-09": "", "GA-03": "", "CL-01": "", "OO-01": "", "CB-01": ""
  },
  // En producción: true y las llamadas van a `orquestador` (PHP), que agrega el secreto y consolida.
  usarOrquestador: false,
  orquestador: "/api/informe.php",
  tiempoMaximoMs: 300000,
  llamadasSimultaneas: 4,
  idioma: "es",
  mapa: {
    centro: [14.6, -87.2], zoom: 7,
    satelite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    calles: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    atribucionSatelite: "Esri, Maxar, Earthstar Geographics",
    atribucionCalles: "Esri, HERE, Garmin, © OpenStreetMap contributors"
  },
  // Reglas de tamaño del área de interés (skill criterios-geoservicios)
  area: { minimoM2: 50, idealMaxHa: 100, avisoHa: 100, maximoHa: 500 },
  contacto: { correo: "info@espacialhn.com", web: "https://espacialhn.com", ciudad: "Tegucigalpa, Honduras" }
};
