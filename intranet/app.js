(()=>{
const $=i=>document.getElementById(i);
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
async function loadAll(){await Promise.all([loadNotices(),loadTasks(),loadDocs(),loadDir()])}

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

/* 직원 */
async function loadDir(){const {data}=await db.rpc("staff_directory");const tb=$("stb2");tb.replaceChildren();
  (data||[]).forEach(r=>tb.append(el("tr",{},[el("td",{textContent:r.name}),el("td",{textContent:r.nickname}),el("td",{textContent:r.pos}),el("td",{textContent:r.dept}),el("td",{},[el("a",{href:"mailto:"+r.email,textContent:r.email})])])));
  if(!(data||[]).length)tb.append(el("tr",{},[el("td",{colSpan:5,textContent:"직원이 없어요."})]))}

/* 탭 */
const P={n:"pn",t:"pt",d:"pd",s:"ps"};
document.querySelectorAll("#tabs button").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("#tabs button").forEach(x=>x.setAttribute("aria-pressed",x===b));
  Object.entries(P).forEach(([k,id])=>$(id).hidden=k!==b.dataset.t)});

/* 로그인·가입 */
$("login").onsubmit=async e=>{e.preventDefault();const {error}=await db.auth.signInWithPassword({email:$("em").value.trim(),password:$("pw").value});
  $("lmsg").textContent=error?"로그인 실패 — 이메일과 비밀번호를 확인해 주세요":"";$("pw").value="";render()};
$("out").onclick=async e=>{e.preventDefault();await db.auth.signOut();render()};
$("signup").onsubmit=async e=>{e.preventDefault();const m=$("smsg");
  if($("spw").value!==$("spw2").value){m.textContent="비밀번호 확인이 달라요";return}
  const b=$("sgo");b.disabled=true;m.className="note";m.textContent="가입 중…";
  let ok=false,msg2="";
  try{const {data,error}=await db.functions.invoke("staff-signup",{body:{empNo:$("sn").value.trim(),name:$("sna").value,nickname:$("snk").value,phone:$("sph").value,email:$("sem").value,password:$("spw").value}});
    if(error){try{msg2=(await error.context.json()).error}catch(_){msg2=error.message}}else if(data&&data.ok)ok=true;else msg2=(data&&data.error)||"알 수 없는 오류"}catch(x){msg2=String(x.message||x)}
  b.disabled=false;
  if(!ok){m.className="note err";m.textContent=msg2;return}
  const {error}=await db.auth.signInWithPassword({email:$("sem").value.trim(),password:$("spw").value});
  $("spw").value="";$("spw2").value="";m.textContent=error?"가입은 됐어요. 위에서 로그인해 주세요.":"";render()};
const qn=new URLSearchParams(location.search).get("n");if(qn&&/^\d{8}$/.test(qn)){$("sn").value=qn;$("sg").open=true}
render();
})();
