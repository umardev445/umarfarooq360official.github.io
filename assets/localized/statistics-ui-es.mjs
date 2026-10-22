import {parseDataset,standardDeviation} from './academic-math.mjs';
const form=document.getElementById('statistics-calculator');
if(form){
  const $=id=>document.getElementById(id), result=$('stats-result'), steps=$('stats-steps');
  const format=n=>new Intl.NumberFormat('es',{maximumFractionDigits:6}).format(n);
  let edited=false,measured=false;
  function calculate(submitted=false){
    try{
      const values=parseDataset($('stats-values').value,$('stats-decimal').value),r=standardDeviation(values,$('stats-model').value);
      result.className='result';
      result.innerHTML=`<div class="result-label">${edited?'Tu cálculo':'Ejemplo editable'} · ${r.model==='sample'?'Muestra':'Población'}</div><div class="result-value">${format(r.deviation)}</div><p>Desviación estándar</p><div class="metrics"><div class="metric"><strong>${r.count}</strong><span>Observaciones</span></div><div class="metric"><strong>${format(r.mean)}</strong><span>Media</span></div><div class="metric"><strong>${format(r.variance)}</strong><span>Varianza</span></div><div class="metric"><strong>${r.divisor}</strong><span>Divisor</span></div></div><p>√(${format(r.sumSquares)} ÷ ${r.divisor}) = ${format(r.deviation)}</p>`;
      steps.innerHTML=`<details class="research-steps"><summary>Ver el desarrollo del cálculo</summary><p>Media = ${format(r.mean)}. Suma de cuadrados = ${format(r.sumSquares)}. Se muestran ${Math.min(values.length,30)} de ${values.length} observaciones; los totales utilizan todas.</p><div class="table-wrap" tabindex="0" role="region" aria-label="Desarrollo de diferencias"><table><caption>Diferencias respecto a la media</caption><thead><tr><th scope="col">Valor</th><th scope="col">Diferencia</th><th scope="col">Cuadrado</th></tr></thead><tbody>${values.slice(0,30).map(v=>`<tr><td>${format(v)}</td><td>${format(v-r.mean)}</td><td>${format((v-r.mean)**2)}</td></tr>`).join('')}</tbody></table></div></details>`;
      if(submitted){$('tool-feedback').textContent='Cálculo actualizado. Revisa el modelo y las unidades.';if(typeof window.gtag==='function'&&!window['ga-disable-G-54C36SGS3Z'])window.gtag('event','tool_complete',{tool_id:'standard_deviation',language:'es',model:r.model});}
    }catch(error){result.className='result error';result.textContent=error.message;steps.replaceChildren();if(submitted)$('tool-feedback').textContent=error.message;}
  }
  function mark(){edited=true;if(!measured&&typeof window.gtag==='function'&&!window['ga-disable-G-54C36SGS3Z']){window.gtag('event','tool_interaction',{tool_id:'standard_deviation',language:'es'});measured=true;}}
  form.addEventListener('submit',e=>{e.preventDefault();mark();calculate(true);});
  form.addEventListener('input',()=>{mark();calculate();});form.addEventListener('change',()=>{mark();calculate();});
  $('stats-example').addEventListener('click',()=>{$('stats-values').value='2; 4; 4; 4; 5; 5; 7; 9';$('stats-model').value='population';$('stats-decimal').value='dot';edited=false;calculate();$('tool-feedback').textContent='Ejemplo cargado.';});
  $('stats-clear').addEventListener('click',()=>{$('stats-values').value='';steps.replaceChildren();result.textContent='Introduce tus observaciones para calcular.';$('stats-values').focus();$('tool-feedback').textContent='Datos borrados.';edited=true;});
  calculate();
}
