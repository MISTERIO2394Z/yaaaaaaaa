/* PROTO.DEV — herramientas de trigonometría (Temas 5 y 6 de la hoja de trabajo)
   Partes: 1) ayudas, 2) valores exactos, 3) herramientas (una por tipo de ejercicio), 4) pantalla. */

const PI = Math.PI;

/* ---------- 1) AYUDAS ---------- */

// Deja el texto listo para math.js: sen→sin, π→pi, arcsen→asin, etc.
function normalizar(texto) {
  return String(texto).trim()
    .replace(/π/g, 'pi').replace(/\*\*/g, '^')
    .replace(/\bsen\b/g, 'sin').replace(/\btg\b/g, 'tan')
    .replace(/arcsen|arcsin|asen/g, 'asin').replace(/arccos/g, 'acos').replace(/arctan|arctg/g, 'atan')
    .replace(/(\d)\s*(pi|x|sin|cos|tan|sqrt)\b/g, '$1*$2');
}

// Número con hasta 4 decimales y signo menos "bonito"
function fmt(n) {
  let r = Math.round(n * 1e4) / 1e4;
  if (Object.is(r, -0)) r = 0;
  return String(r).replace('-', '−');
}

// Convierte radianes a texto con π cuando se puede: 7π/6, −π/3, 5π/2...
function fraccionPi(rad) {
  const v = rad / PI;
  for (let d = 1; d <= 12; d++) {
    const n = Math.round(v * d);
    if (Math.abs(v * d - n) < 1e-9) {
      if (n === 0) return '0';
      const a = Math.abs(n);
      return (n < 0 ? '−' : '') + (a === 1 ? 'π' : `${a}π`) + (d === 1 ? '' : `/${d}`);
    }
  }
  return null;
}
const fmtAng = rad => fraccionPi(rad) ?? `${fmt(rad)} rad`;
const grados = rad => rad * 180 / PI;

// Lee un número o expresión (acepta pi): "pi/2", "2*pi", "-3"
function num(texto, nombre = 'el valor') {
  if (String(texto).trim() === '') throw Error(`Falta ${nombre}.`);
  const v = math.evaluate(normalizar(texto));
  if (typeof v !== 'number' || !isFinite(v)) throw Error(`No entendí ${nombre}: ${texto}`);
  return v;
}

// Lee un ángulo y lo devuelve en radianes. Con "pi" son radianes; con ° o sin pi, grados.
function leerAngulo(texto) {
  let t = normalizar(texto);
  const enGrados = /°|deg/.test(t) || !/pi/.test(t);
  t = t.replace(/°|deg/g, '');
  const v = num(t, 'el ángulo');
  return enGrados ? v * PI / 180 : v;
}

// Dibuja una gráfica con el estilo de la página
function trazar(trazas, titulo, ticks) {
  if (typeof Plotly === 'undefined') return;
  const eje = { zeroline: true, gridcolor: '#1d3a5f', zerolinecolor: '#4aa3e0' };
  Plotly.newPlot('plot-trig', trazas, {
    title: { text: titulo, font: { color: '#e8f0f8' } },
    paper_bgcolor: '#091a2f', plot_bgcolor: '#091a2f', font: { color: '#9db2c9' },
    xaxis: { title: 'x', ...eje, ...(ticks || {}) }, yaxis: { title: 'y', ...eje },
    margin: { t: 50, l: 50, r: 15, b: 45 }, showlegend: false,
  }, { responsive: true });
}

/* ---------- 2) VALORES EXACTOS ---------- */

// Ángulo de referencia (grados) → [sen, cos, tan]
const EXACTO = {
  0: ['0', '1', '0'],
  15: ['(√6−√2)/4', '(√6+√2)/4', '2−√3'],
  30: ['1/2', '√3/2', '√3/3'],
  45: ['√2/2', '√2/2', '1'],
  60: ['√3/2', '1/2', '√3'],
  75: ['(√6+√2)/4', '(√6−√2)/4', '2+√3'],
  90: ['1', '0', 'indefinida'],
};

// Pone signo negativo a un valor exacto
function neg(s) {
  if (s === '0' || s === 'indefinida') return s;
  return /^[^()]*[+−]/.test(s) ? `−(${s})` : `−${s}`;
}

const ROMANO = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };
const SIGNOS = { 1: 'sen +, cos +, tan +', 2: 'sen +, cos −, tan −', 3: 'sen −, cos −, tan +', 4: 'sen −, cos +, tan −' };
const EJE = { 0: 'sobre el eje x positivo', 90: 'sobre el eje y positivo', 180: 'sobre el eje x negativo', 270: 'sobre el eje y negativo' };

// Cuadrante y ángulo de referencia de un ángulo en radianes
function geometria(rad) {
  const g = grados(rad);
  let gn = ((g % 360) + 360) % 360;
  const eje = Math.abs(gn / 90 - Math.round(gn / 90)) < 1e-9;
  if (eje) gn = (Math.round(gn / 90) * 90) % 360;
  const q = eje ? null : gn < 90 ? 1 : gn < 180 ? 2 : gn < 270 ? 3 : 4;
  const ref = gn <= 90 ? gn : gn <= 180 ? 180 - gn : gn <= 270 ? gn - 180 : 360 - gn;
  return { g, gn, q, eje, ref };
}

