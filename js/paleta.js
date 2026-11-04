/* Paleta de datos: colores con significado, los mismos en el mapa, la leyenda y la gráfica. Los lectores solo
   usan estas funciones; nunca un hex suelto. Legible sobre satélite y sobre calles. */
window.ESP = window.ESP || {};
ESP.paleta = {
  marca: "#185c7d", acento: "#f2a516", neutro: "#9ca3af", tinta: "#111417",
  agua: "#1d4ed8", aguaSuave: "#93c5fd", fuego: "#b91c1c", fuegoSuave: "#fca5a5", suelo: "#b45309", vegetacion: "#15803d",
  ok: "#1f7a4d", aviso: "#b7791f", malo: "#a23b2a",
  // 2 a 9 clases ordenadas (claro → oscuro), para años o intensidades
  secuencial(n) {
    const base = ["#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a"];
    if (n <= 1) return [base[6]];
    const out = []; for (let i = 0; i < n; i++) out.push(base[Math.round(i * (base.length - 1) / (n - 1))]); return out;
  },
  // Años: de frío (antiguo) a cálido (reciente); devuelve {anio: color}
  anios(lista) {
    const rampa = ["#1e3a8a", "#1d4ed8", "#0ea5e9", "#14b8a6", "#84cc16", "#eab308", "#f97316", "#dc2626", "#7f1d1d"];
    const a = [...new Set(lista.filter(x => x != null))].sort((p, q) => p - q);
    const m = {}; a.forEach((y, i) => { m[y] = a.length === 1 ? rampa[4] : rampa[Math.round(i * (rampa.length - 1) / (a.length - 1))]; }); return m;
  },
  // Clases nominales conocidas (tipos de alerta, coberturas); lo que no esté aquí recibe neutro
  clases: {
    construccion: "#dc2626", movimiento_tierra: "#f97316", desmonte: "#84cc16", indeterminado: "#9ca3af",
    dentro: "#185c7d", "cruza el borde": "#b91c1c", fuera: "#9ca3af",
    water: "#1d4ed8", trees: "#166534", grass: "#84cc16", crops: "#eab308", shrub_and_scrub: "#a3a3a3", built: "#7c2d12", bare: "#d6a26a", flooded_vegetation: "#0d9488",
    baja: "#fde68a", media: "#f59e0b", alta: "#b91c1c", "moderada-baja": "#f59e0b", "moderada-alta": "#ea580c"
  },
  de(clase) { return this.clases[clase] || this.neutro; },
  // Niveles (1, 2, 3+)
  niveles: { 1: "#bfdbfe", 2: "#3b82f6", 3: "#1e3a8a" },
  deNiveles(n) { return n == null ? this.neutro : (this.niveles[Math.min(3, Math.max(1, n))]); }
};
