import fs from "node:fs";
const sf="content/sources.json";const S=JSON.parse(fs.readFileSync(sf,"utf8"));const arr=Array.isArray(S)?S:S.sources;
export function addSrc(id,title,url){ if(!arr.some(x=>x.id===id)) arr.push({id,title,publisher:"Wikipedia",url,tier:"encyclopedia",status:"to-verify",note:"Used for background that the UNESCO record does not give. Each statement is limited to the article's lead and opening sections; confirm against specialist sources.",retrieved:"2026-10-07"}); }
export function done(){ fs.writeFileSync(sf,JSON.stringify(S,null,2)+"\n"); }
export function card(slug,srcId,parts,gaps){ const f=`content/places/${slug}.json`;const c=JSON.parse(fs.readFileSync(f,"utf8"));
  c.sections=c.sections.filter(s=>s.id!=="context");
  c.sections.push({id:"context",title:"Background",blocks:[{type:"p",parts:parts.map((t,i)=>({text:(i?" ":"")+t,cite:[srcId]}))}]});
  c.gaps=gaps; fs.writeFileSync(f,JSON.stringify(c,null,2)+"\n"); }
