(function () {
  'use strict';
  const M=globalThis.AspireStudy;
  if(!M)return;
  const $=id=>document.getElementById(id), esc=M.escape;
  const format=n=>n===null?'No definida':new Intl.NumberFormat('es',{maximumFractionDigits:6,...(n!==0&&Math.abs(n)<.000001?{notation:'scientific',maximumFractionDigits:4}:{})}).format(n);
  const result=$('study-result'), form=$('study-tool');
  let plainOutput='',lastStats=null,lastAPA=null,library=[];
  const message=(html,error=false)=>{if(result){result.classList.toggle('error',error);result.innerHTML=html;plainOutput=result.innerText;}};
  const safe=fn=>{try{return fn();}catch(e){if(form?.dataset.studyTool==='timer'&&$('timer-status')){$('timer-status').textContent=e.message;result.classList.add('error');}else message('<p><strong>Revisa los datos.</strong> '+esc(e.message)+'</p>',true);}};
  const metric=(label,value)=>`<div class="metric"><strong>${value}</strong><span>${label}</span></div>`;
  const table=(caption,heads,rows)=>`<div class="table-wrap" tabindex="0" role="region" aria-label="${esc(caption)}"><table><caption>${esc(caption)}</caption><thead><tr>${heads.map(x=>'<th scope="col">'+esc(x)+'</th>').join('')}</tr></thead><tbody>${rows.map(r=>'<tr>'+r.map(x=>'<td>'+x+'</td>').join('')+'</tr>').join('')}</tbody></table></div>`;
  function download(name,text,mime='text/plain;charset=utf-8'){
    const url=URL.createObjectURL(new Blob([text],{type:mime})), a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const csvCell=x=>{let s=String(x);if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
  async function copy(text){
    try{await navigator.clipboard.writeText(text);}catch{const box=document.createElement('textarea');box.value=text;document.body.append(box);box.select();const ok=document.execCommand('copy');box.remove();if(!ok)throw Error('No se pudo copiar. Selecciona el texto del resultado manualmente.');}
    const status=$('copy-status');if(status)status.textContent='Copiado.';
  }
  function statistics(){
    const data=M.parseList($('stat-data').value,$('stat-format').value),s=M.describe(data);lastStats=s;
    const medianPosition=s.n%2?`posición ${(s.n+1)/2}`:`posiciones ${s.n/2} y ${s.n/2+1}`;
    const rows=s.frequency.slice(0,60).map(x=>[format(x.value),String(x.count),format(x.count/s.n*100)+' %']);
    message(`<p class="result-label">Resumen de ${s.n} datos</p><div class="metrics">${metric('Media',format(s.mean))}${metric('Mediana',format(s.median))}${metric('Moda(s)',s.modes.length?s.modes.map(format).join('; '):'Sin repetición modal')}${metric('Rango',format(s.range))}${metric('Suma',format(s.sum))}${metric('Mínimo / máximo',format(s.min)+' / '+format(s.max))}${metric('Desviación poblacional (divide por n)',format(s.populationSD))}${metric('Desviación muestral (divide por n − 1)',s.sampleSD===null?'Requiere al menos 2 datos':format(s.sampleSD))}</div><h3>Comprueba cómo se interpretó la lista</h3><p>${s.ordered.slice(0,100).map(format).join('; ')}${s.n>100?'… (primeros 100 valores ordenados)':''}</p><p>Media = ${format(s.sum)} ÷ ${s.n}. Mediana: ${medianPosition} de la lista ordenada. Se muestran todas las modas empatadas cuando alguna frecuencia es mayor que 1.</p>${table('Frecuencias de los valores introducidos',['Valor','Frecuencia','Porcentaje'],rows)}${s.frequency.length>60?'<p class="small">Se muestran las primeras 60 filas; los resultados usan la lista completa.</p>':''}<p class="small">Presentación redondeada hasta seis decimales; el cálculo utiliza los valores completos introducidos.</p>`);
  }
  let rowId=0;
  function input(label,id,value,extra=''){return `<div class="field"><label for="${id}">${label}</label><input id="${id}" value="${esc(value)}" ${extra}></div>`;}
  function addTask(t={name:'',hours:'',priority:'2',deadline:''}){
    if($('plan-rows').children.length>=20)throw Error('Puedes planificar hasta 20 tareas por semana.');
    const el=document.createElement('div'),id=++rowId;el.className='study-row';el.dataset.row=String(id);
    el.innerHTML=input('Asignatura u objetivo','plan-name-'+id,t.name,'type="text" maxlength="120"')+input('Horas pendientes','plan-hours-'+id,t.hours,'type="text" inputmode="decimal"')+`<div class="field"><label for="plan-priority-${id}">Prioridad</label><select id="plan-priority-${id}">${[1,2,3].map(v=>`<option value="${v}"${String(t.priority)===String(v)?' selected':''}>${v}${v===1?' · alta':''}</option>`).join('')}</select></div>`+input('Límite (opcional)','plan-deadline-'+id,t.deadline,'type="date"')+`<button type="button" class="secondary remove-study-row" aria-label="Eliminar tarea ${id}">Quitar</button>`;
    el.querySelector('button').addEventListener('click',()=>el.remove());$('plan-rows').append(el);
  }
  const taskData=()=>[...$('plan-rows').children].map(el=>{const n=el.dataset.row;return {name:$('plan-name-'+n).value,hours:$('plan-hours-'+n).value,priority:$('plan-priority-'+n).value,deadline:$('plan-deadline-'+n).value};});
  const planData=()=>({start:$('plan-start').value,reserve:$('plan-buffer').value,availability:Array.from({length:7},(_,i)=>$('plan-day-'+i).value),tasks:taskData()});
  function dateLabels(){
    if(!$('plan-start').value)return;
    safe(()=>{const t=M.isoDate($('plan-start').value);for(let i=0;i<7;i++){const d=new Date(t+i*86400000);document.querySelector(`label[for="plan-day-${i}"]`).textContent=new Intl.DateTimeFormat('es',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'}).format(d);}});
  }
  function planner(){
    const d=planData(),p=M.planWeek(d.start,d.availability,d.tasks,d.reserve);
    message(`<p class="result-label">Tu semana de estudio</p><div class="metrics">${metric('Trabajo que quieres completar',format(p.workload)+' h')}${metric('Capacidad utilizable',format(p.capacity)+' h')}${metric('Horas sin asignar antes de sus límites',format(p.unallocated)+' h')}${metric('Reserva elegida',format(p.reserve)+' %')}</div>${p.unallocated>1e-8?'<p class="notice warning">El plan no cabe por completo. Reduce tareas, cambia fechas o revisa las horas disponibles; el resultado no oculta ese exceso.</p>':'<p>Las tareas caben en la disponibilidad introducida. Revisa que las estimaciones de trabajo sean realistas.</p>'}${table('Distribución propuesta: fecha límite primero, después prioridad',['Día','Trabajo asignado','Horas libres'],p.days.map(d=>[esc(d.date),d.blocks.map(b=>esc(b.name)+': '+format(b.hours)+' h <a href="/es/herramientas/temporizador-pomodoro/" data-focus-task="'+esc(b.name)+'">Iniciar un bloque</a>').join('<br>')||'Sin tareas',format(Math.max(0,d.remaining))]))}${p.unmet.length?'<h3>Trabajo pendiente</h3><ul>'+p.unmet.map(t=>'<li>'+esc(t.name)+': '+format(t.hours)+' h</li>').join('')+'</ul>':''}<p class="small">Distribución orientativa por horas: no incorpora automáticamente descansos, repasos espaciados ni cambios de dificultad. Revísala después de tu primera sesión.</p><p id="copy-status" class="small" role="status"></p>`);
    if($('plan-save').checked){try{localStorage.setItem('aspire-study-plan-v1',JSON.stringify(d));$('plan-storage').textContent='Guardado solo en este navegador.';}catch{$('plan-storage').textContent='El navegador no permite guardar. El plan sigue funcionando y puedes copiarlo o imprimirlo.';}}
  }
  function seedPlan(saved){
    const now=new Date(),today=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
    const d=saved||{start:today,reserve:'0',availability:[2,2,2,2,2,0,0],tasks:[{name:'Estadística: ejercicios',hours:8,priority:1},{name:'Lectura y esquema',hours:6,priority:2},{name:'Repaso activo',hours:3.5,priority:3}]};
    $('plan-start').value=d.start||today;$('plan-buffer').value=d.reserve??0;
    for(let i=0;i<7;i++)$('plan-day-'+i).value=d.availability?.[i]??0;
    $('plan-rows').replaceChildren();(Array.isArray(d.tasks)?d.tasks.slice(0,20):[]).forEach(addTask);dateLabels();
  }
  function addSubject(s={name:'',grade:'',weight:'.2'}){
    if($('admission-rows').children.length>=6)throw Error('Introduce como máximo seis materias.');
    const id=++rowId,el=document.createElement('div');el.className='study-row subject-row';el.dataset.row=id;
    el.innerHTML=input('Materia','subject-name-'+id,s.name,'type="text" maxlength="100"')+input('Nota (0–10)','subject-grade-'+id,s.grade,'type="text" inputmode="decimal"')+`<div class="field"><label for="subject-weight-${id}">Ponderación</label><select id="subject-weight-${id}">${[0,.1,.2].map(v=>`<option value="${v}"${Number(s.weight)===v?' selected':''}>${format(v)}</option>`).join('')}</select></div><button type="button" class="secondary" aria-label="Quitar materia ${id}">Quitar</button>`;
    el.querySelector('button').addEventListener('click',()=>el.remove());$('admission-rows').append(el);
  }
  function admission(){
    const subjects=[...$('admission-rows').children].map(el=>{const n=el.dataset.row;return{name:$('subject-name-'+n).value,grade:$('subject-grade-'+n).value,weight:$('subject-weight-'+n).value};});
    const r=M.admission({route:$('admission-route').value,bachillerato:$('admission-b').value,phase:$('admission-f').value,access:$('admission-access').value,subjects});
    const url=M.httpUrl($('admission-source').value);
    const chosen=new Set(r.chosen.map(x=>x.index));
    message(`<p class="result-label">Estimación según la vía y ponderaciones introducidas</p><div class="metrics">${metric('Nota de acceso / 10',format(r.base))}${metric('Aportación de materias',format(r.bonus))}${metric('Nota de admisión estimada / 14',r.total===null?'Sin resultado admisible':format(r.total))}</div><p>${esc(r.reason)}</p>${table('Desglose: se eligen aportaciones, no las dos notas brutas más altas',['Materia','Nota × coeficiente','Aportación','Tratamiento'],r.rows.map(x=>[esc(x.name),format(x.grade)+' × '+format(x.weight),format(x.contribution),!r.eligible?'Base sin mínimos':!x.eligible?(x.grade<5?'Nota inferior a 5':'No pondera'):chosen.has(x.index)?'Incluida':'Fuera de las dos mayores aportaciones']))}<p>${r.eligible?`Total = ${format(r.base)} + ${r.chosen.map(x=>format(x.contribution)).join(' + ')||'0'} = ${format(r.total)}.`:'Los puntos de materias no sustituyen un requisito de acceso incumplido.'}</p>${$('admission-university').value?'<p>Programa: '+esc($('admission-university').value)+'</p>':''}${$('admission-cycle').value?'<p>Curso anotado: '+esc($('admission-cycle').value)+'</p>':''}${url?'<p>Tabla anotada por ti: <a rel="noopener" href="'+esc(url)+'">'+esc(url)+'</a></p>':''}<p class="small">La herramienta no comprueba la vigencia de materias, convocatorias o equivalencias. La nota de corte anterior no garantiza una plaza.</p>`);
  }
  const apaKeys=['type','doi','authors','title','year','fullDate','site','publisher','edition','journal','volume','issue','pages','bookTitle','editors','url'];
  function apaData(){const d={};for(const k of apaKeys)d[k]=$('apa-'+k).value;for(const k of ['noAuthor','noTitle','noDate','corporate'])d[k]=$('apa-'+k).checked;return d;}
  function apaFields(){const type=$('apa-type').value;document.querySelectorAll('[data-apa-for]').forEach(el=>el.hidden=!el.dataset.apaFor.split(' ').includes(type));$('apa-authors').disabled=$('apa-noAuthor').checked;$('apa-corporate').disabled=$('apa-noAuthor').checked;$('apa-year').disabled=$('apa-noDate').checked;$('apa-fullDate').disabled=$('apa-noDate').checked;}
  function citation(){lastAPA=M.apa(apaData());message(`<p class="result-label">Referencia bibliográfica</p><div class="apa-reference">${lastAPA.reference}</div><h3>Cita narrativa</h3><p>${lastAPA.narrative}</p><h3>Cita parentética</h3><p>${lastAPA.parenthetical}</p><p class="small">Para una cita textual, añade el localizador que corresponda. Revisa la cursiva y la sangría francesa al pegar. La forma española s. f. indica ausencia de fecha.</p><p id="copy-status" class="small" role="status"></p>`);}
  function showLibrary(){
    const sorted=[...library].sort((a,b)=>a.text.localeCompare(b.text,'es',{sensitivity:'base'}));
    $('apa-library').innerHTML=sorted.length?'<ol>'+sorted.map(x=>'<li class="apa-reference">'+x.html+'</li>').join('')+'</ol>':'<p class="small">Todavía no has añadido referencias.</p>';
    return sorted;
  }
  async function lookup(){
    const target=$('apa-lookup'),button=form.querySelector('[data-action="lookup"]');
    try{
      const doi=M.doiUrl($('apa-doi').value);if(!doi)throw Error('Introduce un DOI para consultar.');
      button.disabled=true;target.textContent='Consultando Crossref…';
      const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);let response;
      try{response=await fetch('https://api.crossref.org/works/'+encodeURIComponent(doi.replace('https://doi.org/','')),{signal:controller.signal,headers:{Accept:'application/json'}});}finally{clearTimeout(timeout);}
      if(!response.ok)throw Error('No se encontró un registro disponible en Crossref. Puedes introducir los datos manualmente.');
      const d=(await response.json()).message;if(!d||!Array.isArray(d.title)||!d.title[0])throw Error('El registro no contiene un título utilizable.');
      const sourceType={'journal-article':'journal','book-chapter':'chapter','book':'book','monograph':'book'}[d.type];if(!sourceType)throw Error('El registro tiene un tipo de fuente no admitido para importación automática. Completa el formato correcto manualmente.');
      for(const key of apaKeys)if(key!=='doi')$('apa-'+key).value='';
      for(const key of ['noAuthor','noTitle','noDate','corporate'])$('apa-'+key).checked=false;
      $('apa-type').value=sourceType;
      const initials=x=>String(x||'').split(/[\s-]+/).filter(Boolean).map(s=>Array.from(s)[0]+'.').join(' ');
      $('apa-title').value=String(d.title[0]).replace(/<[^>]*>/g,'');
      $('apa-editors').value=(d.editor||[]).filter(a=>a.family&&a.given).map(a=>a.family+', '+initials(a.given)).join('\n');
      $('apa-authors').value=(d.author||[]).filter(a=>a.family&&a.given).map(a=>a.family+', '+initials(a.given)).join('\n');
      $('apa-year').value=d.issued?.['date-parts']?.[0]?.[0]||'';
      $('apa-journal').value=d['container-title']?.[0]||'';$('apa-bookTitle').value=d['container-title']?.[0]||'';
      for(const k of ['volume','issue','publisher'])$('apa-'+k).value=d[k]||'';
      $('apa-pages').value=d.page||d['article-number']||'';$('apa-noDate').checked=false;$('apa-noAuthor').checked=false;$('apa-corporate').checked=false;
      $('apa-fullDate').value='';apaFields();lastAPA=null;
      target.textContent='Metadatos recuperados. Confirma autores, tipo de fuente, año y título con la obra; Crossref puede contener registros incompletos.';
    }catch(e){target.textContent=e.name==='AbortError'?'La consulta tardó demasiado. Puedes completar los campos manualmente.':e.message||'No se pudo consultar. Completa los campos manualmente.';}finally{button.disabled=false;}
  }
  let timer,interval,audioContext,timerHistory=[];
  const phaseLabel={focus:'Concentración',short:'Descanso corto',long:'Descanso largo'};
  function sound(){
    const C=window.AudioContext||window.webkitAudioContext;if(!C){$('timer-status').textContent='Este navegador no ofrece el sonido de prueba.';return;}
    audioContext ||= new C();audioContext.resume().then(()=>{const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.connect(gain);gain.connect(audioContext.destination);osc.frequency.value=660;gain.gain.setValueAtTime(.08,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.35);osc.start();osc.stop(audioContext.currentTime+.36);}).catch(()=>$('timer-status').textContent='El navegador bloqueó el sonido. Mantén visible el temporizador.');
  }
  function renderTimer(){
    result.classList.remove('error');
    const seconds=Math.ceil(timer.remaining/1000),minutes=Math.floor(seconds/60),rest=seconds%60;
    $('timer-display').textContent=String(minutes).padStart(2,'0')+':'+String(rest).padStart(2,'0');
    $('timer-display').setAttribute('aria-label',`${minutes} minutos y ${rest} segundos restantes`);
    $('timer-phase').textContent=phaseLabel[timer.phase];$('timer-count').textContent=timer.completed;$('timer-minutes').textContent=timer.focusMinutes+' min';
    form.querySelector('[data-action="start"]').disabled=timer.running;form.querySelector('[data-action="pause"]').disabled=!timer.running;
    if(timer.event?.startsWith('completed-')){$('timer-status').textContent='Intervalo terminado. Siguiente: '+phaseLabel[timer.phase]+'. Pulsa Iniciar cuando estés listo.';if(timer.event==='completed-focus'&&$('timer-save').checked){timerHistory.unshift({minutes:timer.config.focus,task:$('timer-task').value.slice(0,120),date:new Date().toISOString()});timerHistory=timerHistory.slice(0,30);try{localStorage.setItem('aspire-focus-history-v1',JSON.stringify(timerHistory));}catch{$('timer-history-status').textContent='No se puede guardar en este navegador; el temporizador sigue funcionando.';}renderHistory();}if($('timer-audio').checked)sound();}
    else if(timer.event==='skipped')$('timer-status').textContent='Intervalo saltado: no suma un bloque completado.';
  }
  function renderHistory(){if(!$('timer-history'))return;$('timer-history').innerHTML=timerHistory.length?'<ul>'+timerHistory.map(x=>'<li>'+esc(x.date.slice(0,16).replace('T',' '))+' UTC · '+format(x.minutes)+' min'+(x.task?' · '+esc(x.task):'')+'</li>').join('')+'</ul>':'<p class="small">No hay bloques guardados.</p>';}
  function doTimer(action){timer=M.timerAction(timer,action,Date.now());renderTimer();if(action==='start')$('timer-status').textContent=phaseLabel[timer.phase]+' en marcha.';if(action==='pause'&&!timer.event?.startsWith('completed-'))$('timer-status').textContent='Pausado. Iniciar continúa el mismo bloque.';if(action==='reset')$('timer-status').textContent='Bloque reiniciado sin añadir tiempo completado.';}
  function init(){
    if(!form)return;
    const type=form.dataset.studyTool;
    if(type==='planner'){
      $('plan-days').innerHTML=Array.from({length:7},(_,i)=>input('Día '+(i+1),'plan-day-'+i,i<5?2:0,'type="text" inputmode="decimal"')).join('');
      let saved;try{const raw=localStorage.getItem('aspire-study-plan-v1');if(raw){const d=JSON.parse(raw);if(d&&Array.isArray(d.tasks)&&Array.isArray(d.availability)&&d.availability.length===7&&d.tasks.every(t=>t&&typeof t.name==='string')){M.planWeek(d.start,d.availability,d.tasks,d.reserve);saved=d;$('plan-save').checked=true;}}}catch{}
      seedPlan(saved);$('plan-start').addEventListener('change',dateLabels);
      $('plan-save').addEventListener('change',()=>{if(!$('plan-save').checked){try{localStorage.removeItem('aspire-study-plan-v1');$('plan-storage').textContent='Guardado desactivado; copia local eliminada.';}catch{$('plan-storage').textContent='No se puede acceder al almacenamiento.';}}});
    }
    if(type==='admission'){
      addSubject({name:'Materia A',grade:9,weight:.2});addSubject({name:'Materia B',grade:8,weight:.2});
      $('admission-route').addEventListener('change',()=>{$('admission-pau').hidden=$('admission-route').value!=='pau';$('admission-uned').hidden=$('admission-route').value!=='uned';});
    }
    if(type==='apa'){apaFields();showLibrary();for(const k of ['type','noAuthor','noDate'])$('apa-'+k).addEventListener('change',apaFields);form.addEventListener('input',()=>lastAPA=null);}
    if(type==='timer'){
      timer=M.timerState();renderTimer();interval=setInterval(()=>doTimer('tick'),250);
      try{const h=JSON.parse(localStorage.getItem('aspire-focus-history-v1')||'null');if(Array.isArray(h)){timerHistory=h.filter(x=>x&&Number.isFinite(x.minutes)&&x.minutes>0&&typeof x.task==='string'&&typeof x.date==='string').slice(0,30);$('timer-save').checked=true;}}catch{}renderHistory();
      $('timer-save').addEventListener('change',()=>{if(!$('timer-save').checked){timerHistory=[];try{localStorage.removeItem('aspire-focus-history-v1');}catch{}renderHistory();}});
      document.addEventListener('visibilitychange',()=>doTimer('tick'));
      $('timer-task').addEventListener('input',()=>{$('timer-task-view').textContent=$('timer-task').value||'Un bloque para una tarea concreta';});
      try{const task=sessionStorage.getItem('aspire-session-task');if(task){$('timer-task').value=task.slice(0,120);$('timer-task-view').textContent=task.slice(0,120);sessionStorage.removeItem('aspire-session-task');}}catch{}
      document.addEventListener('keydown',e=>{if(e.code==='Space'&&!['INPUT','TEXTAREA','SELECT','BUTTON','SUMMARY','A'].includes(document.activeElement.tagName)){e.preventDefault();doTimer(timer.running?'pause':'start');}});
    }
    form.addEventListener('submit',e=>{e.preventDefault();safe(()=>{if(type==='stats')statistics();if(type==='planner')planner();if(type==='admission')admission();if(type==='apa')citation();if(type==='timer'){timer=M.timerState({focus:$('timer-focus').value,short:$('timer-short').value,long:$('timer-long').value,cycles:$('timer-cycles').value});renderTimer();$('timer-status').textContent='Nuevo ciclo listo; los contadores se han puesto a cero.';}});});
    form.addEventListener('click',e=>{
      const b=e.target.closest('[data-action]');if(!b)return;const action=b.dataset.action;
      if(action==='lookup'){lookup();return;}
      safe(()=>{
        if(action==='print'){window.print();return;}
        if(type==='stats'){
          if(action==='example'){$('stat-data').value='2; 4; 4; 6; 9';statistics();}
          if(action==='clear'){$('stat-data').value='';lastStats=null;message('<p>Lista vacía. Introduce tus datos.</p>');$('stat-data').focus();}
          if(action==='csv'){statistics();download('estadistica-aspirecompass.csv','\uFEFF'+[['valor','frecuencia'],...lastStats.frequency.map(x=>[x.value,x.count])].map(row=>row.map(csvCell).join(';')).join('\r\n'),'text/csv;charset=utf-8');}
        }
        if(type==='planner'){
          if(action==='add')addTask();
          if(action==='example'){seedPlan();planner();}
          if(action==='clear'){try{localStorage.removeItem('aspire-study-plan-v1');}catch{}$('plan-save').checked=false;$('plan-storage').textContent='Guardado desactivado; copia local eliminada.';$('plan-rows').replaceChildren();addTask();message('<p>Plan eliminado. Revisa la disponibilidad antes de volver a calcular.</p>');}
          if(action==='copy'){planner();copy(plainOutput).catch(e=>message('<p>'+esc(e.message)+'</p>',true));}
        }
        if(type==='admission'){
          if(action==='add')addSubject();
          if(action==='example'){$('admission-route').value='pau';$('admission-route').dispatchEvent(new Event('change'));$('admission-b').value=8;$('admission-f').value=7;$('admission-rows').replaceChildren();addSubject({name:'Materia A',grade:9,weight:.2});addSubject({name:'Materia B',grade:8,weight:.2});admission();}
          if(action==='clear'){$('admission-b').value='';$('admission-f').value='';$('admission-access').value='';$('admission-rows').replaceChildren();message('<p>Datos eliminados. Selecciona tu vía e introduce tus calificaciones.</p>');}
        }
        if(type==='apa'){
          if(action==='example'){form.reset();$('apa-type').value='book';$('apa-authors').value='Pérez, M.';$('apa-year').value='2024';$('apa-title').value='Cuaderno de estudio';$('apa-publisher').value='Editorial Ejemplo';apaFields();citation();$('apa-lookup').textContent='Ejemplo inventado para mostrar el formato; no es una obra consultable.';}
          if(action==='clear'){form.reset();lastAPA=null;apaFields();$('apa-lookup').textContent='';message('<p>Formulario limpio. Completa la información de tu fuente.</p>');}
          if(action==='copy'){citation();copy(plainOutput).catch(e=>message('<p>'+esc(e.message)+'</p>',true));}
          if(action==='save'){citation();const html=lastAPA.reference,box=document.createElement('div');box.innerHTML=html;const text=box.textContent;if(library.length>=100)throw Error('La lista admite hasta 100 referencias. Descárgala antes de continuar.');if(!library.some(x=>x.html===html))library.push({html,text});showLibrary();}
          if(action==='empty'){library=[];showLibrary();}
          if(['text','word'].includes(action)){const entries=showLibrary();if(!entries.length)throw Error('Añade al menos una referencia a la lista.');if(action==='text')download('referencias-apa.txt',entries.map(x=>x.text).join('\n\n'));else download('referencias-apa.doc','<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Referencias</title><style>p{margin-left:1.27cm;text-indent:-1.27cm;line-height:2}</style></head><body><h1>Referencias</h1>'+entries.map(x=>'<p>'+x.html+'</p>').join('')+'</body></html>','application/msword');}
        }
        if(type==='timer'){if(action==='sound')sound();else if(action==='history-clear'){timerHistory=[];$('timer-save').checked=false;try{localStorage.removeItem('aspire-focus-history-v1');}catch{}renderHistory();}else if(['start','pause','reset','skip'].includes(action))doTimer(action);}
      });
    });
  }
  init();
  // Small worksheets embedded in guides use their own explicitly scoped forms.
  for(const sheet of document.querySelectorAll('[data-worksheet]')){
    const submit=sheet.querySelector('[data-worksheet-submit]');if(submit)submit.disabled=false;
    sheet.addEventListener('submit',e=>{
    e.preventDefault();const output=sheet.querySelector('[role="status"]');try{
      if(sheet.dataset.worksheet==='ects'){const credits=M.finite(sheet.querySelector('[name="credits"]').value,'Créditos',.1,360);output.textContent=`Carga orientativa para estudios oficiales en España: ${format(credits*25)}–${format(credits*30)} horas de trabajo total. No son solo clases presenciales.`;}
      if(sheet.dataset.worksheet==='budget'){const v=n=>sheet.querySelector('[name="'+n+'"]').value,r=M.budget(v('tuition'),v('monthly'),v('months'),v('setup'),v('deposit'));output.textContent=`Gasto previsto: ${format(r.expense)} €. Fianza recuperable separada: ${format(r.deposit)} €. Fondos para cubrir ambos conceptos: ${format(r.cash)} €. Es un presupuesto de todo el período; no significa que todo venza el primer día.`;}
    }catch(err){output.textContent=err.message;}
  });}

  document.addEventListener('click',e=>{const link=e.target.closest('[data-focus-task]');if(link){try{sessionStorage.setItem('aspire-session-task',link.dataset.focusTask);}catch{}}});
})();