// Valores exactos de sen, cos y tan (solo si el ángulo es múltiplo de 15°)
function razonesExactas(rad) {
  const m = Math.round(grados(rad) / 15);
  if (Math.abs(grados(rad) - m * 15) > 1e-7) return null;
  const G = geometria(m * 15 * PI / 180);
  const [s, c, t] = EXACTO[G.ref];
  const rs = Math.sin(G.gn * PI / 180), rc = Math.cos(G.gn * PI / 180);
  const sg = x => (Math.abs(x) < 1e-9 ? 0 : Math.sign(x));
  const sen = sg(rs) === 0 ? '0' : sg(rs) < 0 ? neg(s) : s;
  const cos = sg(rc) === 0 ? '0' : sg(rc) < 0 ? neg(c) : c;
  const tan = (G.gn === 90 || G.gn === 270) ? 'indefinida' : (sg(rs) * sg(rc) < 0 ? neg(t) : t);
  return { sen, cos, tan, ...G };
}

function valorExacto(fn, ex) {
  const inv = s => (s === '0' ? 'indefinida' : (s === '1' || s === '−1') ? s : `1/(${s})`);
  if (fn === 'sin') return ex.sen;
  if (fn === 'cos') return ex.cos;
  if (fn === 'tan') return ex.tan;
  if (fn === 'sec') return inv(ex.cos);
  if (fn === 'csc') return inv(ex.sen);
  return ex.tan === 'indefinida' ? '0' : inv(ex.tan); // cot
}

function valorNumerico(fn, rad) {
  const s = Math.sin(rad), c = Math.cos(rad), cero = x => Math.abs(x) < 1e-12;
  if (fn === 'sin') return s;
  if (fn === 'cos') return c;
  if (fn === 'tan') return cero(c) ? NaN : s / c;
  if (fn === 'sec') return cero(c) ? NaN : 1 / c;
  if (fn === 'csc') return cero(s) ? NaN : 1 / s;
  return cero(s) ? NaN : c / s; // cot
}
const decTxt = v => (Number.isNaN(v) ? 'indefinida' : fmt(v));

/* ---------- 3) HERRAMIENTAS ---------- */

// 3a) Ejercicios 1 y 2: círculo unitario, ángulo de referencia y valores exactos
function textoAngulo(rad) {
  const G = geometria(rad), ex = razonesExactas(rad), L = [];
  L.push(`Ángulo: θ = ${fmtAng(rad)} = ${fmt(G.g)}°`);
  if (Math.abs(G.g - G.gn) > 1e-9) L.push(`Ángulo coterminal entre 0° y 360°: ${fmt(G.gn)}°`);
  L.push(G.eje ? `Posición: ${EJE[G.gn]}` : `Cuadrante: ${ROMANO[G.q]}  (${SIGNOS[G.q]})`);
  L.push(`Ángulo de referencia: ${fmt(G.ref)}° = ${fmtAng(G.ref * PI / 180)}`);
  if (ex) {
    L.push(`Punto en el círculo unitario: (cos θ, sen θ) = (${ex.cos}, ${ex.sen})`);
    L.push(`sen θ = ${ex.sen} ≈ ${fmt(Math.sin(rad))}`);
    L.push(`cos θ = ${ex.cos} ≈ ${fmt(Math.cos(rad))}`);
    L.push(`tan θ = ${ex.tan}${ex.tan === 'indefinida' ? '' : ' ≈ ' + decTxt(valorNumerico('tan', rad))}`);
  } else {
    L.push(`(No es múltiplo de 15°: valores aproximados)`);
    L.push(`sen θ ≈ ${fmt(Math.sin(rad))}   cos θ ≈ ${fmt(Math.cos(rad))}   tan θ ≈ ${decTxt(valorNumerico('tan', rad))}`);
  }
  return L.join('\n');
}

function textoFuncion(fn, rad) {
  const G = geometria(rad), ex = razonesExactas(rad);
  const nom = fn === 'sin' ? 'sen' : fn, arg = fraccionPi(rad) ?? `${fmt(rad)} rad`;
  const L = [`${nom}(${arg})`, `  1. Pasamos a grados: ${arg} = ${fmt(G.g)}°`];
  L.push(G.eje ? `  2. El ángulo está ${EJE[G.gn]}.`
    : `  2. Cae en el cuadrante ${ROMANO[G.q]}; su ángulo de referencia es ${fmt(G.ref)}°.`);
  if (!G.eje) L.push(`  3. Signos en el cuadrante ${ROMANO[G.q]}: ${SIGNOS[G.q]}.`);
  if (ex && !G.eje && ['sin', 'cos', 'tan'].includes(fn)) {
    const i = { sin: 0, cos: 1, tan: 2 }[fn];
    L.push(`  4. Valor en el ángulo de referencia: ${nom} ${fmt(G.ref)}° = ${EXACTO[G.ref][i]}`);
  }
  if (ex) L.push(`  RESPUESTA: ${nom}(${arg}) = ${valorExacto(fn, ex)}  ≈ ${decTxt(valorNumerico(fn, rad))}`);
  else L.push(`  RESPUESTA: ${nom}(${arg}) ≈ ${decTxt(valorNumerico(fn, rad))}  (no es un ángulo notable)`);
  return L.join('\n');
}

