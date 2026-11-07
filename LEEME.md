# Plataforma de servicios Espacial HN (front)

Sitio público más asistente de análisis: la persona dibuja un área de interés, elige qué quiere saber y recibe el resultado en lenguaje común, con mapa, frases, imágenes por fecha y PDF. Pensado para gente que no sabe de SIG. Vanilla JS, sin build: se abre con `index.html` desde cualquier servidor estático. Claude Code lo empaqueta (minificar, hashes, `dist/`) sin cambiar la estructura.

## Carpeta

- `index.html` — el único HTML: cabecera, `<main id="vista">`, pie, y la lista de scripts en orden.
- `css/tokens.css` — colores, tipografía y espacios de Espacial HN (los del geoportal). Las pantallas solo usan tokens.
- `css/base.css` — reset, botones, chips, avisos, spinner. `css/sitio.css` — cabecera, portada, catálogo, ficha, pie. `css/asistente.css` — el asistente de análisis. `css/mapa.css` — el control «Mi ubicación» del mapa de dibujo. `css/atlas.css` — portada, láminas, contraportada, barra, índice emergente e impresión A4 apaisada.
- `js/config.js` — URLs de los servicios y reglas de tamaño. Es lo único que cambia entre implementación (Cloud Run directo) y producción (`usarOrquestador: true` → PHP con el secreto).
- `js/i18n/es.js` — TODO el texto visible. Otro idioma = copiar, traducir, registrar en `config.idioma`.
- `js/catalogo.js` — las nueve tarjetas y las APIs que llama cada una; `disponible(codigo)` decide qué se puede ejecutar hoy.
- `js/paleta.js` — colores con significado para mapa, leyenda y gráficas.
- `js/lectores/<codigo>.js` — uno por API: traduce la respuesta cruda a `{frase, hallazgos, capas, galeria, fuentes, limites}`. Contrato en `js/lectores/CONTRATO.md`. Es el único lugar que «entiende» una API.
- `js/validar.js` — validación del polígono en el navegador (vértices, cruces, área, rangos).
- `js/mapa.js` — Leaflet + Geoman, dibujo, buscador, bases.
- `js/asistente/` — el asistente de análisis (`#/analizar/0…6`): `estado.js` (estado del flujo y condiciones de entrada, lógica pura), `vista.js` (pasos 0 a 3), `cartelera.js` (paso 4), `analisis.js` (pasos 5 y 6), `movimiento.js` (malla de relieve de la bienvenida, píxeles de satélite del análisis y entradas suaves; sin librerías nuevas, con movimiento reducido se queda fijo). `js/herramienta.js` — solo las llamadas en paralelo con progreso (`llamar`, `correr`). `js/componentes/hoja.js` — hoja inferior arrastrable, independiente (hoy sin uso en el sitio; tiene su prueba y su skill).
- `js/generar-posters.cjs` — genera los pósteres de la cartelera (`img/posters/*.webp`) desde los fixtures; se corre una vez y se versiona.
- `js/almacen.js` — `ESP.resultados`: memoria → IndexedDB (últimos 20 atlas, sobrevive al cierre de la pestaña) → sessionStorage de respaldo.
- `js/tema.js` — tema claro/oscuro (`data-theme` en `<html>`, recordado en localStorage; sin elección sigue al sistema). Botón en la cabecera y en la barra del atlas.
- `js/atlas/laminas.js` — lógica pura (se prueba en Node): reparte las lecturas en láminas. Una lámina = una pregunta = una capa protagonista (o un grupo de capas hermanas); rásteres como secundarias apagadas; lecturas sin mapa → lámina de gráfica; galería → lámina de imágenes. Ver las reglas en el encabezado del archivo y las claves opcionales `hallazgos`, `lamina`, `tituloLamina` en `lectores/CONTRATO.md`.
- `js/atlas/graficas.js` — creador de nodos, gráfica SVG, leyenda y tabla.
- `js/atlas/vista.js` — portada (mapa de situación, lo esencial, índice), láminas, contraportada, barra de controles, índice emergente, teclado (← → Inicio Fin), deslizar en celular, transiciones con GSAP (ninguna con `prefers-reduced-motion`), impresión. Todas las páginas se construyen de una vez en una pila; solo la actual es visible (las demás `visibility:hidden`, con tamaño, para que sus mapas carguen y se impriman).
- `js/informe.js.deprecated` — la pantalla «Resultado» anterior, sustituida por el atlas.
- `js/vistas.js` — portada, catálogo y ficha. `js/router.js` — rutas por hash. `js/app.js` — utilidades (idioma, números, menú móvil).
- `img/logo.svg` — MARCADOR: sustituir por el logo oficial (caja 64×64).

