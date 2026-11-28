import{fundingGap,mextGpa}from'./day25-math.mjs';
const labels={es:{title:'Compara dos ofertas por separado',currency:'Moneda de todos los importes',months:'Meses de estudio',monthly:'Gasto mensual de vida',once:'Gastos iniciales y únicos',tuition:'Matrícula pendiente tras exenciones',funding:'Dinero confirmado para este periodo',a:'Oferta A',b:'Oferta B',submit:'Calcular cobertura',reset:'Borrar datos',total:'Coste total',gap:'Dinero por financiar',surplus:'Exceso sobre el coste estimado',error:'Revisa los campos: introduce importes no negativos, meses enteros mayores que cero y una moneda común. Escribe 0 cuando corresponda; un campo vacío no significa cero.',stale:'Los datos han cambiado. Vuelve a calcular.',note:'Cada oferta es un escenario independiente. No se suman becas incompatibles. El resultado no verifica elegibilidad ni cuándo recibirás el dinero.'},id:{title:'Hitung kekurangan biaya studi',currency:'Mata uang untuk semua nominal',months:'Jumlah bulan studi',monthly:'Biaya hidup per bulan',once:'Biaya awal dan sekali bayar',tuition:'Tuition yang masih harus dibayar',funding:'Dana yang sudah dikonfirmasi untuk periode ini',a:'Rencana pendanaan',submit:'Hitung biaya',reset:'Kosongkan data',total:'Total biaya',gap:'Dana yang masih dibutuhkan',surplus:'Dana di atas estimasi biaya',error:'Periksa isian: nominal tidak negatif, bulan bilangan bulat lebih dari nol, dan semua nominal memakai mata uang yang sama. Isi 0 secara sengaja; kosong bukan nol.',stale:'Data berubah. Hitung ulang hasilnya.',note:'Isi tuition setelah pembebasan biaya. Dana belum pasti perlu diperiksa sebelum dimasukkan. Hasil tahunan tidak menunjukkan kapan dana cair atau membuktikan kelayakan.'}};
const E=(tag,text,props={})=>Object.assign(document.createElement(tag),{textContent:text,...props});
const field=(box,label,name,{value='',type='number',min='0',step='any'}={})=>{const wrap=E('label',label),input=E('input','',{name,type,value,required:true});input.min=min;input.step=step;input.inputMode='decimal';wrap.append(input);box.append(wrap);return input;};
function outputPair(box,label,value){const p=E('p',''),b=E('strong',value);p.append(E('span',label),b);box.append(p);}
function initFunding(root,lang){const t=labels[lang],form=E('form','',{noValidate:true}),grid=E('div','',{className:'day25-fields'});root.append(E('h3',t.title),form);form.append(grid);const cs=E('label',t.currency),select=E('select','',{name:'currency',required:true});select.append(E('option','—',{value:''}));for(const c of ['EUR','USD','GBP','IDR','PKR','AUD','CHF','SGD','JPY','KRW'])select.append(E('option',c,{value:c}));cs.append(select);grid.append(cs);field(grid,t.months,'months',{step:'1',min:'1'});field(grid,t.monthly,'monthly');field(grid,t.once,'once');
const scenarioNames=lang==='es'?['a','b']:['a'];for(const name of scenarioNames){const set=E('fieldset','');set.append(E('legend',t[name]));const fields=E('div','',{className:'day25-fields'});set.append(fields);field(fields,t.tuition,name+'-tuition');field(fields,t.funding,name+'-funding');form.append(set);}const actions=E('div','',{className:'day25-actions'});actions.append(E('button',t.submit,{type:'submit'}),E('button',t.reset,{type:'reset'}));const out=E('div','',{className:'day25-result',role:'status'});out.setAttribute('aria-live','polite');form.append(actions,out,E('p',t.note,{className:'day25-note'}));
form.addEventListener('input',()=>{if(out.childNodes.length)out.textContent=t.stale;});form.addEventListener('change',()=>{if(out.childNodes.length)out.textContent=t.stale;});form.addEventListener('reset',()=>{out.replaceChildren();for(const i of form.elements)i.removeAttribute?.('aria-invalid');});
form.addEventListener('submit',e=>{e.preventDefault();out.replaceChildren();const fields=[...form.querySelectorAll('input,select')];let first;for(const i of fields){const valid=i.checkValidity();i.setAttribute('aria-invalid',String(!valid));if(!valid&&!first)first=i;}if(first){out.textContent=t.error;first.focus();return;}try{const values=Object.fromEntries(new FormData(form)),fmt=new Intl.NumberFormat(lang,{style:'currency',currency:values.currency,maximumFractionDigits:2});for(const name of scenarioNames){const r=fundingGap({...values,tuition:values[name+'-tuition'],funding:values[name+'-funding']}),panel=E('section','');panel.append(E('h4',t[name]));outputPair(panel,t.total,fmt.format(r.total));outputPair(panel,t.gap,fmt.format(r.gap));if(r.surplus>0)outputPair(panel,t.surplus,fmt.format(r.surplus));out.append(panel);}}catch{out.textContent=t.error;}});}
function initMext(root){
 const form=E('form','',{noValidate:true});root.append(form);
 form.append(E('p','Enter the points assigned by your host’s mapping. Exclude pass-only or unlisted marks. This does not convert a 4.0 GPA or establish eligibility.'));
 const modeLabel=E('label','Weighting method'),mode=E('select','',{name:'mode'});
 mode.append(E('option','Credit-weighted',{value:'credits'}),E('option','Equal course count (only when no credit system)',{value:'courses'}));modeLabel.append(mode);form.append(modeLabel);
 const rows=E('div','',{className:'day25-mext-rows'});form.append(rows);let serial=0;
 const syncRow=row=>{const grade=row.querySelector('[name=points]'),credit=row.querySelector('[name=credits]');credit.disabled=mode.value==='courses'||grade.value==='exclude';credit.required=!credit.disabled;if(credit.disabled)credit.removeAttribute('aria-invalid');credit.setCustomValidity('');};
 mode.addEventListener('change',()=>{for(const row of rows.children)syncRow(row);});
 const addRow=()=>{
  serial++;const row=E('fieldset','',{className:'day25-mext-row'});row.append(E('legend','Course '+serial));
  const cols=E('div','',{className:'day25-fields'}),gradeLabel=E('label','Mapped points'),grade=E('select','',{name:'points',required:true});
  grade.append(E('option','Select mapped points',{value:''}));for(const[value,label]of[['3','3 mapped points'],['2','2 mapped points'],['1','1 mapped point'],['0','0 mapped points'],['exclude','Exclude pass-only / unlisted']])grade.append(E('option',label,{value}));
  gradeLabel.append(grade);cols.append(gradeLabel);field(cols,'Course credits','credits',{min:'0'});
  const remove=E('button','Remove course '+serial,{type:'button',className:'day25-remove'});
  remove.addEventListener('click',()=>{const neighbor=row.nextElementSibling||row.previousElementSibling;row.remove();out.textContent='Course removed. Calculate again.';(neighbor?.querySelector('[name=points]')||add).focus();});
  grade.addEventListener('change',()=>syncRow(row));row.append(cols,remove);rows.append(row);syncRow(row);return grade;
 };
 const confirmed=E('label','',{className:'day25-confirm'}),check=E('input','',{type:'checkbox',required:true});confirmed.append(check,document.createTextNode('I checked that this mapping and the included courses match the host’s instructions.'));
 const actions=E('div','',{className:'day25-actions'}),add=E('button','Add course',{type:'button'});
 const out=E('div','',{className:'day25-result',role:'status'});out.setAttribute('aria-live','polite');
 add.addEventListener('click',()=>{const select=addRow();out.textContent='Course added. Complete the new row and calculate again.';select.focus();});
 actions.append(add,E('button','Calculate GPA',{type:'submit'}),E('button','Clear',{type:'reset'}));form.append(confirmed,actions,out);for(let i=0;i<3;i++)addRow();
 const stale=()=>{if(out.childNodes.length)out.textContent='Inputs changed. Calculate again.';};form.addEventListener('input',stale);form.addEventListener('change',stale);
 form.addEventListener('reset',()=>{for(const input of form.querySelectorAll('[aria-invalid]'))input.removeAttribute('aria-invalid');mode.value='credits';rows.replaceChildren();serial=0;for(let i=0;i<3;i++)addRow();out.replaceChildren();});
 form.addEventListener('submit',e=>{
  e.preventDefault();out.replaceChildren();let first;
  for(const input of form.querySelectorAll('input,select')){
   if(input.name==='credits')input.setCustomValidity(!input.disabled&&input.value!==''&&Number(input.value)<=0?'Enter credits greater than zero.':'');
   const valid=input.checkValidity();input.setAttribute('aria-invalid',String(!valid));if(!valid&&!first)first=input;
  }
  if(first){out.textContent='Complete the required values and host-mapping check. Credits must be positive; excluded courses need no credits.';first.focus();return;}
  try{
   const values=[...rows.querySelectorAll('fieldset')].map(row=>({points:row.querySelector('[name=points]').value,credits:row.querySelector('[name=credits]').value})),r=mextGpa(values,mode.value);
   outputPair(out,'Calculated GPA before host rounding',String(r.gpa));outputPair(out,'Weighted points / included '+(mode.value==='credits'?'credits':'courses'),r.points+' / '+r.units);outputPair(out,'Included / excluded courses',r.included+' / '+r.excluded);
   out.append(E('p','The displayed quotient is unrounded. Use your host’s truncation or rounding rule and its own eligibility criteria.'));
  }catch{out.textContent='Include at least one mapped course and positive credit weight. Check for invalid or excessively large values.';}
 });
}
export function mountDay25(root){if(!root||root.dataset.day25Mounted)return;const kind=root.dataset.day25Calculator;if(!['funding-es','funding-id','mext'].includes(kind))return;root.querySelector('[data-calculator-placeholder]')?.remove();root.dataset.day25Mounted='true';root.classList.add('day25-calculator');if(kind==='mext')initMext(root);else initFunding(root,kind.endsWith('es')?'es':'id');}