function runAngulo(v) {
  const items = normalizar(v.e).split(';').map(t => t.trim()).filter(Boolean);
  if (!items.length) throw Error('Escribe un ángulo (7pi/6) o una razón (sen(5pi/3)).');
  return items.map(t => {
    const m = t.match(/^(sin|cos|tan|sec|csc|cot)\((.*)\)$/);
    return m ? textoFuncion(m[1], leerAngulo(m[2])) : textoAngulo(leerAngulo(t));
  }).join('\n\n');
}

// 3b) Ejercicios 3, 4 y 5: y = A·fn(B(x − C)) + D
function runOnda(v) {
  const A = num(v.A, 'A'), B = num(v.B, 'B'), C = num(v.C || '0', 'C'), D = num(v.D || '0', 'D');
  if (A === 0 || B === 0) throw Error('A y B no pueden ser 0.');
  const esSen = v.fn === 'sen', nom = esSen ? 'sen' : 'cos';
  const f = x => A * (esSen ? Math.sin(B * (x - C)) : Math.cos(B * (x - C))) + D;
  const P = 2 * PI / Math.abs(B);
  const desde = v.desde.trim() ? num(v.desde, 'desde') : C;
  const hasta = v.hasta.trim() ? num(v.hasta, 'hasta') : C + P;
  if (hasta <= desde) throw Error('"hasta" debe ser mayor que "desde".');

  const pts = [0, 1, 2, 3, 4].map(k => { const x = C + k * P / 4; return [x, f(x)]; });
  const L = [`FUNCIÓN: y = ${fmt(A)}·${nom}(${fmt(B)}(x − ${fmtAng(C)})) + ${fmt(D)}`, ''];
  L.push(`Amplitud: |A| = ${fmt(Math.abs(A))}`);
  L.push(`Período: P = 2π/|B| = ${fmtAng(P)}${fraccionPi(P) ? ` ≈ ${fmt(P)}` : ''}`);
  L.push(C === 0 ? 'Desfase: ninguno (C = 0)' : `Desfase: ${fmtAng(Math.abs(C))} a la ${C > 0 ? 'derecha' : 'izquierda'}`);
  L.push(`Desplazamiento vertical: ${fmt(Math.abs(D))}${D === 0 ? '' : D > 0 ? ' hacia arriba' : ' hacia abajo'}  (línea media y = ${fmt(D)})`);
  L.push(`Valor máximo: ${fmt(D + Math.abs(A))}   Valor mínimo: ${fmt(D - Math.abs(A))}`);
  L.push(`Rango: [${fmt(D - Math.abs(A))}, ${fmt(D + Math.abs(A))}]`);
  if (A < 0) L.push('Como A es negativo, la gráfica se refleja respecto a la línea media.');
  if (B < 0) L.push('B es negativo: la gráfica se refleja horizontalmente.');
  L.push('', 'CINCO PUNTOS DE UN PERÍODO (x desde C, en pasos de P/4):');
  pts.forEach(([x, y]) => L.push(`  (${fmtAng(x)}, ${fmt(y)})`));
  L.push('', 'Si x representa el tiempo t (ejercicio de modelación): la altura máxima y mínima son el valor máximo y el mínimo, y P es lo que tarda una vuelta completa.');

  const xs = [], ys = [], N = 600;
  for (let i = 0; i <= N; i++) { const x = desde + (hasta - desde) * i / N; xs.push(x); ys.push(f(x)); }
  const dentro = pts.filter(([x]) => x >= desde - 1e-9 && x <= hasta + 1e-9);
  trazar([
    { x: xs, y: ys, type: 'scatter', mode: 'lines', line: { color: '#d9b25a', width: 3 } },
    { x: dentro.map(p => p[0]), y: dentro.map(p => p[1]), type: 'scatter', mode: 'markers', marker: { color: '#ff6b66', size: 10 } },
  ], `y = ${fmt(A)} ${nom}(${fmt(B)}(x − ${fmtAng(C)})) + ${fmt(D)}`,
  { tickvals: dentro.map(p => p[0]), ticktext: dentro.map(p => fmtAng(p[0])) });
  return L.join('\n');
}

