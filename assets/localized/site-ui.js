// Analytics controls are shared across English and Spanish.

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

// No document contents, query strings or form inputs are included in these events.
document.addEventListener('click',event=>{
 const a=event.target.closest?.('main a[href]');
 if(!a||typeof window.gtag!=='function'||window['ga-disable-G-54C36SGS3Z'])return;
 const u=new URL(a.href,location.href);if(!/^https?:$/.test(u.protocol))return;
 if(u.origin!==location.origin&&a.closest('#fuentes,.source-list,article'))window.gtag('event','official_source_click',{destination_host:u.hostname,destination_path:u.pathname,language:'es'});
 else if(u.origin===location.origin&&u.pathname!==location.pathname)window.gtag('event','guide_navigation',{destination_path:u.pathname,language:'es'});
});
