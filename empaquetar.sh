#!/usr/bin/env bash
# Arma dist/ con lo que el hosting necesita servir y nada más. Sin bundler (regla 9): solo copia.
# Quedan fuera pruebas, fixtures, documentación, capturas, bocetos y lo `.deprecated`.
set -euo pipefail
cd "$(dirname "$0")"

rm -rf dist && mkdir dist
cp index.html dist/
cp -r css img lib dist/
cp -r js dist/js

# Dentro de js/: solo código que corre en el navegador del visitante.
find dist/js -type f \( -name 'pruebas-*' -o -name 'fixtures.json' -o -name '*.md' -o -name '*.deprecated' -o -name 'config-local.js' \) -delete

echo "dist/ listo: $(find dist -type f | wc -l) archivos, $(du -sh dist | cut -f1)"
