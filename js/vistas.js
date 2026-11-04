/* Vistas del sitio: portada, catálogo de servicios y ficha. La herramienta y el informe están en
   herramienta.js e informe.js. Todo texto sale de i18n; aquí solo estructura. */
window.ESP = window.ESP || {}; ESP.vistas = ESP.vistas || {};
(function () {
  const U = ESP.util, esc = s => U.esc(s), ic = n => U.icono(n);
  const t = () => ESP.t();

  function tarjetaHtml(tj, modo) {
    const T = t().tarjetas[tj.id] || {}, S = t().servicios;
    const disp = tj.apis.filter(a => ESP.catalogo.disponible(a)).length, total = tj.apis.length;
    const estado = disp ? `<span class="chip ok">${esc(S.disponible)}</span>` : `<span class="chip next">${esc(S.proximamente)}</span>`;
    return `<article class="tarjeta" data-id="${tj.id}">
      <div class="tarjeta-h">${ic(tj.icono)}${estado}</div>
      <h3>${esc(T.nombre)}</h3>
      <p class="pregunta">${esc(T.pregunta)}</p>
      <p class="corta">${esc(T.corta)}</p>
      <div class="tarjeta-a">
        <a class="btn btn-s" href="#/servicio/${tj.id}">${esc(S.ficha)}</a>
        ${disp ? `<a class="btn btn-p" href="#/analizar?t=${tj.id}">${esc(S.analizar)}</a>` : ""}
      </div>
      ${modo === "compacto" ? "" : `<small class="apis">${disp}/${total} ${esc(t().ficha.apis.toLowerCase())}</small>`}
    </article>`;
  }

  ESP.vistas.portada = function (el, seccion) {
    const P = t().portada;
    el.innerHTML = `
    <section class="hero">
      <div class="hero-t">
        <p class="sobre">${esc(t().marca.lema)}</p>
        <h1>${esc(P.titular)}</h1>
        <p class="apoyo">${esc(P.apoyo)}</p>
        <div class="acciones"><a class="btn btn-p btn-g" href="#/analizar">${ic("draw")} ${esc(P.boton)}</a><a class="btn btn-s btn-g" href="#/servicios">${esc(P.boton2)}</a></div>
      </div>
      <div class="hero-v" aria-hidden="true">
        <svg viewBox="0 0 420 300" class="hero-svg">
          <defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b3a2a"/><stop offset=".5" stop-color="#2f5d3b"/><stop offset="1" stop-color="#6b7a4a"/></linearGradient>
          <pattern id="cal" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M0 14h28M14 0v28" stroke="rgba(255,255,255,.08)" stroke-width="1"/></pattern></defs>
          <rect width="420" height="300" rx="14" fill="url(#g1)"/><rect width="420" height="300" rx="14" fill="url(#cal)"/>
          <path d="M40 220 C120 200 150 120 260 110 S380 60 400 40" stroke="rgba(255,255,255,.35)" stroke-width="6" fill="none"/>
          <g fill="#dfe7dc" opacity=".9"><rect x="70" y="90" width="26" height="18" rx="2" transform="rotate(-12 83 99)"/><rect x="110" y="70" width="22" height="16" rx="2" transform="rotate(-12 121 78)"/><rect x="150" y="150" width="30" height="20" rx="2" transform="rotate(-12 165 160)"/><rect x="300" y="170" width="34" height="22" rx="2" transform="rotate(8 317 181)"/><rect x="250" y="210" width="24" height="16" rx="2" transform="rotate(8 262 218)"/><rect x="330" y="120" width="20" height="14" rx="2"/></g>
          <polygon points="190,80 300,70 320,180 230,230 170,170" fill="rgba(242,165,22,.18)" stroke="#f2a516" stroke-width="3" stroke-linejoin="round"/>
          <g fill="#f2a516"><circle cx="190" cy="80" r="5"/><circle cx="300" cy="70" r="5"/><circle cx="320" cy="180" r="5"/><circle cx="230" cy="230" r="5"/><circle cx="170" cy="170" r="5"/></g>
          <g transform="translate(24 24)"><rect width="150" height="54" rx="8" fill="rgba(255,255,255,.94)"/><text x="12" y="22" font-size="11" fill="#4d5b63" font-family="Open Sans, sans-serif">${esc(t().hero.etiqueta)}</text><text x="12" y="42" font-size="16" font-weight="700" fill="#111417" font-family="Open Sans, sans-serif">${esc(t().hero.area)}</text></g>
          <g transform="translate(246 236)"><rect width="150" height="44" rx="8" fill="rgba(255,255,255,.94)"/><circle cx="16" cy="22" r="6" fill="#1f7a4d"/><text x="30" y="26" font-size="12" fill="#111417" font-family="Open Sans, sans-serif">${esc(t().hero.techo)}</text></g>
        </svg>
      </div>
    </section>

    <section class="bloque pasos" id="como">
      <h2 class="centrado">${esc(t().nav.como)}</h2>
      <ol class="pasos-l">${P.pasos.map((p, i) => `<li><span class="n">${i + 1}</span><h3>${esc(p.t)}</h3><p>${esc(p.d)}</p></li>`).join("")}</ol>
    </section>

    <section class="bloque banda">
      <div class="banda-i">
        <h2>${esc(t().servicios.titulo)}</h2>
        <p class="sub">${esc(t().servicios.sub)}</p>
        <div class="rejilla rejilla-3">${ESP.catalogo.tarjetas.slice(0, 6).map(tj => tarjetaHtml(tj, "compacto")).join("")}</div>
        <p class="centrado"><a class="btn btn-s" href="#/servicios">${esc(P.boton2)}</a></p>
      </div>
    </section>

    <section class="bloque">
      <h2 class="centrado">${esc(P.paraTitulo)}</h2>
      <div class="rejilla rejilla-4 para">${P.para.map(p => `<div><h3>${esc(p.t)}</h3><p>${esc(p.d)}</p></div>`).join("")}</div>
    </section>

    <section class="bloque confianza">
      <div class="confianza-i">
        <h2>${esc(P.confianzaTitulo)}</h2>
        <ul>${P.confianza.map(c => `<li>${ic("check_circle")}<span>${esc(c)}</span></li>`).join("")}</ul>
        <p class="paises"><b>${esc(P.paisesTitulo)}.</b> ${esc(P.paises)}</p>
      </div>
    </section>

    <section class="bloque cta">
      <h2>${esc(P.titular)}</h2>
      <a class="btn btn-p btn-g" href="#/analizar">${ic("draw")} ${esc(P.boton)}</a>
    </section>`;
    if (seccion === "como") setTimeout(() => { const s = document.getElementById("como"); if (s) s.scrollIntoView({ behavior: "smooth", block: "start" }); }, 30);
  };

  ESP.vistas.servicios = function (el, filtro) {
    const S = t().servicios, F = S.filtro;
    const lista = ESP.catalogo.tarjetas.filter(tj => filtro === "todos" || tj.publico.includes(filtro));
    el.innerHTML = `
    <section class="bloque">
      <h1>${esc(S.titulo)}</h1>
      <p class="sub">${esc(S.sub)}</p>
      <nav class="filtros" aria-label="${esc(S.filtro.todos)}">${Object.keys(F).map(k => `<a ${k === filtro ? 'aria-current="page"' : ""} href="#/servicios?p=${k}">${esc(F[k])}</a>`).join("")}</nav>
      <div class="rejilla rejilla-3">${lista.map(tj => tarjetaHtml(tj)).join("")}</div>
    </section>`;
  };

  ESP.vistas.ficha = function (el, id) {
    const tj = ESP.catalogo.tarjetas.find(x => x.id === id);
    if (!tj) { ESP.router.ir("#/servicios"); return; }
    const T = t().tarjetas[id], F = t().ficha, A = t().apis;
    const apis = tj.apis.map(c => { const d = ESP.catalogo.disponible(c); return `<li class="${d ? "ok" : "next"}">${ic(d ? "check_circle" : "schedule")}<b>${esc(A[c] ? A[c].nombre : c)}</b>${A[c] && A[c].pregunta ? `<span>${esc(A[c].pregunta)}</span>` : ""}<small>${esc(d ? t().servicios.disponible : t().servicios.proximamente)}</small></li>`; }).join("");
    const hay = tj.apis.some(c => ESP.catalogo.disponible(c));
    el.innerHTML = `
    <section class="bloque ficha">
      <p class="migas"><a href="#/servicios">${esc(F.volver)}</a></p>
      <div class="ficha-h">${ic(tj.icono)}<div><h1>${esc(T.nombre)}</h1><p class="pregunta">${esc(T.pregunta)}</p></div></div>
      <div class="ficha-g">
        <div>
          <h2>${esc(F.sirve)}</h2><p>${esc(T.sirve)}</p>
          <h2>${esc(F.casos)}</h2><ul class="casos">${T.casos.map(c => `<li>${ic("arrow_forward")}${esc(c)}</li>`).join("")}</ul>
          <h2>${esc(F.entrega)}</h2><ul class="entrega">${F.entregaBase.map(c => `<li>${ic("check")}${esc(c)}</li>`).join("")}</ul>
        </div>
        <aside>
          <h2>${esc(F.apis)}</h2><ul class="apis-l">${apis}</ul>
          <h2>${esc(F.limites)}</h2><p class="limites">${esc(T.limites)}</p>
        </aside>
      </div>
      <div class="ficha-cta">${hay ? `<a class="btn btn-p btn-g" href="#/analizar?t=${id}">${ic("draw")} ${esc(F.analizar)}</a>` : `<span class="chip next">${esc(t().servicios.proximamente)}</span>`}</div>
    </section>`;
  };

  ESP.vistas.proximamente = function (el) {
    el.innerHTML = `<section class="bloque centrado"><p class="chip next">${esc(t().servicios.proximamente)}</p></section>`;
  };
})();
