(()=>{
const $=i=>document.getElementById(i);
const toEmail=v=>{v=v.trim().toLowerCase();return v.includes("@")?v:v+"@rif-studio.com"};
const fd=s=>s?new Date(s).toLocaleDateString("ko-KR"):"";
const sz=n=>n>1048576?(n/1048576).toFixed(1)+"MB":Math.max(1,Math.round(n/1024))+"KB";
let me="",uid="",myName="",ceo=false,exec=false,staff=[],reads=new Set(),notices=[],tasks=[],docs=[];
const CEO="takanashi@rif-studio.com";
const msg=(id,t,bad)=>{const m=$(id);m.className="note"+(bad?" err":"");m.textContent=t};
const nameOf=e=>(staff.find(s=>s.email.toLowerCase()===String(e).toLowerCase())||{}).name||e;
async function render(){
  const {data}=await db.auth.getSession(),s=data.session;
  $("login").hidden=!!s;$("sg").hidden=!!s;$("app").hidden=!s;
  if(!s)return;
  me=(s.user.email||"").toLowerCase();uid=s.user.id;ceo=me===CEO;$("who").textContent=s.user.email;
  const {data:st}=await db.from("mail_staff").select("email,name").maybeSingle();
  $("box").hidden=!st;$("nomail").hidden=!!st;if(!st)return;
  myName=st.name;{const {data:ex}=await db.rpc("is_exec");exec=!!ex||ceo}$("nw").hidden=!exec;
  await loadStaff();await loadAll()}
async function loadStaff(){const {data}=await db.rpc("staff_list");staff=data||[];
  $("ta").replaceChildren(el("option",{value:"",textContent:"미지정"}),...staff.map(x=>el("option",{value:x.email,textContent:x.name||x.email})))}
async function loadAll(){await Promise.all([loadNotices(),loadTasks(),loadDocs(),loadDir(),loadInbox()]);startChat()}

/* 작성 팝업 */
let wmForm=null;
function openWm(id){wmForm=$(id);$("wmb").replaceChildren(wmForm);$("wm").hidden=false;const f=wmForm.querySelector("input");if(f)f.focus()}
function closeWm(){$("wm").hidden=true;if(wmForm){$("forms").append(wmForm);wmForm=null}}
$("nw").onclick=()=>openWm("nf");$("dw").onclick=()=>openWm("df");$("wmx").onclick=closeWm;$("wm").onclick=e=>{if(e.target===$("wm"))closeWm()};
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeWm()});
/* 공지 */
async function loadNotices(){
  const [a,b]=await Promise.all([db.from("notices").select("*").order("pinned",{ascending:false}).order("created_at",{ascending:false}).limit(200),db.from("notice_reads").select("notice_id,email,read_at")]);
  notices=a.data||[];const rd=b.data||[];
  reads=new Set(rd.filter(r=>r.email.toLowerCase()===me).map(r=>r.notice_id));
  const byN={};rd.forEach(r=>(byN[r.notice_id]=byN[r.notice_id]||[]).push(r.email));
  drawNotices(byN)}
function drawNotices(byN){
  const box=$("nl");box.replaceChildren();
  const un=notices.filter(n=>!reads.has(n.id)).length;$("nb").hidden=!un;$("nb").textContent=un;
  notices.forEach(n=>{
    const isNew=!reads.has(n.id);
    const h=el("h3",{},[document.createTextNode((n.pinned?"📌 ":"")+n.title),...(isNew?[el("span",{className:"new",textContent:"NEW"})]:[])]);
    const body=el("div",{className:"bodyx",hidden:true,textContent:n.body||"(내용 없음)"});
    const meta=el("div",{className:"meta",textContent:fd(n.created_at)+" · "+n.author_name+(ceo?" · 읽음 "+((byN[n.id]||[]).length)+"/"+staff.length+"명":"")});
    const card=el("div",{className:"card"+(isNew?" unread":"")},[h,meta,body]);
    if(ceo||(exec&&(n.author_email||"").toLowerCase()===me)){
      const who=(byN[n.id]||[]).map(nameOf).join(", ")||"아직 없음";
      body.append(el("div",{className:"meta",textContent:"읽은 사람: "+who,style:"margin-top:12px"}));
      const x=el("button",{className:"btn small",textContent:"삭제",style:"margin-top:10px"});x.onclick=async()=>{if(!confirm("이 공지를 삭제할까요?"))return;await db.from("notices").delete().eq("id",n.id);loadNotices()};body.append(x)}
    h.onclick=async()=>{body.hidden=!body.hidden;
      if(!body.hidden&&!reads.has(n.id)){reads.add(n.id);card.classList.remove("unread");const nw=h.querySelector(".new");if(nw)nw.remove();
        await db.from("notice_reads").upsert({notice_id:n.id,email:me},{onConflict:"notice_id,email",ignoreDuplicates:true});
        const un2=notices.filter(x=>!reads.has(x.id)).length;$("nb").hidden=!un2;$("nb").textContent=un2}};
    box.append(card)});
  if(!notices.length)box.append(el("p",{className:"note",textContent:"아직 공지가 없어요."}))}
$("nf").onsubmit=async e=>{e.preventDefault();const t=$("nt").value.trim();if(!t)return msg("nmsg","제목을 써 주세요.",1);
  const {error}=await db.from("notices").insert({title:t,body:$("nbd").value.trim(),pinned:$("npin").checked,author_name:myName,author_email:me});
  if(error)return msg("nmsg","올리지 못했어요",1);$("nt").value="";$("nbd").value="";$("npin").checked=false;msg("nmsg","올렸어요 ✓");closeWm();loadNotices()};

