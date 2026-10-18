/* Pure calculation and formatting rules. Browser UI is in expansion-ui-es.js. */
(function (root) {
  'use strict';
  const fail = message => { throw new Error(message); };
  const finite = (value, label, min = -1e12, max = 1e12) => {
    const s = String(value).trim();
    if (!/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(s)) fail(`${label}: introduce un número, sin separadores de miles.`);
    const n = Number(s.replace(',', '.'));
    if (!Number.isFinite(n) || n < min || n > max) fail(`${label}: usa un valor entre ${min} y ${max}.`);
    return n;
  };
  const sum = values => {
    let total = 0, correction = 0;
    for (const x of values) { const y = x - correction; const next = total + y; correction = (next - total) - y; total = next; }
    return total;
  };
  function parseList(text, decimal = 'comma') {
    const raw = String(text).trim();
    if (!raw) fail('Introduce al menos un dato. Un campo vacío no equivale a cero.');
    const tokens = raw.split(decimal === 'comma' ? /[;\s]+/ : /[,;\s]+/).filter(Boolean);
    if (tokens.length > 10000) fail('El límite de esta herramienta es 10.000 datos por cálculo.');
    return tokens.map((token, i) => {
      if (decimal === 'dot' && token.includes(',')) fail('En este modo la coma separa valores.');
      return finite(token, `Dato ${i + 1}`);
    });
  }
  function describe(values) {
    if (!Array.isArray(values) || !values.length || values.some(x => !Number.isFinite(x))) fail('Lista numérica no válida.');
    const ordered = [...values].sort((a, b) => a - b), n = ordered.length;
    const total = sum(ordered), mean = total / n;
    const median = n % 2 ? ordered[(n - 1) / 2] : ordered[n / 2 - 1] / 2 + ordered[n / 2] / 2;
    const counts = new Map();
    ordered.forEach(x => counts.set(x, (counts.get(x) || 0) + 1));
    const frequency = [...counts].map(([value, count]) => ({value, count}));
    const maximum = Math.max(...frequency.map(x => x.count));
    const modes = maximum > 1 ? frequency.filter(x => x.count === maximum).map(x => x.value) : [];
    const squares = sum(ordered.map(x => (x - mean) ** 2));
    return {n, sum:total, mean, median, modes, ordered, frequency, min:ordered[0], max:ordered[n - 1], range:ordered[n - 1] - ordered[0], populationSD:Math.sqrt(squares / n), sampleSD:n > 1 ? Math.sqrt(squares / (n - 1)) : null};
  }
  const isoDate = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) fail('Selecciona una fecha completa.');
    const time = Date.parse(value + 'T00:00:00Z');
    if (!Number.isFinite(time) || new Date(time).toISOString().slice(0,10) !== value) fail('Fecha no válida.');
    return time;
  };
  function planWeek(start, availability, tasks, reserve = 0) {
    const time = isoDate(start);
    if (availability.length !== 7 || !tasks.length) fail('Añade al menos una tarea y revisa los siete días.');
    reserve = finite(reserve, 'Reserva de capacidad (%)', 0, 80);
    const days = availability.map((h, i) => {
      const hours = finite(h, `Disponibilidad del día ${i+1}`, 0, 24);
      return {date:new Date(time + i * 86400000).toISOString().slice(0,10), capacity:hours*(1-reserve/100), remaining:hours*(1-reserve/100), blocks:[]};
    });
    const normalized = tasks.map((t, index) => {
      const name = String(t.name || '').trim().slice(0,120);
      if (!name) fail(`Tarea ${index+1}: añade una asignatura u objetivo.`);
      return {name, hours:finite(t.hours, `Horas de ${name}`, 0.25, 200), priority:finite(t.priority, 'Prioridad', 1, 3), deadline:t.deadline ? isoDate(t.deadline) : Infinity, index};
    });
    const unmet = [];
    // Earliest deadline first, then chosen priority. This is a transparent
    // allocation heuristic, not an optimal-learning or scheduling guarantee.
    for (const task of [...normalized].sort((a,b) => a.deadline-b.deadline || a.priority-b.priority || a.index-b.index)) {
      let needed = task.hours;
      for (const d of days) {
        if (isoDate(d.date) > task.deadline || needed <= 1e-9) continue;
        const allocated = Math.min(needed, d.remaining);
        if (allocated > 1e-9) { d.blocks.push({name:task.name, hours:allocated}); d.remaining -= allocated; needed -= allocated; }
      }
      if (needed > 1e-8) unmet.push({name:task.name, hours:needed});
    }
    const workload = sum(normalized.map(t => t.hours)), capacity = sum(days.map(d => d.capacity));
    return {days, workload, capacity, unallocated:sum(unmet.map(t=>t.hours)), unmet, reserve};
  }
  function admission({route, bachillerato, phase, access, subjects}) {
    let base, eligible, reason;
    if (route === 'pau') {
      const b = finite(bachillerato, 'Media de Bachillerato', 5, 10), f = finite(phase, 'Fase de acceso PAU', 0, 10);
      base = .6*b + .4*f; eligible = f >= 4 && base >= 5;
      reason = eligible ? 'Se cumplen los mínimos matemáticos de la vía PAU seleccionada.' : 'No se cumplen los mínimos: fase de acceso ≥ 4 y nota de acceso ≥ 5.';
    } else if (route === 'uned') {
      base = finite(access, 'Calificación de acceso ya emitida', 0, 10); eligible = base >= 5;
      reason = eligible ? 'Se utiliza la calificación emitida que has introducido; no se transforma un expediente extranjero.' : 'La calificación introducida es inferior a 5. Confirma tu acreditación y tu vía de acceso.';
    } else fail('Elige una vía admitida: PAU o calificación UNEDasiss ya emitida.');
    const seen = new Set();
    const rows = subjects.map((s, i) => {
      const name = String(s.name || '').trim().slice(0,100);
      if (!name) fail(`Asignatura ${i+1}: indica el nombre.`);
      const key = name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ');
      if (seen.has(key)) fail(`Asignatura repetida: ${name}. Usa una sola calificación válida por materia.`);
      seen.add(key);
      const grade = finite(s.grade, `Nota de ${name}`, 0, 10), weight = finite(s.weight, 'Ponderación', 0, .2);
      if (![0,.1,.2].includes(weight)) fail('La ponderación debe ser 0, 0,1 o 0,2.');
      return {name, grade, weight, contribution:grade >= 5 ? grade*weight : 0, eligible:grade >= 5 && weight>0, index:i};
    });
    const chosen = rows.filter(x=>x.eligible).sort((a,b)=>b.contribution-a.contribution || a.index-b.index).slice(0,2);
    return {base, eligible, reason, rows, chosen, bonus:eligible?sum(chosen.map(x=>x.contribution)):0, total:eligible?Math.min(14,base+sum(chosen.map(x=>x.contribution))):null};
  }
  const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function httpUrl(value, label = 'URL') {
    const text = String(value || '').trim();
    if (!text) return '';
    let u; try { u=new URL(text); } catch { fail(`${label}: introduce una URL completa con https://.`); }
    if (!['https:','http:'].includes(u.protocol) || u.username || u.password) fail(`${label}: usa una dirección web sin credenciales.`);
    return u.href;
  }
  function doiUrl(value) {
    const doi=String(value||'').trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i,'').replace(/^doi:\s*/i,'');
    if (!doi) return '';
    if (!/^10\.\d{4,9}\/\S+$/i.test(doi)) fail('El DOI debe comenzar por 10. y contener una barra.');
    return 'https://doi.org/'+doi;
  }
  function authors(text, corporate = false) {
    const list = String(text||'').split(/\n|;/).map(x=>x.trim().replace(/\s+/g,' ')).filter(Boolean);
    if (corporate && list.length>1) fail('En autor corporativo, escribe una sola entidad.');
    if (list.length>100) fail('El límite es 100 autores por referencia.');
    if (!corporate && list.some(x=>!/^.+,\s*\S/.test(x))) fail('Escribe un autor por línea como Apellido, Iniciales. Ejemplo: Pérez García, M.');
    return list;
  }
  function joinedAuthors(list) {
    if (!list.length) return '';
    if (list.length===1) return list[0];
    if (list.length>20) return list.slice(0,19).join(', ')+', … '+list.at(-1);
    return list.slice(0,-1).join(', ')+', & '+list.at(-1);
  }
  const terminal=s => /[.!?](?:<\/em>)?$/.test(s)?s:s+'.';
  function apa(d) {
    if (!['web','book','journal','chapter'].includes(d.type)) fail('Tipo de fuente no compatible.');
    const title=String(d.title||'').trim();
    if (!title) fail(d.noTitle?'Describe brevemente la obra que no tiene título.':'Añade el título de la obra.');
    const people=d.noAuthor?[]:authors(d.authors,d.corporate);
    if (!d.noAuthor&&!people.length) fail('Añade los autores o selecciona que la fuente no identifica autor.');
    const year=d.noDate?'s. f.':String(d.year||'').trim();
    if (!d.noDate&&!/^\d{4}$/.test(year)) fail('Introduce el año con cuatro cifras o selecciona «Sin fecha».');
    let date=year;
    if (d.type==='web'&&d.fullDate&&!d.noDate) {
      const t=isoDate(d.fullDate),dt=new Date(t);
      if (String(dt.getUTCFullYear())!==year) fail('El año y la fecha completa no coinciden.');
      const months=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
      date=`${year}, ${dt.getUTCDate()} de ${months[dt.getUTCMonth()]}`;
    }
    const e=escape, italic=s=>`<em>${e(s)}</em>`;
    const displayTitle=d.noTitle?`[${title.replace(/^\[|\]$/g,'')}]`:title;
    const titleHtml=d.noTitle?e(displayTitle):['web','book'].includes(d.type)?italic(title):e(title);
    const doi=doiUrl(d.doi), url=httpUrl(d.url);
    let tail='';
    if (d.type==='web') {
      if (!url) fail('Una página web necesita su URL.');
      const site=String(d.site||'').trim();
      tail=(site && !(d.corporate&&people[0]===site)?terminal(e(site))+' ':'')+e(url);
    }
    if (d.type==='book') {
      if (!String(d.publisher||'').trim()) fail('Añade la editorial del libro.');
      tail=(d.corporate&&people[0]===String(d.publisher).trim()?'':terminal(e(d.publisher)))+(doi||url?' '+e(doi||url):'');
    }
    if (d.type==='journal') {
      if (!String(d.journal||'').trim()||!String(d.volume||'').trim()) fail('Añade la revista y el volumen.');
      const pages=/^e\d+$/i.test(String(d.pages||'').trim())?'Artículo '+String(d.pages).trim():d.pages;
      tail=italic(d.journal)+', '+italic(d.volume)+(d.issue?'('+e(d.issue)+')':'')+(pages?', '+e(pages):'')+'.'+(doi||url?' '+e(doi||url):'');
    }
    if (d.type==='chapter') {
      const editors=authors(d.editors);
      if (!editors.length||!String(d.bookTitle||'').trim()||!String(d.publisher||'').trim()) fail('Para un capítulo, añade editor(es), título del libro y editorial.');
      const reverse=editors.map(x=>{const at=x.indexOf(',');return x.slice(at+1).trim()+' '+x.slice(0,at).trim();});
      const extra=[d.edition&&!/^1(?:\D|$)/.test(String(d.edition))?String(d.edition).trim():'',d.pages?'pp. '+String(d.pages).trim():''].filter(Boolean);
      tail='En '+e(reverse.length===2?reverse.join(' & '):joinedAuthors(reverse))+` (${editors.length===1?'Ed.':'Eds.'}), `+italic(d.bookTitle)+(extra.length?' ('+e(extra.join(', '))+')':'')+'. '+terminal(e(d.publisher))+(doi||url?' '+e(doi||url):'');
    }
    const edition=d.type==='book'&&String(d.edition||'').trim()&&!/^1(?:\D|$)/.test(String(d.edition))?' ('+e(d.edition)+')':'';
    let reference=people.length?e(joinedAuthors(people))+` (${e(date)}). `+terminal(titleHtml+edition)+' '+tail:terminal(titleHtml+edition)+` (${e(date)}). `+tail;
    // Punctuation follows rendered text, not an HTML closing tag.
    reference=reference.replace(/([.!?])<\/em>\./g,'$1</em>');
    const surnames=people.map(x=>d.corporate?x:x.split(',')[0]);
    const citationTitle=d.noTitle?e(displayTitle):['journal','chapter'].includes(d.type)?'“'+e(title)+'”':italic(title);
    const narrativeName=!people.length?citationTitle:surnames.length===1?e(surnames[0]):surnames.length===2?e(surnames.join(' y ')):e(surnames[0])+' et al.';
    const parentName=!people.length?citationTitle:surnames.length===1?e(surnames[0]):surnames.length===2?e(surnames.join(' & ')):e(surnames[0])+' et al.';
    return {reference:reference.trim(),narrative:`${narrativeName} (${e(year)})`,parenthetical:`(${parentName}, ${e(year)})`,year,people,title:displayTitle};
  }
  function timerConfig(raw={}) {
    const cfg={};
    for(const [key,min,max,defaultValue] of [['focus',1,180,25],['short',1,60,5],['long',1,120,15],['cycles',1,12,4]]) {
      cfg[key]=finite(raw[key]??defaultValue,key==='cycles'?'Bloques por ciclo':'Duración en minutos',min,max);
      if(!Number.isInteger(cfg[key]))fail('Las duraciones y el número de bloques deben ser enteros.');
    }
    return cfg;
  }
  function timerState(raw={}) {const config=timerConfig(raw);return {config,phase:'focus',remaining:config.focus*60000,running:false,deadline:null,completed:0,focusMinutes:0,event:null};}
  function timerAction(state,action,now) {
    if(state.running&&now>=state.deadline&&action==='pause')return timerAction(state,'tick',now);
    const s={...state,event:null};
    if(action==='start'&&!s.running){s.running=true;s.deadline=now+s.remaining;}
    else if(action==='pause'&&s.running){s.remaining=Math.max(0,Math.min(s.remaining,s.deadline-now));s.running=false;s.deadline=null;}
    else if(action==='reset'){s.remaining=s.config[s.phase]*60000;s.running=false;s.deadline=null;}
    else if(action==='skip'){s.running=false;s.deadline=null;s.phase=s.phase==='focus'?'short':'focus';s.remaining=s.config[s.phase]*60000;s.event='skipped';}
    else if(action==='tick'&&s.running){
      if(s.deadline-now>s.remaining){s.deadline=now+s.remaining;}
      s.remaining=Math.max(0,s.deadline-now);
      if(!s.remaining){
        const finished=s.phase;
        if(finished==='focus'){s.completed++;s.focusMinutes+=s.config.focus;s.phase=s.completed%s.config.cycles===0?'long':'short';}else s.phase='focus';
        s.running=false;s.deadline=null;s.remaining=s.config[s.phase]*60000;s.event='completed-'+finished;
      }
    }
    return s;
  }
  function budget(tuition,monthly,months,setup,deposit){
    const t=finite(tuition,'Matrícula y tasas',0,1e6),m=finite(monthly,'Gastos mensuales',0,1e5),n=finite(months,'Meses',1,60),s=finite(setup,'Gastos iniciales no recuperables',0,1e5),d=finite(deposit,'Fianza recuperable',0,1e5);
    return {expense:t+m*n+s,deposit:d,cash:t+m*n+s+d,living:m*n};
  }
  const api={finite,sum,parseList,describe,isoDate,planWeek,admission,apa,authors,joinedAuthors,doiUrl,httpUrl,timerConfig,timerState,timerAction,budget,escape};
  root.AspireStudy=Object.freeze(api);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