// 3c) Ejercicio 6: verificar una identidad
function runIdentidad(v) {
  if (!v.izq.trim() || !v.der.trim()) throw Error('Escribe los dos lados de la identidad.');
  const Lc = math.compile(normalizar(v.izq)), Rc = math.compile(normalizar(v.der));
  let ok = 0, indef = 0, malo = null;
  for (let i = 0; i < 200 && !malo; i++) {
    const x = -6.1 + i * 0.0617;
    let l, r;
    try { l = Lc.evaluate({ x }); r = Rc.evaluate({ x }); } catch (e) { indef++; continue; }
    if (typeof l !== 'number' || typeof r !== 'number' || !isFinite(l) || !isFinite(r)) { indef++; continue; }
    if (Math.abs(l - r) / Math.max(1, Math.abs(l), Math.abs(r)) > 1e-8) malo = { x, l, r }; else ok++;
  }
  const T = [`IDENTIDAD: ${v.izq}  =  ${v.der}`, ''];
  if (malo) {
    T.push(`NO es una identidad. Contraejemplo: x = ${fmt(malo.x)}`);
    T.push(`  lado izquierdo = ${fmt(malo.l)}   lado derecho = ${fmt(malo.r)}`);
  } else if (ok < 20) {
    T.push('No pude comprobarla: casi no hay valores donde ambos lados estén definidos. Revisa lo que escribiste.');
  } else {
    T.push(`Comprobación numérica: coinciden en ${ok} valores de x (${indef} puntos excluidos por no estar definidos).`);
    T.push('Es una buena señal, pero NO es una demostración. En la hoja debes escribir los pasos algebraicos.');
  }
  T.push('', 'IDENTIDADES QUE TE AYUDAN A DEMOSTRAR:',
    '  sen²x + cos²x = 1      1 + tan²x = sec²x      1 + cot²x = csc²x',
    '  tan x = sen x / cos x      cot x = cos x / sen x',
    '  sen 2x = 2 sen x cos x      cos 2x = cos²x − sen²x',
    '', 'MÉTODO: trabaja solo un lado (el más complicado) hasta llegar al otro.',
    'Por ejemplo, 1 − cos²x se reemplaza por sen²x usando la primera identidad.',
    'Indica el dominio: la identidad vale donde ningún denominador sea cero.');
  return T.join('\n');
}

// 3d) Ejercicio 7: suma y diferencia de ángulos
const NOTABLES = [...new Set([...Array(12).keys()].map(k => 30 * (k + 1)).concat([...Array(8).keys()].map(k => 45 * (k + 1))))].sort((a, b) => a - b);

function descomponer(gn) {
  const base = [30, 45, 60, 90];
  for (const L of [base, NOTABLES]) {
    for (const a of L) for (const b of L) if (a >= b && a + b === gn) return { a, b, op: '+' };
    for (const a of NOTABLES) for (const b of L) if (a - b === gn) return { a, b, op: '−' };
  }
  return null;
}

function lineasSuma(fn, a, b, op) {
  const A = razonesExactas(a * PI / 180), B = razonesExactas(b * PI / 180), p = s => `(${s})`;
  const otro = op === '+' ? '−' : '+';
  if (fn === 'sen') return [`sen(${a}°${op}${b}°) = sen ${a}°·cos ${b}° ${op} cos ${a}°·sen ${b}°`, `            = ${p(A.sen)}${p(B.cos)} ${op} ${p(A.cos)}${p(B.sen)}`];
  if (fn === 'cos') return [`cos(${a}°${op}${b}°) = cos ${a}°·cos ${b}° ${otro} sen ${a}°·sen ${b}°`, `            = ${p(A.cos)}${p(B.cos)} ${otro} ${p(A.sen)}${p(B.sen)}`];
  if (A.tan === 'indefinida' || B.tan === 'indefinida') return ['tan: una de las tangentes es indefinida; calcula sen/cos.'];
  return [`tan(${a}°${op}${b}°) = (tan ${a}° ${op} tan ${b}°) / (1 ${otro} tan ${a}°·tan ${b}°)`, `            = (${A.tan} ${op} ${B.tan}) / (1 ${otro} ${p(A.tan)}${p(B.tan)})`];
}

function runSuma(v) {
  const t = normalizar(v.e), m = t.match(/^(sin|cos|tan)\((.*)\)$/);
  const rad = leerAngulo(m ? m[2] : t);
  const ex = razonesExactas(rad);
  if (!ex) throw Error('Usa un ángulo múltiplo de 15° (por ejemplo 75°, 105°, 15°).');
  const gn = ex.gn, fns = m ? [m[1] === 'sin' ? 'sen' : m[1]] : ['sen', 'cos', 'tan'];
  const L = [`ÁNGULO: ${fmt(grados(rad))}°`, ''];
  const dec = gn % 30 === 0 || gn % 45 === 0 ? null : descomponer(gn);
  if (dec) L.push(`Lo escribimos como ${dec.a}° ${dec.op} ${dec.b}°, que son ángulos notables.`, '');
  else L.push('Es un ángulo notable: se lee directo del círculo unitario.', '');
  for (const fn of fns) {
    if (dec) lineasSuma(fn, dec.a, dec.b, dec.op).forEach(l => L.push(l));
    const k = { sen: 'sen', cos: 'cos', tan: 'tan' }[fn];
    L.push(`RESPUESTA: ${k} ${fmt(grados(rad))}° = ${ex[k]}  ≈ ${decTxt(valorNumerico(fn === 'sen' ? 'sin' : fn, rad))}`, '');
  }
  return L.join('\n').trim();
}

// 3e) Ejercicio 8: ángulo doble a partir de sen, cos o tan y un cuadrante
function enteroCuadrado(n) { const r = Math.round(Math.sqrt(n)); return r * r === n ? r : null; }
function raizFrac(f) { const n = enteroCuadrado(f.n), d = enteroCuadrado(f.d); return n !== null && d !== null ? math.fraction(n, d) : null; }
function fr(f) { return f.n === 0 ? '0' : (f.s < 0 ? '−' : '') + (f.d === 1 ? `${f.n}` : `${f.n}/${f.d}`); }

