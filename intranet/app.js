(()=>{
const $=i=>document.getElementById(i);
const toEmail=v=>{v=v.trim().toLowerCase();return v.includes("@")?v:v+"@rif-studio.com"};
const fd=s=>s?new Date(s).toLocaleDateString("ko-KR"):"";
const sz=n=>n>1048576?(n/1048576).toFixed(1)+"MB":Math.max(1,Math.round(n/1024))+"KB";
let me="",myAddrs=[],sendAs="",uid="",myName="",ceo=false,exec=false,staff=[],reads=new Set(),notices=[],tasks=[],docs=[];
const CEO="takanashi@rif-studio.com";
const msg=(id,t,bad)=>{const m=$(id);m.className="note"+(bad?" err":"");m.textContent=t};
const nameOf=e=>(staff.find(s=>s.email.toLowerCase()===String(e).toLowerCase())||{}).name||e;
let mySig={html:"",text:""};
async function render(){
  const {data}=await db.auth.getSession(),s=data.session;
  $("login").hidden=!!s;$("sg").hidden=!!s;$("app").hidden=!s;
  if(!s){RIFMAIL.reset();return}
  me=(s.user.email||"").toLowerCase();uid=s.user.id;ceo=me===CEO;$("who").textContent=s.user.email;
  const {data:st}=await db.from("mail_staff").select("email,name,send_as,aliases,signature,signature_html").maybeSingle();
  $("box").hidden=!st;$("nomail").hidden=!!st;if(!st)return;
  myAddrs=[me,...(st.aliases||[]).map(a=>String(a).toLowerCase()).filter(Boolean)];sendAs=(st.send_as||"").toLowerCase()||me;
  myName=st.name;mySig={html:(st.signature_html||"").trim(),text:(st.signature||"").trim()};{const {data:ex}=await db.rpc("is_exec");exec=!!ex||ceo}$("nw").hidden=!exec;
  await loadStaff();await loadAll()}
async function loadStaff(){const {data}=await db.rpc("staff_list");staff=data||[];
  $("ta").replaceChildren(el("option",{value:"",textContent:"미지정"}),...staff.map(x=>el("option",{value:x.email,textContent:x.name||x.email})))}
async function loadAll(){await Promise.all([loadNotices(),loadTasks(),loadDocs(),loadDir()]);RIFMAIL.init(X);startChat()}

/* 작성 팝업 */
let wmForm=null;
function openWm(id){wmForm=$(id);$("wmb").replaceChildren(wmForm);$("wm").hidden=false;const f=wmForm.querySelector("input");if(f)f.focus()}
function closeWm(){$("wm").hidden=true;if(wmForm){$("forms").append(wmForm);wmForm=null}}
$("nw").onclick=()=>openWm("nf");$("dw").onclick=()=>openWm("df");$("tadd").onclick=()=>openWm("tf");$("wmx").onclick=closeWm;$("wm").onclick=e=>{if(e.target===$("wm"))closeWm()};
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeWm()});
let toastT=null;
function toast(t){const e=$("toast");if(!e)return;e.textContent=t;e.classList.add("on");clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove("on"),2600)}
/* 공지 — 제목은 한 줄, 누르면 아래로 펼쳐져요 */
async function loadNotices(){
  const [a,b]=await Promise.all([db.from("notices").select("*").order("pinned",{ascending:false}).order("created_at",{ascending:false}).limit(200),db.from("notice_reads").select("notice_id,email,read_at")]);
  notices=a.data||[];const rd=b.data||[];
  reads=new Set(rd.filter(r=>r.email.toLowerCase()===me).map(r=>r.notice_id));
  const byN={};rd.forEach(r=>(byN[r.notice_id]=byN[r.notice_id]||[]).push(r.email));
  drawNotices(byN)}
