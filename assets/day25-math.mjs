// Pure planning calculations. No network, storage or personal information.
export function number(value,{positive=false,integer=false}={}){
 if((typeof value!=='string'&&typeof value!=='number')||String(value).trim()==='')throw Error('missing');
 const n=Number(value);if(!Number.isFinite(n)||n<0||(positive&&n===0)||(integer&&!Number.isInteger(n)))throw Error('range');return n;
}
export function fundingGap({months,monthly,once,tuition,funding}){
 const m=number(months,{positive:true,integer:true}),living=number(monthly),initial=number(once),fees=number(tuition),award=number(funding);
 const total=m*living+initial+fees;if(!Number.isFinite(total))throw Error('range');
 return {total,gap:Math.max(0,total-award),surplus:Math.max(0,award-total),funding:award};
}
export function mextGpa(rows,mode='credits'){
 if(!Array.isArray(rows)||!rows.length||!['credits','courses'].includes(mode))throw Error('missing');
 let points=0,units=0,included=0,excluded=0;
 for(const row of rows){if(row.points==='exclude'){excluded++;continue;}
 const p=number(row.points,{integer:true});if(p>3)throw Error('range');
 const weight=mode==='courses'?1:number(row.credits,{positive:true});points+=p*weight;units+=weight;included++;
 }
 if(!included||!units||!Number.isFinite(points)||!Number.isFinite(units))throw Error('range');
 return {gpa:points/units,points,units,included,excluded};
}