function runDoble(v) {
  const q = Number(v.q), signS = q <= 2 ? 1 : -1, signC = (q === 1 || q === 4) ? 1 : -1;
  let val;
  try { val = math.fraction(v.v.trim().replace('−', '-')); } catch (e) { val = math.fraction(math.evaluate(normalizar(v.v))); }
  const uno = math.fraction(1), menos = math.fraction(-1), L = [];
  const nombre = v.fn;
  L.push(`DATO: ${nombre} θ = ${fr(val)}, θ en el cuadrante ${ROMANO[q]}  (${SIGNOS[q]})`, '');
  let s = null, c = null, sN, cN;

  if (nombre === 'sen') {
    if (val.n > val.d) throw Error('sen θ debe estar entre −1 y 1.');
    if (val.n !== 0 && val.s !== signS) throw Error(`sen θ = ${fr(val)} no es compatible con el cuadrante ${ROMANO[q]}.`);
    const c2 = math.subtract(uno, math.multiply(val, val)), r = raizFrac(c2);
    L.push(`1. Identidad pitagórica: cos²θ = 1 − sen²θ = 1 − (${fr(val)})² = ${fr(c2)}`);
    if (r) { s = val; c = signC < 0 ? math.multiply(r, menos) : r; L.push(`2. cos θ = ±${fr(r)}; en el cuadrante ${ROMANO[q]} el coseno es ${signC < 0 ? 'negativo' : 'positivo'}, así que cos θ = ${fr(c)}`); }
    else { sN = math.number(val); cN = signC * Math.sqrt(math.number(c2)); L.push(`2. cos θ = ${signC < 0 ? '−' : ''}√(${fr(c2)}) ≈ ${fmt(cN)}`); }
  } else if (nombre === 'cos') {
    if (val.n > val.d) throw Error('cos θ debe estar entre −1 y 1.');
    if (val.n !== 0 && val.s !== signC) throw Error(`cos θ = ${fr(val)} no es compatible con el cuadrante ${ROMANO[q]}.`);
    const s2 = math.subtract(uno, math.multiply(val, val)), r = raizFrac(s2);
    L.push(`1. Identidad pitagórica: sen²θ = 1 − cos²θ = 1 − (${fr(val)})² = ${fr(s2)}`);
    if (r) { c = val; s = signS < 0 ? math.multiply(r, menos) : r; L.push(`2. sen θ = ±${fr(r)}; en el cuadrante ${ROMANO[q]} el seno es ${signS < 0 ? 'negativo' : 'positivo'}, así que sen θ = ${fr(s)}`); }
    else { cN = math.number(val); sN = signS * Math.sqrt(math.number(s2)); L.push(`2. sen θ = ${signS < 0 ? '−' : ''}√(${fr(s2)}) ≈ ${fmt(sN)}`); }
  } else {
    if (val.n !== 0 && val.s !== signS * signC) throw Error(`tan θ = ${fr(val)} no es compatible con el cuadrante ${ROMANO[q]}.`);
    const k = math.add(uno, math.multiply(val, val)), r = raizFrac(k);
    L.push(`1. Identidad: sec²θ = 1 + tan²θ = 1 + (${fr(val)})² = ${fr(k)}`);
    if (r) { const cAbs = math.divide(uno, r); c = signC < 0 ? math.multiply(cAbs, menos) : cAbs; s = math.multiply(val, c); L.push(`2. |cos θ| = 1/√(${fr(k)}) = ${fr(cAbs)}; con el signo del cuadrante, cos θ = ${fr(c)} y sen θ = tan θ·cos θ = ${fr(s)}`); }
    else { cN = signC / Math.sqrt(math.number(k)); sN = math.number(val) * cN; L.push(`2. cos θ ≈ ${fmt(cN)},  sen θ ≈ ${fmt(sN)}`); }
  }

  if (s && c) {
    const s2 = math.multiply(math.fraction(2), math.multiply(s, c));
    const c2 = math.subtract(math.multiply(c, c), math.multiply(s, s));
    const tanT = c.n === 0 ? 'indefinida' : fr(math.divide(s, c));
    const tan2 = c2.n === 0 ? 'indefinida' : fr(math.divide(s2, c2));
    L.push(`3. tan θ = sen θ / cos θ = ${tanT}`);
    L.push(`4. sen 2θ = 2·sen θ·cos θ = 2(${fr(s)})(${fr(c)}) = ${fr(s2)}`);
    L.push(`5. cos 2θ = cos²θ − sen²θ = (${fr(c)})² − (${fr(s)})² = ${fr(c2)}`);
    L.push(`6. tan 2θ = sen 2θ / cos 2θ = ${tan2}`);
    L.push('', `RESPUESTA: sen 2θ = ${fr(s2)},  cos 2θ = ${fr(c2)},  tan 2θ = ${tan2}`);
  } else {
    const s2 = 2 * sN * cN, c2 = cN * cN - sN * sN;
    L.push(`3. sen 2θ = 2·sen θ·cos θ ≈ ${fmt(s2)}`, `4. cos 2θ = cos²θ − sen²θ ≈ ${fmt(c2)}`, `5. tan 2θ = sen 2θ / cos 2θ ≈ ${Math.abs(c2) < 1e-12 ? 'indefinida' : fmt(s2 / c2)}`);
    L.push('', 'Los valores exactos llevan radicales; aquí quedan como decimales.');
  }
  return L.join('\n');
}

