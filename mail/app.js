(()=>{
const $=i=>document.getElementById(i);
const dt=s=>{const d=new Date(s),p=n=>String(n).padStart(2,"0");return (d.getMonth()+1)+"/"+d.getDate()+" "+p(d.getHours())+":"+p(d.getMinutes())};
let rows=[],timer=null,staff=null;
const pv=()=>{const s=$("sig").value.trim()||(staff&&staff.name)||"";$("pv").textContent="— 서명 미리보기 —\n"+(s?s+"\n\n":"")+"RIF STUDIO\nPANGYO • TOKYO • NEW YORK"};
async function render(){
  const {data}=await db.auth.getSession(),s=data.session;
  $("login").hidden=!!s;$("app").hidden=!s;clearInterval(timer);
  if(!s)return;
  $("who").textContent=s.user.email;
  const {data:st}=await db.from("mail_staff").select("email,name,signature").maybeSingle();
  staff=st||null;$("box").hidden=!staff;$("nomail").hidden=!!staff;
  if(!staff)return;
  $("sig").value=staff.signature||"";pv();loadOut();
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
$("mq").oninput=drawOut;$("mrf").onclick=loadOut;$("sig").oninput=pv;
$("sigsave").onclick=async()=>{const m=$("sigmsg");m.className="note";m.textContent="저장 중…";
  const {error}=await db.rpc("set_my_signature",{p_sig:$("sig").value.trim()});
  if(error){m.className="note err";m.textContent="저장하지 못했어요";return}
  staff.signature=$("sig").value.trim();m.textContent="저장했어요 ✓";setTimeout(()=>{m.textContent=""},3000)};
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
$("login").onsubmit=async e=>{e.preventDefault();const {error}=await db.auth.signInWithPassword({email:$("em").value.trim(),password:$("pw").value});
  $("lmsg").textContent=error?"로그인 실패 — 이메일과 비밀번호를 확인해 주세요":"";$("pw").value="";render()};
$("signup").onsubmit=async e=>{e.preventDefault();const m=$("smsg");
  if($("spw").value!==$("spw2").value){m.textContent="비밀번호 확인이 달라요";return}
  const b=$("sgo");b.disabled=true;m.className="note";m.textContent="가입 중…";
  let ok=false,msg="";
  try{const {data,error}=await db.functions.invoke("staff-signup",{body:{empNo:$("sn").value,name:$("sna").value,email:$("sem").value,password:$("spw").value}});
    if(error){try{msg=(await error.context.json()).error}catch(_){msg=error.message}}else if(data&&data.ok)ok=true;else msg=(data&&data.error)||"알 수 없는 오류"}catch(x){msg=String(x.message||x)}
  b.disabled=false;
  if(!ok){m.className="note err";m.textContent=msg;return}
  const {error}=await db.auth.signInWithPassword({email:$("sem").value.trim(),password:$("spw").value});
  $("spw").value="";$("spw2").value="";m.textContent=error?"가입은 됐어요. 위에서 로그인해 주세요.":"";render()};
$("out").onclick=async e=>{e.preventDefault();await db.auth.signOut();render()};
render();
})();