function noticeCount(){const un=notices.filter(n=>!reads.has(n.id)).length;$("nb").hidden=!un;$("nb").textContent=un;$("ncnt").textContent="공지 "+notices.length+"건"+(un?" · 안 읽은 공지 "+un+"건":"")}
function drawNotices(byN){
  const box=$("nl");box.replaceChildren();noticeCount();
  if(!notices.length){box.append(el("p",{className:"empty",textContent:"아직 공지가 없어요."}));return}
  const list=el("div",{className:"nlist"});box.append(list);
  notices.forEach(n=>{
    const isNew=!reads.has(n.id),cr=el("span",{className:"cr",textContent:"▸"});
    const h=el("button",{type:"button",className:"nh"},[cr,el("span",{className:"ntx",textContent:(n.pinned?"📌 ":"")+n.title,title:n.title}),...(isNew?[el("span",{className:"new",textContent:"NEW"})]:[]),el("span",{className:"nm",textContent:n.author_name||""}),...(ceo?[el("span",{className:"nr",textContent:"읽음 "+((byN[n.id]||[]).length)+"/"+staff.length})]:[]),el("span",{className:"nd",textContent:fd(n.created_at)})]);
    const body=el("div",{className:"nb",hidden:true},[el("div",{className:"bodyx",textContent:n.body||"(내용 없음)"})]);
    if(ceo||(exec&&(n.author_email||"").toLowerCase()===me)){
      body.append(el("div",{className:"meta",textContent:"읽은 사람: "+((byN[n.id]||[]).map(nameOf).join(", ")||"아직 없음")}));
      const x=el("button",{type:"button",className:"btn small danger",textContent:"삭제"});x.onclick=async()=>{if(!confirm("이 공지를 삭제할까요?"))return;await db.from("notices").delete().eq("id",n.id);loadNotices()};body.append(x)}
    const row=el("div",{className:"nrow"+(isNew?" unread":"")+(n.pinned?" pin":"")},[h,body]);
    h.onclick=async()=>{const open=body.hidden;body.hidden=!open;row.classList.toggle("open",open);cr.textContent=open?"▾":"▸";
      if(open&&!reads.has(n.id)){reads.add(n.id);row.classList.remove("unread");const nw=h.querySelector(".new");if(nw)nw.remove();
        await db.from("notice_reads").upsert({notice_id:n.id,email:me},{onConflict:"notice_id,email",ignoreDuplicates:true});noticeCount()}};
    list.append(row)})}
$("nf").onsubmit=async e=>{e.preventDefault();const t=$("nt").value.trim();if(!t)return msg("nmsg","제목을 써 주세요.",1);
  const {error}=await db.from("notices").insert({title:t,body:$("nbd").value.trim(),pinned:$("npin").checked,author_name:myName,author_email:me});
  if(error)return msg("nmsg","올리지 못했어요",1);$("nt").value="";$("nbd").value="";$("npin").checked=false;msg("nmsg","");closeWm();toast("공지를 올렸어요 ✓");loadNotices()};

