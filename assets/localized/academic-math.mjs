/** Shared arithmetic for the English tools and Spanish statistics calculator. */
export function numeric(value, label = 'Value') {
  const text = String(value).trim();
  if (!text || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) throw new Error(`${label}: enter a valid number.`);
  const number = Number(text);
  if (!Number.isFinite(number)) throw new Error(`${label}: enter a finite number.`);
  return number;
}
function bounded(value, label, min, max) {
  const number = numeric(value, label);
  if (number < min || number > max) throw new Error(`${label}: use a value from ${min} to ${max}.`);
  return number;
}
export function finalGrade(mode, currentInput, weightInput, targetInput) {
  if (!['required', 'projected'].includes(mode)) throw new Error('Choose a calculation mode.');
  const current = bounded(currentInput, 'Current average', 0, 100);
  const weight = bounded(weightInput, 'Final weight', 0, 100) / 100;
  const target = bounded(targetInput, mode === 'required' ? 'Target grade' : 'Expected final score', 0, 100);
  if (mode === 'required' && weight === 0) return {value: null, status: current >= target ? 'secured-zero-weight' : 'impossible-zero-weight', current, weight, target};
  const value = mode === 'required' ? (target - current * (1 - weight)) / weight : current * (1 - weight) + target * weight;
  if (!Number.isFinite(value)) throw new Error('The result is outside the supported range.');
  return {value, status: mode === 'projected' ? 'projected' : value > 100 + 1e-9 ? 'impossible' : value <= 0 ? 'secured' : 'required', current, weight, target};
}
export function ectsWorkload(mode, amountInput, factorInput, weeksInput) {
  if (!['hours', 'credits'].includes(mode)) throw new Error('Choose a calculation direction.');
  const amount = numeric(amountInput, mode === 'hours' ? 'Total hours' : 'ECTS credits');
  const factor = numeric(factorInput, 'Hours per credit');
  if (amount < 0 || factor <= 0) throw new Error('Use non-negative workload and a positive hours-per-credit value.');
  const hours = mode === 'hours' ? amount : amount * factor;
  const credits = mode === 'hours' ? amount / factor : amount;
  const weeks = String(weeksInput ?? '').trim() === '' ? null : numeric(weeksInput, 'Study weeks');
  if (weeks !== null && weeks <= 0) throw new Error('Study weeks must be positive, or leave this field blank.');
  const weekly = weeks === null ? null : hours / weeks;
  if (![hours, credits, ...(weekly === null ? [] : [weekly])].every(Number.isFinite)) throw new Error('The result is outside the supported range.');
  return {hours, credits, factor, weeks, weekly};
}
export function parseDataset(input, decimal = 'dot') {
  if (!['dot', 'comma'].includes(decimal)) throw new Error('Elige el separador decimal.');
  const text = String(input).trim();
  if (!text) throw new Error('Introduce al menos un dato.');
  const tokens = decimal === 'comma' ? text.split(/[;\n\r]+/) : text.split(/[\s,;]+/);
  if (tokens.length > 1000) throw new Error('El límite es de 1.000 observaciones.');
  return tokens.map((token, i) => {
    const cleaned = token.trim();
    if (!cleaned) throw new Error(`Dato ${i + 1}: hay un valor vacío.`);
    const normalized = decimal === 'comma' ? cleaned.replace(',', '.') : cleaned;
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized) || !Number.isFinite(Number(normalized))) throw new Error(`Dato ${i + 1}: revisa el número y el separador decimal.`);
    return Number(normalized);
  });
}
export function standardDeviation(values, model = 'population') {
  if (!['population', 'sample'].includes(model)) throw new Error('Elige muestra o población.');
  if (!Array.isArray(values) || !values.length || values.length > 1000 || !values.every(Number.isFinite)) throw new Error('Introduce entre 1 y 1.000 datos numéricos válidos.');
  if (model === 'sample' && values.length < 2) throw new Error('La desviación muestral necesita al menos dos observaciones.');
  // Welford avoids the unstable E[x²] − E[x]² calculation.
  let mean = 0, m2 = 0, count = 0;
  for (const value of values) { count++; const delta = value - mean; mean += delta / count; m2 += delta * (value - mean); }
  const divisor = model === 'sample' ? count - 1 : count;
  const variance = Math.max(0, m2 / divisor), deviation = Math.sqrt(variance);
  if (![mean,m2,variance,deviation].every(Number.isFinite)) throw new Error('Los valores exceden el rango numérico admitido.');
  return {count,mean,sumSquares:Math.max(0,m2),divisor,variance,deviation,min:Math.min(...values),max:Math.max(...values),model};
}
