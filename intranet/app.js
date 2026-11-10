(()=>{
const $=i=>document.getElementById(i);
const toEmail=v=>{v=v.trim().toLowerCase();return v.includes("@")?v:v+"@rif-studio.com"};
const fd=s=>s?new Date(s).toLocaleDateString("ko-KR"):"";
const sz=n=>n>1048576?(n/1048576).toFixed(1)+"MB":Math.max(1,Math.round(n/1024))+"KB";
let me="",uid="",myName="",ceo=false,staff=[],reads=new Set(),notices=[],tasks=[],docs=[];
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
  myName=st.name;$("nf").hidden=!ceo;
  await loadStaff();await loadAll()}
async function loadStaff(){const {data}=await db.rpc("staff_list");staff=data||[];
  $("ta").replaceChildren(el("option",{value:"",textContent:"미지정"}),...staff.map(x=>el("option",{value:x.email,textContent:x.name||x.email})))}
async function loadAll(){await Promise.all([loadNotices(),loadTasks(),loadDocs(),loadDir(),loadInbox()])}

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
    if(ceo){
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
  const {error}=await db.from("notices").insert({title:t,body:$("nbd").value.trim(),pinned:$("npin").checked,author_name:myName});
  if(error)return msg("nmsg","올리지 못했어요",1);$("nt").value="";$("nbd").value="";$("npin").checked=false;msg("nmsg","올렸어요 ✓");loadNotices()};

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
  $("dt").value="";$("dn").value="";$("dfile").value="";msg("dmsg","올렸어요 ✓");loadDocs()};

/* 받은편지함 (support@) */
let inbox=[],irds=new Set(),irdBy={};
const ft=s=>s?new Date(s).toLocaleString("ko-KR",{dateStyle:"short",timeStyle:"short"}):"";
async function loadInbox(){
  const [a,b]=await Promise.all([db.from("inbox_messages").select("id,from_addr,from_name,to_addrs,subject,received_at,assignee_email,done,attachments").order("received_at",{ascending:false}).limit(300),db.from("inbox_reads").select("msg_id,email")]);
  inbox=a.data||[];irds=new Set();irdBy={};
  (b.data||[]).forEach(r=>{if(r.email.toLowerCase()===me)irds.add(r.msg_id);(irdBy[r.msg_id]=irdBy[r.msg_id]||[]).push(r.email)});
  drawInbox()}
function ibadge(){const n=inbox.filter(m=>!irds.has(m.id)&&!m.done).length;$("ib").hidden=!n;$("ib").textContent=n}
function drawInbox(){
  const box=$("il");box.replaceChildren();ibadge();
  const list=inbox.filter(m=>!($("ihide").checked&&m.done));
  list.forEach(m=>{
    const isNew=!irds.has(m.id);
    const h=el("h3",{},[document.createTextNode((m.subject||"(제목 없음)")),...(isNew?[el("span",{className:"new",textContent:"NEW"})]:[]),...(m.done?[el("span",{className:"rb off",textContent:"완료",style:"margin-left:8px"})]:[])]);
    const meta=el("div",{className:"meta",textContent:(m.from_name?m.from_name+" ":"")+"<"+m.from_addr+"> · "+ft(m.received_at)+(m.assignee_email?" · 담당 "+nameOf(m.assignee_email):"")});
    const body=el("div",{hidden:true});
    const card=el("div",{className:"card"+(isNew?" unread":"")},[h,meta,body]);
    let loaded=false;
    h.onclick=async()=>{body.hidden=!body.hidden;if(body.hidden)return;
      if(!loaded){loaded=true;body.textContent="불러오는 중…";
        const {data,error}=await db.from("inbox_messages").select("body_text,body_html").eq("id",m.id).single();
        body.replaceChildren();if(error||!data){body.textContent="본문을 불러오지 못했어요";loaded=false;return}
        const f=document.createElement("iframe");f.setAttribute("sandbox","");f.style.cssText="width:100%;min-height:320px;border:1px solid #7773;border-radius:10px;background:#fff";
        if(data.body_html){f.srcdoc='<base target="_blank"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src https: data: cid:; style-src \'unsafe-inline\'"><body style="font:14px/1.6 sans-serif;margin:12px;color:#222">'+data.body_html}
        else f.srcdoc='<body style="font:14px/1.6 sans-serif;margin:12px;white-space:pre-wrap;color:#222">'+(data.body_text||"").replace(/&/g,"&amp;").replace(/</g,"&lt;");
        f.onload=()=>{try{f.style.height=Math.min(900,f.contentDocument.documentElement.scrollHeight+20)+"px"}catch(_){}};
        body.append(f);
        if((m.attachments||[]).length)body.append(el("div",{className:"note",textContent:"첨부 "+m.attachments.length+"개: "+m.attachments.map(a=>a.filename).join(", ")+" (첨부 파일은 Resend 대시보드에서 확인)"}));
        const acts=el("div",{className:"jbar"});
        const rp=el("a",{className:"btn small mred",textContent:"답장",href:"../mail/?to="+encodeURIComponent(m.from_addr)+"&s="+encodeURIComponent(/^re:/i.test(m.subject)?m.subject:"Re: "+m.subject)+"&q="+encodeURIComponent((data.body_text||"").trim().slice(0,1500))});
        const as=el("select",{},[el("option",{value:"",textContent:"담당자 미지정"}),...staff.map(x=>el("option",{value:x.email,textContent:x.name||x.email,selected:x.email.toLowerCase()===(m.assignee_email||"").toLowerCase()}))]);
        as.onchange=async()=>{const {error}=await db.from("inbox_messages").update({assignee_email:as.value}).eq("id",m.id);if(error)alert("바꾸지 못했어요");else{m.assignee_email=as.value;meta.textContent=meta.textContent.replace(/ · 담당 .*$/,"")+(as.value?" · 담당 "+nameOf(as.value):"")}};
        const dn=el("button",{className:"btn small",type:"button",textContent:m.done?"완료 취소":"완료 처리"});
        dn.onclick=async()=>{const v=!m.done;const {error}=await db.from("inbox_messages").update({done:v}).eq("id",m.id);if(error)return alert("바꾸지 못했어요");m.done=v;drawInbox()};
        acts.append(rp,as,dn);
        if(ceo){const x=el("button",{className:"btn small",type:"button",textContent:"삭제"});x.onclick=async()=>{if(!confirm("이 메일을 삭제할까요? 되돌릴 수 없어요."))return;await db.from("inbox_messages").delete().eq("id",m.id);loadInbox()};acts.append(x);
          acts.append(el("span",{className:"note",textContent:"읽은 사람: "+((irdBy[m.id]||[]).map(nameOf).join(", ")||"아직 없음")}))}
        body.append(acts)}
      if(!irds.has(m.id)){irds.add(m.id);card.classList.remove("unread");const nw=h.querySelector(".new");if(nw)nw.remove();ibadge();
        await db.from("inbox_reads").upsert({msg_id:m.id,email:me},{onConflict:"msg_id,email",ignoreDuplicates:true})}};
    box.append(card)});
  if(!list.length)box.append(el("p",{className:"note",textContent:"받은 메일이 없어요."}))}