/* 업무 — 한 줄 목록, 누르면 상세가 펼쳐져요 */
const TS=[["todo","할 일"],["doing","진행 중"],["done","완료"]];let tflt="open",openT=null;
async function loadTasks(){const {data}=await db.from("intra_tasks").select("*").order("created_at",{ascending:false}).limit(500);tasks=data||[];drawTasks()}
function drawTasks(){
  const tb=$("ttb"),today=new Date().toISOString().slice(0,10),mine=$("tmine").checked;
  const base=tasks.filter(t=>!mine||(t.assignee_email||"").toLowerCase()===me);
  const cnt=k=>k==="all"?base.length:k==="open"?base.filter(t=>t.status!=="done").length:base.filter(t=>t.status===k).length;
  $("tflt").replaceChildren(...[["open","진행할 업무"],["todo","할 일"],["doing","진행 중"],["done","완료"],["all","전체"]].map(([k,t])=>{const c=el("button",{type:"button",className:"chip"+(tflt===k?" on":""),textContent:t+" "+cnt(k)});c.onclick=()=>{tflt=k;drawTasks()};return c}));
  const list=base.filter(t=>tflt==="all"||(tflt==="open"?t.status!=="done":t.status===tflt));
  list.sort((a,b)=>(a.status==="done")-(b.status==="done")||(a.due||"9999").localeCompare(b.due||"9999")||String(b.created_at).localeCompare(String(a.created_at)));
  $("tcnt").textContent=list.length+"건";tb.replaceChildren();
  list.forEach(t=>{
    const own=(t.created_by||"").toLowerCase()===me,can=ceo||own||(t.assignee_email||"").toLowerCase()===me,od=t.due&&t.status!=="done"&&t.due<today;
    let st;
    if(can){st=el("select",{className:"stsel "+t.status,title:"상태 바꾸기"},TS.map(([v,l])=>el("option",{value:v,textContent:l,selected:v===t.status})));
      st.onclick=e=>e.stopPropagation();
      st.onchange=async()=>{const {error}=await db.from("intra_tasks").update({status:st.value,updated_at:new Date().toISOString()}).eq("id",t.id);if(error)alert("바꾸지 못했어요");loadTasks()}}
    else st=el("span",{className:"rb "+(t.status==="done"?"on":"off"),textContent:(TS.find(x=>x[0]===t.status)||[0,t.status])[1]});
    const acts=[];
    if(ceo||own){const x=el("button",{type:"button",className:"x",textContent:"×",title:"삭제"});x.onclick=async e=>{e.stopPropagation();if(!confirm("'"+t.title+"' 업무를 삭제할까요?"))return;await db.from("intra_tasks").delete().eq("id",t.id);const fp=(t.refs||[]).filter(r=>r.k==="f").map(r=>r.path);if(fp.length)db.storage.from(RBK).remove(fp);loadTasks()};acts.push(x)}
    const tr=el("tr",{className:"r"+(t.status==="done"?" done":"")},[el("td",{},[st]),
      el("td",{className:"tt",title:t.title+(t.detail?" — "+t.detail:"")},[document.createTextNode(t.title),...(t.detail?[el("span",{className:"dn",textContent:"  "+t.detail.replace(/\s+/g," ")})]:[])]),
      el("td",{textContent:t.assignee_name||"미지정"}),el("td",{className:"dt tdue"},[el("span",{className:od?"od":"",textContent:t.due?t.due+(od?" · 지남":""):"-"})]),el("td",{textContent:(t.created_by_name||"")+" · "+fd(t.created_at)}),el("td",{className:"ac"},acts)]);
    const rbox=el("div",{className:"refs"});
    const dtl=el("tr",{className:"d",hidden:openT!==t.id},[el("td",{colSpan:6},[el("p",{textContent:t.detail||"(상세 내용이 없어요)"}),rbox,el("span",{className:"note",textContent:"등록 "+(t.created_by_name||"")+" · "+fd(t.created_at)+(t.assignee_name?" · 담당 "+t.assignee_name:"")})])]);
    if(can){const pdet=dtl.querySelector("p"),eb=el("button",{type:"button",className:"btn small",textContent:"✎ 제목·내용 수정"});
      eb.onclick=e=>{e.stopPropagation();
        const it=el("input",{value:t.title,maxLength:200}),idt=el("textarea",{rows:5,maxLength:5000,value:t.detail||""}),ia=el("select",{},[el("option",{value:"",textContent:"미지정"}),...staff.map(x=>el("option",{value:x.email,textContent:x.name||x.email,selected:(x.email||"").toLowerCase()===(t.assignee_email||"").toLowerCase()}))]),idu=el("input",{type:"date",value:t.due||""});
        const sv=el("button",{type:"button",className:"btn small",textContent:"저장"}),cx=el("button",{type:"button",className:"btn small ghost",textContent:"취소"}),mm=el("span",{className:"note"});
        const f=el("div",{className:"fr tedit"},[el("label",{textContent:"제목"},[it]),el("label",{textContent:"상세"},[idt]),el("div",{className:"row2"},[el("label",{textContent:"담당자"},[ia]),el("label",{textContent:"마감일"},[idu])]),el("div",{className:"jbar"},[sv,cx,mm])]);
        f.onclick=ev=>ev.stopPropagation();
        cx.onclick=()=>drawTasks();
        sv.onclick=async()=>{const nt=it.value.trim();if(!nt){mm.className="note err";mm.textContent="제목을 써 주세요.";return}
          sv.disabled=true;const as=ia.value;
          const {error}=await db.from("intra_tasks").update({title:nt,detail:idt.value.trim(),assignee_email:as,assignee_name:as?nameOf(as):"",due:idu.value||null,updated_at:new Date().toISOString()}).eq("id",t.id);
          if(error){sv.disabled=false;mm.className="note err";mm.textContent="저장하지 못했어요";return}
          toast("수정했어요 ✓");loadTasks()};
        pdet.replaceWith(f);eb.hidden=true;it.focus()};
      pdet.after(eb)}
    if(openT===t.id)fillRefs(t,rbox,can);
    tr.onclick=()=>{dtl.hidden=!dtl.hidden;openT=dtl.hidden?null:t.id;if(!dtl.hidden)fillRefs(t,rbox,can)};
    tb.append(tr,dtl)});
  if(!list.length)tb.append(el("tr",{},[el("td",{colSpan:6,className:"dt",textContent:tflt==="done"?"완료한 업무가 아직 없어요.":"업무가 없어요."})]))}