/* 업무 */
async function loadTasks(){const {data}=await db.from("intra_tasks").select("*").order("created_at",{ascending:false}).limit(500);tasks=data||[];drawTasks()}
function drawTasks(){
  const kb=$("kb");kb.replaceChildren();const mine=$("tmine").checked;
  const cols=[["todo","할 일"],["doing","진행 중"],["done","완료"]];
  const today=new Date().toISOString().slice(0,10);
  cols.forEach(([k,label])=>{
    const list=tasks.filter(t=>t.status===k&&(!mine||t.assignee_email.toLowerCase()===me));
    const col=el("div",{},[el("h3",{textContent:label+" ("+list.length+")"})]);
    list.forEach(t=>{
      const can=ceo||t.created_by.toLowerCase()===me||t.assignee_email.toLowerCase()===me,canDel=ceo||t.created_by.toLowerCase()===me;
      const od=t.due&&k!=="done"&&t.due<today;
      const card=el("div",{className:"tk"},[el("b",{textContent:t.title}),...(t.detail?[el("div",{textContent:t.detail,style:"white-space:pre-wrap"})]:[]),
        el("div",{className:"meta"},[document.createTextNode((t.assignee_name||"담당자 미지정")+" · "),el("span",{className:od?"od":"",textContent:t.due?"마감 "+t.due+(od?" (지남)":""):"마감 없음"})])]);
      if(can){const sel=el("select",{},cols.map(([v,l])=>el("option",{value:v,textContent:l,selected:v===t.status})));
        sel.onchange=async()=>{const {error}=await db.from("intra_tasks").update({status:sel.value,updated_at:new Date().toISOString()}).eq("id",t.id);if(error)alert("바꾸지 못했어요");loadTasks()};card.append(sel)}
      if(canDel){const x=el("button",{className:"x",textContent:"×",title:"삭제"});x.onclick=async()=>{if(!confirm("이 업무를 삭제할까요?"))return;await db.from("intra_tasks").delete().eq("id",t.id);loadTasks()};card.prepend(x)}
      col.append(card)});
    kb.append(col)})}
$("tmine").onchange=drawTasks;
$("tf").onsubmit=async e=>{e.preventDefault();const t=$("tt").value.trim();if(!t)return msg("tmsg","제목을 써 주세요.",1);
  const as=$("ta").value;
  const {error}=await db.from("intra_tasks").insert({title:t,detail:$("td").value.trim(),assignee_email:as,assignee_name:as?nameOf(as):"",due:$("tdue").value||null,created_by:me,created_by_name:myName});
  if(error)return msg("tmsg","추가하지 못했어요",1);$("tt").value="";$("td").value="";$("tdue").value="";msg("tmsg","추가했어요 ✓");loadTasks()};

/* 자료 */
async function loadDocs(){const {data}=await db.from("intra_docs").select("*").order("created_at",{ascending:false}).limit(500);docs=data||[];drawDocs()}
function drawDocs(){
  const tb=$("dtb");tb.replaceChildren();
  docs.forEach(d=>{
    const dl=el("button",{className:"btn small",textContent:"다운로드"});
    dl.onclick=async()=>{const {data,error}=await db.storage.from("intranet-docs").createSignedUrl(d.path,60,{download:d.filename});if(error||!data)return alert("열지 못했어요");location.href=data.signedUrl};
    const acts=[dl];
    if(ceo||d.uploader_email.toLowerCase()===me){const x=el("button",{className:"btn small",textContent:"삭제"});
      x.onclick=async()=>{if(!confirm("'"+d.title+"' 을 삭제할까요?"))return;await db.storage.from("intranet-docs").remove([d.path]);await db.from("intra_docs").delete().eq("id",d.id);loadDocs()};acts.push(x)}
    tb.append(el("tr",{},[el("td",{},[el("b",{textContent:d.title}),...(d.note?[el("div",{className:"note",textContent:d.note})]:[])]),el("td",{textContent:d.filename}),el("td",{textContent:d.size?sz(d.size):""}),el("td",{textContent:d.uploader_name}),el("td",{textContent:fd(d.created_at)}),el("td",{className:"ac"},acts)]))});
  if(!docs.length)tb.append(el("tr",{},[el("td",{colSpan:6,textContent:"아직 올라온 자료가 없어요."})]))}
$("df").onsubmit=async e=>{e.preventDefault();const f=$("dfile").files[0],t=$("dt").value.trim();
  if(!t||!f)return msg("dmsg","제목과 파일을 모두 넣어 주세요.",1);
  if(f.size>20*1024*1024)return msg("dmsg","20MB 이하 파일만 올릴 수 있어요.",1);
  msg("dmsg","올리는 중…");
  const ext=(f.name.split(".").pop()||"bin").replace(/[^a-zA-Z0-9]/g,"").slice(0,8)||"bin";
  const path=uid+"/"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+"."+ext;
  const {error}=await db.storage.from("intranet-docs").upload(path,f,{contentType:f.type||"application/octet-stream"});
  if(error)return msg("dmsg","올리지 못했어요 (파일 형식이나 크기를 확인해 주세요)",1);
  const {error:e2}=await db.from("intra_docs").insert({title:t,note:$("dn").value.trim(),path,filename:f.name,size:f.size,uploader_email:me,uploader_name:myName});
  if(e2){await db.storage.from("intranet-docs").remove([path]);return msg("dmsg","기록하지 못했어요",1)}
  $("dt").value="";$("dn").value="";$("dfile").value="";msg("dmsg","올렸어요 ✓");closeWm();loadDocs()};

/* 메일 (Outlook 스타일) */
let inbox=[],irds=new Set(),irdBy={},outbox=[],fold="in",selId=null,composing=null,bodies={};
const fmt=s=>{if(!s)return"";const d=new Date(s),n=new Date();return d.toDateString()===n.toDateString()?d.toLocaleTimeString("ko-KR",{hour:"numeric",minute:"2-digit"}):d.toLocaleDateString("ko-KR",{month:"numeric",day:"numeric"})};
const ftl=s=>s?new Date(s).toLocaleString("ko-KR",{dateStyle:"medium",timeStyle:"short"}):"";
async function loadInbox(){
  const [a,b,c]=await Promise.all([db.from("inbox_messages").select("id,from_addr,from_name,to_addrs,subject,preview,received_at,assignee_email,done,attachments,deleted_at").order("received_at",{ascending:false}).limit(300),db.from("inbox_reads").select("msg_id,email"),db.from("mail_outbox").select("id,sender,sender_name,author_name,to_email,subject,body,created_at,opened_at,open_count").order("created_at",{ascending:false}).limit(300)]);
  inbox=(a.data||[]).filter(m=>ceo||!/support@/i.test(m.to_addrs||"")||(m.to_addrs||"").toLowerCase().includes(me));outbox=c.data||[];irds=new Set();irdBy={};
  (b.data||[]).forEach(r=>{if(r.email.toLowerCase()===me)irds.add(r.msg_id);(irdBy[r.msg_id]=irdBy[r.msg_id]||[]).push(r.email)});
  drawMail()}
const unreadN=()=>inbox.filter(m=>!m.deleted_at&&!irds.has(m.id)&&!m.done).length;
let usage=null;async function loadUsage(){const {data}=await db.rpc("mail_usage");usage=data||null;drawUsage()}
const mb=b=>b>=1073741824?(b/1073741824).toFixed(2)+" GB":b>=1048576?(b/1048576).toFixed(1)+" MB":Math.max(1,Math.round(b/1024))+" KB";
const DB_LIMIT=524288000;
function drawUsage(){const u=$("ousg");if(!u)return;u.replaceChildren();if(!usage)return;const left=Math.max(0,DB_LIMIT-usage.db_bytes),pc=Math.min(100,usage.db_bytes/DB_LIMIT*100);
  u.append(el("div",{className:"ub"},[el("i",{style:"width:"+pc.toFixed(1)+"%"})]),el("div",{className:"ut",textContent:"남은 용량 "+mb(left)}),el("div",{className:"us",textContent:"메일 "+mb(usage.mail_bytes)+" · 전체 "+mb(usage.db_bytes)+" / "+mb(DB_LIMIT)}))}