// 3f) Ejercicio 9: funciones trigonométricas inversas
function runInversa(v) {
  const items = normalizar(v.e).split(';').map(t => t.trim()).filter(Boolean);
  if (!items.length) throw Error('Escribe por ejemplo arcsen(-1/2).');
  return items.map(t => {
    const m = t.match(/^(asin|acos|atan)\((.*)\)$/);
    if (!m) throw Error(`No entendí "${t}". Usa arcsen(-1/2), arccos(sqrt(3)/2) o arctan(-1).`);
    const x = num(m[2]);
    const nombre = { asin: 'arcsen', acos: 'arccos', atan: 'arctan' }[m[1]];
    const rango = { asin: '[−π/2, π/2]', acos: '[0, π]', atan: '(−π/2, π/2)' }[m[1]];
    const razon = { asin: 'sen', acos: 'cos', atan: 'tan' }[m[1]];
    if (m[1] !== 'atan' && Math.abs(x) > 1 + 1e-12) return `${nombre}(${m[2]})\n  ${m[2]} no está en [−1, 1]: no existe valor real.`;
    const rad = Math[m[1]](x);
    return `${nombre}(${m[2]})\n  Valor principal: θ debe estar en ${rango}\n  Buscamos θ con ${razon} θ = ${m[2]}\n  RESPUESTA: θ = ${fmtAng(rad)}  (${fmt(grados(rad))}°)`;
  }).join('\n\n');
}

// 3g) Ejercicio 10: ecuaciones trigonométricas (búsqueda numérica de soluciones)
function buscarRaices(f, a, b, incluirFin) {
  const N = 8000, h = (b - a) / N, xs = [], ys = [], raices = [];
  for (let i = 0; i <= N; i++) { const x = a + i * h; let y; try { y = f(x); } catch (e) { y = NaN; } xs.push(x); ys.push(y); }
  const agregar = r => { if (!raices.some(q => Math.abs(q - r) < 1e-4)) raices.push(r); };
  if (Math.abs(ys[0]) < 1e-9) agregar(a);
  if (Math.abs(ys[N]) < 1e-9) agregar(b);
  for (let i = 0; i < N; i++) {                      // cambios de signo (bisección)
    const y1 = ys[i], y2 = ys[i + 1];
    if (!isFinite(y1) || !isFinite(y2)) continue;
    if (y1 === 0) { agregar(xs[i]); continue; }
    if (y1 * y2 < 0) {
      let lo = xs[i], hi = xs[i + 1], flo = y1;
      for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2, fm = f(mid); if (flo * fm <= 0) hi = mid; else { lo = mid; flo = fm; } }
      const r = (lo + hi) / 2;
      if (Math.abs(f(r)) < 1e-6) agregar(r);        // descarta saltos (asíntotas de tan)
    }
  }
  for (let i = 1; i < N; i++) {                      // raíces dobles (la curva solo toca el eje)
    const [y0, y1, y2] = [ys[i - 1], ys[i], ys[i + 1]];
    if (![y0, y1, y2].every(isFinite)) continue;
    if (Math.abs(y1) <= Math.abs(y0) && Math.abs(y1) <= Math.abs(y2) && Math.abs(y1) < 1e-3) {
      let lo = xs[i - 1], hi = xs[i + 1];
      for (let k = 0; k < 80; k++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (Math.abs(f(m1)) < Math.abs(f(m2))) hi = m2; else lo = m1; }
      const r = (lo + hi) / 2;
      if (Math.abs(f(r)) < 1e-7) agregar(r);
    }
  }
  return raices.filter(r => incluirFin || r < b - 1e-6).sort((p, q) => p - q);
}

function runEcuacion(v) {
  const p = normalizar(v.eq).split('=');
  if (p.length !== 2 || !p[0].trim() || !p[1].trim()) throw Error('Escribe una ecuación con un signo =, por ejemplo 2*sin(x) - 1 = 0.');
  const fc = math.compile(`(${p[0]}) - (${p[1]})`);
  const f = x => { const y = fc.evaluate({ x }); return typeof y === 'number' ? y : NaN; };
  const a = v.desde.trim() ? num(v.desde, 'desde') : 0;
  const conFin = v.hasta.trim() !== '';
  const b = conFin ? num(v.hasta, 'hasta') : 2 * PI;
  if (b <= a) throw Error('"hasta" debe ser mayor que "desde".');
  const R = buscarRaices(f, a, b, conFin);
  const L = [`ECUACIÓN: ${v.eq}`, `Intervalo: ${conFin || a !== 0 ? `[${fmtAng(a)}, ${fmtAng(b)}]` : '[0, 2π)'}`, ''];
  if (!R.length) L.push('No encontré soluciones en este intervalo.');
  else {
    L.push(`SOLUCIONES (${R.length}):`);
    R.forEach(r => L.push(`  x = ${fraccionPi(r) ?? '≈ ' + fmt(r)}   (${fmt(grados(r))}°)`));
  }
  L.push('', 'Solución general: a cada solución súmale un múltiplo del período de la ecuación (2πk para sen y cos, πk para tan, con k entero).',
    'Las soluciones se buscan numéricamente; comprueba cada una sustituyéndola en la ecuación.');
  const xs = [], ys = [];
  for (let i = 0; i <= 600; i++) { const x = a + (b - a) * i / 600; let y; try { y = f(x); } catch (e) { y = NaN; } xs.push(x); ys.push(Math.abs(y) < 50 ? y : null); }
  trazar([
    { x: xs, y: ys, type: 'scatter', mode: 'lines', line: { color: '#d9b25a', width: 3 } },
    { x: R, y: R.map(() => 0), type: 'scatter', mode: 'markers', marker: { color: '#ff6b66', size: 10 } },
  ], 'Los puntos rojos son las soluciones (donde la curva cruza y = 0)');
  return L.join('\n');
}

