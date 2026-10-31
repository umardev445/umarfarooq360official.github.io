export function parseSeries(text, label) {
  if (!String(text).trim()) throw new Error('Introduce ' + label + '.');
  const tokens = String(text).trim().split(/[;\n]+/).map(s => s.trim());
  if (tokens.length > 200) throw new Error('Usa como máximo 200 valores o filas.');
  return tokens.map(token => {
    if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(token)) throw new Error('Revisa ' + label + ': un número por línea o separado con punto y coma.');
    const number = Number(token.replace(',', '.'));
    if (!Number.isFinite(number)) throw new Error('Todos los números deben ser finitos.');
    return number;
  });
}

export function meanDeviation(valuesText, frequencyText = '') {
  const values = parseSeries(valuesText, 'los valores');
  const frequencies = String(frequencyText).trim() ? parseSeries(frequencyText, 'las frecuencias') : values.map(() => 1);
  if (values.length !== frequencies.length) throw new Error('Debe haber una frecuencia por cada valor.');
  if (frequencies.some(n => !Number.isSafeInteger(n) || n < 0)) throw new Error('Las frecuencias deben ser enteras no negativas.');
  const count = frequencies.reduce((a,b) => a+b, 0);
  if (!Number.isSafeInteger(count) || count <= 0) throw new Error('La suma de frecuencias debe ser positiva y estar dentro del rango seguro.');
  const mean = values.reduce((s,v,i) => s + v * (frequencies[i] / count), 0);
  const rows = values.map((value,i) => ({value, frequency:frequencies[i], distance:Math.abs(value-mean), weightedDistance:frequencies[i] ? Math.abs(value-mean)*frequencies[i] : 0}));
  const distanceTotal = rows.reduce((s,r) => s+r.weightedDistance,0);
  const deviation = distanceTotal/count;
  if (![mean,distanceTotal,deviation].every(Number.isFinite)) throw new Error('Los valores son demasiado grandes para un resultado fiable. Reduce la escala.');
  return {mean,deviation,count,distanceTotal,rows};
}
