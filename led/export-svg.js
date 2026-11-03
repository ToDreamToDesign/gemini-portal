(function(global){
'use strict';
const colors=['#007c82','#b1482c','#7152b7','#1967a4','#977216','#ab3c79','#4c742e','#4858a6'];
const esc=s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[x]));
function renderPlan(m,meta,plan,wiring,diagram,settings){
 const W=Math.max(1000,diagram.w+80),graphW=W-80;
 const text=(x,y,t,size=24,weight=400,fill='#182b34')=>`<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(t)}</text>`;
 let body=text(40,48,`DREAM / LED WALL · ${meta.name} · ${settings.view==='front'?'正面視角':'背面視角'}`,22,600,'#5b737e')+text(40,106,`${m.w} × ${m.h} cm`,46,700)+`<line x1="40" y1="126" x2="${W-40}" y2="126" stroke="#dbe2e7"/>`;
 const right=(y,t)=>`<text x="${W-40}" y="${y}" text-anchor="end" font-size="28" font-weight="700" fill="#182b34">${esc(t)}</text>`;
 let ry=80;if(settings.consoleModel){body+=right(ry,`控台 ${settings.consoleModel}`);ry+=34;}if(settings.processor)body+=right(ry,`處理器 ${settings.processor}`);
 const r=m.rack;
 [['LED 模組',`${m.total} 片`,`${m.cols} 列 × ${m.rows} 排`],['出貨箱數',`${m.boxes} 箱`,`多帶 ${m.boxes*m.box-m.total} 片`],['杯架直立',`${m.groups} 組`,`共 ${r.pieces*m.groups} 支`]].forEach((a,i)=>{const x=40+i*(W-80)/3;body+=text(x,163,a[0],21)+text(x,209,a[1],38,700)+text(x,244,a[2],20);});
 const combo=[...Array(r.big).fill('120'),...Array(r.small).fill('90')].join(' + ')||'無適用組合';
 body+=`<rect x="40" y="265" width="${W-80}" height="82" rx="6" fill="#eff7f4"/>`+text(56,296,`每組杯架（下往上）：${combo}`,22,600)+text(56,327,`120 cm × ${r.big*m.groups} 支 ｜ 90 cm × ${r.small*m.groups} 支 ｜ 總高 ${r.total} cm ≤ 屏高 ${m.h} cm`,22);
 let y=382;body+=text(40,y,`${meta.name}配線圖 · 每組最多 ${settings.limit} 片 · 進線 15 m`,24,700);y+=35;body+=text(40,y,settings.mode,20,500,'#526975');y+=16;
 const height=diagram.h*graphW/diagram.w;body+=`<svg x="40" y="${y}" width="${graphW}" height="${height}" viewBox="0 0 ${diagram.w} ${diagram.h}">${diagram.markup.replace(/^<svg[^>]*>|<\/svg>$/g,'')}</svg>`;y+=height+30;
 const groups=Object.entries(wiring).filter(([,a])=>a.length).sort((a,b)=>Number(a[0])-Number(b[0]));
 if(groups.length){groups.forEach(([n,a],i)=>{const x=40+i%5*(W-80)/5,ty=y+Math.floor(i/5)*36;body+=`<circle cx="${x+5}" cy="${ty-7}" r="6" fill="${colors[(Number(n)-1)%colors.length]}"/>`+text(x+19,ty,`${meta.prefix}${n}：${a.length} 片`,19);});y+=Math.ceil(groups.length/5)*36;}else{body+=text(40,y,'尚未配線',22);y+=36;}
 y+=20;body+=text(40,y,`${meta.name}線材備料 · 共 ${plan.total} 條`,28,700);y+=40;body+=text(40,y,meta.prefix==='B'?`回系統 15 m 線 ${plan.feeds} 條；1 m 跳線與主訊共用`:`15 m 進線 ${plan.feeds} 條＋跳線 ${plan.jumps} 條`,24,600);y+=40;
 body+=`<rect x="40" y="${y-25}" width="${W-80}" height="42" fill="#f0f4f7"/>`+text(56,y,'用途',22,600)+text(W*.53,y,'線長',22,600)+text(W*.82,y,'條數',22,600);y+=43;
 for(const row of plan.rows){const missing=row.length===null;if(missing)body+=`<rect x="40" y="${y-26}" width="${W-80}" height="43" fill="#fff1e8"/>`;body+=text(56,y,meta.prefix==='B'&&row.kind==='lead'?'備訊回系統':meta.name+(row.kind==='lead'?'進線':'跳線'),22)+text(W*.53,y,missing?`需 ≥ ${row.needed} m`:`${row.length} m`,22,500,missing?'#a43d1a':'#182b34')+text(W*.82,y,`${row.count} 條`,22,600)+`<line x1="40" y1="${y+15}" x2="${W-40}" y2="${y+15}" stroke="#dbe2e7"/>`;y+=43;}
 y+=15;const notes=[meta.prefix==='B'?'圖中模組連接沿用主訊已有的跳線。':`跳線：橫直格距加 ${settings.slackCm} cm 預留，選 1 m 或 15 m。`,'● 為每組起點接 15 m 進線；'+(settings.view==='front'?'圖為正面視角（左右與背面相反，欄號沿用背面編號），施工請看背面視角。':'圖為背面視角（施工面），從正面看左右相反。')];
 if(meta.prefix==='B')notes.unshift('備訊只另備回系統的 15 m 線，模組跳線不另計。');
 if(plan.unmatchedJumps)notes.unshift(`有 ${plan.unmatchedJumps} 段未與主訊跳線匹配，請修正備訊走線。`);
 if(plan.sharedJumps)notes.unshift(`備訊 ${plan.sharedJumps} 段共用主訊跳線，已在主訊圖計料，不重複備線。`);
 if(plan.assigned<m.total)notes.unshift(`僅配 ${plan.assigned}/${m.total} 片，線材備料尚未完整。`);
 if(plan.missing)notes.unshift(`${plan.missing} 條需另備足夠長的規格，請見表中標色。`);
 if(settings.warnings.length)notes.push(`${settings.warnings.length} 項跨格／超片數／杯架提醒，請在頁面確認。`);
 if(meta.prefix==='P')notes.push('不含上游主電源幹線，接頭與每組供電容量依現場器材設定。');
 for(const note of notes){body+=text(40,y,note,20,400,'#526975');y+=30;}
 y+=10;body+=text(40,y,`${m.cw} × ${m.ch} cm／P${m.p}／${m.box} 片一箱 · ${meta.prefix} 組號・接線順序`,18,400,'#526975');
 const H=y+28;return {markup:`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="white"/><g font-family="system-ui,sans-serif">${body}</g></svg>`,w:W,h:H};
}
const api={renderPlan};global.LEDExport=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