function drawMail(){
  const un=unreadN();$("ib").hidden=!un;$("ib").textContent=un;
  const trN=inbox.filter(m=>m.deleted_at).length;
  const mineN=inbox.filter(m=>!m.deleted_at&&!m.done&&(m.assignee_email||"").toLowerCase()===me&&!irds.has(m.id)).length;
  const F=[["in","받은 편지함",un||""],["mine",ceo?"대표 관리":"내 담당",mineN||""],["out","보낸 편지함",""],["done","완료한 메일",""],["trash","휴지통",trN||""]];
  $("ofl").replaceChildren(...F.map(([k,l,c])=>{const d=el("div",{className:"ofi"+(fold===k?" on":"")},[el("span",{textContent:l}),el("span",{className:"c",textContent:c})]);d.onclick=()=>{fold=k;selId=null;composing=null;drawMail()};return d}));
  $("ol").classList.toggle("rd",!!(selId||composing));drawUsage();
  const q=$("oq").value.trim().toLowerCase(),box=$("oli");box.replaceChildren();
  let list;
  if(fold==="out")list=outbox.filter(r=>!q||[r.to_email,r.subject,r.sender_name,r.sender,r.body].join(" ").toLowerCase().includes(q));
  else list=inbox.filter(m=>(fold==="trash"?!!m.deleted_at:(!m.deleted_at&&(fold==="done"?!!m.done:!m.done)))&&(fold!=="mine"||(m.assignee_email||"").toLowerCase()===me)&&(!q||[m.from_addr,m.from_name,m.subject,m.preview].join(" ").toLowerCase().includes(q)));
  list.forEach(m=>{
    const out=fold==="out",un2=!out&&!irds.has(m.id);
    const row=el("div",{className:"omi"+(un2?" un":"")+(selId===m.id&&!composing?" sel":"")},[
      el("div",{className:"r1"},[el("span",{className:"fr1",textContent:out?(m.sender_name?m.sender_name+" → ":"")+m.to_email:(m.from_name||m.from_addr)}),el("span",{className:"dd",textContent:fmt(out?m.created_at:m.received_at)})]),
      el("div",{className:"sj",textContent:m.subject||"(제목 없음)"}),
      el("div",{className:"pv2"},out?[document.createTextNode((m.opened_at?"✓ 읽음 · ":"안 읽음 · ")+(m.body||"").replace(/\s+/g," ").slice(0,80))]:[document.createTextNode((ceo&&m.to_addrs?"→ "+m.to_addrs.replace(/@rif-studio\.com/gi,"")+" · ":"")+(m.assignee_email?"담당 "+nameOf(m.assignee_email)+" · ":"")+(m.preview||""))])]);
    row.onclick=()=>selectMsg(m.id);box.append(row)});
  if(fold==="trash"&&list.length){const eb=el("button",{className:"ob tb",type:"button",textContent:"🗑 휴지통 비우기 ("+list.length+")"});eb.onclick=async()=>{if(!confirm("휴지통의 메일 "+list.length+"건을 영구 삭제할까요?\n되돌릴 수 없어요."))return;const {error}=await db.rpc("inbox_purge",{p_ids:list.map(x=>x.id)});if(error)return alert("비우지 못했어요");selId=null;await loadInbox();loadUsage()};box.prepend(eb)}
  if(!list.length)box.append(el("p",{className:"note",textContent:fold==="out"?"보낸 메일이 없어요.":fold==="trash"?"휴지통이 비어 있어요.":"메일이 없어요.",style:"padding:20px;text-align:center"}));
  drawPane()}
async function selectMsg(id){selId=id;composing=null;
  if(fold!=="out"&&!irds.has(id)){irds.add(id);await db.from("inbox_reads").upsert({msg_id:id,email:me},{onConflict:"msg_id,email",ignoreDuplicates:true})}
  drawMail()}
