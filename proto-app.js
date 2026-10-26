/* PROTO.DEV — lógica de la página
   Partes: datos, ayudas, operaciones, práctica y asistente. */

const $ = id => document.getElementById(id);

/* ---------- 1) DATOS ---------- */

// Botones de operaciones: [identificador, texto del botón]
const ACCIONES = [
  ['solve', 'Resolver ecuación'], ['factor', 'Factorizar'], ['derive', 'Derivar'],
  ['integrate', 'Integrar'], ['limit', 'Límite x → a'], ['definite', 'Integral definida'], ['simplify', 'Simplificar'],
  ['graph', 'Graficar'], ['domain', 'Dominio'], ['range', 'Rango estimado'],
  ['compose', 'Composición f;g'], ['application', 'Puntos críticos y extremos'], ['practice', 'Generar práctica'],
];

// Diez ejemplos: título, texto que se muestra, ejercicio y operación a aplicar
const EJEMPLOS = [
  ['Ecuación lineal', '2x + 5 = 17', '2*x + 5 = 17', 'solve'],
  ['Factorización', 'x² − 5x + 6', 'x^2 - 5*x + 6', 'factor'],
  ['Derivada de una cúbica', 'x³ − 6x² + 9x + 1', 'x^3 - 6*x^2 + 9*x + 1', 'derive'],
  ['Integral indefinida', '3x² + 2x', '3*x^2 + 2*x', 'integrate'],
  ['Límite notable', 'sin(x)/x cuando x → 0', 'sin(x)/x', 'limit'],
  ['Simplificación', '(x² − 9)/(x − 3)', '(x^2 - 9)/(x - 3)', 'simplify'],
  ['Ecuación cuadrática', 'x² − 5x + 6 = 0', 'x^2 - 5*x + 6 = 0', 'solve'],
  ['Gráfica de parábola', 'f(x) = x² − 4', 'x^2 - 4', 'graph'],
  ['Funciones trigonométricas', 'sin(x) + cos(x)', 'cos(x) + sin(x)', 'derive'],
  ['Función con raíz', '√(x + 4), dominio', 'sqrt(x + 4)', 'domain'],
  ['Puntos críticos', 'x³ − 6x² + 9x + 1', 'x^3 - 6*x^2 + 9*x + 1', 'application'],
];

// Ejercicios de práctica: pregunta, respuesta correcta y pista
const PRACTICAS = [
  { q: 'Deriva: x^3 - 4*x', a: '3*x^2-4', pista: 'Regla de la potencia: d(x^n)/dx = n*x^(n-1).' },
  { q: 'Factoriza: x^2 - 5*x + 6', a: '(x-2)*(x-3)', pista: 'Busca dos números que multipliquen 6 y sumen -5.' },
  { q: 'Resuelve: 2*x + 6 = 14', a: '4', pista: 'Resta 6 en ambos lados y divide entre 2.' },
  { q: 'Integra: 2*x (sin la constante C)', a: 'x^2', pista: 'La antiderivada de 2x es x².' },
  { q: 'Simplifica: (x^2 - 4)/(x - 2)', a: 'x+2', pista: 'Factoriza x² − 4 como (x − 2)(x + 2).' },
];

let practicaActual = null;

/* ---------- 2) AYUDAS ---------- */

function mostrar(texto) { $('result').textContent = texto; }

