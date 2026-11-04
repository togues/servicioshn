# Lectores: de la respuesta cruda de una API al lenguaje común

Un lector es el único lugar donde el front «entiende» una API. Recibe la respuesta JSON tal como la devuelve Cloud Run y devuelve una lectura lista para dibujar. El resto del front (herramienta, informe, PDF) no sabe nada de `stats`, bandas ni umbrales: solo dibuja lo que el lector le entrega. Por eso cada API tiene su lector y no hay un molde único: cada una conserva su forma.

Regla de oro: el lector **traduce y ordena, no calcula ni interpreta**. Las frases salen de `lectura`, `nota`, `observado` y `etiquetas` que la API ya trae; el lector las junta, las pone en el orden que ayuda al lector humano y arma la leyenda a partir de los atributos que vienen en los vectores. Nunca inventa un umbral, un rango ni un color con significado que la API no respalde. Si un dato no vino, se dice «sin dato» con el motivo que la API dio en `metadata.faltantes`.

## Registro

Un archivo por API en `js/lectores/<codigo>.js` (por ejemplo `RG-01.js`), que se registra así:

```js
ESP.lectores["RG-01"] = {
  codigo: "RG-01",
  leer(resp, ctx) { /* ... */ return lectura; }
};
```

`resp` es el JSON completo de la API (`status`, `result_key`, `vectors`, `tile_url`, `stats`, `metadata`). `ctx` trae `{ t, idioma, areaM2, aoi }` donde `t` es el diccionario de idioma (`ESP.i18n[idioma]`).

## Lo que devuelve `leer`

```js
{
  codigo: "RG-01",
  titulo: "Inundaciones históricas",              // de t.apis[codigo].nombre
  estado: "ok" | "parcial" | "error",             // de resp.status
  frase: "…",                                      // UNA frase en llano: lo más importante que encontró. Sale de las `lectura` de la API.
  hallazgos: [                                     // bloques en el orden que ayuda a leer; cada uno es un `stats.<bloque>`
    { id: "jrc", titulo: "Agua observada 1984-2021", texto: "…lectura de la API…", nota: "…nota de la API…",
      observado: { desde, hasta, cantidad, revisados },   // tal cual
      escala: "30 m",                                      // de metadata.fuentes o fijo por bloque
      serie: { titulo, unidad, x, y, puntos: [{x, y, etiqueta?}] } | null,   // de `etiquetas` + la lista a la que apunta `serie`
      tabla: { columnas: [...], filas: [[...]] } | null,                      // solo cuando el texto no alcanza
      sinDato: "motivo" | null }
  ],
  capas: [                                         // lo que va al mapa, listo para Leaflet
    { id: "jrc_agua", titulo: "Agua episódica (JRC)", tipo: "vector",
      geojson: {type: "FeatureCollection", features: [...]},   // filtrado por `properties.capa`
      estilo: (feature) => ({ color, fillColor, weight, fillOpacity, dashArray }),
      leyenda: [ { color: "#1d4ed8", etiqueta: "2016" }, ... ],   // SOLO clases que existen en los datos devueltos
      popup: (feature) => "html corto con los atributos que importan",
      // Opcionales, para el atlas (js/atlas/laminas.js): qué bloques de texto van en la lámina de esta capa, y con
      // qué otras capas comparte lámina (cicatrices de varias fechas → una sola lámina). Sin `lamina`, las capas se
      // agrupan por su id sin el último tramo con dígitos; sin `hallazgos`, la primera lámina de la lectura lleva todo.
      hallazgos: ["jrc"], lamina: "radar", tituloLamina: "Tormentas vistas por radar" },
    { id: "s1_2020", titulo: "Agua con Iota (radar)", tipo: "tile", url: resp.tile_url["s1_2020-11-18"], opacidad: .7, leyenda: [...] }
  ],
  galeria: [ { titulo: "2018", sub: "Sentinel-2 · 10 m · 15 escenas", url: thumb_url, aviso?: "…" } ],   // solo PR-01, PR-06 y quien traiga imágenes
  fuentes: resp.metadata.fuentes,                  // tal cual
  limites: resp.metadata.limites,                  // tal cual, texto
  aviso: resp.metadata.aviso || null,
  faltantes: resp.metadata.faltantes || [],
  duracionS: resp.metadata.duracion_s
}
```

## Reglas de redacción

- `frase` es una sola oración, sin jerga, sin claves del JSON, con números redondeados y unidades («el 12 % del área», «unos 3.000 m²»). Si la API trae una `lectura` general, se usa esa. Si trae varias por bloque, se elige la del bloque que más importa (la de alcance «terreno» antes que la de «zona»).
- Cada hallazgo usa la `lectura` de su bloque; si el bloque no trae `lectura`, se arma con sus cifras principales y nada más.
- Los números con separador de miles con punto («1.240 m²»), decimales con coma, varas² cuando la API las trae.
- Palabras prohibidas en todo texto del front: «prueba de posesión», «años de posesión», «dictamen», «zona de riesgo», «apto», «no apto», «certificación», «invasión». Si la API las trae negadas («no es dictamen…»), se conservan tal cual.
- `leyenda` se construye a partir de los valores que realmente aparecen en `vectors` (por ejemplo, los años de `anio_aparicion` presentes), nunca de una lista fija.
- Colores: usar `ESP.paleta` (en `js/paleta.js`): `secuencial(n)`, `anios(lista)`, `clases(['construccion','movimiento_tierra',…])`, `agua`, `fuego`, `alerta`. No hex sueltos en los lectores.

## Lo que el lector NO hace

- No pide nada a la red. No llama a Earth Engine. No descarga miniaturas (eso lo hace el informe al imprimir).
- No decide colores de marca ni tipografía.
- No escribe tutoriales: la guía del servicio vive en la ficha (`i18n`), no en el lector.