const backBtn=()=>{const b=el("button",{className:"bk",type:"button",title:"목록으로",textContent:"‹"});b.append(el("span",{textContent:"목록"}));b.onclick=()=>{selId=null;composing=null;drawMail()};return b};
function drawPane(){
  const p=$("orp");p.replaceChildren();if(selId||composing)p.append(backBtn());
  if(composing)return drawCompose(p);
  if(!selId){p.append(el("div",{className:"empty",textContent:"읽을 메일을 선택하세요"}));return}
  if(fold==="out"){const r=outbox.find(x=>x.id===selId);if(!r)return;
    p.append(el("h2",{className:"eh",textContent:r.subject}),
      el("div",{className:"who"},[el("div",{className:"ci",textContent:ini(r.sender_name||r.sender)}),el("div",{},[el("b",{textContent:(r.sender_name||r.sender)+" <"+r.sender+">"}),el("span",{textContent:"받는 사람: "+r.to_email+" · "+ftl(r.created_at)+(r.author_name&&r.sender!==me?" · 작성: "+r.author_name:"")})])]),
      el("div",{className:"acts"},[el("span",{className:"rb "+(r.opened_at?"on":"off"),textContent:r.opened_at?"읽음":"안 읽음"}),...(r.opened_at?[el("span",{className:"note",textContent:ftl(r.opened_at)+(r.open_count>1?" · "+r.open_count+"회":"")})]:[]),
        (()=>{const b=el("button",{className:"ob",type:"button",textContent:"다시 보내기"});b.onclick=()=>{composing={to:r.to_email,subject:r.subject,body:r.body};drawMail()};return b})()]),
      el("div",{textContent:r.body,style:"white-space:pre-wrap;line-height:1.7"}));return}
  const m=inbox.find(x=>x.id===selId);if(!m)return;
  const acts=el("div",{className:"acts"});
  p.append(el("h2",{className:"eh",textContent:m.subject||"(제목 없음)"}),
    el("div",{className:"who"},[el("div",{className:"ci",textContent:ini(m.from_name||m.from_addr)}),el("div",{},[el("b",{textContent:(m.from_name?m.from_name+" ":"")+"<"+m.from_addr+">"}),el("span",{textContent:"받는 사람: "+(m.to_addrs||"support@rif-studio.com")+" · "+ftl(m.received_at)})])]),acts);
  const bodyBox=el("div",{});p.append(bodyBox);
  const show=data=>{bodyBox.replaceChildren();
    const f=document.createElement("iframe");f.setAttribute("sandbox","");f.style.cssText="width:100%;min-height:300px;border:0;background:#fff;border-radius:6px";
    if(data.body_html)f.srcdoc='<base target="_blank"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src https: data: cid:; style-src \'unsafe-inline\'"><body style="font:14px/1.6 sans-serif;margin:8px;color:#222">'+data.body_html;
    else f.srcdoc='<body style="font:14px/1.6 sans-serif;margin:8px;white-space:pre-wrap;color:#222">'+(data.body_text||"").replace(/&/g,"&amp;").replace(/</g,"&lt;");
    f.onload=()=>{try{f.style.height=Math.max(300,f.contentDocument.documentElement.scrollHeight+20)+"px"}catch(_){}};bodyBox.append(f);
    if((m.attachments||[]).length)bodyBox.append(el("div",{className:"note",textContent:"첨부 "+m.attachments.length+"개: "+m.attachments.map(x=>x.filename).join(", ")+" (파일은 Resend 대시보드에서 확인)"}));
    return data};
  const rp=el("button",{className:"ob p",type:"button",textContent:"↩ 답장"});
  const as=el("select",{},[el("option",{value:"",textContent:"담당자 미지정"}),...staff.map(x=>el("option",{value:x.email,textContent:x.name||x.email,selected:x.email.toLowerCase()===(m.assignee_email||"").toLowerCase()}))]);
  as.onchange=async()=>{const {error}=await db.from("inbox_messages").update({assignee_email:as.value}).eq("id",m.id);if(error)alert("바꾸지 못했어요");else{m.assignee_email=as.value;drawMail()}};
  const dn=el("button",{className:"ob",type:"button",textContent:m.done?"완료 취소":"✓ 완료 처리"});
  dn.onclick=async()=>{const v=!m.done;const {error}=await db.from("inbox_messages").update({done:v}).eq("id",m.id);if(error)return alert("바꾸지 못했어요");m.done=v;selId=null;drawMail()};
  if(m.deleted_at){const rs=el("button",{className:"ob p",type:"button",textContent:"↩ 복원"});rs.onclick=async()=>{const {error}=await db.from("inbox_messages").update({deleted_at:null,deleted_by:null}).eq("id",m.id);if(error)return alert("복원하지 못했어요");selId=null;loadInbox()};
    const pg=el("button",{className:"ob",type:"button",textContent:"영구 삭제"});pg.onclick=async()=>{if(!confirm("이 메일을 영구 삭제할까요? 되돌릴 수 없어요."))return;const {error}=await db.rpc("inbox_purge",{p_ids:[m.id]});if(error)return alert("삭제하지 못했어요");selId=null;await loadInbox();loadUsage()};acts.append(rs,pg)}
  else{acts.append(rp,as,dn);
    const x=el("button",{className:"ob",type:"button",textContent:"🗑 삭제"});x.onclick=async()=>{const {error}=await db.from("inbox_messages").update({deleted_at:new Date().toISOString(),deleted_by:me}).eq("id",m.id);if(error)return alert("삭제하지 못했어요");selId=null;loadInbox()};acts.append(x)}
  if(ceo){
    acts.append(el("span",{className:"note",textContent:"읽은 사람: "+((irdBy[m.id]||[]).map(nameOf).join(", ")||"아직 없음")}))}
  const id0=m.id;
  const go=async()=>{if(bodies[id0])return bodies[id0];bodyBox.textContent="불러오는 중…";
    const {data,error}=await db.from("inbox_messages").select("body_text,body_html").eq("id",id0).single();
    if(error||!data){bodyBox.textContent="본문을 불러오지 못했어요";return null}bodies[id0]=data;return data};
  go().then(d=>{if(d&&selId===id0&&!composing)show(d)});
  const quoteOf=raw=>{let t=String(raw||"").replace(/\r\n/g,"\n").trim();
    const i=t.search(/\n[^\n]*(wrote:|작성:)\s*(\n|$)|\n>|\n-{3,} ?(Original|원본|Forwarded)/i);if(i>0)t=t.slice(0,i);
    t=t.split("\n").filter(l=>!/^\s*\[image:.*\]/i.test(l)&&!/^\s*(RIF STUDIO|PANGYO\s*[•·\/].*|rif-studio\.com|https?:\/\/rif-studio\.com\/?)\s*$/i.test(l)&&!/^\s*--\s*$/.test(l)).join("\n");
    t=t.replace(/<https?:\/\/[^>\s]+>/g,"").replace(/\n{3,}/g,"\n\n").trim();return t.length>1200?t.slice(0,1200).trim()+" …":t};
  rp.onclick=async()=>{const d=await go();if(!d)return;const q=quoteOf(d.body_text);
    composing={as:((m.to_addrs||"").toLowerCase().includes(me)?"me":"support"),inbox:m.id,to:m.from_addr,subject:/^re:/i.test(m.subject)?m.subject:"Re: "+m.subject,body:"\n\n"+ftl(m.received_at)+" "+(m.from_name||m.from_addr)+" 님이 보냄:\n"+(q?q.replace(/^/gm,"> "):"")};drawMail()}}
function drawCompose(p){
  const c=composing;
  const fromSel=el("select",{style:"padding:9px 12px;border:1px solid #7775;border-radius:6px;font:inherit;background:var(--bg);color:var(--fg)"},[el("option",{value:"me",textContent:"내 개인 메일 ("+me+") · 개인 서명 포함",selected:c.as!=="support"}),el("option",{value:"support",textContent:"support@rif-studio.com (공용 · 개인 서명 없음)",selected:c.as==="support"})]);
  const to=el("input",{value:c.to||"",placeholder:"name@example.com (쉼표로 여러 명)"}),sj=el("input",{value:c.subject||"",maxLength:200}),bd=el("textarea",{value:c.body||""});
  const msgx=el("span",{className:"note"});const send=el("button",{className:"ob p",type:"button",textContent:"보내기"}),cancel=el("button",{className:"ob",type:"button",textContent:"취소"});
  cancel.onclick=()=>{composing=null;drawMail()};
  send.onclick=async()=>{const t=to.value.trim(),s=sj.value.trim(),b=bd.value.trim();
    if(!t||!s||!b){msgx.className="note err";msgx.textContent="받는 사람·제목·내용을 모두 써 주세요.";return}
    if(!confirm(t+" 에게 메일을 보낼까요?\n보낸 뒤에는 취소할 수 없어요."))return;
    send.disabled=true;msgx.className="note";msgx.textContent="보내는 중…";let ok=false,m2="";
    try{const {data,error}=await db.functions.invoke("send-mail",{body:{to:t,subject:s,body:b,as:fromSel.value,...(c.inbox?{inbox_id:c.inbox}:{})}});
      if(error){try{m2=(await error.context.json()).error}catch(_){m2=error.message}}else if(data&&data.ok)ok=true;else m2=(data&&data.error)||"알 수 없는 오류"}catch(x){m2=String(x.message||x)}
    send.disabled=false;if(!ok){msgx.className="note err";msgx.textContent="보내지 못했어요: "+m2;return}
    composing=null;fold="out";selId=null;await loadInbox()};
  p.append(el("h2",{className:"eh",textContent:"새 메일"}),el("div",{className:"cf"},[el("label",{},[document.createTextNode("보내는 사람"),fromSel]),el("label",{},[document.createTextNode("받는 사람"),to]),el("label",{},[document.createTextNode("제목"),sj]),bd,el("div",{className:"acts",style:"border:0;padding:0;margin:0"},[send,cancel,msgx,el("span",{className:"note",textContent:"서명은 자동으로 붙어요 (서명 설정에서 바꿀 수 있어요)"})])]));
  to.focus()}
