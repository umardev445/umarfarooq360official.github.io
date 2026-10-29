const list=document.getElementById('ruct-checklist');
if(list){
 const boxes=[...list.querySelectorAll('input[type="checkbox"]')];
 const update=()=>{document.getElementById('ruct-check-count').textContent=`${boxes.filter(box=>box.checked).length} de ${boxes.length} comprobaciones marcadas`;};
 list.addEventListener('change',update);
 document.getElementById('ruct-reset').addEventListener('click',()=>{boxes.forEach(box=>{box.checked=false;});update();});
 document.getElementById('ruct-print').addEventListener('click',()=>window.print());
 update();
}
