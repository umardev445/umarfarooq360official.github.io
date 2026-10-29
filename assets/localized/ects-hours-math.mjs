export function spanishNumber(value, label, optional = false) {
  const text = String(value ?? '').trim();
  if (!text && optional) return null;
  if (!text || !/^[+]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(text)) throw new Error(`Introduce ${label} como un número válido, sin separadores de miles.`);
  const number = Number(text.replace(',', '.'));
  if (!Number.isFinite(number)) throw new Error(`Revisa ${label}: el valor es demasiado grande.`);
  return number;
}

export function ectsHours({ credits, factor, weeks }) {
  const c = spanishNumber(credits, 'los créditos');
  const f = spanishNumber(factor, 'las horas por crédito');
  const w = spanishNumber(weeks, 'las semanas', true);
  if (f < 25 || f > 30) throw new Error('Las horas por crédito deben estar entre 25 y 30. Consulta el factor de tu universidad.');
  if (w !== null && w <= 0) throw new Error('Para calcular horas semanales, las semanas deben ser mayores que cero; también puedes dejar el campo vacío.');
  const total = c * f, low = c * 25, high = c * 30;
  const weekly = w === null ? null : total / w;
  if (![total, low, high, ...(weekly === null ? [] : [weekly])].every(Number.isFinite)) throw new Error('Los valores producen un resultado demasiado grande. Revisa las entradas.');
  return { credits: c, factor: f, weeks: w, total, low, high, weekly };
}
