(function() {
  'use strict';
  const form = document.getElementById('calculator');
  if (!form) return;
  const M = window.AspireMath, tool = form.dataset.tool;
  const el = id => document.getElementById(id);
  const value = id => el(id).value;
  const num = (id, label) => M.number(value(id), label);
  const fmt = n => new Intl.NumberFormat(document.documentElement.lang||'es', {maximumFractionDigits: 3}).format(n);
  const fmtMinimum = n => new Intl.NumberFormat(document.documentElement.lang||'es', {maximumFractionDigits: 12}).format(n);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let serial = 0, edited = false, measured = false, lastValid = false;
  const result = el('result');
  const feedback = el('tool-feedback');
  let inputDelay;
  const announce = text => { if (feedback) feedback.textContent = text; };
  function scheduleCalculation() { mark(); lastValid = false; clearTimeout(inputDelay); inputDelay = setTimeout(calculate, 180); }
  const metric = (label, number) => '<div class="metric"><strong>' + esc(number) + '</strong><span>' + esc(label) + '</span></div>';
  function show(label, amount, explanation, metrics = [], warning = false) {
    result.className = 'result' + (warning ? ' error' : '');
    result.innerHTML = '<div class="result-label">' + (edited ? 'Tu cálculo' : 'Resultado del ejemplo editable') + '</div><div class="result-value">' + esc(amount) + '</div><p class="result-explain"><strong>' + esc(label) + '</strong></p><p class="result-explain">' + esc(explanation) + '</p>' + (metrics.length ? '<div class="metrics">' + metrics.join('') + '</div>' : '');
  }
  function mark() {
    edited = true;
    if (!measured && typeof window.gtag === 'function') {
      window.gtag('event', 'tool_interaction', {tool, language: document.documentElement.lang||'es'});
      measured = true;
    }
  }
  function field(id, label, val = '', extra = '') {
    return '<div class="field"><label for="' + id + '">' + label + '</label><input id="' + id + '" ' + extra + ' value="' + esc(val) + '"></div>';
  }
  function addRow(row, focus = false) {
    const id = ++serial;
    const wrapper = document.createElement('div');
    wrapper.className = 'input-row';
    if (tool === 'grades') {
      wrapper.dataset.gradeRow = '';
      wrapper.innerHTML = field('name-' + id, 'Actividad (opcional)', row.name || '', 'type="text" maxlength="60" data-name autocomplete="off"') + field('grade-' + id, 'Nota', row.grade ?? '', 'type="text" inputmode="decimal" data-grade autocomplete="off"') + '<div data-weight-field>' + field('weight-' + id, 'Peso', row.weight ?? '', 'type="text" inputmode="decimal" data-weight autocomplete="off"') + '</div><button type="button" class="remove" data-remove aria-label="Eliminar esta actividad">×</button>';
      el('grade-rows').append(wrapper);
    } else {
      wrapper.dataset.gpaRow = '';
      wrapper.innerHTML = field('name-' + id, 'Asignatura (opcional)', row.name || '', 'type="text" maxlength="60" data-name autocomplete="off"') + field('credits-' + id, 'Créditos', row.credits ?? '', 'type="text" inputmode="decimal" data-credits autocomplete="off"') + field('points-' + id, 'Puntos de nota', row.points ?? '', 'type="text" inputmode="decimal" data-points autocomplete="off"') + '<label class="check-field"><input type="checkbox" data-exclude ' + (row.exclude ? 'checked' : '') + '>Excluir del GPA</label><button type="button" class="remove" data-remove aria-label="Eliminar esta asignatura">×</button>';
      el('gpa-rows').append(wrapper);
    }
    if (focus) wrapper.querySelector('input').focus();
  }
  function sync() {
    if (tool === 'grades') {
      const mode = value('mode');
      el('target-fields').hidden = mode !== 'target';
      el('grade-inputs').hidden = mode === 'target';
      el('weight-type-field').hidden = mode !== 'weighted';
      form.querySelectorAll('[data-weight-field]').forEach(field => { field.hidden = mode !== 'weighted'; });
      el('add-row').hidden = mode === 'target';
      el('weight-help').hidden = mode !== 'weighted';
    } else if (tool === 'exam') {
      el('choices-field').hidden = value('penalty-mode') !== 'choices';
      el('custom-field').hidden = value('penalty-mode') !== 'custom';
    }
  }
  function calculate() {
    sync();
    announce('');
    lastValid = false;
    try {
      if (tool === 'grades') {
        const min = num('scale-min','Mínimo de la escala'), max = num('scale-max','Máximo de la escala');
        if (value('mode') === 'target') {
          const r = M.target(num('current','Promedio ya evaluado'),num('final-weight','Peso del examen'),num('desired','Nota objetivo'),min,max);
          const amount = r.status === 'impossible' ? fmt(r.required) + ' / ' + fmt(max) : fmtMinimum(r.practical) + ' / ' + fmtMinimum(max);
          const label = r.status === 'impossible' ? 'El objetivo supera lo alcanzable con esta escala.' : r.status === 'met' ? 'Basta el mínimo de la escala para alcanzar este objetivo matemático.' : 'Nota mínima práctica, redondeada hacia arriba a tres decimales.';
          const explanation = 'Fórmula: (' + fmt(r.desired) + ' − ' + fmt(r.current) + ' × ' + fmt(1-r.w) + ') ÷ ' + fmt(r.w) + ' ≈ ' + fmt(r.required) + '. El mínimo práctico se redondea hacia arriba para no quedar por debajo del objetivo; aplica también el redondeo de tu institución. No contempla una nota mínima separada en el examen ni otras reglas del curso.';
          show(label, amount, explanation, [metric('Mejor nota final posible',fmt(r.best)),metric('Peso del examen',fmt(r.w*100)+' %')],r.status === 'impossible');
        } else {
          const rows = [...form.querySelectorAll('[data-grade-row]')].map((row,i) => ({grade:M.number(row.querySelector('[data-grade]').value,'Nota '+(i+1)),weight:value('mode')==='simple'?1:M.number(row.querySelector('[data-weight]').value,'Peso '+(i+1))}));
          const r = M.average(rows,min,max,value('mode'),value('weight-kind'));
          const isSimple = value('mode') === 'simple';
          const formula = r.terms.map(t=>isSimple?fmt(t.grade):fmt(t.grade)+' × '+fmt(t.weight)).join(' + ');
          show(isSimple?'Promedio simple':'Promedio ponderado',fmt(r.value)+' / '+fmt(max),'('+formula+') ÷ '+fmt(r.denominator)+' = '+fmt(r.value)+'. Se muestra hasta tres decimales; aplica el redondeo de tu institución.',[metric(isSimple?'Notas incluidas':'Suma de pesos',fmt(r.denominator)),metric('Suma de productos',fmt(r.numerator))]);
        }
      } else if (tool === 'gpa') {
        const max = num('point-max','Máximo de puntos');
        const priorCredits = num('prior-credits','Créditos anteriores');
        const priorGpa = priorCredits > 0 ? num('prior-gpa','GPA anterior') : null;
        const rows = [...form.querySelectorAll('[data-gpa-row]')].map((row,i) => row.querySelector('[data-exclude]').checked ? {exclude:true} : {exclude:false,credits:M.number(row.querySelector('[data-credits]').value,'Créditos '+(i+1)),points:M.number(row.querySelector('[data-points]').value,'Puntos '+(i+1))});
        const r = M.gpa(rows,max,priorCredits,priorGpa);
        const metrics = [metric('Créditos incluidos del período',fmt(r.credits)),metric('Puntos de calidad del período',fmt(r.quality))];
        if(priorCredits > 0) metrics.push(metric('GPA acumulado estimado',fmt(r.cumulative)),metric('Créditos totales',fmt(r.credits+priorCredits)));
        show('GPA del período con tus puntos de nota',fmt(r.value)+' / '+fmt(max),fmt(r.quality)+' puntos de calidad ÷ '+fmt(r.credits)+' créditos = '+fmt(r.value)+'. No convierte automáticamente notas extranjeras ni decide qué cursos admite tu institución.',metrics);
      } else if (tool === 'attendance') {
        const r = M.attendance(num('attended','Clases asistidas'),num('held','Clases realizadas'),num('remaining','Clases pendientes'),num('required','Asistencia mínima'));
        const explanation = r.possible ? 'Para terminar con al menos '+fmt(r.percent)+' %, debes asistir a '+r.mustAttend+' de las '+r.remaining+' clases pendientes. El margen de ausencias es para el total del período, no permiso para faltar ahora.' : 'Incluso asistiendo a todas las clases pendientes llegarías a '+fmt(r.best)+' %. Revisa tu situación y las reglas de justificación con tu institución.';
        show('Asistencia actual',fmt(r.value)+' %',explanation,[metric('Ausencias posibles hasta el final',r.canMiss===null?'Objetivo no alcanzable':r.canMiss),metric('Asistencia final máxima',fmt(r.best)+' %'),metric('Clases seguidas para llegar al mínimo',r.consecutive===null?'No alcanzable con las pendientes':r.consecutive),metric('Mínimo elegido por ti',fmt(r.percent)+' %')],!r.possible);
      } else if (tool === 'exam') {
        const mode = value('penalty-mode');
        const r = M.exam(num('total','Total de preguntas'),num('correct','Aciertos'),num('wrong','Errores'),num('exam-max','Nota máxima'),mode,mode==='choices'?num('choices','Opciones por pregunta'):4,mode==='custom'?num('custom-penalty','Penalización por error'):0,el('clamp').checked);
        const explanation = '('+r.correct+' − '+r.wrong+' × '+fmt(r.penalty)+') ÷ '+r.total+' × '+fmt(r.max)+' = '+fmt(r.raw)+(r.clamp && r.raw < 0 ? '. Se aplica el suelo de cero que has seleccionado.' : '. No se aplican otros baremos o mínimos.')+' Comprueba el modelo de corrección de tu examen.';
        show('Nota según el modelo elegido',fmt(r.value)+' / '+fmt(r.max),explanation,[metric('Preguntas en blanco',r.blank),metric('Porcentaje de aciertos sin penalizar',fmt(r.accuracy)+' %'),metric('Aciertos netos tras penalizar',fmt(r.effective)),metric('Penalización por error',fmt(r.penalty))],r.raw < 0);
      }
      lastValid = true;
      if (edited) announce(result.innerText);
    } catch(error) {
      result.className = 'result error';
      result.innerHTML = '<div class="result-label">Revisa los datos</div><p class="result-explain">'+esc(error.message)+'</p>';
      if (edited) announce(error.message);
    }
  }
  function populate(example) {
    form.reset();
    if(tool === 'grades') {
      el('grade-rows').innerHTML='';
      (example?[{name:'Parcial',grade:'8',weight:'40'},{name:'Trabajo',grade:'7',weight:'30'},{name:'Proyecto',grade:'9',weight:'30'}]:[{}]).forEach(row=>addRow(row));
      if(!example) ['current','desired','final-weight'].forEach(id=>{el(id).value='';});
    } else if(tool === 'gpa') {
      el('gpa-rows').innerHTML='';
      (example?[{name:'Asignatura A',credits:'3',points:'4'},{name:'Asignatura B',credits:'3',points:'3'},{name:'Asignatura C',credits:'3',points:'2'}]:[{}]).forEach(row=>addRow(row));
    } else if(!example) {
      const ids = tool==='attendance'?['attended','held','remaining']:['total','correct','wrong'];
      ids.forEach(id=>{el(id).value='';});
    }
    calculate();
  }
  form.addEventListener('input',scheduleCalculation);
  form.addEventListener('change',()=>{clearTimeout(inputDelay);mark();calculate();});
  form.addEventListener('submit',event=>{event.preventDefault();clearTimeout(inputDelay);mark();calculate();announce(result.innerText);if(lastValid&&typeof window.gtag==='function'&&!window['ga-disable-G-54C36SGS3Z'])window.gtag('event','tool_complete',{tool_id:tool,language:'es'});});
  form.addEventListener('click',event=>{
    const button = event.target.closest('button');
    if(!button) return;
    if(button.hasAttribute('data-remove')) {
      const rows = form.querySelectorAll('.input-row');
      if(rows.length > 1) {const current=button.closest('.input-row'),list=[...rows],index=list.indexOf(current),next=list[index+1]||list[index-1];current.remove();next.querySelector('input').focus();mark();calculate();announce('Fila eliminada. Resultado actualizado.');}
      else {result.className='result error';result.innerHTML='<p>Conserva al menos una fila. Puedes borrar sus valores o usar «Limpiar».</p>';lastValid=false;}
    } else if(button.id==='add-row') {
      if(form.querySelectorAll('.input-row').length >= 30) {result.className='result error';result.innerHTML='<p>El formulario admite 30 filas por cálculo. Divide un historial más largo en períodos y combina sus créditos y puntos.</p>';lastValid=false;return;}
      addRow({},true);mark();calculate();announce('Fila añadida. Completa sus valores.');
    } else if(button.id==='example') {edited=false;populate(true);}
    else if(button.id==='clear') {mark();populate(false);form.querySelector('input:not([type=checkbox])')?.focus();announce('Formulario limpio. Introduce tus datos.');}
    else if(button.id==='print') {clearTimeout(inputDelay);calculate();if(lastValid)window.print();else announce('Revisa los datos antes de imprimir.');}
    else if(button.id==='copy-result') {calculate();if(!lastValid){announce('Revisa los datos antes de copiar.');return;}const text=result.innerText;const copy=async()=>{try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);}else{const box=document.createElement('textarea');box.value=text;box.setAttribute('readonly','');box.style.position='fixed';box.style.opacity='0';document.body.append(box);box.select();const copied=document.execCommand('copy');box.remove();button.focus({preventScroll:true});if(!copied)throw Error('copy');}announce('Resultado copiado.');}catch{announce('No se pudo copiar. Selecciona el resultado manualmente.');}};copy();}
  });
  const copyButton=document.createElement('button');copyButton.type='button';copyButton.id='copy-result';copyButton.className='secondary';copyButton.textContent='Copiar resultado';form.querySelector('.actions').append(copyButton);
  populate(true);
})();