## Rutas

`#/` portada · `#/servicios?p=alcaldias` catálogo · `#/servicio/predio` ficha · `#/analizar[/<0-6>][?t=predio,riesgo]` asistente de análisis (un paso por pantalla) · `#/informe/<id>/<n>` atlas (n: 0 portada, 1…N láminas, N+1 contraportada; el router no reconstruye el atlas al cambiar de lámina).

## Reglas que no se negocian

- Lo que la persona dibuja es el **área de interés**; nunca «lote», «predio» ni «terreno» en la interfaz (salvo el nombre del producto «Historial del predio»).
- Evidencia, nunca veredicto. Palabras prohibidas en todo texto: prueba de posesión, años de posesión, dictamen, zona de riesgo, apto/no apto, certificación, invasión.
- El front dibuja lo que la API trae; no calcula ni inventa rangos. Las leyendas salen de los valores presentes en los datos.
- Sin nombres de personas ni datos financieros. Sin secretos en el navegador.
- Toda capa ráster que se pinte viene recortada desde la API (costo de Earth Engine).

## Pruebas locales

`js/lectores/pruebas-rg.html`, `js/lectores/pruebas-pr.html` y `js/pruebas-hoja.html` corren sin red (librerías en `lib/`, APIs simuladas). `capturas/` guarda las vistas a 1500 y 400 px.

## Para Claude Code (empaquetado)

1. Minificar y concatenar los JS en el orden de `index.html`; CSS igual. Mantener `config.js` aparte (cambia por entorno).
2. Copiar Leaflet y Geoman a `lib/` si se quiere servir sin CDN.
3. `dist/` con `index.html`, `app.min.js`, `estilos.min.css`, `config.js`, `img/`, `lib/`.
4. Pruebas: abrir `dist/index.html`, recorrer las cinco pantallas a 1500 y 400 px, dibujar un polígono, analizar contra las URLs reales.
5. Publicar en el hosting cPanel (skill `publicar-en-hosting`).

## Auditoría del 3 de noviembre de 2026

GSAP 3.12.5 se carga de cdnjs con copia local en `lib/gsap.min.js` (misma política que Leaflet). Pruebas: `node js/pruebas-estado.cjs` (estado del asistente), `pruebas-laminas.cjs` (reparto con fixtures), `pruebas-asistente.cjs` (cada caso de ASISTENTE.md y capturas por paso), `pruebas-e2e.cjs` (portada → asistente → atlas a 1500 y 400 px, teclado, índice, impresión) y `pruebas-hoja.cjs` (la hoja inferior con gestos de toque). Las que usan navegador comparten `pruebas-comun.cjs`.

Un revisor independiente encontró 16 hallazgos (3 bloqueantes: XSS en popups y nombres de capa, URLs sin validar, navegación secuestrada al salir durante un análisis). Todos aplicados y verificados con `js/pruebas-e2e.cjs` y las pruebas del auditor. Quedan como mejora: unas pocas palabras dentro de plantillas interpoladas de PR-05 y RG-01 que no están en i18n; «Copiar enlace» vuelve cuando el orquestador PHP persista los informes; `metadata.alcance` no se usa para priorizar frases; los lectores ignoran algunas claves secundarias de las APIs (varas² en alertas, huellas por origen, etc.) que el front puede mostrar más adelante.