$("tmine").onchange=drawTasks;
/* 레퍼런스(사진·영상·유튜브) — 파일은 비공개 저장소에 올리고, 볼 때만 잠깐 유효한 주소로 바로 보여줘요 */
const RBK="task-refs",RMAX=50*1024*1024,RTYPES={"image/png":"png","image/jpeg":"jpg","image/gif":"gif","image/webp":"webp","video/mp4":"mp4","video/webm":"webm","video/quicktime":"mov"};
const ytIds=txt=>[...new Set(String(txt||"").split(/[\s,]+/).map(u=>{const m=u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/);return m?m[1]:""}).filter(Boolean))];
async function uploadRefs(files){const out=[];
  for(const f of files){
    const ext=RTYPES[f.type];if(!ext)throw new Error("'"+f.name+"' 은(는) 올릴 수 없는 형식이에요 (사진, mp4/webm/mov 영상만)");
    if(f.size>RMAX)throw new Error("'"+f.name+"' 이(가) 50MB보다 커요");
    const path=uid+"/"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+"."+ext;
    const {error}=await db.storage.from(RBK).upload(path,f,{contentType:f.type});
    if(error)throw new Error("'"+f.name+"' 을(를) 올리지 못했어요");
    out.push({k:"f",name:f.name,path,mime:f.type})}
  return out}
