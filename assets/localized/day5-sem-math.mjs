import {decimal} from './day4-math.mjs';
export function standardError(sdValue,nValue){
 const sd=decimal(sdValue),n=decimal(nValue);
 if(sd<0)throw Error('SD');
 if(!Number.isInteger(n)||n<2||n>1e9)throw Error('N');
 return {sd,n,sem:sd/Math.sqrt(n),quadrupledSem:sd/(2*Math.sqrt(n))};
}