$("onew").onclick=()=>{composing={};drawMail()};$("oq").oninput=drawMail;$("orf").onclick=()=>{loadInbox();loadUsage()};loadUsage();

/* 직원 · 프로필 */
let dir=[],urls={};
const ini=s=>(String(s||"?").trim()[0]||"?").toUpperCase();
function avatar(node,path,name){node.textContent="";node.style.backgroundImage="";if(path&&urls[path])node.style.backgroundImage='url("'+encodeURI(urls[path])+'")';else node.textContent=ini(name)}
async function loadDir(){const {data}=await db.rpc("staff_directory");dir=data||[];
  const paths=[...new Set(dir.map(r=>r.avatar).filter(Boolean))];urls={};
  if(paths.length){const {data:u}=await db.storage.from("avatars").createSignedUrls(paths,3600);(u||[]).forEach(x=>{if(x.signedUrl)urls[x.path]=x.signedUrl})}
  const mine=dir.find(r=>r.email.toLowerCase()===me)||{};
  avatar($("pfav"),mine.avatar,mine.name);$("pfnk").value=mine.nickname||"";$("pfdc").value=mine.discord||"";$("pftw").value=mine.twitter||"";$("pfdu").value=mine.duties||"";
  drawTree();drawDir()}
const DIVS={"경영부":["경영지원팀"],"프로덕션부":["보컬팀","사운드제작팀","일러스트팀","매니지먼트팀"]};
const TEAM_DIV={};Object.entries(DIVS).forEach(([d,ts])=>ts.forEach(t=>TEAM_DIV[t]=d));
const divOf=r=>r.division||TEAM_DIV[r.team]||"";
let osel="",oopen={root:false};
const isBoss=r=>r.pos==="대표이사";
const inLeaf=(r,k)=>k==="boss"?isBoss(r):k==="etc"?(!isBoss(r)&&!r.team):k.startsWith("team:")?(!isBoss(r)&&r.team===k.slice(5)):false;
function drawTree(){const box=$("otree");box.replaceChildren();
  const cnt=f=>dir.filter(f).length;
  const row=(cls,label,n,on,open,fn)=>{const b=el("button",{type:"button",className:cls+(on?" on":"")},[el("span",{className:"cr",textContent:open===null?"":(open?"▾":"▸")}),el("span",{textContent:label}),el("span",{className:"oc",textContent:n===null?"":String(n)})]);b.onclick=fn;box.append(b)};
  row("o0","RIF STUDIO",dir.length,false,!!oopen.root,()=>{oopen.root=!oopen.root;drawTree()});
  if(!oopen.root)return;
  if(cnt(isBoss))row("o1","대표이사",cnt(isBoss),osel==="boss",null,()=>{osel="boss";drawTree();drawDir()});
  Object.entries(DIVS).forEach(([d,ts])=>{
    row("o1",d,cnt(r=>!isBoss(r)&&divOf(r)===d),false,!!oopen[d],()=>{oopen[d]=!oopen[d];drawTree()});
    if(oopen[d])ts.forEach(t=>row("o2",t,cnt(r=>inLeaf(r,"team:"+t)),osel==="team:"+t,null,()=>{osel="team:"+t;drawTree();drawDir()}))});
  if(cnt(r=>inLeaf(r,"etc")))row("o1","기타",cnt(r=>inLeaf(r,"etc")),osel==="etc",null,()=>{osel="etc";drawTree();drawDir()})}
function drawDir(){
  const q=$("eq").value.trim().toLowerCase(),g=$("ogrid");g.replaceChildren();
  const m=r=>[r.name,r.nickname,r.emp,r.email,r.duties,r.team,r.pos].join(" ").toLowerCase().includes(q);
  const l=q?dir.filter(m):osel?dir.filter(r=>inLeaf(r,osel)):[];
  const title=osel==="boss"?"RIF STUDIO · 대표이사":osel==="etc"?"RIF STUDIO · 기타":osel.startsWith("team:")?"RIF STUDIO · "+(TEAM_DIV[osel.slice(5)]||"")+" · "+osel.slice(5):"RIF STUDIO";
  $("oti").textContent=q?"검색 결과":title;
  if(!q&&!osel){$("ecnt").textContent="";g.append(el("p",{className:"note",style:"padding:30px 4px",textContent:"왼쪽에서 RIF STUDIO → 부서 → 팀을 눌러 사원을 확인하세요."}));return}
  $("ecnt").textContent="총 "+l.length+"명 · 이름을 누르면 연락처가 나와요";
  if(!l.length){g.append(el("p",{className:"note",style:"padding:20px 4px",textContent:"해당하는 사원이 없어요."}));return}
  const PO=["대표이사","이사","팀장","팀원"],RK=["수석","차석","책임","사원"],ix=(a,v)=>{const i=a.indexOf(v);return i<0?99:i};
  l.sort((a,b)=>ix(PO,a.pos)-ix(PO,b.pos)||ix(RK,a.rnk)-ix(RK,b.rnk)||String(a.emp).localeCompare(String(b.emp)));
  const tb=el("tbody");
  l.forEach(r=>{const has=r.avatar&&urls[r.avatar],av=el("span",{className:"avs l"});if(has)avatar(av,r.avatar,"");else av.textContent=ini(r.nickname||r.name);
    const nm=el("td",{},[el("b",{textContent:r.nickname||r.name}),...(r.nickname&&r.name?[el("span",{className:"note",textContent:" "+r.name})]:[])]);
    const tr=el("tr",{},[el("td",{},[av]),nm,el("td",{textContent:r.pos}),el("td",{textContent:r.rnk}),el("td",{className:"dt",textContent:r.emp||"-"}),el("td",{textContent:r.discord}),el("td",{textContent:r.twitter}),el("td",{style:"min-width:220px;white-space:pre-wrap",textContent:r.duties||""})]);
    tr.onclick=()=>showPerson(r);tb.append(tr)});
  g.append(el("div",{style:"overflow-x:auto;border:1px solid #7773;border-radius:6px"},[el("table",{className:"jt",id:"etbl"},[el("thead",{},[el("tr",{},["","이름","직책","직위","사번","Discord","X","업무 내용"].map(t=>el("th",{textContent:t})))]),tb])]))}