$("ihide").onchange=drawInbox;$("irf").onclick=loadInbox;

/* 직원 · 프로필 */
let dir=[],urls={};
const ini=s=>(String(s||"?").trim()[0]||"?").toUpperCase();
function avatar(node,path,name){node.textContent="";node.style.backgroundImage="";if(path&&urls[path])node.style.backgroundImage='url("'+encodeURI(urls[path])+'")';else node.textContent=ini(name)}
async function loadDir(){const {data}=await db.rpc("staff_directory");dir=data||[];
  const paths=[...new Set(dir.map(r=>r.avatar).filter(Boolean))];urls={};
  if(paths.length){const {data:u}=await db.storage.from("avatars").createSignedUrls(paths,3600);(u||[]).forEach(x=>{if(x.signedUrl)urls[x.path]=x.signedUrl})}
  const mine=dir.find(r=>r.email.toLowerCase()===me)||{};
  avatar($("pfav"),mine.avatar,mine.name);$("pfnk").value=mine.nickname||"";$("pfdc").value=mine.discord||"";$("pftw").value=mine.twitter||"";
  drawDir()}
const GROUPS=[["경영부",r=>r.division==="경영부"],["프로덕션부 · 보컬팀",r=>r.team==="보컬팀"],["프로덕션부 · 사운드제작팀",r=>r.team==="사운드제작팀"],["프로덕션부 · 일러스트팀",r=>r.team==="일러스트팀"],["프로덕션부 · 매니지먼트팀",r=>r.team==="매니지먼트팀"],["프로덕션부 (팀 미배정)",r=>r.division==="프로덕션부"&&!r.team],["미배정",r=>!r.division&&!r.team]];
function drawDir(){const g=$("dirg");g.replaceChildren();
  GROUPS.forEach(([label,fn])=>{const l=dir.filter(fn);if(!l.length)return;g.append(el("h3",{className:"dh",textContent:label+" ("+l.length+")"}));
    l.forEach(r=>{const av=el("div",{className:"av"});avatar(av,r.avatar,r.nickname||r.name);
      const lines=[];if(r.email)lines.push(r.email);if(r.discord)lines.push("Discord: "+r.discord);if(r.twitter)lines.push("X: "+r.twitter);
      g.append(el("div",{className:"pc"},[av,el("div",{},[el("b",{textContent:r.name+(r.nickname?" ("+r.nickname+")":"")}),el("div",{className:"t",textContent:[r.pos,r.rnk].filter(Boolean).join(" · ")||" "}),el("div",{className:"m",textContent:lines.join("\n"),style:"white-space:pre-line"})])]))})});
  if(!dir.length)g.append(el("p",{className:"note",textContent:"직원이 없어요."}))}
$("pf").onsubmit=async e=>{e.preventDefault();const {error}=await db.rpc("set_my_profile",{p_nick:$("pfnk").value,p_discord:$("pfdc").value,p_twitter:$("pftw").value});
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

/* 탭 */
const P={n:"pn",t:"pt",i:"pi",d:"pd",s:"ps"};
document.querySelectorAll("#tabs button").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("#tabs button").forEach(x=>x.setAttribute("aria-pressed",x===b));
  Object.entries(P).forEach(([k,id])=>$(id).hidden=k!==b.dataset.t)});

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
