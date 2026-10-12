(function(root) {
  'use strict';
  const fail = message => { throw new Error(message); };
  const finite = (value, label) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) fail('Introduce un número válido en «' + label + '».');
    return value;
  };
  const integer = (value, label) => {
    finite(value, label);
    if (!Number.isSafeInteger(value) || value < 0) fail('«' + label + '» debe ser un entero no negativo.');
    return value;
  };
  const number = (value, label) => {
    const text = String(value).trim();
    if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(text)) fail('Completa «' + label + '» con un número; puedes usar coma o punto decimal.');
    return finite(Number(text.replace(',', '.')), label);
  };
  const bounds = (min, max) => {
    finite(min, 'Nota mínima de la escala'); finite(max, 'Nota máxima de la escala');
    if (min < 0 || max <= min) fail('La escala debe empezar en cero o más y terminar en un valor mayor.');
  };
  const inRange = (value, min, max, label) => {
    finite(value, label);
    if (value < min || value > max) fail('«' + label + '» debe estar entre ' + min + ' y ' + max + '.');
  };
  const checkResult = value => {
    if (!Number.isFinite(value)) fail('Estos valores exceden el rango de cálculo. Usa valores académicos reales.');
    return value;
  };
  function average(rows, min, max, mode, kind) {
    bounds(min, max);
    if (!Array.isArray(rows) || !rows.length) fail('Añade al menos una nota.');
    if (!['simple', 'weighted'].includes(mode)) fail('Selecciona un modo de promedio válido.');
    if (mode === 'weighted' && !['percent', 'credits'].includes(kind)) fail('Selecciona el tipo de peso.');
    let numerator = 0, denominator = 0;
    const terms = rows.map((row, i) => {
      inRange(row.grade, min, max, 'Nota ' + (i + 1));
      const weight = mode === 'simple' ? 1 : finite(row.weight, 'Peso ' + (i + 1));
      if (weight < 0) fail('Los pesos no pueden ser negativos.');
      numerator += row.grade * weight; denominator += weight;
      return {grade: row.grade, weight, product: row.grade * weight};
    });
    checkResult(numerator); checkResult(denominator);
    if (denominator <= 0) fail('La suma de pesos debe ser mayor que cero.');
    if (mode === 'weighted' && kind === 'percent' && Math.abs(denominator - 100) > 1e-7) fail('Los porcentajes deben sumar 100. Ahora suman ' + denominator + '. Para un examen pendiente usa «Nota necesaria».');
    return {value: checkResult(numerator / denominator), numerator, denominator, terms};
  }
  function target(current, finalWeight, desired, min, max) {
    bounds(min, max); inRange(current, min, max, 'Promedio ya evaluado'); inRange(desired, min, max, 'Nota objetivo');
    finite(finalWeight, 'Peso del examen final');
    if (finalWeight <= 0 || finalWeight > 100) fail('El peso del examen debe ser mayor que 0 y no superar 100 %.');
    const w = finalWeight / 100;
    const required = checkResult((desired - current * (1 - w)) / w);
    const best = checkResult(current * (1 - w) + max * w);
    const epsilon = Number.EPSILON * Math.max(1, Math.abs(max), Math.abs(required)) * 16;
    return {required, value: Math.max(min, required), best, status: required > max + epsilon ? 'impossible' : required <= min + epsilon ? 'met' : 'possible', w, current, desired};
  }
  function gpa(rows, max, priorCredits = 0, priorGpa = null) {
    finite(max, 'Máximo de puntos');
    if (max <= 0) fail('El máximo de puntos debe ser mayor que cero.');
    finite(priorCredits, 'Créditos anteriores');
    if (priorCredits < 0) fail('Los créditos anteriores no pueden ser negativos.');
    if (priorCredits > 0) inRange(priorGpa, 0, max, 'GPA anterior');
    let credits = 0, quality = 0;
    const terms = [];
    rows.forEach((row, i) => {
      if (row.exclude) return;
      finite(row.credits, 'Créditos de la asignatura ' + (i + 1));
      if (row.credits <= 0) fail('Cada asignatura incluida debe tener créditos mayores que cero.');
      inRange(row.points, 0, max, 'Puntos de la asignatura ' + (i + 1));
      credits += row.credits; quality += row.credits * row.points;
      terms.push({credits: row.credits, points: row.points, product: row.credits * row.points});
    });
    if (!terms.length) fail('Incluye al menos una asignatura con calificación.');
    checkResult(credits); checkResult(quality);
    const semester = checkResult(quality / credits);
    const cumulative = checkResult((quality + (priorCredits > 0 ? priorCredits * priorGpa : 0)) / (credits + priorCredits));
    return {value: semester, cumulative, credits, quality, terms, priorCredits};
  }
  const ceilNear = value => Math.ceil(value - Number.EPSILON * Math.max(1, Math.abs(value)) * 8);
  function attendance(attended, held, remaining, percent) {
    integer(attended, 'Clases asistidas'); integer(held, 'Clases realizadas'); integer(remaining, 'Clases pendientes');
    if (held <= 0) fail('Introduce al menos una clase realizada.');
    if (attended > held) fail('Las clases asistidas no pueden superar las realizadas.');
    finite(percent, 'Asistencia mínima');
    if (percent <= 0 || percent > 100) fail('La asistencia mínima debe ser mayor que 0 y no superar 100 %.');
    if (!Number.isSafeInteger(held + remaining)) fail('El total de clases es demasiado grande.');
    const p = percent / 100, current = attended / held * 100;
    const requiredTotal = ceilNear((held + remaining) * p);
    const mustAttend = Math.max(0, requiredTotal - attended);
    const possible = mustAttend <= remaining;
    // Use whole-percent units to avoid cancellation such as 0.8*17-13.
    const consecutive = attended * 100 >= percent * held ? 0 : p === 1 ? null : Math.max(0, ceilNear((percent * held - attended * 100) / (100 - percent)));
    return {value: current, best: (attended + remaining) / (held + remaining) * 100, mustAttend, canMiss: possible ? remaining - mustAttend : null, possible, consecutive: consecutive !== null && consecutive <= remaining ? consecutive : null, held, attended, remaining, percent};
  }
  function exam(total, correct, wrong, max, mode, choices = 4, customPenalty = 0, clamp = false) {
    integer(total, 'Total de preguntas'); integer(correct, 'Aciertos'); integer(wrong, 'Errores');
    if (total <= 0) fail('El examen debe tener al menos una pregunta.');
    if (correct > total || wrong > total - correct) fail('Aciertos más errores no pueden superar el total de preguntas.');
    finite(max, 'Nota máxima'); if (max <= 0) fail('La nota máxima debe ser mayor que cero.');
    let penalty = 0;
    if (mode === 'choices') {
      integer(choices, 'Opciones por pregunta');
      if (choices < 2) fail('Debe haber al menos dos opciones por pregunta.');
      penalty = 1 / (choices - 1);
    } else if (mode === 'custom') {
      finite(customPenalty, 'Penalización por error');
      if (customPenalty < 0) fail('La penalización no puede ser negativa.');
      penalty = customPenalty;
    } else if (mode !== 'none') fail('Selecciona un modelo de penalización válido.');
    const effective = checkResult(correct - wrong * penalty);
    const raw = checkResult(effective / total * max);
    return {value: clamp ? Math.max(0, raw) : raw, raw, effective, penalty, blank: total - correct - wrong, accuracy: correct / total * 100, total, correct, wrong, max, clamp};
  }
  root.AspireMath = Object.freeze({number, average, target, gpa, attendance, exam});
})(typeof window !== 'undefined' ? window : globalThis);