// Convierte lo que escribe el estudiante (x², 2x, −, ×, √) a texto que entienden las librerías
function normalizarCalculo(t) {
  const sup = { '⁰':0,'¹':1,'²':2,'³':3,'⁴':4,'⁵':5,'⁶':6,'⁷':7,'⁸':8,'⁹':9 };
  return t.trim().replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, m => '^' + [...m].map(c => sup[c]).join(''))
    .replace(/[−–]/g, '-').replace(/[×·]/g, '*').replace(/÷/g, '/').replace(/√/g, 'sqrt').replace(/π/g, 'pi')
    .replace(/\*\*/g, '^').replace(/\bsen\b/g, 'sin')
    .replace(/(\d)\s*([a-z(])/g, '$1*$2').replace(/\)\s*([a-z\d(])/g, ')*$1').replace(/\bx\s*\(/g, 'x*(');
}

// Lee lo que escribió el estudiante y lo deja listo para las librerías
function leerExpresion() {
  const s = normalizarCalculo($('expr').value);
  if (!s) throw Error('Escribe una expresión matemática primero.');
  return s;
}

// Calcula con Nerdamer (matemática simbólica)
function simbolico(s) {
  if (typeof nerdamer === 'undefined') throw Error('No cargó la librería de matemáticas. Revisa tu conexión a Internet.');
  return nerdamer(s).toString();
}

function resolverEcuacion(texto) {
  const partes = texto.split('=');
  if (partes.length !== 2 || !partes[0].trim() || !partes[1].trim())
    throw Error('Escribe una ecuación como 2*x + 5 = 17.');
  const diferencia = `(${partes[0]})-(${partes[1]})`;

  // Primer intento: Nerdamer
  try {
    const raices = nerdamer.solve(diferencia, 'x').toString();
    if (raices && raices !== '[]') return `x = ${raices}`;
  } catch (e) { /* si falla, probamos el plan B */ }

  // Plan B: ecuación lineal con math.js (ax + b = 0)
  try {
    const b = math.evaluate(diferencia, { x: 0 });
    const a = math.evaluate(diferencia, { x: 1 }) - b;
    if (Math.abs(a) > 1e-10) return `x = ${math.format(-b / a, { precision: 12 })}`;
    if (Math.abs(b) < 1e-10) return 'La igualdad se cumple para todos los valores de x.';
    return 'La ecuación no tiene solución.';
  } catch (e) {
    throw Error('No pude interpretar esta ecuación. Usa * para multiplicar, por ejemplo 2*x + 5 = 17.');
  }
}

// Dibuja la gráfica de la expresión entre x = -10 y x = 10
let ultimaGrafica = '';
function graficar(s, destino = 'plot') {
  const e = s.includes('=') ? s.split('=').slice(1).join('=').trim() : s;
  const f = math.compile(e);
  const xs = [], ys = [];
  for (let i = 0; i <= 400; i++) {
    const x = -10 + i * 0.05;
    xs.push(x);
    try {
      const y = f.evaluate({ x });
      ys.push(typeof y === 'number' && Number.isFinite(y) && Math.abs(y) < 1e6 ? y : null);
    } catch (err) { ys.push(null); }
  }
  Plotly.newPlot(destino,
    [{ x: xs, y: ys, type: 'scatter', mode: 'lines', name: e, line: { color: '#d9b25a', width: 3 } }],
    {
      title: { text: `f(x) = ${e}`, font: { color: '#e8f0f8' } },
      paper_bgcolor: '#091a2f', plot_bgcolor: '#091a2f', font: { color: '#9db2c9' },
      xaxis: { title: 'x', zeroline: true, gridcolor: '#1d3a5f', zerolinecolor: '#4aa3e0' },
      yaxis: { title: 'f(x)', zeroline: true, gridcolor: '#1d3a5f', zerolinecolor: '#4aa3e0' },
      margin: { t: 50, l: 50, r: 15, b: 45 },
    }, { responsive: true });
  ultimaGrafica = e;
  return e;
}


/* ---------- ANÁLISIS DE FUNCIONES ---------- */

const evalX = (s, x) => math.evaluate(s, { x });
const fmtN = v => String(math.format(v, { precision: 8 })).replace(/\.0+$/, '');

// Raíces reales de g(x)=0: primero simbólico; si falla, búsqueda evalXérica
function raicesReales(g) {
  let lista = [];
  try {
    const t = nerdamer.solve(g, 'x').toString().replace(/^\[|\]$/g, '');
    lista = t.split(',').filter(Boolean).map(r => math.evaluate(r)).filter(v => typeof v === 'number' && isFinite(v));
  } catch (e) { lista = []; }
  if (!lista.length) {
    let prev = null;
    for (let x = -50; x <= 50; x += 0.05) {
      let y; try { y = evalX(g, x); } catch (e) { continue; }
      if (prev && prev.y * y < 0) {
        let lo = prev.x, hi = x;
        for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; (evalX(g, lo) * evalX(g, m) <= 0) ? hi = m : lo = m; }
        lista.push((lo + hi) / 2);
      }
      prev = { x, y };
    }
  }
  return [...new Set(lista.map(v => +v.toFixed(8)))].sort((p, q) => p - q);
}

