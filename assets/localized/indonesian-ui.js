/* Progressive enhancement. Search and checklist values stay in this page session. */
(() => {
 'use strict';
 const search=document.querySelector('#id-search');
 if(search){
  const cards=[...document.querySelectorAll('.id-library [data-id-card]')];
  const results=document.querySelector('#id-results'),empty=document.querySelector('#id-empty');
  search.addEventListener('input',()=>{
   const q=search.value.trim().toLocaleLowerCase('id');
   let count=0;
   for(const c of cards){c.hidden=!c.dataset.search.includes(q);if(!c.hidden)count++;}
   results.textContent=count+' panduan'+(q?' ditemukan':' tersedia');
   empty.hidden=count!==0;
  });
 }
 document.querySelectorAll('[data-id-print]').forEach(b=>b.addEventListener('click',()=>window.print()));
 document.querySelectorAll('.id-checklist').forEach(group=>{
  const checks=[...group.querySelectorAll('input[type=checkbox]')];
  if(!checks.length)return;
  const progress=document.createElement('div');progress.className='id-check-progress';
  const status=document.createElement('span');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const reset=document.createElement('button');reset.type='button';reset.textContent='Atur ulang';
  const update=()=>{status.textContent=checks.filter(c=>c.checked).length+' dari '+checks.length+' langkah ditandai';};
  reset.addEventListener('click',()=>{checks.forEach(c=>{c.checked=false;});update();});
  checks.forEach(c=>c.addEventListener('change',update));progress.append(status,reset);group.prepend(progress);update();
 });
 document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{const menu=a.closest('.id-menu');if(menu)menu.removeAttribute('open');}));
})();
