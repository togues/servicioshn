/* Tema claro / oscuro. Sin elección guardada, sigue al sistema (los tokens ya lo hacen con prefers-color-scheme).
   La elección se guarda en localStorage y se aplica en <html data-theme> antes de pintar, para que no parpadee. */
window.ESP = window.ESP || {};
ESP.tema = (function () {
  const CLAVE = "esp-tema";
  const leer = () => { try { return localStorage.getItem(CLAVE) || ""; } catch { return ""; } };
  const aplicar = v => { if (v === "dark" || v === "light") document.documentElement.setAttribute("data-theme", v); else document.documentElement.removeAttribute("data-theme"); document.dispatchEvent(new CustomEvent("esp:tema", { detail: { tema: actual() } })); };
  const actual = () => { const d = document.documentElement.getAttribute("data-theme"); if (d) return d; return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; };
  aplicar(leer());
  document.addEventListener("DOMContentLoaded", () => { const sitio = document.getElementById("tema-sitio"); if (sitio) sitio.append(ESP.tema.boton("btn btn-icono")); });
  return {
    actual,
    alternar() { const v = actual() === "dark" ? "light" : "dark"; try { localStorage.setItem(CLAVE, v); } catch { /* nada */ } aplicar(v); return v; },
    // Botón listo para poner en cualquier barra: cambia su icono y su etiqueta accesible con el tema
    boton(clase) {
      const t = () => (ESP.t && ESP.t().tema) || { claro: "Tema claro", oscuro: "Tema oscuro" };
      const b = document.createElement("button"); b.type = "button"; b.className = clase || "btn";
      const pintar = () => { const osc = actual() === "dark"; b.innerHTML = `<span class="ms" aria-hidden="true">${osc ? "light_mode" : "dark_mode"}</span>`; b.setAttribute("aria-label", osc ? t().claro : t().oscuro); b.title = b.getAttribute("aria-label"); };
      b.addEventListener("click", () => { ESP.tema.alternar(); });
      document.addEventListener("esp:tema", pintar); pintar();
      return b;
    }
  };
})();
