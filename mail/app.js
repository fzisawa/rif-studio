(()=>{
const $=i=>document.getElementById(i);
const toEmail=v=>{v=v.trim().toLowerCase();return v.includes("@")?v:v+"@rif-studio.com"};
const dt=s=>{const d=new Date(s),p=n=>String(n).padStart(2,"0");return (d.getMonth()+1)+"/"+d.getDate()+" "+p(d.getHours())+":"+p(d.getMinutes())};
let staff=null;
async function render(){
  const {data}=await db.auth.getSession(),s=data.session;
  $("login").hidden=!!s;$("sg").hidden=!!s;$("app").hidden=!s;
  if(!s)return;
  $("who").textContent=s.user.email;
  const {data:st}=await db.from("mail_staff").select("email,name,signature,signature_html").maybeSingle();
  staff=st||null;$("box").hidden=!staff;$("nomail").hidden=!!staff;
  if(!staff)return;
  setSig()}
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
const qn=new URLSearchParams(location.search).get("n");if(qn&&/^\d{8}$/.test(qn)){$("sn").value=qn;$("sg").open=true}
render();
})();