/* Catálogo: cada herramienta tiene nombre, ayuda, campos y la función que calcula */
const FN_SEN_COS = [['sen', 'sen'], ['cos', 'cos']];
const HERRAMIENTAS = {
  angulo: {
    nombre: 'Círculo unitario y valores exactos (ej. 1 y 2)',
    ayuda: 'Escribe un ángulo (7pi/6, -pi/3, 210°) o una razón: sen(5pi/3). Puedes poner varias separadas por ;. Con "pi" son radianes; un número solo se toma como grados.',
    campos: [{ id: 'e', label: 'Ángulo o razón', def: '7pi/6', ancho: true }], run: runAngulo,
  },
  onda: {
    nombre: 'Gráfica de seno o coseno (ej. 3, 4 y 5)',
    ayuda: 'Forma: y = A · sen(B(x − C)) + D. Si tu función es sen(Bx + c), usa C = −c/B. Deja desde/hasta vacíos para ver un período empezando en C.',
    campos: [
      { id: 'fn', label: 'Función', opciones: FN_SEN_COS, def: 'sen' },
      { id: 'A', label: 'A (amplitud)', def: '2' }, { id: 'B', label: 'B', def: '1' },
      { id: 'C', label: 'C (desfase)', def: 'pi/2' }, { id: 'D', label: 'D (vertical)', def: '1' },
      { id: 'desde', label: 'x desde (opcional)', def: '' }, { id: 'hasta', label: 'x hasta (opcional)', def: '' },
    ], run: runOnda,
  },
  identidad: {
    nombre: 'Verificar una identidad (ej. 6)',
    ayuda: 'Escribe cada lado con x. Usa sin(x)^2 en vez de sen²x. Multiplica con *.',
    campos: [{ id: 'izq', label: 'Lado izquierdo', def: '(1-cos(x)^2)/sin(x)', ancho: true }, { id: 'der', label: 'Lado derecho', def: 'sin(x)', ancho: true }],
    run: runIdentidad,
  },
  suma: {
    nombre: 'Suma y diferencia de ángulos (ej. 7)',
    ayuda: 'Escribe un ángulo múltiplo de 15° (75°, 105°, pi/12) o una razón: sen(75°). Se muestra la fórmula con ángulos notables.',
    campos: [{ id: 'e', label: 'Ángulo o razón', def: '75°', ancho: true }], run: runSuma,
  },
  doble: {
    nombre: 'Ángulo doble (ej. 8)',
    ayuda: 'Indica qué razón conoces, su valor (como fracción) y el cuadrante de θ.',
    campos: [
      { id: 'fn', label: 'Razón conocida', opciones: [['sen', 'sen θ'], ['cos', 'cos θ'], ['tan', 'tan θ']], def: 'sen' },
      { id: 'v', label: 'Valor', def: '3/5' },
      { id: 'q', label: 'Cuadrante', opciones: [['1', 'I'], ['2', 'II'], ['3', 'III'], ['4', 'IV']], def: '2' },
    ], run: runDoble,
  },
  inversa: {
    nombre: 'Funciones inversas (ej. 9)',
    ayuda: 'Escribe arcsen, arccos o arctan con su valor. Varias separadas por ;. Para raíces usa sqrt(3)/2.',
    campos: [{ id: 'e', label: 'Expresiones', def: 'arcsen(-1/2); arccos(sqrt(3)/2); arctan(-1)', ancho: true }], run: runInversa,
  },
  ecuacion: {
    nombre: 'Ecuaciones trigonométricas (ej. 10)',
    ayuda: 'Escribe la ecuación en x, por ejemplo 2*sin(x) - 1 = 0 o cos(2*x) = cos(x). Usa sin(x)^2 en vez de sen²x. Por defecto busca en [0, 2π).',
    campos: [
      { id: 'eq', label: 'Ecuación', def: '2*sin(x) - 1 = 0', ancho: true },
      { id: 'desde', label: 'x desde (opcional)', def: '' }, { id: 'hasta', label: 'x hasta (opcional)', def: '' },
    ], run: runEcuacion,
  },
};

