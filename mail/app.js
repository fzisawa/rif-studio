(()=>{
const $=i=>document.getElementById(i);
const toEmail=v=>{v=v.trim().toLowerCase();return v.includes("@")?v:v+"@rif-studio.com"};
const dt=s=>{const d=new Date(s),p=n=>String(n).padStart(2,"0");return (d.getMonth()+1)+"/"+d.getDate()+" "+p(d.getHours())+":"+p(d.getMinutes())};
let rows=[],timer=null,staff=null;
async function render(){
  const {data}=await db.auth.getSession(),s=data.session;
  $("login").hidden=!!s;$("sg").hidden=!!s;$("app").hidden=!s;clearInterval(timer);
  if(!s)return;
  $("who").textContent=s.user.email;
  const {data:st}=await db.from("mail_staff").select("email,name,signature,signature_html").maybeSingle();
  staff=st||null;$("box").hidden=!staff;$("nomail").hidden=!!staff;
  if(!staff)return;
  setSig();loadOut();
  timer=setInterval(loadOut,30000)}
async function loadOut(){
  const {data,error}=await db.from("mail_outbox").select("id,sender,sender_name,to_email,subject,body,created_at,opened_at,open_count").order("created_at",{ascending:false}).limit(300);
  if(error){$("mcnt").textContent="불러오기 실패";return}
  rows=data||[];drawOut()}
function drawOut(){
  const q=$("mq").value.trim().toLowerCase(),tb=$("mtb");tb.replaceChildren();
  const v=rows.filter(r=>!q||[r.to_email,r.subject,r.sender,r.sender_name,r.body].join(" ").toLowerCase().includes(q));
  $("mcnt").textContent="보낸 메일 "+v.length+(q?" / "+rows.length:"")+"통 · 읽음 "+rows.filter(r=>r.opened_at).length+"통";
  v.forEach(r=>{
    const st=el("td",{},[el("span",{className:"rb "+(r.opened_at?"on":"off"),textContent:r.opened_at?"읽음":"안 읽음"}),...(r.opened_at?[el("div",{className:"note",textContent:dt(r.opened_at)+(r.open_count>1?" · "+r.open_count+"회":"")})]:[])]);
    const tr=el("tr",{className:"r"},[el("td",{className:"dt",textContent:dt(r.created_at)}),el("td",{textContent:r.sender_name||r.sender}),el("td",{textContent:r.to_email}),el("td",{textContent:r.subject}),st]);
    const d=el("tr",{className:"d",hidden:true},[el("td",{colSpan:5},[el("b",{textContent:"보낸 사람: "+r.sender}),el("p",{textContent:r.body})])]);
    tr.onclick=()=>{d.hidden=!d.hidden};tb.append(tr,d)});
  if(!v.length)tb.append(el("tr",{},[el("td",{colSpan:5,textContent:"보낸 메일이 아직 없어요."})]))}
$("mq").oninput=drawOut;$("mrf").onclick=loadOut;
const esc=t=>t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
function setSig(){const h=(staff.signature_html||"").trim();$("sig").innerHTML=h||(staff.signature?esc(staff.signature).replace(/\n/g,"<br>"):"");selImg=null}
let selImg=null;
const ed=$("sig");
ed.addEventListener("paste",e=>{e.preventDefault();const t=(e.clipboardData||window.clipboardData).getData("text/plain");document.execCommand("insertText",false,t)});
ed.addEventListener("click",e=>{ed.querySelectorAll("img.sel").forEach(i=>i.classList.remove("sel"));selImg=null;if(e.target.tagName==="IMG"){selImg=e.target;selImg.classList.add("sel")}});
document.querySelectorAll("#stb [data-c]").forEach(b=>{b.onmousedown=e=>e.preventDefault();b.onclick=()=>{ed.focus();document.execCommand(b.dataset.c,false,null)}});
$("scol").oninput=()=>{ed.focus();document.execCommand("foreColor",false,$("scol").value)};
$("slink").onmousedown=e=>e.preventDefault();
$("slink").onclick=()=>{const u=prompt("링크 주소 (https://… 또는 mailto:…)");if(!u)return;if(!/^(https?:\/\/|mailto:)/i.test(u))return alert("https:// 로 시작하는 주소를 넣어 주세요.");ed.focus();document.execCommand("createLink",false,u)};
const size=d=>{if(!selImg)return alert("크기를 바꿀 사진을 먼저 눌러 선택해 주세요.");const w=Math.max(40,Math.min(560,(parseInt(selImg.getAttribute("width"))||selImg.naturalWidth||200)+d));selImg.setAttribute("width",w);selImg.removeAttribute("height")};
$("sminus").onclick=()=>size(-40);$("splus").onclick=()=>size(40);
$("simg").onclick=()=>$("sfile").click();
$("sfile").onchange=async()=>{const f=$("sfile").files[0];$("sfile").value="";if(!f)return;const m=$("sigmsg");
  if(!/^image\/(png|jpeg|gif|webp)$/.test(f.type))return alert("png, jpg, gif, webp 사진만 넣을 수 있어요.");
  if(f.size>2*1024*1024)return alert("사진은 2MB 이하로 넣어 주세요.");
  m.className="note";m.textContent="사진 올리는 중…";
  const {data:{session}}=await db.auth.getSession();const ext={"image/png":"png","image/jpeg":"jpg","image/gif":"gif","image/webp":"webp"}[f.type];
  const path=session.user.id+"/"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+"."+ext;
  const {error}=await db.storage.from("mail-assets").upload(path,f,{contentType:f.type});
  if(error){m.className="note err";m.textContent="사진을 올리지 못했어요";return}
  const url=db.storage.from("mail-assets").getPublicUrl(path).data.publicUrl;
  m.textContent="";ed.focus();document.execCommand("insertHTML",false,'<img src="'+url+'" width="200" alt="">')};
$("sigsave").onclick=async()=>{const m=$("sigmsg");m.className="note";m.textContent="저장 중…";
  ed.querySelectorAll("img.sel").forEach(i=>i.classList.remove("sel"));
  const html=ed.innerHTML.trim();
  const {error}=await db.rpc("set_my_signature_html",{p_html:html});
  if(error){m.className="note err";m.textContent="저장하지 못했어요";return}
  staff.signature_html=html;m.textContent="저장했어요 ✓";setTimeout(()=>{m.textContent=""},3000)};
$("mform").onsubmit=async e=>{e.preventDefault();
  const to=$("mto").value.trim(),sj=$("msj").value.trim(),bd=$("mbd").value.trim(),msg=$("mmsg");
  if(!to||!sj||!bd){msg.className="note err";msg.textContent="받는 사람·제목·내용을 모두 써 주세요.";return}
  if(!confirm(to+" 에게 메일을 보낼까요?\n보낸 뒤에는 취소할 수 없어요."))return;
  const b=$("msend");b.disabled=true;msg.className="note";msg.textContent="보내는 중…";
  let ok=false,m="";
  try{const {data,error}=await db.functions.invoke("send-mail",{body:{to,subject:sj,body:bd}});
    if(error){try{m=(await error.context.json()).error}catch(_){m=error.message}}else if(data&&data.ok)ok=true;else m=(data&&data.error)||"알 수 없는 오류"}catch(x){m=String(x.message||x)}
  b.disabled=false;
  if(ok){msg.textContent="보냈어요 ✓";$("msj").value="";$("mbd").value="";$("mto").value="";loadOut();setTimeout(()=>{if(msg.textContent==="보냈어요 ✓")msg.textContent=""},4000)}
  else{msg.className="note err";msg.textContent="보내지 못했어요: "+m}};
$("login").onsubmit=async e=>{e.preventDefault();const {error}=await db.auth.signInWithPassword({email:toEmail($("em").value),password:$("pw").value});
  $("lmsg").textContent=error?"로그인 실패 — 이메일과 비밀번호를 확인해 주세요":"";$("pw").value="";render()};
$("signup").onsubmit=async e=>{e.preventDefault();const m=$("smsg");
  if($("spw").value!==$("spw2").value){m.textContent="비밀번호 확인이 달라요";return}
  const b=$("sgo");b.disabled=true;m.className="note";m.textContent="가입 중…";
  let ok=false,msg="";
  try{const {data,error}=await db.functions.invoke("staff-signup",{body:{empNo:$("sn").value.trim(),name:$("sna").value,nickname:$("snk").value,phone:$("sph").value,loginId:$("sid").value,inviteEmail:$("sem").value,password:$("spw").value}});
    if(error){try{msg=(await error.context.json()).error}catch(_){msg=error.message}}else if(data&&data.ok)ok=true;else msg=(data&&data.error)||"알 수 없는 오류"}catch(x){msg=String(x.message||x)}
  b.disabled=false;
  if(!ok){m.className="note err";m.textContent=msg;return}
  const {error}=await db.auth.signInWithPassword({email:toEmail($("sid").value),password:$("spw").value});
  $("spw").value="";$("spw2").value="";m.textContent=error?"가입은 됐어요. 위에서 로그인해 주세요.":"";render()};
$("out").onclick=async e=>{e.preventDefault();await db.auth.signOut();render()};
{const q=new URLSearchParams(location.search),t=q.get("to"),sj=q.get("s");if(t&&/^[^@\s<>,;]+@[^@\s<>,;]+$/.test(t))$("mto").value=t;if(sj)$("msj").value=sj.slice(0,200);const rb=q.get("q");if(rb)$("mbd").value="\n\n----- 받은 메일 -----\n"+rb.slice(0,3000).replace(/^/gm,"> ")}
const qn=new URLSearchParams(location.search).get("n");if(qn&&/^\d{8}$/.test(qn)){$("sn").value=qn;$("sg").open=true}
render();
})();