function analizarCriticos(s) {
  const d1 = simbolico(`diff(${s},x)`), d2 = simbolico(`diff(${d1},x)`);
  const crit = raicesReales(d1);
  let t = `PUNTOS CRÍTICOS Y EXTREMOS RELATIVOS\n\nf(x) = ${s}\n\nFórmulas: los puntos críticos cumplen f'(x) = 0. Criterio de la segunda derivada: f''(c) > 0 → mínimo; f''(c) < 0 → máximo; f''(c) = 0 → no concluye.\n\n1. Primera derivada: f'(x) = ${d1}\n2. Igualamos a cero: ${d1} = 0\n   Puntos críticos: ${crit.length ? crit.map(c => 'x = ' + fmtN(c)).join(', ') : 'no hay puntos críticos reales'}\n3. Segunda derivada: f''(x) = ${d2}\n4. Clasificación (sustituimos cada punto):\n`;
  const filas = [];
  crit.forEach(c => {
    const y = evalX(s, c), seg = evalX(d2, c);
    const tipo = seg > 1e-9 ? 'mínimo relativo' : seg < -1e-9 ? 'máximo relativo' : 'el criterio no concluye (revisa el signo de f\')';
    t += `   • x = ${fmtN(c)}: f''(${fmtN(c)}) = ${fmtN(seg)} → ${tipo}; f(${fmtN(c)}) = ${fmtN(y)}\n`;
    filas.push([c, y, seg]);
  });
  const ex = filas.map(([c, y, seg]) => `${seg > 1e-9 ? 'Mínimo' : seg < -1e-9 ? 'Máximo' : 'Punto crítico'} en (${fmtN(c)}, ${fmtN(y)})`);
  t += `\nRESPUESTA: ${ex.length ? ex.join('; ') : 'la función no tiene extremos relativos.'}`;
  if (crit.length) {
    const cortes = [-Infinity, ...crit, Infinity];
    t += '\nCrecimiento: ' + cortes.slice(0, -1).map((c, i) => {
      const m = isFinite(c) ? (isFinite(cortes[i + 1]) ? (c + cortes[i + 1]) / 2 : c + 1) : cortes[i + 1] - 1;
      return `${evalX(d1, m) > 0 ? 'crece' : 'decrece'} en (${isFinite(c) ? fmtN(c) : '-∞'}, ${isFinite(cortes[i + 1]) ? fmtN(cortes[i + 1]) : '∞'})`;
    }).join('; ');
  }
  return t;
}

function limiteEn(s, a) {
  const aTxt = String(a);
  let t = `LÍMITE CUANDO x TIENDE A ${aTxt}\n\nf(x) = ${s}\n\n1. Sustitución directa: x = ${aTxt}\n`;
  let directo = null;
  try { const v = evalX(s, math.evaluate(aTxt)); if (typeof v === 'number' && isFinite(v)) directo = v; } catch (e) {}
  if (directo !== null) return t + `   f(${aTxt}) = ${fmtN(directo)} (resultado finito, no hay indeterminación)\n\nRESPUESTA: lim(x→${aTxt}) f(x) = ${fmtN(directo)}`;
  t += '   Da una indeterminación (0/0 o división entre 0).\n2. Método: simplificar/factorizar y cancelar, luego sustituir.\n';
  let simp = null;
  try { simp = simbolico(`simplify(${s})`); t += `   Simplificado: ${simp}\n`; } catch (e) {}
  const p = math.evaluate(aTxt), h = 1e-6;
  let izq, der; try { izq = evalX(s, p - h); der = evalX(s, p + h); } catch (e) { throw Error('No pude evaluar la función cerca de ese valor.'); }
  t += `3. Verificación evalXérica: x = ${fmtN(p - h)} → ${fmtN(izq)};  x = ${fmtN(p + h)} → ${fmtN(der)}\n\n`;
  if (Math.abs(izq - der) < 1e-3 * Math.max(1, Math.abs(izq))) return t + `RESPUESTA: lim(x→${aTxt}) f(x) = ${fmtN(Math.round((izq + der) / 2 * 1e4) / 1e4)}`;
  return t + 'RESPUESTA: el límite no existe (los límites laterales son distintos o crecen sin cota).';
}

