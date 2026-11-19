// Shuffle bags play every variation once before refilling, without an adjacent repeat.
export function pickVariant(bags,key,count,random=Math.random){
 if(!Number.isInteger(count)||count<1)return 0;
 let bag=bags[key];
 if(!bag||typeof bag!=='object')bag=bags[key]={last:-1,left:[]};
 if(!bag.left.length){
  bag.left=Array.from({length:count},(_,i)=>i);
  for(let i=bag.left.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[bag.left[i],bag.left[j]]=[bag.left[j],bag.left[i]];}
  if(count>1&&bag.left.at(-1)===bag.last)[bag.left[0],bag.left[count-1]]=[bag.left[count-1],bag.left[0]];
 }
 const value=bag.left.pop();bag.last=value;return value;
}
export function idleCategory(office){
 if(!office||office.active)return null;
 const ceoEmpty=!office.ceo?.id,secretaryEmpty=!office.secretary?.id;
 return ceoEmpty&&secretaryEmpty?'idleBoth':ceoEmpty?'idleCeo':secretaryEmpty?'idleSecretary':null;
}