// Tarjetas de la hoja de trabajo: [n.º, título, texto, herramienta, valores, ¿plantilla?]
const HOJA = [
  [1, 'Círculo unitario y ángulo de referencia', 'θ = 7π/6', 'angulo', { e: '7pi/6' }],
  [2, 'Evaluación de funciones', 'sen(5π/3); cos(3π/4); tan(−π/3)', 'angulo', { e: 'sen(5pi/3); cos(3pi/4); tan(-pi/3)' }],
  [3, 'Gráfica de la función seno', 'f(x) = 2 sen(x − π/2) + 1', 'onda', { fn: 'sen', A: '2', B: '1', C: 'pi/2', D: '1', desde: '', hasta: '' }],
  [4, 'Gráfica y propiedades del coseno', 'g(x) = −3 cos(2x) + 2, 0 ≤ x ≤ π', 'onda', { fn: 'cos', A: '-3', B: '2', C: '0', D: '2', desde: '0', hasta: 'pi' }],
  [5, 'Modelación trigonométrica', 'plantilla: h(t) = 4 sen(πt/5) + 6, cambia los datos', 'onda', { fn: 'sen', A: '4', B: 'pi/5', C: '0', D: '6', desde: '0', hasta: '10' }, true],
  [6, 'Identidades fundamentales', 'plantilla: (1 − cos²x)/sen x = sen x', 'identidad', { izq: '(1-cos(x)^2)/sin(x)', der: 'sin(x)' }, true],
  [7, 'Suma y diferencia de ángulos', 'plantilla: sen 75°', 'suma', { e: '75°' }, true],
  [8, 'Identidades de ángulo doble', 'sen θ = 3/5, θ en el cuadrante II', 'doble', { fn: 'sen', v: '3/5', q: '2' }],
  [9, 'Funciones trigonométricas inversas', 'plantilla: arcsen(−1/2), arccos(√3/2), arctan(−1)', 'inversa', { e: 'arcsen(-1/2); arccos(sqrt(3)/2); arctan(-1)' }, true],
  [10, 'Ecuaciones trigonométricas', 'plantilla: 2 sen x − 1 = 0', 'ecuacion', { eq: '2*sin(x) - 1 = 0', desde: '', hasta: '' }, true],
];

/* ---------- 4) PANTALLA ---------- */

function pintarCampos(key, valores = {}) {
  const h = HERRAMIENTAS[key];
  $('trig-ayuda').textContent = h.ayuda;
  $('trig-campos').innerHTML = h.campos.map(c => {
    const val = valores[c.id] ?? c.def ?? '';
    const ancho = c.ancho ? ' ancho-campo' : '';
    if (c.opciones) {
      const ops = c.opciones.map(o => `<option value="${o[0]}"${String(o[0]) === String(val) ? ' selected' : ''}>${o[1]}</option>`).join('');
      return `<div class="campo${ancho}"><label for="t-${c.id}">${c.label}</label><select id="t-${c.id}">${ops}</select></div>`;
    }
    return `<div class="campo${ancho}"><label for="t-${c.id}">${c.label}</label><input id="t-${c.id}" value="${String(val).replace(/"/g, '&quot;')}" autocomplete="off" spellcheck="false"></div>`;
  }).join('');
}

function leerCampos(key) {
  const v = {};
  HERRAMIENTAS[key].campos.forEach(c => { v[c.id] = $('t-' + c.id).value; });
  return v;
}

function correrTrig() {
  const key = $('trig-tool').value;
  $('plot-trig').innerHTML = '';
  try {
    if (typeof math === 'undefined') throw Error('No cargó la librería de matemáticas. Revisa tu conexión a Internet.');
    $('trig-out').textContent = HERRAMIENTAS[key].run(leerCampos(key));
  } catch (e) {
    $('trig-out').textContent = `No se pudo calcular.\n\n${e.message || e}\n\nRevisa cómo escribiste los datos (ejemplo: pi/6, sqrt(3)/2, 3/5).`;
  }
}

function abrirTrig(key, valores) {
  $('trig-tool').value = key;
  pintarCampos(key, valores);
  correrTrig();
}

function iniciarTrig() {
  $('trig-tool').innerHTML = Object.entries(HERRAMIENTAS).map(([k, h]) => `<option value="${k}">${h.nombre}</option>`).join('');
  pintarCampos('angulo');
  $('trig-tool').onchange = () => { pintarCampos($('trig-tool').value); $('trig-out').textContent = 'Completa los datos y pulsa Calcular.'; $('plot-trig').innerHTML = ''; };
  $('trig-run').onclick = correrTrig;
  $('trig-campos').addEventListener('keydown', e => { if (e.key === 'Enter') correrTrig(); });

  $('ejemplos-hoja').innerHTML = HOJA.map(([n, titulo, texto, , , plantilla], i) =>
    `<button class="ejemplo" data-h="${i}"><b>${n}. ${titulo}</b><span>${texto}</span></button>`).join('');
  document.querySelectorAll('[data-h]').forEach(b => b.onclick = () => {
    const [, , , key, valores] = HOJA[b.dataset.h];
    abrirTab('trigo');
    abrirTrig(key, valores);
  });
}

if (typeof window !== 'undefined') iniciarTrig();
if (typeof module !== 'undefined') module.exports = { HERRAMIENTAS, razonesExactas, fmt, fraccionPi };