function showPerson(r){const has=r.avatar&&urls[r.avatar],av=el("div",{className:"av"});if(has)avatar(av,r.avatar,"");else av.textContent=ini(r.nickname||r.name);
  const rows=[["사번",r.emp||"-"],["부서",[r.division,r.team].filter(Boolean).join(" · ")||"-"],["직책·직위",[r.pos,r.rnk].filter(Boolean).join(" · ")||"-"],["전화",r.phone||"-"],["이메일",r.email],["Discord",r.discord||"-"],["X",r.twitter||"-"],["업무 내용",r.duties||"-"]];
  $("pmb").replaceChildren(el("div",{className:"pfx"},[av,el("div",{},[el("b",{textContent:r.nickname||r.name}),el("span",{textContent:r.nickname&&r.name?r.name:""})])]),el("dl",{className:"prl"},rows.flatMap(([k,v])=>[el("dt",{textContent:k}),el("dd",{textContent:v})])));
  $("pm").hidden=false}
$("pmx").onclick=()=>{$("pm").hidden=true};$("pm").onclick=e=>{if(e.target===$("pm"))$("pm").hidden=true};document.addEventListener("keydown",e=>{if(e.key==="Escape")$("pm").hidden=true});
$("eq").oninput=drawDir;
$("pf").onsubmit=async e=>{e.preventDefault();const {error}=await db.rpc("set_my_profile",{p_nick:$("pfnk").value,p_discord:$("pfdc").value,p_twitter:$("pftw").value,p_duties:$("pfdu").value});
  msg("pfmsg",error?"저장하지 못했어요":"저장했어요 ✓",!!error);if(!error)loadDir()};
$("pfpick").onclick=()=>$("pfile").click();
function shrink(f){return new Promise((res,rej)=>{const im=new Image(),u=URL.createObjectURL(f);im.onload=()=>{const S=512,k=Math.min(1,S/Math.min(im.width,im.height)),w=Math.round(im.width*k),h=Math.round(im.height*k);
  const side=Math.min(w,h),c=document.createElement("canvas");c.width=c.height=side;const x=c.getContext("2d");x.drawImage(im,(w-side)/2/k,(h-side)/2/k,side/k,side/k,0,0,side,side);
  URL.revokeObjectURL(u);c.toBlob(b=>b?res(b):rej(),"image/jpeg",0.85)};im.onerror=()=>rej();im.src=u})}
$("pfile").onchange=async()=>{const f=$("pfile").files[0];$("pfile").value="";if(!f)return;
  if(!/^image\/(jpeg|png|webp)$/.test(f.type))return msg("pfm2","jpg·png·webp 사진만 올릴 수 있어요.",1);
  msg("pfm2","올리는 중…");let blob;try{blob=await shrink(f)}catch(_){return msg("pfm2","사진을 읽지 못했어요.",1)}
  const mine=dir.find(r=>r.email.toLowerCase()===me)||{},old=mine.avatar;
  const path=uid+"/"+Date.now()+".jpg";
  const {error}=await db.storage.from("avatars").upload(path,blob,{contentType:"image/jpeg"});if(error)return msg("pfm2","올리지 못했어요.",1);
  const {error:e2}=await db.rpc("set_my_avatar",{p_path:path});if(e2){await db.storage.from("avatars").remove([path]);return msg("pfm2","저장하지 못했어요.",1)}
  if(old)await db.storage.from("avatars").remove([old]);msg("pfm2","바꿨어요 ✓");loadDir()};
$("pfdel").onclick=async()=>{const mine=dir.find(r=>r.email.toLowerCase()===me)||{};if(!mine.avatar)return;if(!confirm("프로필 사진을 지울까요?"))return;
  await db.rpc("set_my_avatar",{p_path:""});await db.storage.from("avatars").remove([mine.avatar]);loadDir()};

/* 채팅 */
let rooms=[],roomMem={};
let chatMsgs=[],chatSub=null,chatOpen=false,chatTimer=null,chatStarted=false,chatTo="";
const seenKey=()=>"rif_chat_seen2_"+me;
const getSeenMap=()=>{try{return JSON.parse(localStorage.getItem(seenKey())||"{}")||{}}catch(_){return {}}};
const setSeenFor=(k,n)=>{try{const m=getSeenMap();m[k]=n;localStorage.setItem(seenKey(),JSON.stringify(m))}catch(_){}};
const dispName=e=>{const r=dir.find(x=>x.email.toLowerCase()===String(e).toLowerCase());return r?(r.nickname||r.name):e};
const dayStr=s=>new Date(s).toLocaleDateString("ko-KR",{year:"numeric",month:"long",day:"numeric",weekday:"short"});
const convKey=m=>{if(m.room_id)return "room:"+m.room_id;if(!m.to_email)return "";return m.author_email.toLowerCase()===me?m.to_email.toLowerCase():m.author_email.toLowerCase()};
const convMsgs=k=>chatMsgs.filter(m=>convKey(m)===k);
const convUnread=k=>{const sn=Number(getSeenMap()[k])||0;return convMsgs(k).filter(m=>m.id>sn&&m.author_email.toLowerCase()!==me).length};
function chatBadge(){let un=0;const keys=new Set(chatMsgs.map(convKey));keys.forEach(k=>{if(chatOpen&&k===chatTo)return;un+=convUnread(k)});$("cb").hidden=!un;$("cb").textContent=un>99?"99+":un}
function markSeen(){const l=convMsgs(chatTo);setSeenFor(chatTo,l.length?l[l.length-1].id:0)}
function drawPeople(){const box=$("cp");box.replaceChildren();
  const q=($("cq").value||"").trim().toLowerCase();
  const roomItems=rooms.map(r=>({k:"room:"+r.id,name:r.name,sub:"👥 "+((roomMem[r.id]||[]).length+1)+"명",room:r}));
  const items=[{k:"",name:"전체 채팅",sub:"모든 사원"}].concat(roomItems.filter(it=>!q||it.name.toLowerCase().includes(q))).concat(dir.filter(r=>r.email.toLowerCase()!==me&&(!q||[r.name,r.nickname,r.email].join(" ").toLowerCase().includes(q))).map(r=>({k:r.email.toLowerCase(),name:r.nickname||r.name,sub:[r.pos,r.rnk].filter(Boolean).join(" · "),r})));
  if(canLead()){const nb=el("button",{type:"button",className:"cpi cnew",textContent:"＋ 새 팀 채팅방 만들기"});nb.onclick=()=>roomDlg(null);box.prepend(nb)}
  items.forEach(it=>{const av=el("span",{className:"avs l"});
    if(it.r&&it.r.avatar&&urls[it.r.avatar])avatar(av,it.r.avatar,"");else av.textContent=it.r?ini(it.name):it.room?"👥":"#";
    const un=convUnread(it.k);
    const b=el("button",{type:"button",className:"cpi"+(chatTo===it.k?" on":"")},[av,el("span",{className:"cpt"},[el("b",{textContent:it.name}),el("span",{className:"note",textContent:it.sub})]),...(un&&!(chatOpen&&chatTo===it.k)?[el("span",{className:"cbd",textContent:un>99?"99+":un})]:[])]);
    b.onclick=()=>{chatTo=it.k;markSeen();drawPeople();drawChat(true);$("ci").focus()};box.append(b)})}
