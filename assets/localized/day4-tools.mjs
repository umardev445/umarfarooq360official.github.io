import {decimal,parseDataset,quantile,academicGpa} from './day4-math.mjs';
const form=document.querySelector('[data-day4-tool]');
if(form){
 const type=form.dataset.day4Tool,es=type==='quantile',out=form.querySelector('[data-day4-result]');
 const fmt=n=>new Intl.NumberFormat(es?'es-ES':'id-ID',{maximumFractionDigits:6}).format(n);
 const errors=es?{EMPTY:'Introduce al menos un dato.',NUMBER:'Usa números finitos. Separa datos con punto y coma o espacios; la coma sólo indica decimales. Límite de magnitud: 10¹².',LIMIT:'El máximo es de 5000 datos.',PERCENT:'El percentil debe estar entre 0 y 100.',METHOD:'Selecciona un método disponible.'}:{EMPTY:'Masukkan setidaknya satu mata kuliah.',NUMBER:'Gunakan angka yang valid; koma atau titik boleh menjadi desimal.',LIMIT:'Maksimum 500 baris mata kuliah.',PAIR:'Setiap baris harus berisi SKS; bobot nilai, misalnya 3;4.',CREDITS:'SKS per baris harus lebih dari 0 dan maksimal 1000. SKS sebelumnya: 0–1.000.000.',GRADE:'Bobot nilai dan IPK harus berada pada skala 0–4.',PRIOR:'Isi kedua kolom riwayat atau kosongkan keduanya. Jika SKS sebelumnya 0, gunakan IPK 0.'};
 function line(label,value){const p=document.createElement('p');const b=document.createElement('strong');b.textContent=label+': ';p.append(b,document.createTextNode(value));out.append(p);}
 function calculate(){
  out.replaceChildren();out.classList.remove('day4-error');
  try{
   const d=new FormData(form);
   if(es){
    const x=parseDataset(d.get('values')),p=decimal(d.get('percent')),m=d.get('method');
    line('Percentil '+fmt(p),fmt(quantile(x,p,m)));line('Cuartiles Q1 / Q2 / Q3',[25,50,75].map(v=>fmt(quantile(x,v,m))).join(' / '));
    line('Método',m==='type7'?'Tipo 7: interpolación lineal':'Tipo 1: inversa de distribución empírica');
    line('Datos incluidos',String(x.length));line('Datos ordenados',[...x].sort((a,b)=>a-b).slice(0,40).map(fmt).join('; ')+(x.length>40?' … (primeros 40)':''));
   }else{
    const r=academicGpa(d.get('courses'),d.get('priorCredits'),d.get('priorGpa'));
    line('IPS dari baris yang dimasukkan',r.semester.toFixed(2).replace('.',','));line('Rincian IPS',`${fmt(r.quality)} poin mutu ÷ ${fmt(r.credits)} SKS`);
    line('IPK gabungan',r.cumulative.toFixed(2).replace('.',','));line('Rincian IPK',`${fmt(r.combinedQuality)} poin mutu ÷ ${fmt(r.combinedCredits)} SKS`);
    if(!String(d.get('priorCredits')).trim())line('Riwayat','Belum dimasukkan; hasil gabungan hanya memakai baris di atas.');
    line('Catatan','Perhitungan bantu pada skala 0–4. Angka transkrip resmi dan kebijakan kampus tetap menentukan.');
   }
  }catch(e){out.classList.add('day4-error');line(es?'Revisa los datos':'Periksa data',errors[e.message]||(es?'No se pudo calcular. Revisa los campos.':'Periksa semua kolom dan coba lagi.'));}
 }
 form.addEventListener('submit',e=>{e.preventDefault();calculate();});
 form.addEventListener('input',()=>{out.replaceChildren();out.textContent=es?'Datos modificados. Pulsa Calcular para actualizar.':'Data berubah. Tekan Hitung untuk memperbarui hasil.';});
 form.addEventListener('change',()=>{out.replaceChildren();out.textContent=es?'Método o datos modificados. Vuelve a calcular.':'Data berubah. Hitung kembali.';});
 form.querySelector('[data-day4-clear]').addEventListener('click',()=>{for(const field of form.querySelectorAll('textarea,input'))field.value='';out.replaceChildren();out.classList.remove('day4-error');});
 form.querySelector('[data-day4-example]').addEventListener('click',()=>{form.reset();calculate();});
}
