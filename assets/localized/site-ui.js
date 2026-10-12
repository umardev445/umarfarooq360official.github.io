(function(){
  'use strict';
  const key='aspirecompass_'+document.documentElement.lang+'_analytics';
  const choice=document.getElementById('analytics-choice');
  const settings=document.querySelector('.privacy-settings');
  if(!choice||!settings)return;
  let started=false;
  function stored(){try{return localStorage.getItem(key);}catch{return null;}}
  function analytics(){
    if(started||!['aspirecompass.org','www.aspirecompass.org'].includes(location.hostname))return;
    started=true;window.dataLayer=window.dataLayer||[];
    window.gtag=function(){window.dataLayer.push(arguments);};
    window.gtag('js',new Date());window.gtag('config','G-54C36SGS3Z');
    const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id=G-54C36SGS3Z';document.head.appendChild(script);
  }
  function apply(value){window['ga-disable-G-54C36SGS3Z']=value!=='yes';if(value==='yes')analytics();}
  settings.hidden=false;settings.addEventListener('click',()=>{choice.hidden=false;choice.querySelector('button').focus();});
  const saved=stored();apply(saved);choice.hidden=saved==='yes'||saved==='no';
  choice.addEventListener('click',event=>{
    const button=event.target.closest('[data-consent]');if(!button)return;
    const value=button.dataset.consent;try{localStorage.setItem(key,value);}catch{/* The choice still applies in this tab. */}
    apply(value);choice.hidden=true;settings.focus();
  });
})();