function integralDefinida(s, a, b) {
  const F = simbolico(`integrate(${s},x)`);
  const Fa = evalX(F, a), Fb = evalX(F, b);
  // Verificación evalXérica con la regla de Simpson
  const n = 2000, h = (b - a) / n; let suma = evalX(s, a) + evalX(s, b);
  for (let i = 1; i < n; i++) suma += (i % 2 ? 4 : 2) * evalX(s, a + i * h);
  const simpson = suma * h / 3;
  return `INTEGRAL DEFINIDA\n\nf(x) = ${s}   en [${a}, ${b}]\n\nFórmula: ∫ de a a b f(x) dx = F(b) − F(a)\n1. Antiderivada: F(x) = ${F}\n2. Sustituimos: F(${b}) = ${fmtN(Fb)};  F(${a}) = ${fmtN(Fa)}\n3. Restamos: ${fmtN(Fb)} − (${fmtN(Fa)})\n\nRESPUESTA: ${fmtN(Fb - Fa)}\nVerificación evalXérica (Simpson): ${fmtN(simpson)}`;
}

function verificarDerivada(s, d) {
  const x0 = 2, exacta = evalX(d, x0), h = 1e-5;
  const aprox = (evalX(s, x0 + h) - evalX(s, x0 - h)) / (2 * h);
  return `\n\nVerificación en x = ${x0}: f'(${x0}) = ${fmtN(exacta)}; pendiente aproximada = ${fmtN(aprox)} → ${Math.abs(exacta - aprox) < 1e-3 * Math.max(1, Math.abs(exacta)) ? 'coinciden ✔' : 'no coinciden, revisa la expresión'}`;
}

/* ---------- ASISTENTE: entiende el enunciado en español ---------- */

function asistente(texto) {
  const q = texto.toLowerCase();
  const f = normalizarCalculo(texto).match(/(?:f\(x\)|y)\s*=\s*([^;:,]+?)(?=\s*[;:]|,\s|\.\s|\.$|$)/i);
  let expr = f ? f[1] : (normalizarCalculo(texto).match(/[0-9x\s+\-*\/^().]{3,}/g) || []).filter(m => m.includes('x')).sort((p, r) => r.length - p.length)[0];
  if (!expr) throw Error('No encontré ninguna función en tu pregunta. Escríbela así: f(x) = x^2 - 4.');
  $('expr').value = expr.trim();
  const nums = (q.match(/-?\d+(?:\.\d+)?/g) || []);
  const lim = q.match(/(?:tiende a|→|->)\s*(-?\d+(?:\.\d+)?)/);
  const rango = q.match(/(?:de|entre|desde)\s*(-?\d+(?:\.\d+)?)\s*(?:a|y|hasta)\s*(-?\d+(?:\.\d+)?)/);
  if (lim) $('pa').value = lim[1];
  if (/definida|desde|entre/.test(q) && rango) { $('pa').value = rango[1]; $('pb').value = rango[2]; }
  const reglas = [[/cr[ií]tic|extremo|m[aá]xim|m[ií]nim/, 'application'], [/l[ií]mite|lim\b/, 'limit'], [/integra|antiderivada/, rango ? 'definite' : 'integrate'],
    [/deriv|pendiente|raz[oó]n de cambio/, 'derive'], [/factori/, 'factor'], [/dominio/, 'domain'], [/rango/, 'range'], [/graf/, 'graph'],
    [/simplific/, 'simplify'], [/compos/, 'compose'], [/resuelve|ecuaci|despeja|ra[ií]ces|ceros/, 'solve']];
  const r = reglas.find(([re]) => re.test(q));
  ejecutar(r ? r[1] : ($('expr').value.includes('=') ? 'solve' : 'simplify'));
}

