import { ectsHours } from './ects-hours-math.mjs';

const form = document.getElementById('ects-hours-form');
if (form) {
  const credits = form.elements.namedItem('credits');
  const factor = form.elements.namedItem('factor');
  const weeks = form.elements.namedItem('weeks');
  const output = document.getElementById('ects-hours-result');
  const error = document.getElementById('ects-hours-error');
  const number = value => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(value);
  function render() {
    [credits, factor, weeks].forEach(input => input.removeAttribute('aria-invalid'));
    try {
      const r = ectsHours({ credits: credits.value, factor: factor.value, weeks: weeks.value });
      error.hidden = true;
      error.textContent = '';
      output.innerHTML = `<p class="r28-result-label">Carga de trabajo total</p><p class="r28-number"><span id="ects-total">${number(r.total)}</span> <span>horas</span></p><p id="ects-formula">${number(r.credits)} ECTS × ${number(r.factor)} horas/ECTS = ${number(r.total)} horas</p><dl class="r28-breakdown"><div><dt>Rango con 25–30 horas por crédito</dt><dd>${number(r.low)}–${number(r.high)} horas</dd></div><div><dt>Promedio semanal</dt><dd id="ects-weekly">${r.weekly === null ? 'Sin calcular: añade las semanas si quieres repartir la carga.' : `${number(r.weekly)} horas/semana durante ${number(r.weeks)} semanas`}</dd></div></dl><p class="small">Trabajo total estimado: clases, estudio, actividades y evaluación. El reparto semanal no es un horario de clases.</p>`;
    } catch (e) {
      output.innerHTML = '<p>Corrige las entradas para mostrar un resultado actualizado.</p>';
      error.textContent = e.message;
      error.hidden = false;
      [credits, factor, weeks].forEach(input => {
        const raw = input.value.trim();
        if ((input !== weeks && !raw) || (raw && !/^[+]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(raw)) || (input === factor && (Number(raw.replace(',', '.')) < 25 || Number(raw.replace(',', '.')) > 30)) || (input === weeks && raw && Number(raw.replace(',', '.')) <= 0)) input.setAttribute('aria-invalid','true');
      });
    }
  }
  form.addEventListener('submit', e => { e.preventDefault(); render(); });
  form.addEventListener('input', render);
  form.querySelectorAll('[data-ects-preset]').forEach(button => button.addEventListener('click', () => { credits.value = button.dataset.ectsPreset; render(); }));
  form.querySelector('[data-ects-reset]').addEventListener('click', () => { form.reset(); render(); credits.focus(); });
  form.querySelector('[data-ects-print]').addEventListener('click', () => window.print());
  render();
}
