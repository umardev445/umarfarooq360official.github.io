import {meanDeviation} from './mean-deviation-math.mjs';
const form = document.getElementById('mean-deviation-form');
if (form) {
  const values = document.getElementById('dm-values');
  const frequencies = document.getElementById('dm-frequencies');
  const output = document.getElementById('dm-result');
  const breakdown = document.getElementById('dm-breakdown');
  const fmt = n => new Intl.NumberFormat('es',{maximumFractionDigits:6}).format(n);
  let edited = false;
  function calculate() {
    output.replaceChildren(); breakdown.replaceChildren();
    try {
      const r = meanDeviation(values.value,frequencies.value);
      output.className = 'result';
      const label = document.createElement('div');label.className='result-label';label.textContent=edited?'Tu desviación media':'Resultado del ejemplo editable';
      const number = document.createElement('div');number.className='result-value';number.textContent=fmt(r.deviation);
      const explanation = document.createElement('p');explanation.textContent='Media = '+fmt(r.mean)+'. Suma de distancias ponderadas = '+fmt(r.distanceTotal)+'. DM = '+fmt(r.distanceTotal)+' ÷ '+fmt(r.count)+' = '+fmt(r.deviation)+'.';
      const note = document.createElement('p');note.className='small';note.textContent='Distancia media absoluta respecto a la media aritmética. Conserva la unidad de tus datos; no es desviación estándar ni desviación absoluta mediana.';
      output.append(label,number,explanation,note);
      const wrap=document.createElement('div');wrap.className='table-wrap';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','Desglose de distancias absolutas');
      const table=document.createElement('table');const caption=document.createElement('caption');caption.textContent='Desglose: '+r.rows.length+' filas'+(r.rows.length>40?' (se muestran las primeras 40)':'');table.append(caption);
      const head=document.createElement('thead');const tr=document.createElement('tr');['Valor','Frecuencia','Distancia absoluta','Frecuencia × distancia'].forEach(t=>{const th=document.createElement('th');th.scope='col';th.textContent=t;tr.append(th);});head.append(tr);table.append(head);
      const body=document.createElement('tbody');r.rows.slice(0,40).forEach(row=>{const tr=document.createElement('tr');[row.value,row.frequency,row.distance,row.weightedDistance].forEach((v,i)=>{const cell=document.createElement(i?'td':'th');if(!i)cell.scope='row';cell.textContent=fmt(v);tr.append(cell);});body.append(tr);});table.append(body);wrap.append(table);breakdown.append(wrap);
    } catch(error) {output.className='result error';const p=document.createElement('p');p.textContent=error.message;output.append(p);}
  }
  form.addEventListener('submit',e=>{e.preventDefault();edited=true;calculate();});
  form.addEventListener('input',()=>{edited=true;calculate();});
  document.getElementById('dm-example').addEventListener('click',()=>{values.value='2\n4\n6\n8';frequencies.value='';edited=false;calculate();});
  document.getElementById('dm-clear').addEventListener('click',()=>{values.value='';frequencies.value='';edited=true;calculate();values.focus();});
  calculate();
}
