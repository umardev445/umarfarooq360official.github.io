/* Native details menus work without JavaScript; enhance dismissal and focus. */
(()=>{const selector='.site-language-menu,.locale-page .mobile-menu,.id-menu';
 const menus=()=>[...document.querySelectorAll(selector)];
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){const open=menus().filter(m=>m.open);for(const m of open){m.open=false;m.querySelector('summary')?.focus();}}});
 document.addEventListener('pointerdown',e=>{for(const m of menus())if(m.open&&!m.contains(e.target))m.open=false;});
 document.addEventListener('focusin',e=>{for(const m of menus())if(m.open&&!m.contains(e.target))m.open=false;});
 document.addEventListener('click',e=>{if(e.target.closest('a'))for(const m of menus())if(m.contains(e.target))m.open=false;});
})();