function lightbox(src){const o=el("div",{className:"lb"},[el("img",{src})]);o.onclick=()=>o.remove();document.body.append(o)}
async function fillRefs(t,box,can){
  const refs=Array.isArray(t.refs)?t.refs:[];box.replaceChildren();
  const paths=refs.filter(r=>r.k==="f").map(r=>r.path);let urls={};
  if(paths.length){const {data}=await db.storage.from(RBK).createSignedUrls(paths,3600);(data||[]).forEach(d=>{if(d.signedUrl)urls[d.path]=d.signedUrl})}
  const save=async nr=>{const {error}=await db.from("intra_tasks").update({refs:nr,updated_at:new Date().toISOString()}).eq("id",t.id);if(error){alert("저장하지 못했어요");return false}t.refs=nr;return true};
  const grid=el("div",{className:"rgrid"});
  refs.forEach((r,i)=>{let m;
    if(r.k==="yt")m=el("iframe",{src:"https://www.youtube-nocookie.com/embed/"+encodeURIComponent(r.id),allow:"accelerometer; encrypted-media; picture-in-picture; fullscreen",allowFullscreen:true,loading:"lazy",title:"유튜브 영상",className:"rv"});
    else if(!urls[r.path])m=el("div",{className:"rv miss",textContent:r.name||"파일"});
    else if((r.mime||"").startsWith("video/"))m=el("video",{src:urls[r.path],controls:true,preload:"metadata",playsInline:true,className:"rv"});
    else{m=el("img",{src:urls[r.path],alt:r.name||"",loading:"lazy",className:"ri",title:"누르면 크게 보여요"});m.onclick=e=>{e.stopPropagation();lightbox(urls[r.path])}}
    const wrap=el("div",{className:"ritem"},[m]);
    if(can){const x=el("button",{type:"button",className:"x",textContent:"×",title:"이 레퍼런스 지우기"});
      x.onclick=async e=>{e.stopPropagation();if(!confirm("이 레퍼런스를 지울까요?"))return;if(!await save(refs.filter((_,j)=>j!==i)))return;if(r.k==="f")db.storage.from(RBK).remove([r.path]);fillRefs(t,box,can)};wrap.append(x)}
    grid.append(wrap)});
  if(refs.length)box.append(grid);
  if(can){const f=el("input",{type:"file",accept:"image/*,video/mp4,video/webm,video/quicktime",multiple:true,hidden:true});
    const a=el("button",{type:"button",className:"btn small",textContent:"＋ 사진·영상 추가"}),y=el("button",{type:"button",className:"btn small",textContent:"＋ 유튜브 링크"}),mm=el("span",{className:"note"});
    a.onclick=e=>{e.stopPropagation();f.click()};f.onclick=e=>e.stopPropagation();
    f.onchange=async()=>{const fs=[...f.files];f.value="";if(!fs.length)return;mm.textContent="올리는 중…";
      try{const add=await uploadRefs(fs);if(await save([...refs,...add]))fillRefs(t,box,can)}catch(x){mm.textContent=x.message}};
    y.onclick=async e=>{e.stopPropagation();const v=prompt("유튜브 링크를 붙여 넣어 주세요");if(!v)return;const ids=ytIds(v);if(!ids.length)return alert("유튜브 링크가 아닌 것 같아요");if(await save([...refs,...ids.map(id=>({k:"yt",id}))]))fillRefs(t,box,can)};
    box.append(el("div",{className:"ract"},[a,y,mm,f]))}
  else if(!refs.length)box.hidden=true}
$("tf").onsubmit=async e=>{e.preventDefault();const t=$("tt").value.trim();if(!t)return msg("tmsg","제목을 써 주세요.",1);
  const as=$("ta").value,b=e.submitter||$("tf").querySelector("button.btn");if(b)b.disabled=true;
  try{
    const ids=ytIds($("tyt").value);let refs=ids.map(id=>({k:"yt",id}));
    const fs=[...$("tfile").files];if(fs.length){msg("tmsg","파일 올리는 중…");refs=[...await uploadRefs(fs),...refs]}
    const {error}=await db.from("intra_tasks").insert({title:t,detail:$("td").value.trim(),assignee_email:as,assignee_name:as?nameOf(as):"",due:$("tdue").value||null,created_by:me,created_by_name:myName,refs});
    if(error)throw new Error("추가하지 못했어요");
  }catch(x){if(b)b.disabled=false;return msg("tmsg",x.message,1)}
  if(b)b.disabled=false;$("tt").value="";$("td").value="";$("tdue").value="";$("tfile").value="";$("tyt").value="";msg("tmsg","");closeWm();toast("업무를 추가했어요 ✓");tflt="open";loadTasks()};

/* 자료 */
async function loadDocs(){const {data}=await db.from("intra_docs").select("*").order("created_at",{ascending:false}).limit(500);docs=data||[];drawDocs()}
function drawDocs(){
  const tb=$("dtb");tb.replaceChildren();$("dcnt").textContent="자료 "+docs.length+"건";
  docs.forEach(d=>{
    const dl=el("button",{type:"button",className:"btn small",textContent:"다운로드"});
    dl.onclick=async()=>{const {data,error}=await db.storage.from("intranet-docs").createSignedUrl(d.path,60,{download:d.filename});if(error||!data)return alert("열지 못했어요");location.href=data.signedUrl};
    const acts=[dl];
    if(ceo||d.uploader_email.toLowerCase()===me){const x=el("button",{type:"button",className:"btn small danger",textContent:"삭제"});
      x.onclick=async()=>{if(!confirm("'"+d.title+"' 을 삭제할까요?"))return;await db.storage.from("intranet-docs").remove([d.path]);await db.from("intra_docs").delete().eq("id",d.id);loadDocs()};acts.push(x)}
    tb.append(el("tr",{},[el("td",{className:"tt",title:d.title+(d.note?" — "+d.note:"")},[el("b",{textContent:d.title}),...(d.note?[el("span",{className:"note",textContent:"  "+d.note})]:[])]),el("td",{className:"fn",textContent:d.filename,title:d.filename}),el("td",{className:"dt",textContent:d.size?sz(d.size):""}),el("td",{textContent:d.uploader_name}),el("td",{className:"dt",textContent:fd(d.created_at)}),el("td",{className:"ac"},acts)]))});
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
  $("dt").value="";$("dn").value="";$("dfile").value="";msg("dmsg","");closeWm();toast("자료를 올렸어요 ✓");loadDocs()};

