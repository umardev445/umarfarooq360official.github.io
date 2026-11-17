import {standardError} from './day5-sem-math.mjs';
const form=document.querySelector('[data-day5-sem]');
if(form){
 const out=form.querySelector('[data-sem-result]');
 const fmt=n=>new Intl.NumberFormat('es-ES',{maximumSignificantDigits:8}).format(n);
 const line=(label,value)=>{const p=document.createElement('p'),b=document.createElement('strong');b.textContent=label+': ';p.append(b,document.createTextNode(value));out.append(p);};
 function calculate(){
  out.replaceChildren();out.classList.remove('day4-error');
  try{
   const values=new FormData(form),r=standardError(values.get('sd'),values.get('n'));
   line('Error estándar estimado',fmt(r.sem));
   line('Cálculo',fmt(r.sd)+' ÷ √'+fmt(r.n));
   line('Si n se multiplicara por 4, manteniendo s',fmt(r.quadrupledSem));
   line('Interpretación','Es una estimación aritmética para la precisión de una media bajo los supuestos explicados. No demuestra representatividad, causalidad ni ausencia de sesgo.');
   if(r.sd===0)line('Dispersión observada nula','Un s de cero produce cero en esta fórmula. No prueba que toda la población sea idéntica.');
  }catch(e){
   out.classList.add('day4-error');
   line('Revisa los datos',e.message==='SD'?'La desviación estándar no puede ser negativa.':e.message==='N'?'n debe ser un número entero entre 2 y 1.000.000.000.':'Introduce ambos números. Puedes usar coma o punto decimal; no uses separadores de miles.');
  }
 }
 form.addEventListener('submit',e=>{e.preventDefault();calculate();});
 form.addEventListener('input',()=>{out.classList.remove('day4-error');out.textContent='Datos modificados. Pulsa Calcular para actualizar.';});
 form.querySelector('[data-sem-example]').addEventListener('click',()=>{form.reset();calculate();});
 form.querySelector('[data-sem-clear]').addEventListener('click',()=>{for(const field of form.querySelectorAll('input'))field.value='';out.replaceChildren();out.classList.remove('day4-error');});
}
