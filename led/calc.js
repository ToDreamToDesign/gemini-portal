(function(global){
'use strict';
function bestRack(h){let best={big:0,small:0,total:0,pieces:0};for(let big=0;big<=Math.floor(h/120);big++){const small=Math.floor((h-big*120)/90),total=big*120+small*90,pieces=big+small;if(total>best.total||(total===best.total&&pieces<best.pieces))best={big,small,total,pieces};}return best;}
function calculate(w,h,box,groups){if(!Number.isInteger(w)||!Number.isInteger(h)||w<50||h<50||w>10000||h>10000||w%50||h%50)throw Error('寬、高需為 50 cm 的倍數，範圍 50–10,000 cm。');if(!Number.isInteger(box)||box<1||box>100)throw Error('每箱片數請填 1–100 的整數。');if(!Number.isInteger(groups)||groups<0||groups>100)throw Error('杯架組數請填 0–100 的整數。');const cols=w/50,rows=h/50,total=cols*rows;if(total>2000)throw Error('單面最多支援 2,000 片，請拆面計算。');return {w,h,cols,rows,total,box,boxes:Math.ceil(total/box),groups,rack:bestRack(h)};}
function snake(cols,rows,corner,axis){const right=corner.includes('r'),bottom=corner.includes('b'),out=[];const outer=axis==='row'?rows:cols,inner=axis==='row'?cols:rows;for(let o=0;o<outer;o++)for(let i=0;i<inner;i++){let r,c;if(axis==='row'){r=bottom?rows-1-o:o;c=(right!==(o%2===1))?cols-1-i:i;}else{c=right?cols-1-o:o;r=(bottom!==(o%2===1))?rows-1-i:i;}out.push(r*cols+c);}return out;}
function groupOrder(order,limit){if(!Number.isInteger(limit)||limit<1)throw Error('每串片數必須是正整數。');const groups={};order.forEach((idx,i)=>{const n=Math.floor(i/limit)+1;(groups[n]??=[]).push(idx);});return groups;}
function parseLengths(input){const parts=String(input).trim().split(/[,，、;；\s]+/),values=parts.map(Number);if(!parts.length||values.some(n=>!Number.isFinite(n)||n<=0||n>1000))throw Error('常備線長需為 0–1,000 m 之間的正數，請用逗號分隔。');return [...new Set(values)].sort((a,b)=>a-b);}
function cablePlan(cols,rows,wiring,stock,lead,slack){
 if(!Number.isFinite(lead)||lead<=0||lead>1000)throw Error('每路進線需長請填大於 0、最多 1,000 m。');
 if(!Number.isFinite(slack)||slack<0||slack>10)throw Error('跳線預留請填 0–1,000 cm。');
 if(!stock.length||stock.some(n=>!Number.isFinite(n)||n<=0))throw Error('請填有效的常備線長。');
 const sorted=[...stock].sort((a,b)=>a-b),segments=[],seen=new Set();
 const add=(kind,needed,line,from,to)=>{needed=Math.round(needed*1000000)/1000000;segments.push({kind,needed,line,from,to,length:sorted.find(n=>n+1e-9>=needed)??null});};
 for(const[line,path]of Object.entries(wiring)){if(!path.length)continue;
  for(const idx of path){if(!Number.isInteger(idx)||idx<0||idx>=cols*rows||seen.has(idx))throw Error('配線包含重複或無效模組。');seen.add(idx);}
  add('lead',lead,line,null,path[0]);
  for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],steps=Math.abs(a%cols-b%cols)+Math.abs(Math.floor(a/cols)-Math.floor(b/cols));add('jump',steps*0.5+slack,line,a,b);}
 }
 const counts=new Map();for(const segment of segments){const key=segment.kind+':'+(segment.length??'missing:'+segment.needed),row=counts.get(key)??{kind:segment.kind,length:segment.length,needed:segment.needed,count:0};row.count++;counts.set(key,row);}
 return {segments,rows:[...counts.values()].sort((a,b)=>a.kind.localeCompare(b.kind)||(a.length??a.needed)-(b.length??b.needed)),assigned:seen.size,feeds:segments.filter(s=>s.kind==='lead').length,jumps:segments.filter(s=>s.kind==='jump').length,total:segments.length,missing:segments.filter(s=>s.length===null).length};
}
function copyWiring(wiring,reverse=false){return Object.fromEntries(Object.entries(wiring).map(([n,path])=>[n,reverse?[...path].reverse():[...path]]));}
function routeWithin(cells,cols,axis='row',right=false,bottom=false){
 const groups=new Map();for(const idx of cells){const outer=axis==='row'?Math.floor(idx/cols):idx%cols;(groups.get(outer)??(groups.set(outer,[]),groups.get(outer))).push(idx);}
 const outer=[...groups.keys()].sort((a,b)=>a-b);if(axis==='row'?bottom:right)outer.reverse();const result=[];
 outer.forEach((key,i)=>{const group=groups.get(key).sort((a,b)=>axis==='row'?a%cols-b%cols:Math.floor(a/cols)-Math.floor(b/cols));if((axis==='row'?right:bottom)!==(i%2===1))group.reverse();result.push(...group);});return result;
}
function autoGroups(cols,rows,limit,{grouping='columns',axis='row',corner='tl',direction='left'}={}){
 if(!Number.isInteger(limit)||limit<1||limit>2000)throw Error('每組最多片數請填 1–2,000 的整數。');
 const right=corner.includes('r'),bottom=corner.includes('b');let base={};
 if(grouping==='continuous')base=groupOrder(snake(cols,rows,corner,axis),limit);
 else{
  const blockW=grouping==='columns'?Math.max(1,Math.floor(limit/Math.min(rows,limit))):Math.min(cols,limit);
  const blockH=grouping==='columns'?Math.min(rows,limit):Math.max(1,Math.floor(limit/blockW));
  const xs=[],ys=[];for(let x=0;x<cols;x+=blockW)xs.push([x,Math.min(cols,x+blockW)]);for(let y=0;y<rows;y+=blockH)ys.push([y,Math.min(rows,y+blockH)]);
  if(right)xs.reverse();if(bottom)ys.reverse();let n=1;
  const block=(x,y)=>{const cells=[];for(let r=y[0];r<y[1];r++)for(let c=x[0];c<x[1];c++)cells.push(r*cols+c);base[n++]=cells;};
  if(grouping==='columns')for(const x of xs)for(const y of ys)block(x,y);else for(const y of ys)for(const x of xs)block(x,y);
 }
 return Object.fromEntries(Object.entries(base).map(([n,cells],i)=>[n,routeWithin(cells,cols,axis,direction==='right'||(direction==='alternate'&&i%2===1),bottom)]));
}
function shareJumpCables(backup,primary){
 const edge=s=>Math.min(s.from,s.to)+':'+Math.max(s.from,s.to),edges=new Map(primary.segments.filter(s=>s.kind==='jump').map(s=>[edge(s),s]));
 const kept=backup.segments.filter(s=>{if(s.kind!=='jump')return true;const main=edges.get(edge(s));return !main||main.length===null||main.length+1e-9<s.needed;});
 const counts=new Map();for(const s of kept){const key=s.kind+':'+(s.length??'missing:'+s.needed),row=counts.get(key)??{kind:s.kind,length:s.length,needed:s.needed,count:0};row.count++;counts.set(key,row);}
 return {...backup,segments:kept,rows:[...counts.values()].sort((a,b)=>a.kind.localeCompare(b.kind)||(a.length??a.needed)-(b.length??b.needed)),sharedJumps:backup.segments.length-kept.length,feeds:kept.filter(s=>s.kind==='lead').length,jumps:kept.filter(s=>s.kind==='jump').length,total:kept.length,missing:kept.filter(s=>s.length===null).length};
}
function gridTrace(from,to,cols,axis='row'){
 let r=Math.floor(from/cols),c=from%cols;const tr=Math.floor(to/cols),tc=to%cols,out=[];
 const horizontal=()=>{while(c!==tc){c+=Math.sign(tc-c);out.push(r*cols+c);}};
 const vertical=()=>{while(r!==tr){r+=Math.sign(tr-r);out.push(r*cols+c);}};
 if(axis==='row'){horizontal();vertical();}else{vertical();horizontal();}return out;
}
function backupReturnPlan(backup,primary){
 const shared=shareJumpCables(backup,primary),segments=backup.segments.filter(s=>s.kind==='lead'),counts=new Map();
 for(const s of segments){const key=s.length??'missing:'+s.needed,row=counts.get(key)??{kind:'lead',length:s.length,needed:s.needed,count:0};row.count++;counts.set(key,row);}
 return {...backup,segments,rows:[...counts.values()].sort((a,b)=>(a.length??a.needed)-(b.length??b.needed)),feeds:segments.length,jumps:0,total:segments.length,sharedJumps:shared.sharedJumps,unmatchedJumps:shared.jumps,missing:segments.filter(s=>s.length===null).length};
}
const api={bestRack,calculate,snake,groupOrder,parseLengths,cablePlan,copyWiring,routeWithin,autoGroups,shareJumpCables,gridTrace,backupReturnPlan};global.LEDCalc=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