/* 메일은 mail.js 가 그려요 (공용 메일함 · 참조 · 전달 · 별표 · 상용구 · 임시보관함 …) */

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
    const tr=el("tr",{className:"r"},[el("td",{},[av]),nm,el("td",{textContent:r.pos}),el("td",{textContent:r.rnk}),el("td",{className:"dt",textContent:r.emp||"-"}),el("td",{textContent:r.discord}),el("td",{textContent:r.twitter}),el("td",{className:"wd",title:r.duties||"",textContent:(r.duties||"").replace(/\s+/g," ")})]);
    tr.onclick=()=>showPerson(r);tb.append(tr)});
  g.append(el("div",{className:"tbw"},[el("table",{className:"jt",id:"etbl"},[el("thead",{},[el("tr",{},["","이름","직책","직위","사번","Discord","X","업무 내용"].map(t=>el("th",{textContent:t})))]),tb])]))}
function showPerson(r){const has=r.avatar&&urls[r.avatar],av=el("div",{className:"av"});if(has)avatar(av,r.avatar,"");else av.textContent=ini(r.nickname||r.name);
  const rows=[["사번",r.emp||"-"],["부서",[r.division,r.team].filter(Boolean).join(" · ")||"-"],["직책·직위",[r.pos,r.rnk].filter(Boolean).join(" · ")||"-"],["전화",fmtPhone(r.phone)||"-"],["이메일",r.email],["Discord",r.discord||"-"],["X",r.twitter||"-"],["업무 내용",r.duties||"-"]];
  $("pmb").replaceChildren(el("div",{className:"pfx"},[av,el("div",{},[el("b",{textContent:r.nickname||r.name}),el("span",{textContent:r.nickname&&r.name?r.name:""})])]),el("dl",{className:"prl"},rows.flatMap(([k,v])=>[el("dt",{textContent:k}),el("dd",{textContent:v})])));
  if(r.email.toLowerCase()!==me){const cb=el("button",{type:"button",className:"btn",textContent:"💬 채팅하기",style:"margin-top:16px;width:100%"});cb.onclick=()=>{chatTo=r.email.toLowerCase();$("cq").value="";$("pm").hidden=true;document.querySelector('#tabs button[data-t="c"]').click()};$("pmb").append(cb)}
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
  const lastId=k=>{const l=convMsgs(k);return l.length?l[l.length-1].id:0};
  const mkEmp=r=>({k:r.email.toLowerCase(),name:r.nickname||r.name,sub:[r.pos,r.rnk].filter(Boolean).join(" · "),duty:r.duties||"",r});
  let people,hd;
  if(q){hd="검색 결과";people=dir.filter(r=>r.email.toLowerCase()!==me&&[r.name,r.nickname,r.email,r.duties,r.team,r.pos].join(" ").toLowerCase().includes(q)).map(mkEmp)}
  else{hd="대화";const keys=[...new Set(chatMsgs.map(convKey).filter(k=>k&&!k.startsWith("room:")))];if(chatTo&&!chatTo.startsWith("room:")&&!keys.includes(chatTo))keys.push(chatTo);
    people=keys.map(k=>dir.find(r=>r.email.toLowerCase()===k)).filter(Boolean).sort((x,y)=>lastId(y.email.toLowerCase())-lastId(x.email.toLowerCase())).map(mkEmp)}
  const items=[{k:"",name:"RIF STUDIO",sub:"전체 채팅 · 모든 사원",logo:1}].concat(roomItems.filter(it=>!q||it.name.toLowerCase().includes(q))).concat([{hdr:hd}]).concat(people);
  {const fb=el("button",{type:"button",className:"cpi cnew find",textContent:"🔎 사원 정보에서 찾기"});fb.onclick=()=>document.querySelector('#tabs button[data-t="e"]').click();box.prepend(fb)}
  if(canLead()){const nb=el("button",{type:"button",className:"cpi cnew",textContent:"＋ 새 팀 채팅방 만들기"});nb.onclick=()=>roomDlg(null);box.prepend(nb)}
  items.forEach(it=>{if(it.hdr){box.append(el("div",{className:"csh",textContent:it.hdr}));if(!people.length)box.append(el("div",{className:"note",style:"padding:10px 14px;font-size:12px",textContent:q?"찾는 사원이 없어요.":"사원은 위 검색이나 '사원 정보'에서 찾아 대화를 시작하세요."}));return}
    const av=el("span",{className:"avs l"});
    if(it.r&&it.r.avatar&&urls[it.r.avatar])avatar(av,it.r.avatar,"");else {if(it.logo){av.style.backgroundImage='url("../img/logo-square.png")';av.style.backgroundSize="cover";av.style.backgroundColor="#fff"}else av.textContent=it.r?ini(it.name):it.room?"👥":"#"}
    const un=convUnread(it.k);
    const b=el("button",{type:"button",className:"cpi"+(chatTo===it.k?" on":"")},[av,el("span",{className:"cpt"},[el("b",{textContent:it.name}),el("span",{className:"note",textContent:it.sub}),...(it.duty?[el("span",{className:"cduty",textContent:"업무 · "+it.duty})]:[])]),...(un&&!(chatOpen&&chatTo===it.k)?[el("span",{className:"cbd",textContent:un>99?"99+":un})]:[])]);
    b.onclick=()=>{chatTo=it.k;if(q)$("cq").value="";markSeen();drawPeople();drawChat(true);$("ci").focus()};box.append(b)})}
