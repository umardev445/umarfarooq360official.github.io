(function () {
  'use strict';
  const form=document.getElementById('calculator');
  if(!form)return;
  const field=id=>document.getElementById(id);
  const notify=node=>node.dispatchEvent(new Event('change',{bubbles:true}));
  function sync(){
    form.querySelectorAll('[data-grade-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.gradeMode===field('mode')?.value)));
    form.querySelectorAll('[data-attendance-min]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.attendanceMin===field('required')?.value)));
  }
  form.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.gradeMode){field('mode').value=b.dataset.gradeMode;notify(field('mode'));}
    if(b.dataset.attendanceMin){field('required').value=b.dataset.attendanceMin;notify(field('required'));}
    if(b.dataset.examExample){
      const examples={'6':['6','4','1','10','none'],'40':['40','28','6','10','choices'],'60':['60','45','9','10','choices']};
      const values=examples[b.dataset.examExample];
      ['total','correct','wrong','exam-max','penalty-mode'].forEach((id,i)=>{field(id).value=values[i];});
      field('choices').value='4';field('clamp').checked=false;notify(field('penalty-mode'));
    }
    sync();
  });
  form.addEventListener('change',sync);
  sync();
})();