/* ---------- PRÁCTICA ALEATORIA ---------- */

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
function nuevaPractica() {
  const tipo = rnd(0, 3), a = rnd(2, 6), b = rnd(1, 9), p = rnd(1, 5), q = rnd(1, 5);
  if (tipo === 0) return { q: `Resuelve: ${a}*x + ${b} = ${a * p + b}`, a: String(p), pista: `Resta ${b} en ambos lados y divide entre ${a}.` };
  if (tipo === 1) return { q: `Deriva: ${a}*x^3 + ${b}*x`, a: `${3 * a}*x^2+${b}`, pista: 'Regla de la potencia: d(x^n)/dx = n*x^(n-1).' };
  if (tipo === 2) return { q: `Integra (sin la constante C): ${2 * a}*x`, a: `${a}*x^2`, pista: 'Suma 1 al exponente y divide entre el nuevo exponente.' };
  return { q: `Factoriza: x^2 - ${p + q}*x + ${p * q}`, a: `(x-${p})*(x-${q})`, pista: `Busca dos números que multipliquen ${p * q} y sumen ${p + q}.` };
}

/* ---------- 3) OPERACIONES ---------- */

function ejecutar(accion) {
  $('practice').hidden = true;
  if (!['graph', 'range', 'application'].includes(accion)) $('plot').innerHTML = '';

  try {
    const s = leerExpresion();

    if (accion === 'solve') {
      const r = resolverEcuacion(s);
      const p = s.split('=');
      mostrar(`RESOLVER ECUACIÓN\n\n1. Ecuación original: ${s}\n2. Pasamos todo a un lado: (${p[0]}) - (${p[1]}) = 0\n3. Despejamos x.\n\nRESPUESTA: ${r}\n\nPrueba: sustituye cada solución en la ecuación original.`);

    } else if (accion === 'factor') {
      mostrar(`FACTORIZACIÓN\n\n1. Expresión: ${s}\n2. Buscamos factores cuyo producto sea la expresión.\n\nRESPUESTA: ${simbolico(`factor(${s})`)}\n\nPrueba: multiplica los factores y comprueba que obtienes la original.`);

    } else if (accion === 'derive') {
      mostrar(`DERIVADA\n\n1. Función: f(x) = ${s}\n2. Derivamos término por término con las reglas de derivación.\n\nRESPUESTA: f'(x) = ${simbolico(`diff(${s},x)`)}${verificarDerivada(s, simbolico(`diff(${s},x)`))}`);

    } else if (accion === 'integrate') {
      mostrar(`INTEGRAL INDEFINIDA\n\n1. Función: f(x) = ${s}\n2. Buscamos una función cuya derivada sea f(x).\n\nRESPUESTA: ∫ f(x) dx = ${simbolico(`integrate(${s},x)`)} + C\n(C es la constante de integración)`);

    } else if (accion === 'limit') {
      mostrar(limiteEn(s, $('pa').value.trim() || '0'));

    } else if (accion === 'definite') {
      const pa = $('pa').value.trim(), pb = $('pb').value.trim();
      if (!pa || !pb) throw Error('Faltan datos: escribe los límites a y b de la integral en los recuadros "a, b".');
      mostrar(integralDefinida(s, math.evaluate(pa), math.evaluate(pb)));

    } else if (accion === 'simplify') {
      mostrar(`SIMPLIFICACIÓN\n\n1. Expresión: ${s}\n2. Reducimos la expresión al máximo.\n\nRESPUESTA: ${simbolico(`simplify(${s})`)}\n\nSi se cancelaron factores, recuerda las restricciones del dominio original.`);

    } else if (accion === 'graph') {
      const e = graficar(s);
      mostrar(`GRÁFICA\n\nf(x) = ${e}\n\nLa gráfica muestra -10 ≤ x ≤ 10. Observa dónde cruza los ejes y dónde sube o baja.`);

    } else if (accion === 'domain') {
      const notas = [];
      if (s.includes('/')) notas.push('El denominador no puede ser cero.');
      if (/sqrt\s*\(/.test(s)) notas.push('Con números reales, lo que está dentro de la raíz debe ser ≥ 0.');
      if (/log\s*\(/.test(s)) notas.push('Lo que está dentro de un logaritmo debe ser > 0.');
      if (!notas.length) notas.push('Si es un polinomio, el dominio son todos los números reales.');
      mostrar(`DOMINIO\n\nf(x) = ${s}\n\nReglas:\n• Se excluyen los valores que vuelven cero un denominador.\n• Dentro de una raíz cuadrada: ≥ 0.\n• Dentro de un logaritmo: > 0.\n\nPara esta función: ${notas.join(' ')}\n\nEscribe la restricción como desigualdad y resuélvela para dar el dominio en intervalos.`);

    } else if (accion === 'range') {
      graficar(s);
      mostrar(`RANGO ESTIMADO\n\nf(x) = ${s}\n\nMira la gráfica: ¿entre qué valores de y se mueve la función? Es una aproximación visual; el rango exacto necesita análisis algebraico.`);

    } else if (accion === 'compose') {
      const p = s.split(';');
      if (p.length !== 2) throw Error('Escribe f(x);g(x) separadas por punto y coma. Ejemplo: x^2;2*x+1');
      const f = p[0].trim(), g = p[1].trim();
      const r = simbolico(f.replace(/x/g, `(${g})`));
      mostrar(`COMPOSICIÓN DE FUNCIONES\n\nf(x) = ${f}\ng(x) = ${g}\n\n(f∘g)(x) = f(g(x)): reemplazamos cada x de f por g(x).\n\nRESPUESTA: (f∘g)(x) = ${r}`);

    } else if (accion === 'application') {
      mostrar(analizarCriticos(s));
      graficar(s);

    } else if (accion === 'practice') {
      generarPractica();
    }
  } catch (e) {
    mostrar(`No se pudo resolver el ejercicio.\n\n${e.message || e}\n\nEjemplos válidos: x^2 - 4  o  2*x + 5 = 17`);
  }
}

/* ---------- 4) PRÁCTICA ---------- */

function generarPractica() {
  practicaActual = nuevaPractica();
  $('question').textContent = practicaActual.q;
  $('answer').value = '';
  $('feedback').textContent = '';
  $('practice').hidden = false;
  mostrar('Se generó un ejercicio. Escribe tu respuesta y pulsa Comprobar.');
}

function comprobar() {
  if (!practicaActual) return;
  const fb = $('feedback');
  try {
    const respuesta = $('answer').value.trim();
    if (!respuesta) throw Error('vacío');
    // Si (tu respuesta) − (la correcta) se simplifica a 0, son iguales
    const ok = simbolico(`simplify((${respuesta})-(${practicaActual.a}))`) === '0';
    fb.textContent = ok ? 'Correcto. Muy bien.' : `Todavía no. Pista: ${practicaActual.pista} (Respuesta correcta: ${practicaActual.a})`;
    fb.style.color = ok ? 'var(--ok)' : 'var(--rojo)';
  } catch (e) {
    fb.textContent = `No pude leer tu respuesta. Pista: ${practicaActual.pista}`;
    fb.style.color = 'var(--rojo)';
  }
}

/* ---------- ARRANQUE: conectar botones y pestañas ---------- */

function abrirTab(nombre) {
  document.querySelectorAll('.tab').forEach(t => {
    const activa = t.dataset.tab === nombre;
    t.classList.toggle('activa', activa);
    t.setAttribute('aria-selected', activa);
  });
  document.querySelectorAll('.panel').forEach(p => { p.hidden = p.id !== `tab-${nombre}`; });
}

// Botones de operaciones
$('acciones').innerHTML = ACCIONES
  .map(([id, texto]) => `<button class="chip" data-act="${id}">${texto}</button>`).join('');
document.querySelectorAll('[data-act]').forEach(b => b.onclick = () => ejecutar(b.dataset.act));

// Tarjetas de ejemplos
$('ejemplos').innerHTML = EJEMPLOS
  .map(([titulo, vista, , ], i) => `<button class="ejemplo" data-i="${i}"><b>${i + 1}. ${titulo}</b><span>${vista}</span></button>`).join('');
document.querySelectorAll('.ejemplo').forEach(b => b.onclick = () => {
  const [, , ejercicio, accion] = EJEMPLOS[b.dataset.i];
  $('expr').value = ejercicio;
  abrirTab('resolver');
  ejecutar(accion);
});

// Resolver con el botón o con Enter
$('solve').onclick = () => ejecutar($('expr').value.includes('=') ? 'solve' : 'simplify');
$('expr').addEventListener('keydown', e => { if (e.key === 'Enter') $('solve').click(); });
$('check').onclick = comprobar;
$('ask').onclick = () => { try { asistente($('pregunta').value); } catch (e) { mostrar(`Aviso: ${e.message}`); } };
$('pregunta').addEventListener('keydown', e => { if (e.key === 'Enter') $('ask').click(); });
$('answer').addEventListener('keydown', e => { if (e.key === 'Enter') comprobar(); });

// Pestañas
document.querySelectorAll('.tab').forEach(t => t.onclick = () => abrirTab(t.dataset.tab));

/* ---------- ASISTENTE IA (chat) ---------- */

const SUGERIDAS = [
  'Analiza f(x) = x^3 - 6x^2 + 9x + 1; determina sus puntos críticos y clasifica sus extremos relativos.',
  'Resuelve 2x + 5 = 17',
  'Deriva f(x) = x^3 - 4x',
  'Calcula el límite de (x^2 - 9)/(x - 3) cuando x tiende a 3',
  'Integra f(x) = 3x^2 + 2x de 0 a 2',
  'Factoriza x^2 - 5x + 6',
];

function burbuja(quien, texto) {
  const d = document.createElement('div');
  d.className = `burbuja ${quien}`;
  d.textContent = texto;
  $('chat').appendChild(d);
  return d;
}

function preguntarChat(texto) {
  texto = texto.trim();
  if (!texto) { burbuja('bot', 'Aviso: escribe tu pregunta o ejercicio primero.'); return; }
  burbuja('yo', texto);
  $('chat-in').value = '';
  let respuesta;
  try { asistente(texto); respuesta = $('result').textContent; }
  catch (e) { respuesta = `Aviso: ${e.message}`; }
  const b = burbuja('bot', respuesta);
  if ($('plot').innerHTML && ultimaGrafica) {
    const g = document.createElement('div');
    g.id = `plot-${Date.now()}`;
    b.appendChild(g);
    try { graficar(ultimaGrafica, g.id); } catch (e) { /* sin gráfica */ }
  }
  $('chat').scrollTop = $('chat').scrollHeight;
}

burbuja('bot', 'Hola, soy el asistente de PROTO.DEV. Escríbeme un ejercicio como aparece en tu hoja (ecuaciones, factorización, límites, derivadas, integrales, puntos críticos) y te muestro fórmulas, sustitución y respuesta.');
$('chat-sugeridas').innerHTML = SUGERIDAS.map((t, i) => `<button class="chip" data-s="${i}">${t.length > 46 ? t.slice(0, 44) + '…' : t}</button>`).join('');
document.querySelectorAll('[data-s]').forEach(b => b.onclick = () => preguntarChat(SUGERIDAS[b.dataset.s]));
$('chat-send').onclick = () => preguntarChat($('chat-in').value);
$('chat-in').addEventListener('keydown', e => { if (e.key === 'Enter') $('chat-send').click(); });
