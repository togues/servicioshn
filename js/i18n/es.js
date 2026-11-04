/* Español. Todo texto que ve el visitante vive aquí. Para otro idioma se copia este archivo (en.js, de.js), se
   traduce y se registra en config.idioma. El código nunca lleva frases sueltas. */
window.ESP = window.ESP || {}; ESP.i18n = ESP.i18n || {};
ESP.i18n.es = {
  marca: { nombre: "Espacial HN", lema: "Inteligencia territorial con evidencia satelital", pais: "Honduras · Centroamérica" },
  nav: { inicio: "Inicio", servicios: "Servicios", como: "Cómo funciona", analizar: "Analizar un área", idioma: "Idioma" },
  portada: {
    titular: "Lo que el satélite sabe de su área de interés, con fecha y fuente.",
    apoyo: "Dibuje un área en el mapa y reciba, en minutos y en lenguaje común, lo que las imágenes satelitales abiertas muestran sobre ella: desde cuándo hay construcción, si le ha llegado el agua, qué tan cerca está de una quebrada, cómo ha cambiado año por año.",
    boton: "Analizar un área", boton2: "Ver los servicios",
    pasos: [
      { t: "Marque el área", d: "Toque en el mapa las esquinas de su área de interés, sea una casa, su colonia o su finca. Le avisamos si el dibujo tiene un error y cómo corregirlo." },
      { t: "Elija qué quiere saber", d: "Nueve preguntas, en palabras sencillas. Marque una o varias." },
      { t: "Lea el resultado", d: "Un mapa, unas frases claras y las imágenes con su fecha. Lo puede guardar en PDF y adjuntarlo a un trámite." }
    ],
    paraTitulo: "Para quién es",
    para: [
      { t: "Alcaldías", d: "Encontrar construcciones nuevas y ampliaciones sin ir a campo; dirigir la inspección a donde hace falta." },
      { t: "Ciudadanos y sus abogados", d: "Evidencia de desde cuándo se ve una construcción, para un expediente de titulación o una controversia." },
      { t: "Bancos y aseguradoras", d: "Saber qué muestra el satélite sobre un área de interés antes de una hipoteca o una póliza." },
      { t: "Productores y técnicos de campo", d: "Lluvia, sequía, cobertura y aptitud preliminar de un área de interés." }
    ],
    confianzaTitulo: "Qué entregamos y qué no",
    confianza: [
      "Evidencia observada, con la fecha de cada imagen y la fuente de cada dato. Nunca un veredicto.",
      "Datos abiertos y verificables: Copernicus (Sentinel), NASA, USGS, Google Open Buildings, Microsoft, JRC.",
      "Cada resultado dice su escala y sus límites: lo que a 10 m se ve y lo que no.",
      "No sustituye un levantamiento topográfico, un peritaje ni un estudio de suelos. Es un estudio preliminar.",
      "No guardamos nombres de personas ni datos financieros. Solo la geometría que usted dibuja y el resultado."
    ],
    paisesTitulo: "Dónde trabajamos", paises: "Honduras, Guatemala, El Salvador, Costa Rica y Colombia; los datos cubren toda Centroamérica."
  },
  servicios: {
    titulo: "Nueve preguntas que respondemos sobre cualquier área",
    sub: "Cada servicio devuelve lo que se observa, con fecha y fuente. Elija uno para ver qué entrega, o combine varios en un mismo análisis.",
    filtro: { todos: "Todos", alcaldias: "Para alcaldías", ciudadanos: "Para ciudadanos", bancos: "Para bancos", campo: "Para el campo" },
    ficha: "Ver qué entrega", analizar: "Analizar con esto", proximamente: "Próximamente", disponible: "Disponible"
  },
  ficha: {
    responde: "Qué pregunta responde", sirve: "Para qué sirve", casos: "Úselo si quiere saber", entrega: "Qué recibe", fuentes: "Fuentes y fechas", limites: "Lo que no dice",
    apis: "Análisis que corre por dentro", volver: "Todos los servicios", analizar: "Analizar un área con este servicio",
    entregaBase: ["Un mapa con las capas de lo encontrado y su leyenda", "Unas frases en lenguaje común, una por hallazgo", "Las imágenes satelitales con su fecha, cuando aplica", "Las fuentes, las fechas y los límites de la evidencia", "Todo descargable en PDF"]
  },
  tarjetas: {
    riesgo: { nombre: "Riesgo: la historia del área", pregunta: "¿Se ha inundado, deslizado o quemado? ¿Qué huracanes y sismos le han pasado cerca?", corta: "Agua, deslizamientos, fuego, sequía, huracanes, sismos y costa, desde 1984 hasta hoy.",
      sirve: "Antes de comprar, construir, prestar o asegurar: saber qué ha pasado en esa área, no lo que podría pasar.",
      casos: ["Si el área se inundó con Eta e Iota, o con cualquier lluvia desde 1984", "Si hubo deslizamientos o cicatrices en la ladera", "Si se ha quemado y cuántas veces", "Qué huracanes pasaron y qué viento dejaron", "Qué sismos ha habido cerca"],
      limites: "No da un número de riesgo ni dice «zona de riesgo». Dice qué se observó, cuándo y con qué dato. No sustituye a COPECO ni a un estudio geotécnico." },
    predio: { nombre: "Historial del predio", pregunta: "¿Desde cuándo se ve construcción aquí y cómo ha cambiado?", corta: "Año en que aparece cada techo, altura, niveles e imágenes por año desde 2016.",
      sirve: "Para un expediente de titulación, una regularización o una controversia de linderos: la imagen como evidencia de la fecha en que aparece la construcción.",
      casos: ["Desde cuándo se ve la casa", "Si consta el segundo piso o la ampliación", "Cómo se veía el área en 2017, 2019, 2022", "Si el dibujo del área cuadra con los techos"],
      limites: "El año en que aparece un techo no son años de posesión ni prueba de propiedad. Las construcciones menores de unos 30 m² pueden no verse; el año puede moverse ±1. Los datos de edificios terminan en 2023." },
    construccion: { nombre: "Construcción y entorno", pregunta: "¿Qué hay construido, de cuántos niveles, y qué se ha construido últimamente?", corta: "Edificios, niveles, cambios recientes, acceso y población cercana.",
      sirve: "Para catastro: encontrar lo que creció sin ir a campo y dirigir la visita a donde hace falta.",
      casos: ["Qué construcciones nuevas aparecieron desde una fecha", "Cuántos niveles tiene cada techo", "Qué calles y servicios hay cerca"],
      limites: "A 10 m un cambio menor de 200 m² puede no verse; las nubes de mayo a octubre atrasan la detección." },
    normativa: { nombre: "Normativa y restricciones", pregunta: "¿El área toca una quebrada, un retiro, un río o un área protegida?", corta: "Traslapes con cauces, retiros, áreas protegidas y las capas del municipio.",
      sirve: "Antes de pagar un levantamiento o pedir un permiso: saber si hay un traslape que lo va a detener.",
      casos: ["Cuánto del área cae en el retiro de una quebrada", "Qué tan cerca está el río más cercano", "Si está dentro de un área protegida"],
      limites: "Los cauces de las fuentes globales tienen ±500 m de error; el retiro exacto requiere la capa municipal o un levantamiento." },
    identificacion: { nombre: "Identificación del área", pregunta: "¿Mi dibujo está bien hecho y cuadra con lo que se ve?", corta: "Área en m², varas² y hectáreas; forma; coherencia con techos y vecinos.",
      sirve: "Para el topógrafo o el operador catastral: detectar un lindero mal trazado antes de cargarlo.",
      casos: ["Si un techo sale del área", "Si el polígono tiene vértices duplicados o lados cruzados", "Cuánto mide el área en las unidades que use"],
      limites: "Los bordes de las huellas satelitales tienen 1 a 4 m de error; lo que esté dentro de ese margen no se reporta." },
    suelo: { nombre: "Suelo y relieve", pregunta: "¿Qué tan empinado es, qué suelo tiene y por dónde baja el agua?", corta: "Pendiente, textura del suelo y drenaje natural.",
      sirve: "Para decidir qué se puede construir o sembrar y dónde.",
      casos: ["La pendiente del área y de la ladera de arriba", "La textura y profundidad del suelo", "Por dónde corre el agua cuando llueve"],
      limites: "El relieve es de 30 m y el suelo de 250 m: valores de zona, no del área de interés." },
    clima: { nombre: "Clima y agua", pregunta: "¿Cuánto llueve, cuándo hay sequía y cuánto calor hace?", corta: "Lluvia por mes desde 1981, años secos, canícula y temperatura.",
      sirve: "Para planificar siembras, obras o abastecimiento de agua con el clima real del lugar.",
      casos: ["Qué años fueron secos y cuánto", "Cuánto dura la canícula", "Cuánto llueve cada mes"],
      limites: "El clima se analiza con el centro del área; el dato es de 5 a 9 km, igual para toda la zona." },
    cobertura: { nombre: "Cobertura e historial", pregunta: "¿Qué hubo en el área año por año: bosque, cultivo, construcción, agua?", corta: "Imágenes por fecha, pérdida de bosque, cambios entre años.",
      sirve: "Para ver con sus ojos cómo ha cambiado el lugar, y documentarlo.",
      casos: ["Cómo se veía en una fecha", "Si se perdió bosque desde 2001", "Qué cambió entre dos años"],
      limites: "Sentinel-2 a 10 m desde 2017; antes, Landsat a 30 m: se ven manzanas, no paredes." },
    aptitud: { nombre: "Aptitud agrícola", pregunta: "¿Qué tan bien se da un cultivo aquí?", corta: "Lectura preliminar de suelo, lluvia, temperatura y balance de agua.",
      sirve: "Para una primera idea antes de invertir en un estudio de suelos.",
      casos: ["Qué zonas del área tienen más potencial", "Si el agua alcanza para el cultivo", "Qué temperatura y lluvia tiene el sitio"],
      limites: "Preliminar; no sustituye el análisis de suelo ni la asistencia técnica." }
  },
  apis: {
    "RG-01": { nombre: "Inundaciones históricas", pregunta: "¿Ha tenido agua encima esta área desde 1984?" },
    "RG-02": { nombre: "Deslizamientos y pendiente", pregunta: "¿Qué tan empinado es y hubo cicatrices de deslizamiento?" },
    "RG-03": { nombre: "Incendios", pregunta: "¿Se ha quemado y cuántas veces desde 2000?" },
    "RG-04": { nombre: "Sequía", pregunta: "¿Qué años fueron secos, con canícula larga o calor extremo?" },
    "RG-05": { nombre: "Huracanes y viento", pregunta: "¿Qué ciclones pasaron cerca y qué dejaron?" },
    "RG-06": { nombre: "Sismos y volcanes", pregunta: "¿Qué sismos ha habido cerca y a qué distancia están los volcanes?" },
    "RG-07": { nombre: "Costa", pregunta: "¿Qué tan cerca y qué tan bajo está respecto al mar?" },
    "PR-01": { nombre: "Línea de tiempo de la construcción", pregunta: "¿Desde cuándo se ve construcción, año por año?" },
    "PR-02": { nombre: "Niveles y ampliaciones", pregunta: "¿Cuántos niveles tiene cada techo y cuándo creció?" },
    "PR-03": { nombre: "Traslapes", pregunta: "¿Toca quebrada, río, área protegida o retiro?" },
    "PR-04": { nombre: "Coherencia del polígono", pregunta: "¿El dibujo cuadra con los techos y los vecinos?" },
    "PR-05": { nombre: "Vigilancia de cambios", pregunta: "¿Qué se construyó o se movió desde una fecha?" },
    "PR-06": { nombre: "Imágenes por fecha", pregunta: "¿Cómo se veía el área en cada año?" },
    "GF-01": { nombre: "Huellas de edificios", pregunta: "¿Qué edificios hay?" }, "GF-02": { nombre: "Altura de edificios", pregunta: "" }, "GF-04": { nombre: "Cambios entre años", pregunta: "" },
    "GF-05": { nombre: "Calles y servicios cercanos", pregunta: "" }, "GF-08": { nombre: "Población cercana", pregunta: "" }, "TS-02": { nombre: "Zonas por potencial", pregunta: "" },
    "TS-05": { nombre: "Textura y aptitud del suelo", pregunta: "" }, "TS-06": { nombre: "Alertas climáticas", pregunta: "" }, "TS-09": { nombre: "Balance de agua del cultivo", pregunta: "" },
    "GA-03": { nombre: "Lluvia por mes", pregunta: "" }, "CL-01": { nombre: "Temperatura", pregunta: "" }, "OO-01": { nombre: "Pérdida de bosque", pregunta: "" }, "CB-01": { nombre: "Cobertura año por año", pregunta: "" }
  },
  herramienta: {
    titulo: "Analizar un área", hoja: "Mostrar u ocultar los pasos",
    paso1: { t: "Marque el área", d: "Toque en el mapa las esquinas de su área de interés y cierre en el primer punto. También puede buscar un lugar o pegar coordenadas.", dibujar: "Dibujar", borrar: "Borrar", deshacer: "Deshacer el último punto", buscar: "Buscar un lugar o pegar coordenadas" },
    paso2: { t: "¿Qué quiere saber?", d: "Marque una o varias. Un mismo análisis interno se ejecuta una sola vez aunque esté en varias.", desde: "Cambios desde (opcional)", desdeAyuda: "Solo para la vigilancia de cambios: desde qué fecha buscar construcciones o movimientos de tierra. Si se deja vacío, los últimos seis meses." },
    paso3: { t: "Analizar", d: "Tarda entre medio minuto y tres minutos según lo que elija. Puede seguir el avance de cada parte.", boton: "Analizar ahora", corriendo: "Analizando…", listo: "Ver el resultado" },
    estado: { sinDibujo: "Todavía no hay área marcada.", valido: "Dibujo válido", area: "Área", unidades: { m2: "m²", varas2: "varas²", ha: "ha" },
      invalido: "El dibujo tiene un problema", cruzado: "Dos lados se cruzan: mueva el vértice marcado en rojo.", pocosPuntos: "Faltan esquinas: marque al menos tres.",
      muyChico: "El área mide menos de 50 m²: es menos que un cuarto. Revise el dibujo.", muyGrande: "El área pasa de 500 ha. Pártala en dos o tres polígonos y analice cada uno.", coordenadasFuera: "Esas coordenadas no caen en la región; escriba latitud, longitud (por ejemplo 14.0116, -87.0974).",
      grande: "Área grande ({ha} ha): el resultado describe la zona, no un sitio puntual. Puede seguir.", fueraCobertura: "Esta zona está fuera de Centroamérica; algunos datos no cubren aquí." },
    progreso: { enCola: "en cola", corriendo: "{s} s…", listo: "listo", error: "sin dato", parcial: "parcial" },
    errores: { red: "No se pudo conectar con el servicio. Revise su conexión e intente de nuevo.", servicio: "El servicio no respondió a tiempo. Intente de nuevo en un momento.", todo: "Ningún análisis respondió. Intente de nuevo." }
  },
  informe: {
    titulo: "Resultado", cabecera: "Área de {area} analizada el {fecha} · {n} servicios", pdf: "Guardar en PDF", nuevo: "Nuevo análisis", compartir: "Copiar enlace", copiado: "Enlace copiado", noExiste: "Este resultado ya no está disponible en esta pestaña. Haga un nuevo análisis.",
    esencial: "Lo esencial", porServicio: "Por servicio", significa: "Qué significa", noDice: "Qué no dice", fuentes: "Fuentes y fechas", galeria: "Imágenes por fecha", leyenda: "Leyenda", capas: "Capas",
    sinDato: "Sin dato: {motivo}", pie: "Evidencia satelital con fecha y fuente; no es dictamen, peritaje ni certificación.", generado: "Generado por Espacial HN el {fecha}",
    escala: "Escala del dato", observado: "Observado entre {desde} y {hasta} ({n} registros)"
  },
  pie: { contacto: "Contacto", privacidad: "No guardamos datos personales: solo la geometría dibujada y el resultado, el tiempo necesario para mostrarlo.", derechos: "© Espacial HN, S. de R.L." },
  hero: { etiqueta: "Área de interés", area: "1.240 m² · 1.775 v²", techo: "Techo desde 2019 (±1)" },
  mapa: { satelite: "Satélite", calles: "Calles", miUbicacion: "Mi ubicación", ubicacionNo: "No se pudo obtener su ubicación. Revise el permiso del navegador.", ubicacionFuera: "Su ubicación está fuera de la región que cubre el servicio." },
  lectores: {
    "RG-01": { "respuesta_vacia": "respuesta vacía", "sin_dato_de_inundaciones_para_esta_are": "Sin dato de inundaciones para esta área.", "agua_observada_por_landsat_1984_2021": "Agua observada por Landsat, 1984-2021", "30_m": "30 m", "tormentas_conocidas_vistas_por_radar": "Tormentas conocidas vistas por radar", "10_m": "10 m", "tormenta": "Tormenta", "fecha": "Fecha", "del_area_con_agua": "% del área con agua", "estado": "Estado", "todas_las_pasadas_de_radar_desde_2015": "Todas las pasadas de radar desde 2015", "cauce_mas_cercano_y_altura_sobre_el": "Cauce más cercano y altura sobre él", "500_m_cauce_30_m_relieve": "500 m (cauce) · 30 m (relieve)", "ano_que_se_vio_distinto_alphaearth": "Año que se vio distinto (AlphaEarth)", "agua_episodica_1984_2021_landsat": "Agua episódica 1984-2021 (Landsat)", "zona_que_tuvo_agua_alguna_vez_1984_202": "Zona que tuvo agua alguna vez (1984-2021)", "cauce_mas_cercano_hydrosheds_500_m": "Cauce más cercano (HydroSHEDS, ±500 m)", "cauce_segun_hydrosheds_ubicacion_aprox": "Cauce según HydroSHEDS (ubicación aproximada)", "frecuencia_de_agua_1984_2021": "Frecuencia de agua 1984-2021", "agua_pocas_veces": "Agua pocas veces", "agua_casi_siempre": "Agua casi siempre" },
    "RG-02": { "respuesta_vacia": "respuesta vacía", "sin_dato_de_relieve_ni_de_cicatrices_p": "Sin dato de relieve ni de cicatrices para esta área.", "sin_cicatriz": "sin cicatriz", "pendiente_del_area_y_de_la_ladera_de_a": "Pendiente del área y de la ladera de arriba", "30_m": "30 m", "cicatrices_en_las_fechas_revisadas": "Cicatrices en las fechas revisadas", "10_m": "10 m", "fecha_revisada": "Fecha revisada", "fecha": "Fecha", "origen": "Origen", "del_area": "% del área", "ha_en_250_m": "ha en 250 m", "pista": "Pista", "lluvias_extremas_registradas_chirps": "Lluvias extremas registradas (CHIRPS)", "5_5_km": "5,5 km", "anos_en_que_la_ladera_cambio_de_aspect": "Años en que la ladera cambió de aspecto", "deslizamientos_registrados_a_10_km_nas": "Deslizamientos registrados a 10 km (NASA)", "sismos_cercanos_usgs": "Sismos cercanos (USGS)", "pendiente_grados": "Pendiente (grados)", "suave_10": "Suave (<10°)", "media_10_25": "Media (10-25°)", "fuerte_35": "Fuerte (>35°)", "suelo_expuesto_en_ladera": "Suelo expuesto en ladera" },
    "RG-03": { "respuesta_vacia": "respuesta vacía", "sin_dato_de_quemas_para_esta_area": "Sin dato de quemas para esta área.", "fuego_confirmado_por_foco_o_modis": "fuego confirmado por foco o MODIS", "cambio_sin_fuego_confirmado": "cambio sin fuego confirmado", "cicatriz_de_quema_dentro_del_area_sent": "Cicatriz de quema dentro del área (Sentinel-2)", "20_m": "20 m", "evento": "Evento", "fecha": "Fecha", "origen": "Origen", "del_area": "% del área", "ha_en_1_km": "ha en 1 km", "fuego": "Fuego", "pista": "Pista", "focos_de_calor_a_menos_de_1_km_nasa": "Focos de calor a menos de 1 km (NASA)", "375_m_a_1_km": "375 m a 1 km", "area_quemada_en_la_zona_modis_celdas_d": "Área quemada en la zona (MODIS, celdas de 25 ha)", "500_m": "500 m", "cobertura_del_suelo_hoy_y_que_tan_infl": "Cobertura del suelo hoy y qué tan inflamable es", "10_m": "10 m", "baja": "Baja", "moderada": "Moderada", "alta": "Alta", "veces_quemado_2001_hoy_modis_500_m": "Veces quemado 2001-hoy (MODIS, 500 m)", "1_vez": "1 vez", "varias_veces": "Varias veces", "10_o_mas": "10 o más" },
    "RG-04": { "respuesta_vacia": "respuesta vacía", "frase_anios_secos": "{n} años secos de {m} con dato según el SPI-6 de octubre; el más seco fue {peor}. Dato de la celda de lluvia de 5,5 km en el centro del área, no del área de interés.", "sin_dato_de_sequia_para_esta_zona": "Sin dato de sequía para esta zona.", "ano": "Año", "spi_6_de_octubre": "SPI-6 de octubre", "categoria": "Categoría", "lluvia_mm": "Lluvia (mm)", "dias_secos_seguidos": "Días secos seguidos", "clase": "Clase", "anos_secos_segun_la_lluvia_chirps_spi": "Años secos según la lluvia (CHIRPS, SPI)", "5_5_km": "5,5 km", "como_respondio_la_vegetacion_del_area_": "Cómo respondió la vegetación del área en los años secos (Landsat)", "30_m": "30 m", "canicula_dias_secos_seguidos_en_julio_": "Canícula: días secos seguidos en julio-agosto", "calor_de_julio_agosto_por_ano_era5_lan": "Calor de julio-agosto por año (ERA5-Land)", "11_km": "11 km", "ano_que_se_vio_distinto_alphaearth": "Año que se vio distinto (AlphaEarth)", "10_m": "10 m" },
    "RG-05": { "respuesta_vacia": "respuesta vacía", "sin_dato_de_ciclones_para_esta_zona": "Sin dato de ciclones para esta zona.", "ciclones_que_pasaron_cerca_ibtracs": "Ciclones que pasaron cerca (IBTrACS)", "linea_10_40_km_de_error": "línea, 10-40 km de error", "ciclon": "Ciclón", "fecha": "Fecha", "distancia_km": "Distancia (km)", "viento_nudos": "Viento (nudos)", "categoria": "Categoría", "viento_estimado_en_el_punto": "Viento estimado en el punto", "caida_de_vegetacion_en_el_area_tras_ca": "Caída de vegetación en el área tras cada ciclón (Sentinel-2)", "10_m": "10 m", "sin_caida_de_vegetacion_atribuible_a_u": "Sin caída de vegetación atribuible a un ciclón en las fechas revisadas.", "del_area_con_caida": "% del área con caída", "control_estado": "Control / estado", "lluvia_y_viento_de_la_zona_por_evento_": "Lluvia y viento de la zona por evento (CHIRPS, ERA5)", "5_5_a_11_km": "5,5 a 11 km", "sin_dato": "sin dato", "trayectorias_de_ciclones": "Trayectorias de ciclones", "nudos": " nudos", "leve": "Leve", "media": "Media", "fuerte": "Fuerte" },
    "RG-06": { "respuesta_vacia": "respuesta vacía", "sin_dato_de_sismos_ni_volcanes_para_es": "Sin dato de sismos ni volcanes para esta zona.", "si": "sí", "sismos_registrados_cerca_usgs_desde_19": "Sismos registrados cerca (USGS, desde 1900)", "fecha": "Fecha", "magnitud": "Magnitud", "profundidad_km": "Profundidad (km)", "clase": "Clase", "distancia_km": "Distancia (km)", "lugar": "Lugar", "volcanes_a_menos_de_100_km": "Volcanes a menos de 100 km", "volcan": "Volcán", "pais": "País", "rumbo": "Rumbo", "ultima_erupcion": "Última erupción", "se_ve_desde_el_area": "Se ve desde el área", "cambio_del_area_ano_a_ano_alphaearth": "Cambio del área año a año (AlphaEarth)", "10_m": "10 m", "sin_dato": "sin dato", "sismos_tamano_segun_magnitud_color_seg": "Sismos (tamaño según magnitud, color según profundidad)", "superficial_menos_de_70_km_el_que_mas_": "Superficial (menos de 70 km): el que más se siente", "km_de_profundidad": " km de profundidad · ", "volcanes": "Volcanes", "con_erupcion_historica": "Con erupción histórica", "sin_erupcion_historica": "Sin erupción histórica", "relieve_sombreado": "Relieve (sombreado)" },
    "RG-07": { "respuesta_vacia": "respuesta vacía", "sin_dato_costero_para_esta_area": "Sin dato costero para esta área.", "km": " km", "m": " m", "del_lado_del": ", del lado del ", "distancia_al_mar": "Distancia al mar", "30_m": "30 m", "cambio_1984_2021_franja_de_1_km": "Cambio 1984-2021 (franja de 1 km)", "ciclon": "Ciclón", "fecha": "Fecha", "distancia_km": "Distancia (km)", "viento_nudos": "Viento (nudos)", "categoria": "Categoría", "que_tan_bajo_esta_respecto_al_mar": "Qué tan bajo está respecto al mar", "tierra_y_agua_1984_2021_landsat_jrc": "Tierra y agua 1984-2021 (Landsat, JRC)", "ciclones_a_menos_de_200_km": "Ciclones a menos de 200 km", "linea_10_40_km_de_error": "línea, 10-40 km de error", "manglar_en_2020": "Manglar en 2020", "10_m": "10 m", "tsunamis_medidos_a_menos_de_300_km": "Tsunamis medidos a menos de 300 km", "run_ups_de_tsunami_medidos": "Run-ups de tsunami medidos", "altura_de_ola_medida_run_up": "Altura de ola medida (run-up)", "zonas_bajo_5_m_sobre_el_geoide": "Zonas bajo 5 m sobre el geoide", "al_nivel_del_mar": "Al nivel del mar", "2_3_m": "2-3 m", "cerca_de_5_m": "Cerca de 5 m", "cambios_tierra_agua_1984_2021_jrc": "Cambios tierra-agua 1984-2021 (JRC)", "agua_permanente": "Agua permanente", "tierra_que_paso_a_agua": "Tierra que pasó a agua", "agua_que_paso_a_tierra": "Agua que pasó a tierra", "agua_estacional": "Agua estacional" },
    "PR-01": { "presencia_de_edificios_por_ano": "Presencia de edificios por año (Open Buildings, 4 m)", "techo_nuevo_por_ano": "Techo nuevo por año", "4_m_open_buildings": "4 m (Open Buildings)", "techo_que_aparece_por_primera_vez_cada": "Techo que aparece por primera vez cada año", "m2": "m²", "entre": "Entre", "cambio": "Cambio", "persistente": "Persistente", "coincide_con_alphaearth": "Coincide con AlphaEarth", "no_parpadeo": "no (parpadeo)", "si": "sí", "area_techada_total_por_ano": "Área techada total por año", "huellas_de_edificio_y_ano_de_aparicion": "Huellas de edificio y año de aparición", "4_m": "4 m (", "huellas_de_edificio": "Huellas de edificio", "en_o_antes_de_2016": "en o antes de 2016", "sin_fecha": "sin fecha", "techos_por_ano_de_aparicion": "Techos por año de aparición", "cruza_el_borde": "cruza el borde", "aparece": "Aparece", "altura_2023": "Altura 2023", "m": " m", "niveles": "Niveles", "area": "Área", "origen": "Origen", "estado": "Estado", "techos_por_niveles_compatibles_2023": "Techos por niveles compatibles (2023)", "3_o_mas_niveles": "3 o más niveles", "1_nivel": "1 nivel", "hasta_2_niveles": "hasta 2 niveles", "sin_altura": "sin altura", "cambio_de_aspecto_entre_anos_alphaeart": "Cambio de aspecto entre años (AlphaEarth)", "10_m": "10 m", "cambio_de_aspecto_marcado_entre": "Cambio de aspecto marcado entre: ", "ningun_par_de_anos_con_cambio_de_aspec": "Ningún par de años con cambio de aspecto sobre el umbral", "cambio_de_aspecto_alphaearth": "Cambio de aspecto (AlphaEarth)", "antes_de_2016_por_manzana": "Antes de 2016, por manzana", "100_m_ghsl_30_m_landsat": "100 m (GHSL) · 30 m (Landsat)", "epoca": "Época", "construido_en_100_m": "% construido en 100 m", "probabilidad_de_edificio": "Probabilidad de edificio ", "muy_probable": "muy probable", "altura_de_edificios": "Altura de edificios ", "0_m": "0 m", "6_m": "6 m", "12_m": "12 m", "presencia_de_edificios": "presencia de edificios", "open_buildings": " · Open Buildings" },
    "PR-02": { "altura_del_techo_por_ano": "Altura del techo por año", "4_m_open_buildings": "4 m (Open Buildings)", "ano": "Año", "techo": "Techo", "altura_mediana": "Altura mediana", "niveles": "Niveles", "sin_techo": "sin techo", "sin_imagen": "sin imagen", "m": " m", "radar_confirma": " (radar confirma)", "techos_por_niveles_compatibles": "Techos por niveles compatibles", "4_m": "4 m (", "techos_por_niveles": "Techos por niveles", "3_o_mas_niveles": "3 o más niveles", "1_nivel": "1 nivel", "hasta_2_niveles": "hasta 2 niveles", "sin_altura": "sin altura", "techos_por_niveles_compatibles_altura_": "Techos por niveles compatibles (altura de 2023)", "cruza_el_borde": "cruza el borde", "altura_p90": "Altura p90", "area": "Área", "origen": "Origen", "radar_sobre_el_techo_por_ano": "Radar sobre el techo por año", "10_m_sentinel_1": "10 m (Sentinel-1)", "sin_saltos_de_radar_entre_anos_la_estr": "Sin saltos de radar entre años: la estructura no cambió de forma apreciable", "radar_sobre_el_techo": "Radar sobre el techo", "comparacion_con_lo_declarado": "Comparación con lo declarado", "altura_de_edificios": "Altura de edificios ", "0_m": "0 m", "6_m": "6 m", "12_m": "12 m" },
    "PR-03": { "capas_municipales": "Capas municipales", "sin_informacion_no_vinieron_capas_del_": "sin información: no vinieron capas del municipio", "la_de_cada_capa": "la de cada capa", "sin_capas_con_geometria_legible": "Sin capas con geometría legible", "sin_informacion": " · Sin información: ", "rio_mas_cercano": "Río más cercano", "500_m_hydrosheds": "500 m (HydroSHEDS)", "cauce_derivado_del_relieve": "Cauce derivado del relieve", "450_m_celda_de_acumulacion": "450 m (celda de acumulación)", "areas_protegidas": "Áreas protegidas", "decenas_a_cientos_de_m_wdpa": "decenas a cientos de m (WDPA)", "area_protegida": "Área protegida", "designacion": "Designación", "distancia": "Distancia", "traslape": "Traslape", "m": " m", "marginal": " (marginal)", "rio_mas_cercano_hydrosheds_500_m": "Río más cercano (HydroSHEDS, ±500 m)", "rio_hydrosheds_ubicacion_aproximada_50": "río HydroSHEDS (ubicación aproximada ±500 m)", "orden_de_rio": "Orden de río", "precision": "Precisión", "areas_protegidas_wdpa": "Áreas protegidas (WDPA)", "area_protegida_2": "área protegida", "fuente": "Fuente", "dentro_del_retiro": "dentro del retiro", "traslape_con_la_capa": "traslape con la capa", "traslapes_con_capas_municipales": "Traslapes con capas municipales", "capa": "Capa", "retiro": "Retiro", "superficie": "Superficie" },
    "PR-04": { "puntos_a_revisar": "Puntos a revisar", "el_dibujo_del_poligono": "El dibujo del polígono", "metros_proyeccion_local": "metros (proyección local)", "aviso": "Aviso", "donde": "Dónde", "sugerencia": "Sugerencia", "vertice": "vértice ", "techos_y_borde_del_area": "Techos y borde del área", "1_4_m_de_borde": "1-4 m de borde (", "techo": "Techo", "sale_hacia": "Sale hacia", "m2_fuera": "m² fuera", "predios_vecinos": "Áreas vecinas", "sin_informacion": "sin información", "techo_dentro_del_area": "techo dentro del área", "cruza_el_borde": "cruza el borde", "techo_que_sale_del_area": "techo que sale del área", "techos_respecto_al_borde": "Techos respecto al borde", "relacion": "Relación", "sale_del_area": "sale del área", "m2_dentro": "m² dentro", "fuente": "Fuente", "se_monta_con_un_vecino": "se monta con un vecino", "franja_entre_dibujos": "franja entre dibujos", "traslapes_y_franjas_con_vecinos": "Traslapes y franjas con vecinos", "vecino": "Vecino", "traslape": "Traslape", "separacion": "Separación", "m": " m" },
    "PR-05": { "construccion": "construcción", "movimiento_de_tierra": "movimiento de tierra", "parches_con_cambio": "Parches con cambio", "primer_mes": "Primer mes", "tipo": "Tipo", "m2": "m²", "del_area": "% del área", "confianza": "Confianza", "meses": "Meses", "persistencia": "Persistencia", "cambio_general_no_es_alerta": "Cambio general (no es alerta)", "10_m": "10 m", "meses_comparados": "Meses comparados", "10_m_sentinel_2": "10 m (Sentinel-2)", "radar": "Radar", "10_m_sentinel_1": "10 m (Sentinel-1)", "parches_con_cambio_por_tipo": "Parches con cambio por tipo", "superficie": "Superficie", "meses_con_cambio": "Meses con cambio", "lectura": "Lectura", "parches_por_primer_mes_visto": "Parches por primer mes visto", "primer_mes_con_cambio_raster": "Primer mes con cambio (ráster)" },
    "PR-06": { "imagenes_por_fecha": "Imágenes por fecha", "ninguna_fecha_con_imagen_despejada_sob": "Ninguna fecha con imagen despejada sobre el área de interés", "imagenes_del_area_de_interes_por_fecha": "Imágenes del área de interés por fecha", "10_m_sentinel_2_30_m_landsat": "10 m (Sentinel-2) · 30 m (Landsat)", "fecha_pedida": "Fecha pedida", "imagen": "Imagen", "satelite": "Satélite", "resolucion": "Resolución", "escenas": "Escenas", "despejado": "Despejado", "m": " m", "sin_imagen": "sin imagen", "escena": " escena", "despejado_2": " despejado", "imagen_2": "Imagen ", "fechas_sin_imagen": "Fechas sin imagen" },
  },
  tema: { claro: "Cambiar a tema claro", oscuro: "Cambiar a tema oscuro" },
  ayuda: {
    boton: "Qué estoy viendo", titulo: "Qué estoy viendo", queVes: "En pocas palabras", colores: "Qué significan los colores",
    palabras: "Palabras que va a encontrar", dato: "De dónde sale este dato", noDice: "Qué no dice esta lámina", volver: "Volver a la lámina",
    // Un texto por lámina, con la clave «CÓDIGO.grupo». Sin texto no aparece el botón. Se explica qué se ve, nunca qué conclusión sacar.
    laminas: {
      "PR-01.huellas_anio": {
        queVes: [
          "Cada figura es el techo de una construcción que el satélite ve hoy dentro o junto al área de interés. El color indica el primer año en que ese techo aparece en las imágenes y se mantiene.",
          "Es el año en que se ve, no el año en que se construyó. Las imágenes tienen un margen de más o menos un año, y una construcción muy pequeña o tapada por árboles puede aparecer tarde o no aparecer.",
          "No dice quién construyó, quién vive ahí ni desde cuándo. Solo muestra cuándo se ve el techo."
        ],
        colores: "Cada color es un año distinto. Los años salen de la propia imagen, por eso la lista cambia de un análisis a otro.",
        clases: {
          "en o antes de 2016": "el techo ya se veía en la primera imagen (2016). No se sabe cuánto tiempo antes existía.",
          "sin fecha": "se ve una construcción hoy, pero no se pudo fechar el año en que apareció."
        },
        terminos: [
          { t: "Techo", d: "Lo que el satélite ve desde arriba. Una casa, una bodega o un galpón se ven como techo; no se distingue para qué se usa." },
          { t: "Qué tan pequeño se ve", d: "El detalle es de unos 4 m. Una construcción menor de unos 30 m², de lámina o bajo árboles, puede no verse." }
        ]
      },
      "PR-01.imagenes": {
        queVes: [
          "Cada imagen muestra, para un año, dónde el satélite calcula que hay edificios. No son fotografías: es un cálculo hecho a partir de imágenes de satélite.",
          "Toque las imágenes una por una para ver cómo fue apareciendo o creciendo lo construido, año tras año.",
          "Los tonos van del amarillo (probable) al rojo oscuro (muy probable). Donde no hay color, no se detecta edificio."
        ],
        terminos: [
          { t: "Detalle", d: "Cada punto del cálculo mide unos 4 m. Los techos pequeños pueden no aparecer." },
          { t: "Un año suelto", d: "La confianza de estos cálculos no está medida con exactitud: conviene fijarse en la tendencia de varios años y no en un solo año." }
        ]
      },
      "PR-02.techos_niveles": {
        queVes: [
          "Son los mismos techos, pero pintados según cuántos pisos serían compatibles con la altura que se midió en 2023.",
          "Se calcula con unos 3 m por piso. La altura tiene un error de alrededor de 1 m en techos de hasta 5 m, y de 1,6 m entre 5 y 20 m.",
          "Por eso se dice «compatible con» y nunca «tiene»: los pisos no se cuentan, se deducen de la altura."
        ],
        clases: {
          "1 nivel": "la altura es compatible con un piso.",
          "hasta 2 niveles": "la altura es compatible con uno o dos pisos; el margen de error no deja precisar más.",
          "3 o más niveles": "la altura es compatible con tres pisos o más.",
          "sin altura": "se ve el techo, pero la fuente no trae su altura."
        },
        terminos: [
          { t: "Altura mediana", d: "El valor del medio entre todas las alturas medidas sobre un mismo techo. Es más estable que mirar un solo punto." },
          { t: "El techo crece o se reduce", d: "Se anota cuando entre dos años la altura sube o baja 2,5 m o más, o el área del techo cambia 25 % o más. Es un aviso de cambio, no una prueba de obra." }
        ]
      },
      "PR-06.imagenes": {
        queVes: [
          "Son imágenes de satélite del área de interés en distintos años, para comparar el antes y el después a simple vista.",
          "Cada una junta las tomas despejadas del año y deja fuera las nubes y las sombras.",
          "Desde 2017 se usa Sentinel-2, donde cada punto de la imagen mide 10 m. Antes se usa Landsat, con puntos de 30 m: en un área pequeña quedan pocos puntos y no se distingue qué hay."
        ],
        terminos: [
          { t: "Escenas", d: "Cuántas tomas del satélite se juntaron para armar la imagen de ese año." },
          { t: "Despejado", d: "Qué parte del área de interés quedó sin nubes ni sombras en esa imagen." },
          { t: "Fechas sin imagen", d: "Años en que no hubo ninguna toma despejada. No quiere decir que no haya pasado nada: quiere decir que no se pudo ver." }
        ]
      },
      "RG-01.rio_mas_cercano": {
        queVes: [
          "La línea es el río o la quebrada más cercano al área de interés según un mapa mundial de ríos (HydroSHEDS). Puede estar lejos y quedar fuera del mapa; la distancia aparece en el texto.",
          "Ese mapa tiene un error de hasta unos 500 m, así que la posición es aproximada, y no incluye las quebradas pequeñas.",
          "Junto a la distancia se estima cuánto más alto está el área que el río, con un relieve de 30 m. Es una estimación, no un estudio de agua."
        ],
        clases: {
          "Cauce según HydroSHEDS (ubicación aproximada)": "la línea del río o quebrada más cercano; su posición puede estar corrida hasta unos 500 m."
        },
        terminos: [
          { t: "Orden del cauce", d: "Un número que dice qué tan grande es el río: 1 es el más grande, y cuanto más alto el número, más pequeño el cauce." },
          { t: "Altura sobre el río", d: "Cuánto más alto está el área de interés que el cauce más cercano. Los bordos, los diques y los canales no se consideran." }
        ]
      },
      "RG-03.quema": {
        queVes: [
          "Una «cicatriz de quema» es una zona donde el satélite ve que la vegetación se secó o se quemó, al comparar una imagen de antes con una de después de un foco de calor o de un área quemada detectada.",
          "Cada fecha de la leyenda es una quema distinta. Solo se dibuja la parte que cae dentro del área de interés, con un detalle de 20 m.",
          "Si no hubo foco de calor ni área quemada cerca de esa fecha, el cambio se anota como «cambio de cobertura sin fuego confirmado»: otras causas, como una plaga en el pino, se ven parecido."
        ],
        colores: "Cada color es una quema en una fecha distinta. La fecha es la de la imagen en que se ve la cicatriz, no necesariamente el día del fuego.",
        terminos: [
          { t: "Foco de calor", d: "Un punto donde un satélite detectó mucho calor en un día. Ubica el fuego con un error de 375 m a 1 km: indica que ardió cerca, no necesariamente dentro del área de interés." },
          { t: "Área quemada de 25 ha", d: "Un mapa de celdas grandes que marca los meses en que algo se quemó. Sirve de contexto: describe la celda, no el área que usted dibujó." }
        ]
      },
      "PR-05.parches": {
        queVes: [
          "Cada mancha de color es un «parche»: un pedazo del área de interés donde la imagen del satélite cambió y se mantuvo distinta. Un cambio cuenta solo si se ve en al menos dos meses y en la mayor parte de los meses revisados después.",
          "El satélite compara cada mes con el mismo mes de dos años anteriores. Así, el pasto que se seca en verano o reverdece con las lluvias no se confunde con una obra.",
          "Solo se dibujan parches de unos 200 m² o más. Un cambio más pequeño no aparece aquí, aunque exista."
        ],
        clases: {
          "construcción": "las señales son compatibles con una construcción nueva o con un techo. No confirma una obra: es lo que el satélite ve.",
          "movimiento de tierra": "compatible con suelo que quedó descubierto o removido, por ejemplo tierra expuesta después de quitar la vegetación.",
          "desmonte": "compatible con que se quitó la vegetación (monte, árboles o cultivo). No dice por qué se quitó.",
          "indeterminado": "hubo un cambio, pero las señales no forman un patrón claro. No se puede decir qué fue."
        },
        terminos: [
          { t: "Confianza", d: "Aparece al tocar un parche. Es «alta» cuando varias señales de la imagen coinciden y el radar las confirma, «media» cuando coinciden menos y «baja» cuando hay pocas. Cuenta cuántas señales coinciden; no dice si algo ocurrió de verdad en el sitio." },
          { t: "Persistencia", d: "De todos los meses revisados desde que apareció el cambio, el porcentaje en que se siguió viendo." },
          { t: "Primer mes", d: "El primer mes en que el satélite vio el cambio. No es la fecha exacta en que ocurrió: pudo pasar antes, y las nubes pueden retrasar el momento en que se ve." },
          { t: "Radar", d: "Un segundo satélite que ve a través de las nubes y detecta estructuras nuevas o zonas despejadas. Se usa para confirmar lo que la imagen normal sugiere." }
        ]
      },
      "PR-05.parches_fecha": {
        queVes: [
          "Son los mismos parches de la lámina anterior, pero cada color indica el mes en que el satélite los vio por primera vez.",
          "Sirve para ver en qué orden fue apareciendo el cambio, no para saber cuándo ocurrió exactamente."
        ],
        colores: "Los colores van del más claro (los primeros meses) al más oscuro (los más recientes).",
        terminos: [
          { t: "Primer mes", d: "El primer mes en que el satélite vio el cambio. No es la fecha exacta en que ocurrió: pudo pasar antes, y las nubes pueden retrasar el momento en que se ve." }
        ]
      }
    }
  },
  atlas: {
    titulo: "Atlas del área de interés", subtitulo: "Evidencia satelital con fecha y fuente",
    cabecera: "Área de {area} · {lugar}{fecha} · {n} láminas", fechaDe: "analizado el ", laminasN: "{n} láminas",
    portada: "Portada", contraportada: "Contraportada", lamina: "Lámina", laminaDe: "Lámina {n} de {m}", indice: "Índice de láminas",
    esencial: "Lo esencial", comoLeer: "Cómo leer este atlas",
    comoLeerTexto: ["Cada lámina responde una pregunta con una sola capa de mapa, su leyenda y el hallazgo en lenguaje común.", "Todo dato lleva su fecha y su fuente; la escala indica el tamaño mínimo que la fuente puede distinguir.", "Al pie de cada lámina se dice qué no afirma la evidencia. No es dictamen, peritaje ni certificación."],
    situacion: "Mapa de situación", verArea: "Encuadrar el área", hallazgo: "Hallazgo", leyenda: "Leyenda", grafica: "Gráfica", tabla: "Datos", notas: "Notas del cartógrafo", noDice: "Qué no dice",
    secundarias: "Otras capas de esta lámina", fuente: "Fuente", escala: "Escala del dato", observado: "Observado entre {desde} y {hasta} ({n} registros)", metodo: "Método",
    imagenes: "Imágenes por fecha", verEnMapa: "Ver en el mapa", imagenGrande: "Ampliar la imagen",
    fuentes: "Fuentes y fechas", fuentesCols: ["Fuente", "Detalle", "Periodo", "Licencia"], limites: "Límites de la evidencia", sinDatoTitulo: "Partes sin dato", sinDato: "Sin dato: {motivo}", errores: "Servicios que no respondieron",
    pdf: "Guardar en PDF", nuevo: "Nuevo análisis", volverPortada: "Volver a la portada", anterior: "Lámina anterior", siguiente: "Lámina siguiente", irIndice: "Ir al índice", cerrar: "Cerrar",
    pie: "Evidencia satelital con fecha y fuente; no es dictamen, peritaje ni certificación.", generado: "Atlas generado por Espacial HN el {fecha}", editor: "Espacial HN · Inteligencia territorial",
    noExiste: "Este atlas ya no está disponible en este navegador. Haga un nuevo análisis.", cargando: "Abriendo el atlas…", deslizar: "Deslice hacia los lados para cambiar de lámina",
    empezar: "Empezar", anteriorCorto: "Anterior", siguienteCorto: "Siguiente", pistaTeclado: "También puede cambiar de lámina con las flechas ← → del teclado.", pistaToque: "También puede deslizar el dedo hacia los lados para cambiar de lámina.",
    tipos: { mapa: "Mapa", grafica: "Gráfica", imagenes: "Imágenes" }
  },
  guia: {
    abrir: "Visita guiada", atras: "Atrás", continuar: "Continuar", terminar: "Terminar", saltar: "Saltar", pasoDe: "Paso {n} de {m}",
    herramienta: [
      { t: "Visita guiada", d: "En cinco pasos le mostramos cómo marcar su área de interés y pedir el análisis. Puede saltarla cuando quiera y volver a verla con el botón de ayuda." },
      { t: "Aquí se marca el área", d: "Este es el mapa donde se dibuja el área de interés. Acérquese hasta ver el lugar que le interesa, con los botones + y − o con los dedos." },
      { t: "Encuentre el lugar", d: "Escriba el nombre de un lugar o pegue unas coordenadas, y el mapa lo lleva hasta allí." },
      { t: "Dibuje el área", d: "Pulse «Dibujar», toque en el mapa las esquinas de su área y cierre tocando el primer punto. «Deshacer» quita el último punto y «Borrar» empieza de nuevo." },
      { t: "Elija qué quiere saber", d: "Marque una o varias tarjetas. Cada una trae un conjunto de láminas con evidencia satelital. Las que dicen «próximamente» todavía no están disponibles." },
      { t: "Pida el análisis", d: "Con el área dibujada y al menos una tarjeta marcada, pulse «Analizar ahora». Tarda entre medio minuto y tres minutos; verá el avance de cada parte y, al terminar, se abre el atlas." }
    ]
  },
  comunes: { cargando: "Cargando…", cerrar: "Cerrar", mas: "Más", menos: "Menos", si: "Sí", no: "No", ok: "Entendido",
    sinBloque: "El servicio no devolvió esta parte", sinDatoServicio: "Sin dato: el servicio no pudo calcular esta parte", errorLectura: "No se pudo leer la respuesta del servicio", errorServicio: "El servicio no respondió" }
};
