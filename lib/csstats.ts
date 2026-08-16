const BASE='https://csstats.gg/player';
const clean=(s:string)=>s.replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
const text=(s:string)=>clean(s.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;/gi,"'"));
const num=(s?:string|number)=>{const raw=String(s??'').replace(/\u00a0/g,' ').trim().replace('%',''); const normalized=/^-?\d{1,3}(?:[ ,]\d{3})+(?:\.\d+)?$/.test(raw)?raw.replace(/[ ,]/g,''):raw.replace(/,/g,'.'); const n=Number(normalized);return Number.isFinite(n)?n:0};
const cells=(r:string)=>[...r.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m=>text(m[1]));
const alts=(r:string)=>[...r.matchAll(/<img[^>]+alt=["']([^"']+)["']/gi)].map(m=>m[1]);
const rankNames=['Silver I','Silver II','Silver III','Silver IV','Silver Elite','Silver Elite Master','Gold Nova I','Gold Nova II','Gold Nova III','Gold Nova Master','Master Guardian I','Master Guardian II','Master Guardian Elite','Distinguished Master Guardian','Legendary Eagle','Legendary Eagle Master','Supreme Master First Class','The Global Elite'];
const rankList=(html:string)=>{
 const out:{level:number;map:string;name:string}[]=[];
 for(const m of html.matchAll(/\/ranks\/(\d+)\.png/gi)){
  const level=Number(m[1]); if(level<1||level>18)continue;
  const at=m.index??0; const snippet=html.slice(Math.max(0,at-2200),Math.min(html.length,at+2200));
  const visible=text(snippet);
  const maps=visible.match(/\b(?:de|cs)_[a-z0-9_]+\b/ig)||[];
  const map=maps.length?maps[maps.length-1]:'Competitive';
  const key=`${level}:${map}`;
  if(!out.some(x=>`${x.level}:${x.map}`===key)) out.push({level,map,name:rankNames[level-1]});
 }
 return out;
};
const premierHistory=(t:string)=>{
 const out:{season:number;rating:number|null;best:number|null;wins:number|null}[]=[];
 for(const m of t.matchAll(/Premier\s*-\s*Season\s*(\d+)/gi)){
  const season=Number(m[1]); const part=t.slice(m.index??0,(m.index??0)+420);
  const values=[...part.matchAll(/(?:^|\s)(\d{1,3}(?:[ ,]\d{3})|\d{4,5})(?=\s|$)/g)].map(x=>num(x[1])).filter(x=>x>=1000&&x<=50000);
  const wins=part.match(/Wins:\s*(\d+)/i);
  if(!out.some(x=>x.season===season))out.push({season,rating:values[0]??null,best:values[1]??null,wins:wins?Number(wins[1]):null});
 }
 return out;
};
export async function getCsstatsProfile(steamid64:string){
 const c=new AbortController(),tm=setTimeout(()=>c.abort(),12000);try{const r=await fetch(`${BASE}/${steamid64}`,{headers:{Accept:'text/html','User-Agent':'Mozilla/5.0 (compatible; CS2Radar/3.0)'},cache:'no-store',signal:c.signal});if(!r.ok){console.warn(`csstats.gg ${r.status} for ${steamid64}`);return null}const h=await r.text(),t=text(h);const m=(x:RegExp|string)=>t.match(x)?.[1];const stat=(x:RegExp|string)=>{const v=m(x);return v==null?null:num(v)};const history=premierHistory(t);const ranks=rankList(h);const matches:any[]=[];for(const tb of [...h.matchAll(/<table[\s\S]*?<\/table>/gi)].map(x=>x[0])){const rs=[...tb.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map(x=>x[0]);if(!rs.length)continue;const hd=cells(rs[0]).join(' ').toLowerCase();if(!hd.includes('date')||!hd.includes('map')||!hd.includes('rating'))continue;for(const row of rs.slice(1)){const c=cells(row);if(c.length<10)continue;const map=(alts(row).find(x=>/^de_|^cs_/i.test(x))||c[1]||'—').match(/(?:de_|cs_).*/i)?.[0]||c[1]||'—';if(!/\d{1,2}(?:st|nd|rd|th)/i.test(c[0]||''))continue;matches.push({date:c[0],map,score:c[2]||'—',kills:num(c[4]),deaths:num(c[5]),assists:num(c[6]),hsPercent:num(c[8]),adr:num(c[9]),rating:num(c[19]||c[c.length-1]),kDiff:num(c[7]),clutch1v5:num(c[10]),clutch1v4:num(c[11]),clutch1v3:num(c[12]),clutch1v2:num(c[13]),clutch1v1:num(c[14]),multi5k:num(c[15]),multi4k:num(c[16]),multi3k:num(c[17])})}if(matches.length)break}
const current=history[0];return{source:'csstats',sourceUrl:`${BASE}/${steamid64}`,stats:{kd:stat(/K\/D\s*([0-9.]+)/i),hltvRating:stat(/HLTV Rating\s*([0-9.]+)/i),winRate:stat(/Win Rate\s*([0-9.]+)%/i),played:stat(/Played\s+(\d+)/i),wins:stat(/Won\s+(\d+)/i),losses:stat(/Lost\s+(\d+)/i),ties:stat(/Tied\s+(\d+)/i),hsPercent:stat(/HS%\s*([0-9.]+)%/i),kills:stat(/Kills\s+(\d+)/i),deaths:stat(/Deaths\s+(\d+)/i),assists:stat(/Assists\s+(\d+)/i),headshots:stat(/Headshots\s+(\d+)/i),adr:stat(/ADR\s*([0-9.]+)/i),damage:stat(/Damage\s+(\d+)/i),rounds:stat(/Rounds\s+(\d+)/i)},matches:matches.slice(0,30),premier:{rating:current?.rating??null,previousRating:history[1]?.rating??null,season:current?.season??null,history},competitiveRanks:ranks};}catch(e){console.warn(`csstats.gg parse error for ${steamid64}:`,e);return null}finally{clearTimeout(tm)}}