function drawChat(stick){const box=$("cl"),near=box.scrollHeight-box.scrollTop-box.clientHeight<80;box.replaceChildren();let lastDay="";
  const to=chatTo?dir.find(x=>x.email.toLowerCase()===chatTo):null;
  const rm=curRoom();
  $("ch2").replaceChildren(el("span",{textContent:rm?"👥 "+rm.name+" · "+[rm.owner_email,...(roomMem[rm.id]||[])].map(dispName).join(", "):chatTo?(to?(to.nickname||to.name):chatTo)+" 님과의 1:1 대화":"전체 채팅 · 모든 사원이 볼 수 있어요"}));
  if(rm&&(rm.owner_email.toLowerCase()===me||ceo)){const mb=el("button",{type:"button",className:"ob2",textContent:"멤버 관리"});mb.onclick=()=>roomDlg(rm);const db2=el("button",{type:"button",className:"ob2",textContent:"방 삭제"});
    db2.onclick=async()=>{if(!confirm("'"+rm.name+"' 채팅방을 삭제할까요?\n대화 내용도 모두 사라지고 되돌릴 수 없어요."))return;const {error}=await db.rpc("chat_room_delete",{p_id:rm.id});if(error)return alert("삭제하지 못했어요");chatTo="";await loadRooms();await loadChat(true)};$("ch2").append(mb,db2)}
  $("ci").placeholder=rm?"채팅방 멤버 모두에게 보내요 (Enter 보내기 · Shift+Enter 줄바꿈)":chatTo?"이 사원에게만 보내요 (Enter 보내기 · Shift+Enter 줄바꿈)":"전체에게 보내요 (Enter 보내기 · Shift+Enter 줄바꿈)";
  const list=convMsgs(chatTo);
  if(!list.length)box.append(el("div",{className:"cday",textContent:chatTo?"아직 대화가 없어요. 먼저 말을 걸어 보세요.":"아직 메시지가 없어요."}));
  list.forEach(m=>{const d=dayStr(m.created_at);if(d!==lastDay){lastDay=d;box.append(el("div",{className:"cday",textContent:d}))}
    const mine=m.author_email.toLowerCase()===me,rr=dir.find(x=>x.email.toLowerCase()===m.author_email.toLowerCase());
    const av=el("span",{className:"avs l"});if(rr&&rr.avatar&&urls[rr.avatar])avatar(av,rr.avatar,"");else av.textContent=ini(rr?(rr.nickname||rr.name):m.author_name);
    const tm=new Date(m.created_at).toLocaleTimeString("ko-KR",{hour:"numeric",minute:"2-digit"});
    const body=el("div",{},[...(mine?[]:[el("div",{className:"cn",textContent:rr?(rr.nickname||rr.name):m.author_name})]),el("div",{className:"cb2",textContent:m.body})]);
    const row=el("div",{className:"cm"+(mine?" me":"")},[...(mine?[]:[av]),body,el("span",{className:"ct",textContent:tm})]);
    const rmo=m.room_id&&rooms.find(x=>x.id===m.room_id);if(mine||(ceo&&!m.to_email)||(rmo&&rmo.owner_email.toLowerCase()===me)){row.title="더블클릭하면 삭제";row.ondblclick=async()=>{if(!confirm("이 메시지를 삭제할까요?"))return;await db.from("chat_messages").delete().eq("id",m.id);chatMsgs=chatMsgs.filter(x=>x.id!==m.id);drawChat()}}
    box.append(row)});
  if(stick||near)box.scrollTop=box.scrollHeight;chatBadge()}
const curRoom=()=>chatTo.startsWith("room:")?rooms.find(r=>"room:"+r.id===chatTo)||null:null;
const canLead=()=>ceo||(dir.find(x=>x.email.toLowerCase()===me)||{}).pos==="팀장"||(dir.find(x=>x.email.toLowerCase()===me)||{}).pos==="대표이사";
async function loadRooms(){const [a,b]=await Promise.all([db.from("chat_rooms").select("id,name,owner_email").order("id"),db.from("chat_room_members").select("room_id,email")]);
  if(a.error)return;rooms=a.data||[];roomMem={};(b.data||[]).forEach(x=>(roomMem[x.room_id]=roomMem[x.room_id]||[]).push(x.email));
  if(chatTo.startsWith("room:")&&!curRoom())chatTo=""}