function drawChat(stick){const box=$("cl"),near=box.scrollHeight-box.scrollTop-box.clientHeight<80;box.replaceChildren();let lastDay="";
  const to=chatTo?dir.find(x=>x.email.toLowerCase()===chatTo):null;
  const rm=curRoom();
  $("ch2").replaceChildren(el("span",{textContent:rm?"👥 "+rm.name+" · "+[rm.owner_email,...(roomMem[rm.id]||[])].map(dispName).join(", "):chatTo?(to?(to.nickname||to.name):chatTo)+" 님과의 1:1 대화"+(to&&to.duties?" · 업무: "+to.duties:""):"RIF STUDIO · 전체 채팅 · 모든 사원이 볼 수 있어요"}));
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
  const msgx=el("span",{className:"note"});const ok=el("button",{type:"button",className:"btn",textContent:rm?"저장":"만들기"}),cx=el("button",{type:"button",className:"btn ghost",textContent:"취소"});
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
const P={b:"pb",t:"pt",i:"pi",c:"pc",q:"pbd",e:"pe",s:"ps"};
document.querySelectorAll("#tabs button").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("#tabs button").forEach(x=>x.setAttribute("aria-pressed",x===b));
  Object.entries(P).forEach(([k,id])=>$(id).hidden=k!==b.dataset.t);if(b.dataset.t==="c")openChat();});
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
const qn=new URLSearchParams(location.search).get("n");if(qn&&/^\S{1,20}$/.test(qn)){$("sn").value=qn;$("sg").open=true}
/* 메일 화면(mail.js)에 넘겨 주는 값 — 항상 최신 값을 읽도록 getter 로 */
const X={get me(){return me},get myAddrs(){return myAddrs},get sendAs(){return sendAs},get myName(){return myName},get mySig(){return mySig},get ceo(){return ceo},get exec(){return exec},get staff(){return staff},get dir(){return dir},nameOf,dispName,toast,afterTask:()=>loadTasks()};
bindPhone($("sph"));render();
})();
