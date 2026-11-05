/* Versioned review engine. The older member pilot retains its original engine. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AssetAssessment=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const IDS=['wisdom','beauty','health','wealth','civilisation'];
 const SIDES=['tangible','intangible'];
 const DAILY=['health-T7','health-I7'];
 const band=(n,count=7)=>n<count*2?1:n<count*3?2:3;
 function score(bank,answers){
  const qs=bank.questions;
  if(!answers||typeof answers!=='object'||Array.isArray(answers)||Object.keys(answers).length!==qs.length||Object.keys(answers).some(id=>!qs.some(q=>q.id===id)))throw Error('請完成全部題目。 Please answer every question.');
  const values={};
  for(const q of qs){const choice=q.options.find(o=>o.id===answers[q.id]);if(!choice)throw Error('回答選項不正確。 Invalid answer choice.');values[q.id]=choice.score;}
  return {values,categories:IDS.map(id=>({id,...Object.fromEntries(SIDES.map(s=>[s,qs.filter(q=>q.category===id&&q.side===s).reduce((n,q)=>n+values[q.id],0)]))}))};
 }
 function interpret(bank,answers){
  const {values,categories:raw}=score(bank,answers);
  const categories=raw.map(c=>{const minimum=Math.min(c.tangible,c.intangible),sum=c.tangible+c.intangible,tBand=band(c.tangible),iBand=band(c.intangible);return {...c,minimum,sum,tBand,iBand,key:`${tBand}${iBand}`,priority:28-minimum,gap:c.tangible-c.intangible,eligible:minimum<21,lower:bank.questions.filter(q=>q.category===c.id&&values[q.id]<=2).map(q=>q.id)};});
  const ranked=categories.filter(c=>c.eligible).sort((a,b)=>b.priority-a.priority||a.sum-b.sum||IDS.indexOf(a.id)-IDS.indexOf(b.id));
  let rank=0;ranked.forEach((c,i)=>{if(i===0||c.priority!==ranked[i-1].priority||c.sum!==ranked[i-1].sum)rank=i+1;c.rank=rank;});
  const tangible=categories.reduce((n,c)=>n+c.tangible,0),intangible=categories.reduce((n,c)=>n+c.intangible,0);
  const low=bank.questions.filter(q=>values[q.id]<=2),daily=low.filter(q=>DAILY.includes(q.id));
  const themes=[...new Set(low.map(q=>q.theme))].map(id=>{
   const items=low.filter(q=>q.theme===id),cats=categories.filter(c=>items.some(q=>q.category===c.id));
   const weakest=[...cats].sort((a,b)=>b.priority-a.priority||a.sum-b.sum)[0];
   return {id,items:items.map(q=>q.id),daily:items.some(q=>DAILY.includes(q.id)),priority:weakest.priority,pillarTotal:weakest.sum,lowest:Math.min(...items.map(q=>values[q.id])),count:items.length};
  }).sort((a,b)=>Number(b.daily)-Number(a.daily)||b.priority-a.priority||a.pillarTotal-b.pillarTotal||a.lowest-b.lowest||b.count-a.count||a.id.localeCompare(b.id));
  const financialStrain=values['wealth-T2']<=2,accessBarrier=values['health-T6']<=2;
  // At most one optional service across the initial themes. No sales based on access/financial difficulty.
  let assigned=false;
  for(const theme of themes.slice(0,3)){
   theme.service=null;
   if(assigned||daily.length||financialStrain||accessBarrier)continue;
   const has=id=>theme.items.includes(id);
   if(theme.id==='decisions')theme.service=theme.items.some(id=>/^wisdom-T/.test(id))?'iching':'tarot';
   if(theme.id==='meaning_learning'&&theme.items.some(id=>['civilisation-I4','civilisation-I6'].includes(id))&&!has('civilisation-I7'))theme.service='tarot';
   if(theme.id==='rest_care'){
    if(['health-T3','health-T4','health-T5','health-T6','health-T7'].some(has))continue;
    theme.service=has('health-T1')?'knife':has('health-T2')?'phytoncide':null;
   }
   if(theme.service)assigned=true;
  }
  return {version:bank.version,values,categories,ranked,tangible,intangible,tBand:band(tangible,35),iBand:band(intangible,35),profileKey:`${band(tangible,35)}${band(intangible,35)}`,lower:low.map(q=>q.id),daily:daily.map(q=>q.id),themes,visibleThemes:themes.slice(0,3),otherThemes:themes.slice(3),financialStrain,accessBarrier};
 }
 return {score,interpret,band};
});