function roomDlg(rm){
  const old=document.getElementById("rmdlg");if(old)old.remove();
  const sel=new Set(rm?(roomMem[rm.id]||[]).map(e=>e.toLowerCase()):[]);
  const nm=el("input",{value:rm?rm.name:"",maxLength:60,placeholder:"예: 사운드제작팀 채팅방"});
  const q=el("input",{type:"search",placeholder:"사원 검색"});const lst=el("div",{className:"rml"});const cnt=el("span",{className:"note"});
  const myT=(dir.find(x=>x.email.toLowerCase()===me)||{}).team||"";
  const draw=()=>{lst.replaceChildren();const k=q.value.trim().toLowerCase();
    dir.filter(r=>r.email.toLowerCase()!==me&&(!k||[r.name,r.nickname,r.team].join(" ").toLowerCase().includes(k))).forEach(r=>{
      const cb=el("input",{type:"checkbox",checked:sel.has(r.email.toLowerCase())});cb.onchange=()=>{cb.checked?sel.add(r.email.toLowerCase()):sel.delete(r.email.toLowerCase());cnt.textContent="초대 "+sel.size+"명"};
      lst.append(el("label",{className:"rmi"},[cb,el("span",{textContent:(r.nickname||r.name)+(r.team?" · "+r.team:"")+(r.rnk?" · "+r.rnk:"")})]))});cnt.textContent="초대 "+sel.size+"명"};
  q.oninput=draw;draw();
  const tm=myT?el("button",{type:"button",className:"ob2",textContent:"내 팀("+myT+") 전원 선택"}):null;
  if(tm)tm.onclick=()=>{dir.filter(r=>r.team===myT&&r.email.toLowerCase()!==me).forEach(r=>sel.add(r.email.toLowerCase()));draw()};
  const msgx=el("span",{className:"note"});const ok=el("button",{type:"button",className:"btn mred",textContent:rm?"저장":"만들기"}),cx=el("button",{type:"button",className:"btn",textContent:"취소"});
  const wrap=el("div",{className:"mod",id:"rmdlg"},[el("div",{className:"mbox wd"},[el("h2",{textContent:rm?"채팅방 멤버 관리":"새 팀 채팅방",style:"margin-top:0"}),el("label",{className:"rmn"},[document.createTextNode("방 이름"),nm]),q,...(tm?[tm]:[]),lst,el("div",{className:"wr",style:"justify-content:space-between;align-items:center;gap:10px"},[cnt,msgx,el("span",{},[cx,document.createTextNode(" "),ok])])])]);
  cx.onclick=()=>wrap.remove();wrap.addEventListener("click",e=>{if(e.target===wrap)wrap.remove()});
  ok.onclick=async()=>{const n=nm.value.trim();if(!n){msgx.textContent="방 이름을 써 주세요.";return}ok.disabled=true;msgx.textContent="저장 중…";
    const {data,error}=await db.rpc("chat_room_save",{p_id:rm?rm.id:null,p_name:n,p_members:[...sel]});ok.disabled=false;
    if(error){msgx.textContent="저장하지 못했어요 (권한을 확인해 주세요)";return}wrap.remove();await loadRooms();if(!rm)chatTo="room:"+data;drawPeople();await loadChat(true)};
  document.body.append(wrap);nm.focus()}
async function loadChat(stick){await loadRooms();const {data}=await db.from("chat_messages").select("id,author_email,author_name,body,created_at,to_email,room_id").order("id",{ascending:false}).limit(500);
  if(!data)return;chatMsgs=data.reverse();if(chatOpen)markSeen();drawPeople();drawChat(stick)}
function startChat(){if(chatStarted)return;chatStarted=true;loadChat(true);
  try{chatSub=db.channel("chat-room").on("postgres_changes",{event:"*",schema:"public",table:"chat_messages"},()=>loadChat(false)).subscribe()}catch(_){}
  chatTimer=setInterval(()=>loadChat(false),8000)}
function openChat(){chatOpen=true;markSeen();drawPeople();drawChat(true);chatBadge();const b=$("cl");setTimeout(()=>{b.scrollTop=b.scrollHeight},30);$("ci").focus()}
document.querySelectorAll("#tabs button").forEach(b=>b.addEventListener("click",()=>{if(b.dataset.t!=="c"){chatOpen=false;chatBadge()}}));
$("cq").oninput=drawPeople;
async function sendChat(){const t=$("ci").value.trim();if(!t)return;$("ci").value="";
  const row={author_email:me,author_name:myName,body:t.slice(0,2000)};if(chatTo.startsWith("room:"))row.room_id=Number(chatTo.slice(5));else if(chatTo)row.to_email=chatTo;
  const {error}=await db.from("chat_messages").insert(row);
  if(error){$("ci").value=t;alert("보내지 못했어요");return}await loadChat(true)}
$("cf2").onsubmit=e=>{e.preventDefault();sendChat()};
$("ci").onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();sendChat()}};

/* 탭 */
const P={b:"pb",t:"pt",i:"pi",c:"pc",e:"pe",s:"ps"};
document.querySelectorAll("#tabs button").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("#tabs button").forEach(x=>x.setAttribute("aria-pressed",x===b));
  Object.entries(P).forEach(([k,id])=>$(id).hidden=k!==b.dataset.t);if(b.dataset.t==="c")openChat()});
document.querySelectorAll("#sub button").forEach(b=>b.onclick=()=>{document.querySelectorAll("#sub button").forEach(x=>x.setAttribute("aria-pressed",x===b));$("pn").hidden=b.dataset.s!=="pn";$("pd").hidden=b.dataset.s!=="pd"});

/* 로그인·가입 */
$("login").onsubmit=async e=>{e.preventDefault();const {error}=await db.auth.signInWithPassword({email:toEmail($("em").value),password:$("pw").value});
  $("lmsg").textContent=error?"로그인 실패 — 이메일과 비밀번호를 확인해 주세요":"";$("pw").value="";render()};
$("out").onclick=async e=>{e.preventDefault();await db.auth.signOut();render()};
$("signup").onsubmit=async e=>{e.preventDefault();const m=$("smsg");
  if($("spw").value!==$("spw2").value){m.textContent="비밀번호 확인이 달라요";return}
  const b=$("sgo");b.disabled=true;m.className="note";m.textContent="가입 중…";
  let ok=false,msg2="";
  try{const {data,error}=await db.functions.invoke("staff-signup",{body:{empNo:$("sn").value.trim(),name:$("sna").value,nickname:$("snk").value,phone:$("sph").value,loginId:$("sid").value,discord:$("sdc").value,twitter:$("stw").value,password:$("spw").value}});
    if(error){try{msg2=(await error.context.json()).error}catch(_){msg2=error.message}}else if(data&&data.ok)ok=true;else msg2=(data&&data.error)||"알 수 없는 오류"}catch(x){msg2=String(x.message||x)}
  b.disabled=false;
  if(!ok){m.className="note err";m.textContent=msg2;return}
  const {error}=await db.auth.signInWithPassword({email:toEmail($("sid").value),password:$("spw").value});
  $("spw").value="";$("spw2").value="";m.textContent=error?"가입은 됐어요. 위에서 로그인해 주세요.":"";render()};
const qn=new URLSearchParams(location.search).get("n");if(qn&&/^\d{8}$/.test(qn)){$("sn").value=qn;$("sg").open=true}
render();
})();
