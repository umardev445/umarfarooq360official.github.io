(function(){
  'use strict';
  const key='aspirecompass_'+document.documentElement.lang+'_analytics';
  const choice=document.getElementById('analytics-choice');
  const settings=document.querySelector('.privacy-settings');
  if(!choice||!settings)return;
  let started=false, previousFocus=null;
  function stored(){try{return localStorage.getItem(key);}catch{return null;}}
  function analytics(){
    if(started||!['aspirecompass.org','www.aspirecompass.org'].includes(location.hostname))return;
    started=true;window.dataLayer=window.dataLayer||[];
    window.gtag=function(){window.dataLayer.push(arguments);};
    window.gtag('js',new Date());window.gtag('config','G-54C36SGS3Z');
    const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id=G-54C36SGS3Z';document.head.appendChild(script);
  }
  function apply(value){window['ga-disable-G-54C36SGS3Z']=value!=='yes';if(value==='yes')analytics();}
  settings.hidden=false;settings.addEventListener('click',()=>{previousFocus=document.activeElement;choice.hidden=false;choice.querySelector('button').focus();});
  const saved=stored();apply(saved);choice.hidden=saved==='yes'||saved==='no';
  choice.addEventListener('click',event=>{
    const button=event.target.closest('[data-consent]');if(!button)return;
    const value=button.dataset.consent;try{localStorage.setItem(key,value);}catch{/* The choice still applies in this tab. */}
    apply(value);choice.hidden=true;const target=previousFocus||document.querySelector('h1');if(target){if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}previousFocus=null;
  });
})();

(function(){
  'use strict';
  const menu=document.querySelector('.mobile-menu');
  if(menu){
    const summary=menu.querySelector('summary');
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){menu.open=false;summary.focus();}});
    document.addEventListener('click',event=>{if(menu.open&&!menu.contains(event.target))menu.open=false;});
    menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{menu.open=false;}));
  }
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  if(reduced?.matches||!('IntersectionObserver' in window))return;
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;observer.unobserve(entry.target);if(!reduced?.matches)entry.target.animate?.([{opacity:.7,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:360,easing:'ease-out'});}},{threshold:.12});
  document.querySelectorAll('[data-reveal]').forEach(element=>observer.observe(element));
})();
