const fail=code=>{throw new Error(code);};
export function decimal(value){
 const text=String(value).trim();
 if(!/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(text))fail('NUMBER');
 const n=Number(text.replace(',','.'));if(!Number.isFinite(n)||Math.abs(n)>1e12)fail('NUMBER');return n;
}
export function parseDataset(text){
 if(!String(text).trim())fail('EMPTY');
 const tokens=String(text).trim().split(/[;\s]+/);if(tokens.length>5000)fail('LIMIT');
 return tokens.map(decimal);
}
export function quantile(values,percent,method='type7'){
 if(!Array.isArray(values)||!values.length)fail('EMPTY');
 if(values.some(n=>!Number.isFinite(n)||Math.abs(n)>1e12))fail('NUMBER');
 if(!Number.isFinite(percent)||percent<0||percent>100)fail('PERCENT');
 if(!['type7','type1'].includes(method))fail('METHOD');
 const x=[...values].sort((a,b)=>a-b),p=percent/100;
 if(method==='type1')return x[Math.max(0,Math.ceil(x.length*p)-1)];
 const h=(x.length-1)*p,lo=Math.floor(h),hi=Math.ceil(h);
 return x[lo]+(x[hi]-x[lo])*(h-lo);
}
export function academicGpa(text,priorCredits='',priorGpa=''){
 const rows=String(text).trim().split(/\r?\n/).filter(l=>l.trim());if(!rows.length)fail('EMPTY');if(rows.length>500)fail('LIMIT');
 let credits=0,quality=0;
 for(const line of rows){
  const cells=line.split(/[;\t]/);if(cells.length!==2)fail('PAIR');
  const c=decimal(cells[0]),g=decimal(cells[1]);
  if(c<=0||c>1000)fail('CREDITS');if(g<0||g>4)fail('GRADE');credits+=c;quality+=c*g;
 }
 const hasCredits=String(priorCredits).trim()!=='',hasGpa=String(priorGpa).trim()!=='';
 if(hasCredits!==hasGpa)fail('PRIOR');
 let pc=0,pg=0;
 if(hasCredits){pc=decimal(priorCredits);pg=decimal(priorGpa);if(pc<0||pc>1e6)fail('CREDITS');if(pg<0||pg>4)fail('GRADE');if(pc===0&&pg!==0)fail('PRIOR');}
 return {credits,quality,semester:quality/credits,priorCredits:pc,combinedCredits:pc+credits,combinedQuality:pc*pg+quality,cumulative:(pc*pg+quality)/(pc+credits)};
}
