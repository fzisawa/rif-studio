/* 인트라넷 메일 — 개인 메일함 + 공용 메일함 · 참조/숨은참조 · 답장/전체 답장/전달 · 별표 · 내부 메모 · 상용구 · 임시보관함
   app.js 가 RIFMAIL.init(컨텍스트) 를 불러 주면 시작해요. (db · el · fmtPhone 은 lib.js 의 전역 값) */
window.RIFMAIL=(()=>{
const $=id=>document.getElementById(id);
let X=null,started=false,poll=null;
let inbox=[],outbox=[],boxes=[],bmem={},stars=new Set(),drafts=[],tpls=[],irds=new Set(),bodies={},notes={};
let fold="in",sub="open",mode="list",selId=null,selKind="in",picked=new Set(),filt={un:false,st:false,at:false},q="",compose=null,usage=null,newCount=-1;
const lc=s=>String(s==null?"":s).toLowerCase();
const tok=s=>lc(s).match(/[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/g)||[];
const mineMsg=m=>X.myAddrs.some(a=>m._t.has(a));
const boxesOf=m=>boxes.filter(b=>m._t.has(b.addr));
const isMgmt=()=>X.ceo||X.exec;
const mbyte=b=>b>=1073741824?(b/1073741824).toFixed(2)+" GB":b>=1048576?(b/1048576).toFixed(1)+" MB":Math.max(1,Math.round(b/1024))+" KB";
const fmt=s=>{if(!s)return"";const d=new Date(s),n=new Date();return d.toDateString()===n.toDateString()?d.toLocaleTimeString("ko-KR",{hour:"numeric",minute:"2-digit"}):d.getFullYear()===n.getFullYear()?d.toLocaleDateString("ko-KR",{month:"numeric",day:"numeric"}):d.toLocaleDateString("ko-KR",{year:"2-digit",month:"numeric",day:"numeric"})};
const ftl=s=>s?new Date(s).toLocaleString("ko-KR",{dateStyle:"medium",timeStyle:"short"}):"";
const ini=s=>(String(s||"?").trim()[0]||"?").toUpperCase();
const nm=e=>X.nameOf(e);
const btn=(t,c,fn,title)=>{const b=el("button",{type:"button",className:"btn small "+(c||""),textContent:t});if(title)b.title=title;if(fn)b.onclick=fn;return b};
const normSub=s=>{let t=String(s||"").trim();for(let i=0;i<8;i++){const n=t.replace(/^\s*((re|fw|fwd|답장|회신|답신|전달)\s*(\[\d+\])?\s*[:：]\s*)+/i,"").replace(/^\s*\[RIF STUDIO\]\s*/i,"");if(n===t)break;t=n}return t.trim().toLowerCase()};
const errTxt=e=>{const m=String((e&&e.message)||e||"");
  if(/address exists/.test(m))return"이미 있는 주소예요.";if(/staff address/.test(m))return"사원 메일 주소와 겹쳐요.";if(/bad address/.test(m))return"주소는 영문 소문자·숫자·점(.)·하이픈(-)·밑줄(_)만 쓸 수 있어요.";
  if(/reserved/.test(m))return"쓸 수 없는 주소예요.";if(/protected/.test(m))return"고객 문의(support@) 메일함은 지울 수 없어요.";if(/mgmt only/.test(m))return"경영지원팀·대표만 할 수 있어요.";return m};

/* ───────── 데이터 ───────── */
async function load(){
  const me=X.me,D=db;
  const [a,b,c,s,dr,bx,bm,tp]=await Promise.all([
    D.from("inbox_messages").select("id,from_addr,from_name,to_addrs,cc_addrs,subject,preview,received_at,assignee_email,done,attachments,deleted_at").order("received_at",{ascending:false}).limit(400),
    D.from("inbox_reads").select("msg_id").eq("email",me),
    D.from("mail_outbox").select("id,sender,sender_name,author_name,author_email,to_email,cc_email,subject,body,created_at,opened_at,open_count,deleted_at,attachments,box_id,inbox_id").order("created_at",{ascending:false}).limit(300),
    D.from("mail_stars").select("msg_id"),
    D.from("mail_drafts").select("id,from_as,to_text,cc_text,bcc_text,subject,body_html,inbox_id,updated_at").order("updated_at",{ascending:false}),
    D.from("mail_boxes").select("id,addr,name,from_name,descr").order("id"),
    D.from("mail_box_members").select("box_id,email"),
    D.from("mail_templates").select("id,owner_email,shared,title,subject,body").order("title")]);
  inbox=(a.data||[]).map(m=>(m._t=new Set(tok(m.to_addrs)),m));
  irds=new Set((b.data||[]).map(r=>r.msg_id));
  outbox=c.data||[];stars=new Set((s.data||[]).map(r=>r.msg_id));drafts=dr.data||[];
  boxes=bx.data||[];bmem={};(bm.data||[]).forEach(r=>(bmem[r.box_id]=bmem[r.box_id]||[]).push(lc(r.email)));
  tpls=tp.data||[];
  if(fold.startsWith("box:")&&!boxes.some(x=>"box:"+x.id===fold)){fold="in";if(mode==="list")sub="open"}
  title()}
const unreadIn=m=>!m.deleted_at&&!m.done&&!irds.has(m.id);
function title(){const n=inbox.filter(m=>unreadIn(m)&&(mineMsg(m)||(boxesOf(m).length)||X.exec||X.ceo)).length;
  const t=$("ib");if(t){t.hidden=!n;t.textContent=n}
  document.title=(n?"("+n+") ":"")+"Intranet · RIF STUDIO";return n}
async function refresh(quiet){await load();if(mode==="list"||quiet!==true)render();else drawFolders();loadUsage()}
async function loadUsage(){const {data}=await db.rpc("mail_usage");usage=data||null;drawUsage()}

/* ───────── 왼쪽 폴더 ───────── */
function counts(){
  const c={};const live=inbox.filter(m=>!m.deleted_at);
  c.in=live.filter(m=>!m.done&&!irds.has(m.id)&&mineMsg(m)).length;
  c.mine=live.filter(m=>!m.done&&lc(m.assignee_email)===X.me&&!irds.has(m.id)).length;
  c.draft=drafts.length;c.trash=inbox.filter(m=>m.deleted_at).length+outbox.filter(r=>r.deleted_at).length;
  boxes.forEach(b=>{c["box:"+b.id]=live.filter(m=>!m.done&&!irds.has(m.id)&&m._t.has(b.addr)).length});
  c.orph=live.filter(m=>!m.done&&!irds.has(m.id)&&isOrph(m)).length;return c}
const staffAddrs=()=>new Set(X.staff.map(s=>lc(s.email)));
function isOrph(m){const sa=staffAddrs();return!mineMsg(m)&&!boxesOf(m).length&&![...m._t].some(a=>sa.has(a))}
function go(k){fold=k;sub="open";selId=null;picked.clear();q="";filt={un:false,st:false,at:false};compose=null;mode=(k==="manage"||k==="tpl")?k:"list";render()}
function drawFolders(){
  const f=$("of");if(!f)return;f.replaceChildren();const c=counts();
  const nb=el("button",{className:"onew",type:"button",textContent:"✉ 새 메일"});nb.onclick=()=>openCompose({});f.append(nb);
  const item=(k,label,n,sec)=>{const on=fold===k&&(mode==="list"||mode==="read"||k===mode);const d=el("div",{className:"ofi"+(on?" on":"")},[el("span",{textContent:label}),el("span",{className:"c",textContent:n||""})]);d.onclick=()=>go(k);f.append(d)};
  item("in","받은 편지함",c.in);item("star","별표 편지함","");item("mine","내 담당",c.mine);item("out","보낸 편지함","");item("draft","임시보관함",c.draft);item("done","완료한 메일","");item("trash","휴지통",c.trash);
  f.append(el("div",{className:"ofh",textContent:"공용 메일함"}));
  if(!boxes.length)f.append(el("div",{className:"ofn",textContent:"아직 없어요"}));
  boxes.forEach(b=>item("box:"+b.id,b.name,c["box:"+b.id]));
  if(isMgmt()){item("orph","미분류 메일",c.orph);item("manage","⚙ 공용 메일함 관리","")}
  if(X.ceo)item("all","전체 메일 (대표)","");
  f.append(el("div",{className:"ofh",textContent:"도구"}));
  item("tpl","상용구","");
  f.append(el("a",{className:"ofi ofa",href:"../mail/"},[el("span",{textContent:"서명 설정"}),el("span",{className:"c",textContent:"↗"})]));
  f.append(el("div",{id:"ousg",className:"ousg"}));drawUsage();
  if(window.innerWidth<=900){const on=f.querySelector(".ofi.on");if(on)f.scrollLeft=Math.max(0,on.offsetLeft-12)}}
function drawUsage(){const u=$("ousg");if(!u)return;u.replaceChildren();if(!usage)return;
  const left=Math.max(0,524288000-usage.db_bytes),pc=Math.min(100,Math.max((usage.mine_bytes||0)/524288000*100,0.6));
  u.append(el("div",{className:"us",textContent:"내 메일 사용량"}),el("div",{className:"ut",textContent:mbyte(usage.mine_bytes||0)+" · "+(usage.mine_count||0)+"통"}),el("div",{className:"ub"},[el("i",{style:"width:"+pc.toFixed(1)+"%"})]),el("div",{className:"us",textContent:"사이트 전체 남은 용량 "+mbyte(left)+" / "+mbyte(524288000)}));
  if(X.ceo&&usage.staff){const l=el("div",{className:"usl"},[el("div",{className:"us",textContent:"사원별 (대표만 보여요)"})]);
    usage.staff.forEach(x=>l.append(el("div",{className:"usr"},[el("span",{textContent:X.dispName(x.email)}),el("span",{textContent:mbyte(x.bytes||0)})])));
    l.append(el("div",{className:"usr"},[el("span",{textContent:"support@ (공용)"}),el("span",{textContent:mbyte(usage.support_bytes||0)})]));u.append(l)}}

/* ───────── 목록 ───────── */
function render(){
  if(!X||!$("om"))return;drawFolders();const om=$("om");om.replaceChildren();
  if(mode==="read")return drawRead(om);if(mode==="compose")return drawCompose(om);if(mode==="manage")return drawManage(om);if(mode==="tpl")return drawTpl(om);
  drawList(om)}
const wrapOut=r=>({...r,_o:1,_t:new Set(),received_at:r.created_at});
const wrapDraft=d=>({...d,_d:1,_t:new Set(),received_at:d.updated_at,subject:d.subject});
function baseList(){
  const live=m=>!m.deleted_at;let L=[];
  if(fold==="in")L=inbox.filter(m=>live(m)&&!m.done&&mineMsg(m));
  else if(fold==="star")L=inbox.filter(m=>live(m)&&stars.has(m.id));
  else if(fold==="mine")L=inbox.filter(m=>live(m)&&!m.done&&lc(m.assignee_email)===X.me);
  else if(fold==="done")L=inbox.filter(m=>live(m)&&m.done);
  else if(fold==="out")L=outbox.filter(r=>!r.deleted_at&&lc(r.author_email)===X.me).map(wrapOut);
  else if(fold==="draft")L=drafts.map(wrapDraft);
  else if(fold==="trash"){L=[...inbox.filter(m=>m.deleted_at),...outbox.filter(r=>r.deleted_at&&(X.ceo||lc(r.author_email)===X.me)).map(wrapOut)];L.sort((a,b)=>String(b.deleted_at).localeCompare(String(a.deleted_at)))}
  else if(fold==="orph")L=inbox.filter(m=>live(m)&&!m.done&&isOrph(m));
  else if(fold==="all")L=sub==="out"?outbox.filter(r=>!r.deleted_at).map(wrapOut):inbox.filter(live);
  else if(fold.startsWith("box:")){const b=boxes.find(x=>"box:"+x.id===fold);if(b){
    if(sub==="out")L=outbox.filter(r=>!r.deleted_at&&r.box_id===b.id).map(wrapOut);
    else L=inbox.filter(m=>live(m)&&m._t.has(b.addr)&&(sub==="done"?m.done:!m.done))}}
  return L}
function viewList(){
  let L=baseList();const k=lc(q);
  if(filt.un)L=L.filter(m=>!m._o&&!m._d&&!irds.has(m.id));
  if(filt.st)L=L.filter(m=>!m._o&&!m._d&&stars.has(m.id));
  if(filt.at)L=L.filter(m=>(m.attachments||[]).length);
  if(k)L=L.filter(m=>m._o?[m.to_email,m.cc_email,m.subject,m.sender_name,m.body].join(" ").toLowerCase().includes(k):m._d?[m.to_text,m.subject].join(" ").toLowerCase().includes(k):[m.from_addr,m.from_name,m.subject,m.preview,m.to_addrs].join(" ").toLowerCase().includes(k));
  return L}
const keyOf=m=>(m._o?"o:":m._d?"d:":"i:")+m.id;
function drawList(om){
  const bar=el("div",{className:"obar"});
  const all=el("input",{type:"checkbox",title:"모두 선택",ariaLabel:"모두 선택"});all.onchange=()=>{const L=viewList();all.checked?L.forEach(m=>picked.add(keyOf(m))):picked.clear();fillRows();bulk()};
  const sr=el("input",{type:"search",placeholder:"메일 검색 (보낸 사람·제목·내용)",value:q,ariaLabel:"메일 검색"});sr.oninput=()=>{q=sr.value;fillRows()};
  const chip=(k,t)=>{const c=el("button",{type:"button",className:"chip"+(filt[k]?" on":""),textContent:t});c.onclick=()=>{filt[k]=!filt[k];c.classList.toggle("on",filt[k]);fillRows()};return c};
  bar.append(all,btn("⟳","",()=>refresh(),"새로고침"),sr,chip("un","안 읽음"),chip("st","★ 별표"),chip("at","📎 첨부"));
  om.append(bar);
  const subs=fold.startsWith("box:")?[["open","받은 메일"],["done","완료"],["out","보낸 메일"]]:fold==="all"?[["open","받은 메일"],["out","보낸 메일"]]:null;
  if(subs){const sb=el("div",{className:"osub"});
    if(fold.startsWith("box:")){const b=boxes.find(x=>"box:"+x.id===fold);if(b)sb.append(el("span",{className:"obx",textContent:b.name+" · "+b.addr}),el("span",{className:"obm",textContent:"멤버 "+(bmem[b.id]||[]).map(nm).join(", ")||"-"}))}
    subs.forEach(([k,t])=>{const c=el("button",{type:"button",className:"chip"+(sub===k?" on":""),textContent:t});c.onclick=()=>{sub=k;picked.clear();render()};sb.append(c)});om.append(sb)}
  om.append(el("div",{id:"obulk",className:"selbar",hidden:true}),el("div",{id:"omlist",className:"omlist"}));
  fillRows();bulk()}
function fillRows(){
  const box=$("omlist");if(!box)return;box.replaceChildren();const L=viewList();
  if(fold==="trash"&&L.length){const eb=btn("🗑 휴지통 비우기 ("+L.length+")","danger",async()=>{if(!confirm("휴지통의 메일 "+L.length+"건을 영구 삭제할까요?\n되돌릴 수 없어요."))return;await purge(L);},"");eb.className+=" etb";box.append(eb)}
  L.forEach(m=>box.append(row(m)));
  if(!L.length)box.append(el("p",{className:"oempty",textContent:fold==="out"?"보낸 메일이 없어요.":fold==="trash"?"휴지통이 비어 있어요.":fold==="draft"?"임시보관함이 비어 있어요.":fold==="star"?"별표 표시한 메일이 없어요.":q||filt.un||filt.st||filt.at?"조건에 맞는 메일이 없어요.":"메일이 없어요."}));
  const all=document.querySelector(".obar input[type=checkbox]");if(all)all.checked=!!L.length&&L.every(m=>picked.has(keyOf(m)))}
function row(m){
  const k=keyOf(m),un=!m._o&&!m._d&&!irds.has(m.id),r=el("div",{className:"omi"+(un?" un":"")+(picked.has(k)?" pk":"")});
  const cb=el("input",{type:"checkbox",checked:picked.has(k),ariaLabel:"선택"});cb.onclick=e=>e.stopPropagation();cb.onchange=()=>{cb.checked?picked.add(k):picked.delete(k);r.classList.toggle("pk",cb.checked);bulk()};
  const st=el("button",{type:"button",className:"ostar"+(stars.has(m.id)?" on":""),textContent:stars.has(m.id)?"★":"☆",title:"별표",ariaLabel:"별표"});
  if(m._o||m._d)st.style.visibility="hidden";
  st.onclick=async e=>{e.stopPropagation();await toggleStar(m);st.classList.toggle("on",stars.has(m.id));st.textContent=stars.has(m.id)?"★":"☆"};
  let from,subj,pv,extra=[];
  if(m._d){from="임시저장 · "+(m.to_text||"(받는 사람 없음)");subj=m.subject||"(제목 없음)";pv=txtOf(m.body_html).slice(0,120);extra=[el("span",{className:"cp",textContent:"임시"})]}
  else if(m._o){from="→ "+m.to_email;subj=m.subject||"(제목 없음)";pv=(m.body||"").replace(/\s+/g," ").slice(0,120);extra=[el("span",{className:"cp "+(m.opened_at?"ok":""),textContent:m.opened_at?"읽음":"안 읽음"})]}
  else{from=m.from_name||m.from_addr;subj=m.subject||"(제목 없음)";pv=m.preview||"";
    const bs=boxesOf(m);if(fold==="all"||fold==="in"||fold==="star"||fold==="trash"||fold==="done"||fold==="mine"){bs.forEach(b=>extra.push(el("span",{className:"cp bx",textContent:b.name,title:b.addr})))}
    if(fold==="all"&&!mineMsg(m)&&!bs.length){const sa=X.staff.find(x=>m._t.has(lc(x.email)));extra.push(el("span",{className:"cp",textContent:sa?"→ "+nm(sa.email):"미분류"}))}
    if(m.assignee_email)extra.push(el("span",{className:"cp as",textContent:"담당 "+nm(m.assignee_email)}))}
  if((m.attachments||[]).length)extra.push(el("span",{className:"cp",textContent:"📎"}));
  r.append(cb,st,el("span",{className:"fr1",textContent:from}),el("span",{className:"sjl"},[el("b",{textContent:subj}),el("span",{className:"pv2",textContent:pv?" — "+pv:""})]),el("span",{className:"chips1"},extra),el("span",{className:"dd",textContent:fmt(m._d?m.updated_at:m._o?m.created_at:m.received_at)}));
  r.onclick=()=>open(m);return r}
const txtOf=h=>{try{return new DOMParser().parseFromString(h||"","text/html").body.textContent.replace(/\s+/g," ").trim()}catch(_){return""}};
async function toggleStar(m){const on=stars.has(m.id);
  if(on){const {error}=await db.from("mail_stars").delete().eq("msg_id",m.id).eq("email",X.me);if(error)return alert("별표를 바꾸지 못했어요");stars.delete(m.id)}
  else{const {error}=await db.from("mail_stars").insert({msg_id:m.id,email:X.me});if(error)return alert("별표를 바꾸지 못했어요");stars.add(m.id)}}

/* 선택한 여러 통에 한꺼번에 */
function sel(){const L=baseList(),by=new Map(L.map(m=>[keyOf(m),m]));return[...picked].map(k=>by.get(k)).filter(Boolean)}
function bulk(){
  const b=$("obulk");if(!b)return;const S=sel();b.hidden=!S.length;if(!S.length)return;b.replaceChildren();
  const ins=S.filter(m=>!m._o&&!m._d),outs=S.filter(m=>m._o),drs=S.filter(m=>m._d);
  const run=(fn)=>async()=>{await fn();picked.clear();await load();render()};
  const now=()=>new Date().toISOString();
  b.append(el("span",{className:"note",textContent:S.length+"개 선택"}));
  if(fold==="trash"){
    b.append(btn("↩ 복원","p",run(async()=>{await Promise.all([ins.length?db.from("inbox_messages").update({deleted_at:null,deleted_by:null}).in("id",ins.map(x=>x.id)):null,...outs.map(x=>db.rpc("outbox_set_deleted",{p_id:x.id,p_del:false}))])})),
      btn("영구 삭제","danger",()=>purge(S)));
  }else if(fold==="draft"){
    b.append(btn("🗑 삭제","danger",run(async()=>{await db.from("mail_drafts").delete().in("id",drs.map(x=>x.id))})));
  }else{
    if(ins.length){
      b.append(btn("읽음","",run(async()=>{await db.from("inbox_reads").upsert(ins.map(x=>({msg_id:x.id,email:X.me})),{onConflict:"msg_id,email",ignoreDuplicates:true})})),
        btn("안 읽음","",run(async()=>{await db.from("inbox_reads").delete().in("msg_id",ins.map(x=>x.id)).eq("email",X.me)})),
        btn(fold==="done"?"완료 취소":"✓ 완료","",run(async()=>{await db.from("inbox_messages").update({done:fold!=="done"}).in("id",ins.map(x=>x.id))})),
        btn("★ 별표","",run(async()=>{const add=ins.filter(x=>!stars.has(x.id));if(add.length)await db.from("mail_stars").insert(add.map(x=>({msg_id:x.id,email:X.me})))})));}
    b.append(btn("🗑 삭제","danger",run(async()=>{await Promise.all([ins.length?db.from("inbox_messages").update({deleted_at:now(),deleted_by:X.me}).in("id",ins.map(x=>x.id)):null,...outs.map(x=>db.rpc("outbox_set_deleted",{p_id:x.id,p_del:true}))])})));
  }
  b.append(btn("선택 해제","",()=>{picked.clear();fillRows();bulk()}))}
async function purge(S){
  const ii=S.filter(m=>!m._o&&!m._d).map(m=>m.id),oo=S.filter(m=>m._o).map(m=>m.id);
  if(!confirm("선택한 "+(ii.length+oo.length)+"건을 영구 삭제할까요?\n되돌릴 수 없어요."))return;
  const [e1,e2]=await Promise.all([ii.length?db.rpc("inbox_purge",{p_ids:ii}):{},oo.length?db.rpc("outbox_purge",{p_ids:oo}):{}]);
  if(e1.error||e2.error)alert("일부를 지우지 못했어요");picked.clear();selId=null;await load();render();loadUsage()}

/* 받은 메일 본문 틀 — 스크립트는 못 돌리고(sandbox), 링크는 새 탭으로, 높이는 내용에 맞춰요 */
const escH=t=>String(t==null?"":t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
function cleanHtml(h){try{const d=new DOMParser().parseFromString(String(h),"text/html");
  d.querySelectorAll("script,iframe,object,embed,form,base,link,meta[http-equiv],noscript").forEach(n=>n.remove());
  d.querySelectorAll("a[href]").forEach(a=>{a.setAttribute("target","_blank");a.setAttribute("rel","noopener noreferrer")});
  return d.head.innerHTML.replace(/<title[\s\S]*?<\/title>/gi,"")+d.body.innerHTML}catch(_){return escH(h)}}
function mailFrame(html,text,minH){
  const f=document.createElement("iframe");f.setAttribute("sandbox","allow-same-origin allow-popups allow-popups-to-escape-sandbox");f.className="mfrm2";
  const inner=html?cleanHtml(html):'<div style="white-space:pre-wrap">'+escH(text)+"</div>";
  f.srcdoc='<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src https: data: cid:; style-src \'unsafe-inline\'"><base target="_blank"><body style="font:14px/1.65 -apple-system,Pretendard,\'Noto Sans KR\',sans-serif;margin:14px 18px;color:#2a2620;word-break:break-word">'+inner;
  f.onload=()=>{const fit=()=>{try{f.style.height=Math.max(minH||260,f.contentDocument.documentElement.scrollHeight+4)+"px"}catch(_){}};fit();try{new ResizeObserver(fit).observe(f.contentDocument.documentElement)}catch(_){}};
  return f}

/* ───────── 열기 ───────── */
async function open(m){
  picked.clear();
  if(m._d){const d=drafts.find(x=>x.id===m.id);if(d)openCompose({draft:d});return}
  selId=m.id;selKind=m._o?"out":"in";mode="read";
  if(!m._o&&!irds.has(m.id)){irds.add(m.id);title();db.from("inbox_reads").upsert({msg_id:m.id,email:X.me},{onConflict:"msg_id,email",ignoreDuplicates:true})}
  render()}
const back=()=>{const b=el("button",{className:"bk",type:"button",title:"목록으로"},[el("span",{textContent:"‹ 목록"})]);b.onclick=()=>{mode="list";selId=null;render()};return b};
function drawRead(om){
  const p=el("div",{className:"orp"});om.append(p);p.append(back());
  if(selKind==="out"){const r=outbox.find(x=>x.id===selId);if(!r){mode="list";return render()}return readOut(p,r)}
  const m=inbox.find(x=>x.id===selId);if(!m){mode="list";return render()}readIn(p,m)}
function cpTo(m){const my=new Set(X.myAddrs);boxes.forEach(b=>my.add(b.addr));
  const to=[m.from_addr],cc=[];const seen=new Set([lc(m.from_addr)]);
  tok(m.to_addrs).forEach(a=>{if(!my.has(a)&&!seen.has(a)){seen.add(a);((m.cc_addrs&&tok(m.cc_addrs).includes(a))?cc:to).push(a)}});
  return{to:to.join(", "),cc:cc.join(", ")}}
function quoteOf(raw){let t=String(raw||"").replace(/\r\n/g,"\n").trim();
  const i=t.search(/\n[^\n]*(wrote:|작성:)\s*(\n|$)|\n>|\n-{3,} ?(Original|원본|Forwarded)/i);if(i>0)t=t.slice(0,i);
  t=t.split("\n").filter(l=>!/^\s*\[image:.*\]/i.test(l)&&!/^\s*(RIF STUDIO|PANGYO\s*[•·\/].*|rif-studio\.com|https?:\/\/rif-studio\.com\/?)\s*$/i.test(l)&&!/^\s*--\s*$/.test(l)).join("\n");
  t=t.replace(/<https?:\/\/[^>\s]+>/g,"").replace(/\n{3,}/g,"\n\n").trim();return t.length>1500?t.slice(0,1500).trim()+" …":t}
function fromFor(m){const bs=boxesOf(m);if(bs.length&&!mineMsg(m))return"box:"+bs[0].id;return mineMsg(m)?"me":(bs.length?"box:"+bs[0].id:"me")}
function readIn(p,m){
  const acts=el("div",{className:"acts"});
  const bs=boxesOf(m);
  p.append(el("h2",{className:"eh",textContent:m.subject||"(제목 없음)"}),
    el("div",{className:"who"},[el("div",{className:"ci",textContent:ini(m.from_name||m.from_addr)}),el("div",{className:"wi"},[el("b",{textContent:(m.from_name?m.from_name+" ":"")+"<"+m.from_addr+">"}),
      el("span",{textContent:"받는 사람: "+(m.to_addrs||"-")+(m.cc_addrs?" · 참조: "+m.cc_addrs:"")+" · "+ftl(m.received_at),title:"받는 사람: "+(m.to_addrs||"-")+(m.cc_addrs?"\n참조: "+m.cc_addrs:"")})])]),
    ...(bs.length?[el("div",{className:"note",textContent:"공용 메일함: "+bs.map(b=>b.name).join(", ")+" · 멤버는 모두 이 메일을 볼 수 있어요"})]:[]),acts);
  const bodyBox=el("div",{className:"obody"});
  const show=data=>{bodyBox.replaceChildren();
    bodyBox.append(mailFrame(data.body_html,data.body_text));
    if((m.attachments||[]).length)bodyBox.prepend(el("div",{className:"atl"},m.attachments.map((x,i)=>{const b=el("button",{type:"button",className:"atb",textContent:"📎 "+x.filename+(x.size?" ("+mbyte(x.size)+")":"")});
      b.onclick=async()=>{b.disabled=true;const {data:d,error}=await db.functions.invoke("mail-file",{body:{inbox_id:m.id,index:i}});b.disabled=false;if(error||!d||!d.url)return alert("파일을 가져오지 못했어요"+(d&&d.error?": "+d.error:""));window.open(d.url,"_blank","noopener")};return b})))};
  const id0=m.id;
  const go1=async()=>{if(bodies[id0])return bodies[id0];bodyBox.textContent="불러오는 중…";
    const {data,error}=await db.from("inbox_messages").select("body_text,body_html").eq("id",id0).single();
    if(error||!data){bodyBox.textContent="본문을 불러오지 못했어요";return null}bodies[id0]=data;return data};
  const upd=async(patch,msg)=>{const {error}=await db.from("inbox_messages").update(patch).eq("id",m.id);if(error)return alert((msg||"바꾸지 못했어요"));Object.assign(m,patch);return true};
  if(m.deleted_at){
    acts.append(btn("↩ 복원","p",async()=>{if(await upd({deleted_at:null,deleted_by:null},"복원하지 못했어요")){mode="list";await load();render()}}),
      btn("영구 삭제","danger",async()=>{if(!confirm("이 메일을 영구 삭제할까요? 되돌릴 수 없어요."))return;const {error}=await db.rpc("inbox_purge",{p_ids:[m.id]});if(error)return alert("삭제하지 못했어요");mode="list";selId=null;await load();render();loadUsage()}))}
  else{
    const reply=(all)=>async()=>{const d=await go1();if(!d)return;const t=all?cpTo(m):{to:m.from_addr,cc:""};
      openCompose({as:fromFor(m),inbox:m.id,to:t.to,cc:t.cc,subject:/^re:/i.test(m.subject||"")?m.subject:"Re: "+(m.subject||""),quote:{head:ftl(m.received_at)+" · "+(m.from_name||m.from_addr)+" 님이 보냄",text:quoteOf(d.body_text).replace(/\n{2,}/g,"\n")}})};
    const fwd=async()=>{const d=await go1();if(!d)return;
      openCompose({as:fromFor(m),to:"",subject:/^(fwd?|전달):/i.test(m.subject||"")?m.subject:"Fwd: "+(m.subject||""),quote:{head:"전달된 메일 · 보낸 사람 "+(m.from_name?m.from_name+" ":"")+"<"+m.from_addr+"> · "+ftl(m.received_at)+" · 제목 "+(m.subject||"")+" · 받는 사람 "+(m.to_addrs||""),text:quoteOf(d.body_text).replace(/\n{2,}/g,"\n")},fwdNote:(m.attachments||[]).length?"원본의 첨부파일은 전달되지 않아요. 필요하면 직접 첨부해 주세요.":""})};
    acts.append(btn("↩ 답장","p",reply(false)));
    if(tok(m.to_addrs).length+tok(m.cc_addrs).length>1)acts.append(btn("↩↩ 전체 답장","",reply(true)));
    acts.append(btn("→ 전달","",fwd),btn(m.done?"완료 취소":"✓ 완료 처리","",async()=>{if(await upd({done:!m.done})){mode="list";selId=null;await load();render()}}));
    const star=btn(stars.has(m.id)?"★ 별표 해제":"☆ 별표","",async()=>{await toggleStar(m);star.textContent=stars.has(m.id)?"★ 별표 해제":"☆ 별표"});acts.append(star);
    const as=el("select",{title:"담당자",ariaLabel:"담당자"},[el("option",{value:"",textContent:"담당자 미지정"}),...X.staff.map(x=>el("option",{value:x.email,textContent:"담당 "+(x.name||x.email),selected:lc(x.email)===lc(m.assignee_email)}))]);
    as.onchange=async()=>{if(await upd({assignee_email:as.value})){drawFolders()}};acts.append(as);
    acts.append(btn("📌 업무로","",async()=>{const who=m.assignee_email||X.me;const {error}=await db.from("intra_tasks").insert({title:("[메일] "+(m.subject||"(제목 없음)")).slice(0,200),detail:"보낸 사람: "+(m.from_name?m.from_name+" ":"")+"<"+m.from_addr+">\n받은 날짜: "+ftl(m.received_at)+"\n\n"+(m.preview||""),assignee_email:who,assignee_name:nm(who),due:null,created_by:X.me,created_by_name:X.myName});
      if(error)return alert("업무로 만들지 못했어요");X.toast("업무 탭에 추가했어요 ✓");X.afterTask()},"이 메일로 업무 만들기"),
      btn("안 읽음으로","",()=>{irds.delete(m.id);db.from("inbox_reads").delete().eq("msg_id",m.id).eq("email",X.me).then(()=>{mode="list";selId=null;title();render()})}),
      btn("🗑 삭제","danger",async()=>{if(await upd({deleted_at:new Date().toISOString(),deleted_by:X.me},"삭제하지 못했어요")){mode="list";selId=null;await load();render()}}))}
  if(isMgmt()){const rb=el("span",{className:"note",textContent:"읽은 사람: 불러오는 중…"});acts.append(rb);
    db.from("inbox_reads").select("email").eq("msg_id",m.id).then(({data})=>{rb.textContent="읽은 사람: "+((data||[]).map(r=>nm(r.email)).join(", ")||"아직 없어요")})}
  p.append(bodyBox);
  go1().then(d=>{if(d&&selId===id0&&mode==="read")show(d)});
  noteBox(p,m);related(p,m)}
function noteBox(p,m){
  const w=el("section",{className:"nts"},[el("h3",{textContent:"내부 메모"}),el("p",{className:"note",textContent:"이 메일을 볼 수 있는 사원끼리만 보여요. 보낸 사람에게는 가지 않아요."})]);
  const list=el("div",{className:"ntl"}),ta=el("textarea",{rows:2,maxLength:2000,placeholder:"예) 견적 보냄 · 내일 전화 예정"}),msg=el("span",{className:"note"});
  const draw=()=>{list.replaceChildren(...(notes[m.id]||[]).map(n=>{const x=el("button",{type:"button",className:"atx",textContent:"✕",title:"지우기"});
    x.onclick=async()=>{const {error}=await db.from("mail_notes").delete().eq("id",n.id);if(error)return;notes[m.id]=notes[m.id].filter(z=>z.id!==n.id);draw()};
    return el("div",{className:"nt"},[el("b",{textContent:n.author_name||nm(n.author_email)}),el("span",{className:"note",textContent:" · "+ftl(n.created_at)}),...(lc(n.author_email)===X.me||X.ceo?[x]:[]),el("div",{className:"ntb",textContent:n.body})])}))};
  const sv=btn("메모 남기기","",async()=>{const b=ta.value.trim();if(!b)return;sv.disabled=true;const row={msg_id:m.id,author_email:X.me,author_name:X.myName,body:b};
    const {error}=await db.from("mail_notes").insert(row);sv.disabled=false;if(error){msg.className="note err";msg.textContent="저장하지 못했어요";return}
    ta.value="";msg.textContent="";const {data}=await db.from("mail_notes").select("id,author_email,author_name,body,created_at").eq("msg_id",m.id).order("created_at");notes[m.id]=data||[];draw()});
  w.append(list,ta,el("div",{className:"jbar"},[sv,msg]));p.append(w);
  db.from("mail_notes").select("id,author_email,author_name,body,created_at").eq("msg_id",m.id).order("created_at").then(({data})=>{notes[m.id]=data||[];draw()})}
function related(p,m){
  const k=normSub(m.subject);if(!k)return;
  const rel=[...inbox.filter(x=>x.id!==m.id&&!x.deleted_at&&normSub(x.subject)===k).map(x=>({t:x.received_at,k:"in",x})),...outbox.filter(x=>!x.deleted_at&&normSub(x.subject)===k&&(lc(x.author_email)===X.me||X.ceo||(x.box_id&&boxes.some(b=>b.id===x.box_id)))).map(x=>({t:x.created_at,k:"out",x}))].sort((a,b)=>new Date(b.t)-new Date(a.t)).slice(0,12);
  if(!rel.length)return;
  p.append(el("section",{className:"nts"},[el("h3",{textContent:"같은 제목의 메일 "+rel.length+"건"}),...rel.map(r=>{const d=el("div",{className:"rel"},[el("span",{className:"cp "+(r.k==="out"?"ok":""),textContent:r.k==="out"?"보냄":"받음"}),el("span",{className:"rwho",textContent:r.k==="out"?"→ "+r.x.to_email:(r.x.from_name||r.x.from_addr)}),el("span",{className:"rpv",textContent:r.k==="out"?(r.x.body||"").replace(/\s+/g," ").slice(0,90):(r.x.preview||"")}),el("span",{className:"dd",textContent:fmt(r.t)})]);
    d.onclick=()=>{selId=r.x.id;selKind=r.k;mode="read";if(r.k==="in"&&!irds.has(r.x.id)){irds.add(r.x.id);db.from("inbox_reads").upsert({msg_id:r.x.id,email:X.me},{onConflict:"msg_id,email",ignoreDuplicates:true})}render()};return d})]))}
function readOut(p,r){
  const acts=el("div",{className:"acts"}),canDel=X.ceo||lc(r.author_email)===X.me,obody=el("div",{className:"obody otxt",textContent:r.body});
  p.append(el("h2",{className:"eh",textContent:r.subject}),
    el("div",{className:"who"},[el("div",{className:"ci",textContent:ini(r.sender_name||r.sender)}),el("div",{className:"wi"},[el("b",{textContent:(r.sender_name||r.sender)+" <"+r.sender+">"}),el("span",{textContent:"받는 사람: "+r.to_email+(r.cc_email?" · 참조: "+r.cc_email:"")+" · "+ftl(r.created_at)+(r.author_name&&lc(r.sender)!==X.me?" · 작성: "+r.author_name:"")})])]),acts);
  acts.append(el("span",{className:"rb "+(r.opened_at?"on":"off"),textContent:r.opened_at?"읽음":"안 읽음"}),...(r.opened_at?[el("span",{className:"note",textContent:ftl(r.opened_at)+(r.open_count>1?" · "+r.open_count+"회":"")})]:[]),
    btn("다시 보내기","",()=>openCompose({as:r.box_id?"box:"+r.box_id:"me",to:r.to_email,cc:r.cc_email||"",subject:r.subject,text:r.body})),
    btn("→ 전달","",()=>openCompose({as:r.box_id?"box:"+r.box_id:"me",to:"",subject:/^(fwd?|전달):/i.test(r.subject)?r.subject:"Fwd: "+r.subject,quote:{head:"전달된 메일 · "+ftl(r.created_at)+" · 보낸 사람 "+r.sender+" · 받는 사람 "+r.to_email,text:r.body}})));
  if(canDel){if(r.deleted_at)acts.append(btn("↩ 복원","p",async()=>{const {error}=await db.rpc("outbox_set_deleted",{p_id:r.id,p_del:false});if(error)return alert("복원하지 못했어요");mode="list";await load();render()}),
      btn("영구 삭제","danger",async()=>{if(!confirm("이 메일을 영구 삭제할까요? 되돌릴 수 없어요."))return;const {error}=await db.rpc("outbox_purge",{p_ids:[r.id]});if(error)return alert("삭제하지 못했어요");mode="list";await load();render();loadUsage()}));
    else acts.append(btn("🗑 삭제","danger",async()=>{const {error}=await db.rpc("outbox_set_deleted",{p_id:r.id,p_del:true});if(error)return alert("삭제하지 못했어요");mode="list";await load();render()}))}
  if((r.attachments||[]).length)p.append(el("div",{className:"atl"},r.attachments.map(x=>el("span",{className:"atb",textContent:"📎 "+x.filename+(x.size?" ("+mbyte(x.size)+")":"")}))));
  p.append(obody);
  const sid=r.id;db.from("mail_outbox").select("body_html").eq("id",sid).single().then(({data})=>{if(data&&data.body_html&&selId===sid&&mode==="read")obody.replaceWith(mailFrame(data.body_html,"",200))})}

/* ───────── 새 메일 / 답장 / 전달 ───────── */
function cleanTable(h){try{const doc=new DOMParser().parseFromString(h,"text/html"),rules={};
  [...doc.querySelectorAll("style")].forEach(st=>{String(st.textContent).replace(/\.([\w-]+)\s*\{([^}]*)\}/g,(_,c,d)=>{rules[c]=(rules[c]||"")+d+";"})});
  const esc=t=>t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const sty=cell=>{const d=((cell.className||"").split(/\s+/).map(c=>rules[c]||"").join(";"))+";"+(cell.getAttribute("style")||"");const o={};
    d.split(";").forEach(x=>{const i=x.indexOf(":");if(i<0)return;const k=x.slice(0,i).trim().toLowerCase(),v=x.slice(i+1).trim().replace(/\s*!important/,"");
      if((k==="background"||k==="background-color"||k==="color")&&/^(#[0-9a-f]{3,8}|rgb\([\d\s,]+\))$/i.test(v)&&!/^#?(fff|ffffff)$/i.test(v.replace("#","")))o[k==="color"?"color":"background-color"]=v;
      else if(k==="font-weight"&&(v==="bold"||Number(v)>=600))o["font-weight"]="700";
      else if(k==="font-style"&&v==="italic")o["font-style"]="italic";
      else if(k==="text-align"&&/^(left|center|right)$/.test(v))o["text-align"]=v});
    return Object.entries(o).map(([k,v])=>k+":"+v).join(";")};
  const tbs=[...doc.querySelectorAll("table")].filter(t=>!t.parentElement.closest("table"));if(!tbs.length)return"";
  return tbs.map(t=>{const rows=[...t.querySelectorAll("tr")].filter(r=>r.closest("table")===t).map(r=>"<tr>"+[...r.children].filter(c=>/^t[dh]$/i.test(c.tagName)).map(c=>{
      const cs=Math.min(99,Number(c.getAttribute("colspan"))||1),rs=Math.min(99,Number(c.getAttribute("rowspan"))||1),txt=esc((c.textContent||"").replace(/ /g," ").replace(/[ \t]+/g," ").trim()).replace(/\r?\n/g,"<br>");
      return "<td"+(cs>1?' colspan="'+cs+'"':"")+(rs>1?' rowspan="'+rs+'"':"")+' style="border:1px solid #999;padding:4px 10px;'+sty(c)+'">'+txt+"</td>"}).join("")+"</tr>").join("");
    return '<table style="border-collapse:collapse;margin:6px 0"><tbody>'+rows+"</tbody></table>"}).join("<br>")}catch(_){return""}}
/* 임시보관함에서 불러온 HTML 을 안전하게 (스크립트·이벤트 속성 제거) */
function safeHtml(h){try{const d=new DOMParser().parseFromString(String(h||""),"text/html");d.querySelectorAll("script,style,iframe,object,embed,link,meta,form,input,button,svg,math").forEach(n=>n.remove());
  d.querySelectorAll("*").forEach(n=>{[...n.attributes].forEach(a=>{const k=a.name.toLowerCase();if(k.startsWith("on")||(/^(href|src|xlink:href|action|formaction)$/.test(k)&&/^\s*(javascript|data|vbscript):/i.test(a.value)))n.removeAttribute(a.name)})});return d.body.innerHTML}catch(_){return""}}
function openCompose(init){
  compose={id:init.draft?init.draft.id:null,as:init.as||"me",to:"",cc:"",bcc:"",subject:"",html:"",inbox:init.inbox||null,quote:init.quote||null,text:init.text||"",fwdNote:init.fwdNote||"",files:[],dirty:false,...(init.draft?{as:init.draft.from_as||"me",to:init.draft.to_text,cc:init.draft.cc_text,bcc:init.draft.bcc_text,subject:init.draft.subject,html:init.draft.body_html,inbox:init.draft.inbox_id||null}:{}),
    ...(init.draft?{}:{to:init.to||"",cc:init.cc||"",bcc:"",subject:init.subject||""})};
  mode="compose";fold=fold;render()}
function drawCompose(om){
  const c=compose,p=el("div",{className:"orp"});om.append(p);
  const bk=back();bk.onclick=async()=>{await saveDraft(true);compose=null;mode="list";await load();render()};p.append(bk);
  p.append(el("h2",{className:"eh",textContent:c.inbox?(/^re:/i.test(c.subject)?"답장":"메일 쓰기"):/^fwd:/i.test(c.subject)?"전달":"새 메일"}));
  const opts=[el("option",{value:"me",textContent:"내 메일 ("+X.sendAs+") · 개인 서명 포함",selected:c.as==="me"}),...boxes.map(b=>el("option",{value:"box:"+b.id,textContent:b.name+" ("+b.addr+") · 공용 · 개인 서명 없음",selected:c.as==="box:"+b.id}))];
  const fromSel=el("select",{ariaLabel:"보내는 사람"},opts);if(![...fromSel.options].some(o=>o.value===c.as))c.as="me",fromSel.value="me";
  const mkIn=(v,ph)=>el("input",{value:v||"",placeholder:ph,autocomplete:"off",spellcheck:false});
  const to=mkIn(c.to,"name@example.com (쉼표로 여러 명 · 이름이나 주소를 치면 후보가 나와요)"),cc=mkIn(c.cc,"참조 (함께 알려야 하는 사람)"),bcc=mkIn(c.bcc,"숨은 참조 (받는 사람에게 보이지 않아요)"),sj=el("input",{value:c.subject||"",maxLength:200,placeholder:"제목"});
  const bd=el("div",{className:"rte",contentEditable:"true",ariaLabel:"본문"});
  if(c.html)bd.innerHTML=safeHtml(c.html);
  else if(c.quote){const mk=(t,st,tx)=>{const e=document.createElement(t);if(st)e.setAttribute("style",st);if(tx!=null)e.textContent=tx;return e};
    const f=mk("div",null,"");f.append(document.createElement("br"));const f2=mk("div",null,"");f2.append(document.createElement("br"));
    const bq=mk("blockquote","margin:14px 0 0;padding:4px 0 4px 14px;border-left:3px solid #ff3d6e;color:#6b6975");bq.append(mk("div","font-size:12px;margin-bottom:6px",c.quote.head));
    c.quote.text.split("\n").forEach(l=>{const d=document.createElement("div");if(l.trim())d.textContent=l;else d.append(document.createElement("br"));bq.append(d)});bd.append(f,f2,bq)}
  else bd.textContent=c.text||"";
  const rowOf=(label,inp,extra)=>el("div",{className:"crow"},[el("label",{textContent:label}),el("div",{className:"cin"},[inp]),...(extra?[extra]:[])]);
  const rCc=rowOf("참조",cc),rBcc=rowOf("숨은 참조",bcc);rCc.hidden=!c.cc;rBcc.hidden=!c.bcc;
  const tg=el("span",{className:"ctg"},[(()=>{const b=el("button",{type:"button",className:"lnk",textContent:"참조"});b.onclick=()=>{rCc.hidden=!rCc.hidden;if(!rCc.hidden)cc.focus()};return b})(),(()=>{const b=el("button",{type:"button",className:"lnk",textContent:"숨은 참조"});b.onclick=()=>{rBcc.hidden=!rBcc.hidden;if(!rBcc.hidden)bcc.focus()};return b})()]);
  const rTo=rowOf("받는 사람",to,tg);
  [to,cc,bcc].forEach(suggest);
  /* 서명 미리보기 */
  const sigBox=el("div",{className:"sgp"}),esc2=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const drawSig=()=>{const mine=fromSel.value==="me",b=boxes.find(x=>"box:"+x.id===fromSel.value);
    const brand='<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tr><td style="padding:0 14px 0 0;vertical-align:middle"><img src="../img/logo-square.png" width="76" height="76" style="display:block;width:76px;height:76px"></td><td style="vertical-align:middle;line-height:1.4"><div style="font-size:20px;font-weight:700;letter-spacing:3px">RIF STUDIO</div><div style="font-size:11px;letter-spacing:2px;color:#7a7783;margin-top:6px">PANGYO • TOKYO • NEW YORK</div><div style="font-size:12px;margin-top:6px;color:#7c5cd6">rif-studio.com</div></td></tr></table>';
    const sg=X.mySig,own=mine?(sg.html?'<div style="margin-top:16px">'+sg.html+'</div>':(sg.text||X.myName?'<div style="font-size:14px;margin-top:14px">'+esc2(sg.text||X.myName).replace(/\n/g,"<br>")+"</div>":"")):"";
    const fr=document.createElement("iframe");fr.setAttribute("sandbox","allow-same-origin");fr.title="서명 미리보기";
    fr.srcdoc='<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src https: data: *; style-src \'unsafe-inline\'"><base href="'+location.href.replace(/[^/]*$/,"")+'"><body style="margin:12px 16px;font:14px/1.6 sans-serif;color:#2a2620">'+brand+own;
    fr.onload=()=>{try{fr.style.height=fr.contentDocument.documentElement.scrollHeight+4+"px"}catch(_){}};
    sigBox.replaceChildren(el("div",{className:"sgh"},[el("b",{textContent:"✉ 이렇게 나가요 (예시)"}),el("span",{textContent:mine?"본문 맨 아래에 로고 + 내 서명이 자동으로 붙어요. 제목 앞에는 [RIF STUDIO]가 붙어요.":(b?b.name+" ("+b.addr+") 이름으로 나가요. ":"")+"공용 메일은 개인 서명 없이 RIF STUDIO 로고만 붙고, 제목에 [RIF STUDIO]가 붙지 않아요."}),...(mine&&!sg.html&&!sg.text?[el("a",{href:"../mail/",target:"_blank",textContent:"서명 설정하기 ↗"})]:[])]),fr)};
  fromSel.onchange=drawSig;drawSig();
  /* 첨부 */
  const files=c.files,MAXB=10*1024*1024,afl=el("div",{className:"atl"}),fi=el("input",{type:"file",multiple:true,hidden:true}),msgx=el("span",{className:"note"});
  const drawF=()=>{afl.replaceChildren(...files.map((f,i)=>{const x=el("button",{type:"button",className:"atx",textContent:"✕",title:"빼기"});x.onclick=()=>{files.splice(i,1);drawF()};return el("span",{className:"atb"},[document.createTextNode("📎 "+f.name+" ("+mbyte(f.size)+") "),x])}))};
  const addF=list=>{for(const f of list){if(files.length>=10){msgx.className="note err";msgx.textContent="첨부는 최대 10개까지예요.";break}
    if(files.reduce((a,x)=>a+x.size,0)+f.size>MAXB){msgx.className="note err";msgx.textContent="첨부 합계는 10MB까지예요: "+f.name;continue}files.push(f)}drawF()};
  fi.onchange=()=>{addF([...fi.files]);fi.value=""};drawF();
  bd.addEventListener("dragover",e=>{if(e.dataTransfer&&[...e.dataTransfer.types].includes("Files"))e.preventDefault()});
  bd.addEventListener("drop",e=>{if(e.dataTransfer&&e.dataTransfer.files.length){e.preventDefault();addF([...e.dataTransfer.files])}});
  bd.addEventListener("paste",e=>{const cd=e.clipboardData;if(!cd)return;
    if(cd.files&&cd.files.length&&!cd.getData("text/plain")){e.preventDefault();addF([...cd.files]);return}
    const h=cd.getData("text/html");if(h&&/<table/i.test(h)){const t=cleanTable(h);if(t){e.preventDefault();document.execCommand("insertHTML",false,t+"<br>");return}}
    const tx=cd.getData("text/plain");if(tx){e.preventDefault();document.execCommand("insertText",false,tx)}});
  /* 상용구 */
  const tp=el("select",{ariaLabel:"상용구",className:"ctpl"},[el("option",{value:"",textContent:"상용구 넣기 ▾"}),...tpls.map(t=>el("option",{value:t.id,textContent:(t.shared?"공용 · ":"내 것 · ")+t.title}))]);
  tp.onchange=()=>{const t=tpls.find(x=>x.id===tp.value);tp.value="";if(!t)return;if(!sj.value.trim()&&t.subject)sj.value=t.subject;bd.focus();document.execCommand("insertText",false,t.body);touch()};
  const ab=btn("📎 파일 첨부","",()=>fi.click());
  const doneAfter=el("input",{type:"checkbox",checked:!!c.inbox});const dl=el("label",{className:"ck3 cdone"},[doneAfter,document.createTextNode(" 보낸 뒤 이 메일을 완료 처리")]);dl.hidden=!c.inbox;
  /* 임시 저장 */
  let tmr=null;const touch=()=>{c.dirty=true;clearTimeout(tmr);tmr=setTimeout(()=>saveDraft(false),2500)};
  [to,cc,bcc,sj].forEach(i=>i.addEventListener("input",touch));bd.addEventListener("input",touch);fromSel.addEventListener("change",touch);
  const collect=()=>{c.as=fromSel.value;c.to=to.value;c.cc=cc.value;c.bcc=bcc.value;c.subject=sj.value;c.html=bd.innerHTML};
  const st=el("span",{className:"note"});
  async function saveDraft(final){collect();clearTimeout(tmr);
    const empty=!c.to.trim()&&!c.cc.trim()&&!c.subject.trim()&&!bd.innerText.trim();
    if(empty){if(c.id&&final){await db.from("mail_drafts").delete().eq("id",c.id);c.id=null}return}
    if(!c.dirty&&c.id)return;
    if(!c.id)c.id=(crypto.randomUUID?crypto.randomUUID():"d"+Date.now());
    const {error}=await db.from("mail_drafts").upsert({id:c.id,owner_email:X.me,from_as:c.as,to_text:c.to,cc_text:c.cc,bcc_text:c.bcc,subject:c.subject,body_html:c.html.slice(0,290000),inbox_id:c.inbox||null,updated_at:new Date().toISOString()});
    if(!error){c.dirty=false;st.className="note";st.textContent="임시보관함에 저장됨 "+new Date().toLocaleTimeString("ko-KR",{hour:"numeric",minute:"2-digit"})}}
  c.save=saveDraft;
  const send=btn("보내기","p",null),sv=btn("임시 저장","",async()=>{c.dirty=true;await saveDraft(false);if(!st.textContent)st.textContent="저장할 내용이 없어요"}),
    ds=btn("초안 삭제","danger",async()=>{if(!confirm("이 메일 쓰기를 취소하고 지울까요?"))return;if(c.id)await db.from("mail_drafts").delete().eq("id",c.id);compose=null;mode="list";await load();render()});
  send.className="btn";
  send.onclick=async()=>{collect();const t=c.to.trim(),s=c.subject.trim(),b=bd.innerText.trim(),hasT=!!bd.querySelector("table,blockquote");
    if(!t||!s||!b){msgx.className="note err";msgx.textContent="받는 사람·제목·내용을 모두 써 주세요.";return}
    const who=[t,c.cc.trim()&&"(참조) "+c.cc.trim(),c.bcc.trim()&&"(숨은 참조) "+c.bcc.trim()].filter(Boolean).join("\n");
    if(!confirm(who+"\n\n위 주소로 메일을 보낼까요?"+(files.length?"\n첨부파일 "+files.length+"개 포함":"")+"\n보낸 뒤에는 취소할 수 없어요."))return;
    send.disabled=true;msgx.className="note";msgx.textContent="보내는 중…";let ok=false,m2="";
    try{const attachments=await Promise.all(files.map(f=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res({filename:f.name,content:String(r.result).split(",")[1]||""});r.onerror=rej;r.readAsDataURL(f)})));
      const {data,error}=await db.functions.invoke("send-mail",{body:{to:t,cc:c.cc.trim(),bcc:c.bcc.trim(),subject:s,body:b,as:c.as,...(hasT?{body_html:bd.innerHTML.replace(/\n/g,"<br>")}:{}),...(attachments.length?{attachments}:{}),...(c.inbox?{inbox_id:c.inbox}:{})}});
      if(error){try{m2=(await error.context.json()).error}catch(_){m2=error.message}}else if(data&&data.ok)ok=true;else m2=(data&&data.error)||"알 수 없는 오류"}catch(x){m2=String(x.message||x)}
    send.disabled=false;if(!ok){msgx.className="note err";msgx.textContent="보내지 못했어요: "+m2;return}
    clearTimeout(tmr);if(c.id)await db.from("mail_drafts").delete().eq("id",c.id);
    if(c.inbox&&doneAfter.checked)await db.from("inbox_messages").update({done:true}).eq("id",c.inbox);
    const bx=c.as.startsWith("box:")?c.as:null;compose=null;mode="list";selId=null;fold=bx||"out";sub=bx?"out":"open";await load();render();X.toast("메일을 보냈어요 ✓")};
  p.append(el("div",{className:"cf"},[rowOf("보내는 사람",fromSel),rTo,rCc,rBcc,rowOf("제목",sj),
    el("div",{className:"ctools"},[tp,ab]),...(c.fwdNote?[el("p",{className:"note",textContent:c.fwdNote})]:[]),bd,sigBox,afl,fi,dl,
    el("p",{className:"note",textContent:"엑셀 표를 복사해 붙여넣을 수 있어요 · 쓰는 동안 임시보관함에 자동 저장돼요 (첨부파일은 저장되지 않아요) · 받는 사람·참조·숨은 참조는 각각 최대 10명"}),
    el("div",{className:"acts cact"},[send,sv,ds,st,msgx])]));
  if(c.quote||c.html){bd.focus();try{const r=document.createRange();r.setStart(bd,0);r.collapse(true);const sl=getSelection();sl.removeAllRanges();sl.addRange(r)}catch(_){}}else to.focus()}
/* 받는 사람 입력 자동 완성: 사원 · 공용 메일함 · 예전에 주고받은 사람 */
function suggest(inp){
  const wrap=inp.parentElement,dd=el("div",{className:"sgl",hidden:true});wrap.append(dd);let items=[],ix=-1;
  const cands=()=>{const m=new Map();
    X.staff.forEach(s=>m.set(lc(s.email),{email:s.email,name:s.name||""}));
    boxes.forEach(b=>m.set(b.addr,{email:b.addr,name:b.name+" (공용)"}));
    inbox.forEach(x=>{const a=lc(x.from_addr);if(a&&!m.has(a))m.set(a,{email:x.from_addr,name:x.from_name||""})});
    outbox.forEach(r=>String(r.to_email||"").split(/[,;\s]+/).filter(Boolean).forEach(a=>{if(!m.has(lc(a)))m.set(lc(a),{email:a,name:""})}));return[...m.values()]};
  const cut=()=>{const v=inp.value,i=Math.max(v.lastIndexOf(","),v.lastIndexOf(";"));return{head:v.slice(0,i+1),word:v.slice(i+1).trim()}};
  const pick=c=>{const {head}=cut();inp.value=(head?head.replace(/\s*$/,"")+" ":"")+c.email+", ";dd.hidden=true;inp.focus();inp.dispatchEvent(new Event("input"))};
  const paint=()=>{dd.replaceChildren(...items.map((c,i)=>{const d=el("div",{className:"sgi"+(i===ix?" on":"")},[el("b",{textContent:c.name||c.email}),el("span",{textContent:c.name?c.email:""})]);d.onmousedown=e=>{e.preventDefault();pick(c)};return d}));dd.hidden=!items.length};
  inp.addEventListener("input",()=>{const {word}=cut(),w=lc(word);if(w.length<1){items=[];dd.hidden=true;return}
    items=cands().filter(c=>lc(c.email+" "+c.name).includes(w)).slice(0,7);ix=items.length?0:-1;paint()});
  inp.addEventListener("keydown",e=>{if(dd.hidden||!items.length)return;
    if(e.key==="ArrowDown"){e.preventDefault();ix=(ix+1)%items.length;paint()}else if(e.key==="ArrowUp"){e.preventDefault();ix=(ix-1+items.length)%items.length;paint()}
    else if(e.key==="Enter"||e.key==="Tab"){if(ix>=0){e.preventDefault();pick(items[ix])}}else if(e.key==="Escape"){dd.hidden=true}});
  inp.addEventListener("blur",()=>setTimeout(()=>{dd.hidden=true},120))}

/* ───────── 공용 메일함 관리 (경영지원팀·대표) ───────── */
const PRESETS=[["support","고객 문의","홈페이지·외부 문의 응대"],["biz","협업·제안","협업·제안·의뢰 접수"],["recruit","채용","지원서·면접 안내"],["billing","계약·정산","계약서·견적·정산 문의"],["press","홍보·보도","취재·홍보·제휴 문의"]];
function drawManage(om){
  const p=el("div",{className:"orp"});om.append(p);
  p.append(el("h2",{className:"eh",textContent:"공용 메일함 관리"}),el("p",{className:"note",textContent:"주소 하나(예: biz@rif-studio.com)로 온 메일을 정한 사원들이 함께 보고, 그 주소 이름으로 답장하게 만들어요. 따로 설정할 건 없어요 — 만들면 바로 받아요."}));
  const bar=el("div",{className:"jbar"},[btn("＋ 새 공용 메일함","p",()=>boxDlg(null))]);bar.querySelector("button").className="btn";p.append(bar);
  const tb=el("tbody");
  boxes.forEach(b=>{const mem=(bmem[b.id]||[]).map(nm).join(", ")||"(멤버 없음 · 대표·경영지원팀만 봐요)";
    const prot=b.addr==="support@rif-studio.com";
    tb.append(el("tr",{},[el("td",{},[el("b",{textContent:b.name})]),el("td",{textContent:b.addr}),el("td",{className:"wd",textContent:mem,title:mem}),el("td",{className:"wd",textContent:b.descr||"",title:b.descr||""}),el("td",{className:"ac"},[btn("수정","",()=>boxDlg(b)),document.createTextNode(" "),...(prot?[]:[btn("삭제","danger",async()=>{if(!confirm("'"+b.name+"' 메일함을 지울까요?\n이 주소로 온 기존 메일은 그대로 남지만 '미분류 메일'로 옮겨져요."))return;const {error}=await db.rpc("mailbox_delete",{p_id:b.id});if(error)return alert(errTxt(error));await load();render()})])])]))});
  if(!boxes.length)tb.append(el("tr",{},[el("td",{colSpan:5,textContent:"아직 공용 메일함이 없어요."})]));
  p.append(el("div",{className:"tbw",style:"margin-top:14px"},[el("table",{className:"jt"},[el("thead",{},[el("tr",{},["이름","주소","멤버","설명",""].map(t=>el("th",{textContent:t})))]),tb])]));
  p.append(el("h3",{className:"sech",textContent:"이런 메일함을 많이 써요 (눌러서 만들기)"}),el("div",{className:"chips2"},PRESETS.filter(x=>!boxes.some(b=>b.addr===x[0]+"@rif-studio.com")).map(([a,n,d])=>{const c=el("button",{type:"button",className:"chip",textContent:n+" · "+a+"@"});c.onclick=()=>boxDlg(null,{local:a,name:n,descr:d});return c})));
  p.append(el("p",{className:"note",style:"margin-top:16px",textContent:"멤버가 아닌 경영지원팀·대표도 모든 공용 메일함을 볼 수 있어요. 사원 개인 주소가 아닌 주소로 온 메일 중 만들어 둔 메일함이 없는 것은 '미분류 메일'에 모여요."}))}
function boxDlg(b,pre){
  const old=document.getElementById("bxdlg");if(old)old.remove();pre=pre||{};
  const sel=new Set(b?(bmem[b.id]||[]):[]);
  const loc=el("input",{value:b?b.addr.split("@")[0]:(pre.local||""),maxLength:40,placeholder:"biz",disabled:!!b,autocomplete:"off"}),
    nmI=el("input",{value:b?b.name:(pre.name||""),maxLength:60,placeholder:"예) 협업·제안"}),
    fnI=el("input",{value:b?b.from_name:"RIF STUDIO",maxLength:60,placeholder:"RIF STUDIO"}),
    ds=el("input",{value:b?b.descr:(pre.descr||""),maxLength:300,placeholder:"어떤 메일을 받는 곳인지 한 줄"});
  const qI=el("input",{type:"search",placeholder:"사원 검색"}),lst=el("div",{className:"rml"}),cnt=el("span",{className:"note"});
  const dirx=X.dir.length?X.dir:X.staff.map(s=>({email:s.email,name:s.name}));
  const draw=()=>{lst.replaceChildren();const k=lc(qI.value.trim());
    dirx.filter(r=>!k||lc([r.name,r.nickname,r.team,r.email].join(" ")).includes(k)).forEach(r=>{const e=lc(r.email);
      const cb=el("input",{type:"checkbox",checked:sel.has(e)});cb.onchange=()=>{cb.checked?sel.add(e):sel.delete(e);cnt.textContent="멤버 "+sel.size+"명"};
      lst.append(el("label",{className:"rmi"},[cb,el("span",{textContent:(r.nickname||r.name||r.email)+(r.team?" · "+r.team:"")+(r.pos?" · "+r.pos:"")})]))});cnt.textContent="멤버 "+sel.size+"명"};
  qI.oninput=draw;draw();
  const quick=(t,fn)=>{const x=btn(t,"",()=>{fn();draw()});return x};
  const msgx=el("span",{className:"note"}),ok=el("button",{type:"button",className:"btn",textContent:b?"저장":"만들기"}),cx=btn("취소","",()=>wrap.remove());
  const row=(l,i,h)=>el("label",{className:"rmn"},[document.createTextNode(l),i,...(h?[el("span",{className:"note",textContent:h})]:[])]);
  const addrRow=el("label",{className:"rmn"},[document.createTextNode("메일 주소"),el("div",{className:"idrow"},[loc,el("span",{textContent:"@rif-studio.com"})]),el("span",{className:"note",textContent:b?"주소는 바꿀 수 없어요.":"영문 소문자·숫자·점(.)·하이픈(-)만 쓸 수 있어요."})]);
  const wrap=el("div",{className:"mod",id:"bxdlg"},[el("div",{className:"mbox wd"},[el("h2",{textContent:b?"공용 메일함 수정":"새 공용 메일함"}),addrRow,row("이름 (사내에서 보이는 이름)",nmI),row("보내는 이름 (받는 사람에게 보이는 이름 · 영문 추천)",fnI),row("설명",ds),
    el("div",{className:"rmn"},[document.createTextNode("멤버 — 이 메일함의 메일을 보고 답장할 수 있는 사원")]),
    el("div",{className:"jbar",style:"margin:0 0 8px"},[quick("경영지원팀 전원",()=>dirx.filter(r=>r.team==="경영지원팀").forEach(r=>sel.add(lc(r.email)))),quick("전체 선택",()=>dirx.forEach(r=>sel.add(lc(r.email)))),quick("모두 해제",()=>sel.clear())]),qI,lst,
    el("div",{className:"wr",style:"justify-content:space-between;align-items:center"},[cnt,msgx,el("span",{className:"jbar",style:"margin:0"},[cx,ok])])])]);
  wrap.addEventListener("click",e=>{if(e.target===wrap)wrap.remove()});
  ok.onclick=async()=>{const n=nmI.value.trim();if(!b&&!loc.value.trim()){msgx.className="note err";msgx.textContent="메일 주소를 써 주세요.";return}if(!n){msgx.className="note err";msgx.textContent="이름을 써 주세요.";return}
    ok.disabled=true;msgx.className="note";msgx.textContent="저장 중…";
    const {error}=await db.rpc("mailbox_save",{p_id:b?b.id:null,p_local:loc.value.trim(),p_name:n,p_from_name:fnI.value.trim(),p_descr:ds.value.trim(),p_members:[...sel]});ok.disabled=false;
    if(error){msgx.className="note err";msgx.textContent=errTxt(error);return}wrap.remove();await load();render();X.toast("저장했어요 ✓")};
  document.body.append(wrap);(b?nmI:loc).focus()}

/* ───────── 상용구 ───────── */
function drawTpl(om){
  const p=el("div",{className:"orp"});om.append(p);
  p.append(el("h2",{className:"eh",textContent:"상용구"}),el("p",{className:"note",textContent:"자주 쓰는 문장을 저장해 두고, 새 메일에서 '상용구 넣기'로 불러와요. '내 것'은 나만, '공용'은 모든 사원이 쓸 수 있어요 (공용은 경영지원팀·대표만 만들어요)."}));
  const bar=el("div",{className:"jbar"},[btn("＋ 새 상용구","p",()=>tplDlg(null))]);bar.firstChild.className="btn";p.append(bar);
  const tb=el("tbody");
  tpls.forEach(t=>{const can=lc(t.owner_email)===X.me&&!t.shared||(t.shared&&isMgmt());
    tb.append(el("tr",{},[el("td",{},[el("b",{textContent:t.title})]),el("td",{textContent:t.shared?"공용":"내 것"}),el("td",{className:"wd",textContent:t.subject||"-"}),el("td",{className:"wd",textContent:t.body.replace(/\s+/g," ").slice(0,140)}),
      el("td",{className:"ac"},can?[btn("수정","",()=>tplDlg(t)),document.createTextNode(" "),btn("삭제","danger",async()=>{if(!confirm("'"+t.title+"' 상용구를 지울까요?"))return;const {error}=await db.from("mail_templates").delete().eq("id",t.id);if(error)return alert("지우지 못했어요");await load();render()})]:[])]))});
  if(!tpls.length)tb.append(el("tr",{},[el("td",{colSpan:5,textContent:"아직 상용구가 없어요."})]));
  p.append(el("div",{className:"tbw",style:"margin-top:14px"},[el("table",{className:"jt"},[el("thead",{},[el("tr",{},["이름","구분","제목","내용",""].map(t=>el("th",{textContent:t})))]),tb])]))}
function tplDlg(t){
  const old=document.getElementById("tpdlg");if(old)old.remove();
  const ti=el("input",{value:t?t.title:"",maxLength:80,placeholder:"예) 문의 접수 확인"}),sj=el("input",{value:t?t.subject:"",maxLength:200,placeholder:"메일 제목 (선택)"}),bd=el("textarea",{rows:10,maxLength:20000,placeholder:"본문"});bd.value=t?t.body:"";
  const sh=el("input",{type:"checkbox",checked:!!(t&&t.shared)});const shl=el("label",{className:"ck3"},[sh,document.createTextNode(" 모든 사원이 쓰는 공용 상용구")]);shl.hidden=!isMgmt();
  const msgx=el("span",{className:"note"}),ok=el("button",{type:"button",className:"btn",textContent:"저장"}),cx=btn("취소","",()=>wrap.remove());
  const row=(l,i)=>el("label",{className:"rmn"},[document.createTextNode(l),i]);
  const wrap=el("div",{className:"mod",id:"tpdlg"},[el("div",{className:"mbox wd"},[el("h2",{textContent:t?"상용구 수정":"새 상용구"}),row("이름",ti),row("제목 (선택)",sj),row("본문",bd),shl,el("div",{className:"wr",style:"justify-content:space-between;align-items:center"},[msgx,el("span",{className:"jbar",style:"margin:0"},[cx,ok])])])]);
  wrap.addEventListener("click",e=>{if(e.target===wrap)wrap.remove()});
  ok.onclick=async()=>{const n=ti.value.trim();if(!n||!bd.value.trim()){msgx.className="note err";msgx.textContent="이름과 본문을 써 주세요.";return}
    ok.disabled=true;const row2={title:n,subject:sj.value.trim(),body:bd.value.trim(),shared:isMgmt()&&sh.checked};
    const {error}=t?await db.from("mail_templates").update(row2).eq("id",t.id):await db.from("mail_templates").insert({...row2,owner_email:X.me});ok.disabled=false;
    if(error){msgx.className="note err";msgx.textContent="저장하지 못했어요";return}wrap.remove();await load();render()};
  document.body.append(wrap);ti.focus()}

/* ───────── 시작 · 정리 ───────── */
function init(ctx){
  X=ctx;if(started)return;started=true;
  $("of").replaceChildren();$("om").replaceChildren();
  load().then(()=>{render();loadUsage();newCount=title()});
  poll=setInterval(()=>{if(document.hidden||!X)return;if(mode==="compose")return;const prev=newCount;load().then(()=>{const n=title();if(mode==="list"){drawFolders();fillRows();bulk()}else drawFolders();newCount=n;if(prev>=0&&n>prev)X.toast("새 메일이 왔어요 ✉")})},60000)}
function reset(){started=false;X=null;clearInterval(poll);inbox=[];outbox=[];boxes=[];drafts=[];tpls=[];bodies={};notes={};picked.clear();compose=null;mode="list";fold="in";selId=null;document.title="Intranet · RIF STUDIO";const t=$("ib");if(t)t.hidden=true}
return{init,reset,refresh,show:()=>{if(X&&mode==="list")fillRows()}}
})();
