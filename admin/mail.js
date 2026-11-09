(()=>{
const $=i=>document.getElementById(i),CEO="takanashi@rif-studio.com";
const dt=s=>{const d=new Date(s),p=n=>String(n).padStart(2,"0");return (d.getMonth()+1)+"/"+d.getDate()+" "+p(d.getHours())+":"+p(d.getMinutes())};
let me="",staff=null,rows=[],timer=null,seen=false;
const show=n=>{$("p3").hidden=n!==3;$("t3").setAttribute("aria-pressed",n===3);
  if(n===3){$("p1").hidden=true;$("p2").hidden=true;$("t1").setAttribute("aria-pressed",false);$("t2").setAttribute("aria-pressed",false);$("mn").classList.add("wide");loadOut();clearInterval(timer);timer=setInterval(()=>{if(!$("p3").hidden)loadOut()},30000)}
  else{clearInterval(timer)}};
$("t3").onclick=()=>show(3);
$("t1").addEventListener("click",()=>show(0));$("t2").addEventListener("click",()=>show(0));
async function who(){
  const {data}=await db.auth.getSession();const s=data.session;
  if(!s){me="";staff=null;return}
  me=(s.user.email||"").toLowerCase();
  const {data:st}=await db.from("mail_staff").select("email,name").maybeSingle();staff=st||null;
  const ceo=me===CEO;
  $("t3").hidden=!staff;
  if(!ceo){ // 직원 계정: 메일 탭만
    $("t1").hidden=true;$("t2").hidden=true;$("p1").hidden=true;$("p2").hidden=true;
    if(staff&&$("p3").hidden)show(3);
    if(!staff){$("nomail").hidden=false}
  }
}
async function loadOut(){
  const {data,error}=await db.from("mail_outbox").select("id,sender,sender_name,to_email,subject,body,created_at,opened_at,open_count").order("created_at",{ascending:false}).limit(300);
  if(error){$("mcnt").textContent="불러오기 실패";return}
  rows=data||[];drawOut()}
function drawOut(){
  const q=$("mq").value.trim().toLowerCase(),tb=$("mtb");tb.replaceChildren();
  const v=rows.filter(r=>!q||[r.to_email,r.subject,r.sender,r.sender_name,r.body].join(" ").toLowerCase().includes(q));
  const op=rows.filter(r=>r.opened_at).length;
  $("mcnt").textContent="보낸 메일 "+v.length+(q?" / "+rows.length:"")+"통 · 읽음 "+op+"통";
  v.forEach(r=>{
    const st=el("td",{className:"rd"},[el("span",{className:"rb "+(r.opened_at?"on":"off"),textContent:r.opened_at?"읽음":"안 읽음"}),...(r.opened_at?[el("div",{className:"note",textContent:dt(r.opened_at)+(r.open_count>1?" · "+r.open_count+"회":"")})]:[])]);
    const tr=el("tr",{className:"r"},[el("td",{className:"dt",textContent:dt(r.created_at)}),el("td",{textContent:r.sender_name||r.sender}),el("td",{textContent:r.to_email}),el("td",{textContent:r.subject}),st]);
    const d=el("tr",{className:"d",hidden:true},[el("td",{colSpan:5},[el("b",{textContent:"보낸 사람: "+r.sender}),el("p",{textContent:r.body})])]);
    tr.onclick=()=>{d.hidden=!d.hidden};tb.append(tr,d)});
  if(!v.length)tb.append(el("tr",{},[el("td",{colSpan:5,textContent:"보낸 메일이 아직 없어요."})]))}
$("mq").oninput=drawOut;$("mrf").onclick=loadOut;
$("mform").onsubmit=async e=>{e.preventDefault();
  const to=$("mto").value.trim(),sj=$("msj").value.trim(),bd=$("mbd").value.trim(),msg=$("mmsg");
  if(!to||!sj||!bd){msg.textContent="받는 사람·제목·내용을 모두 써 주세요.";msg.className="note err";return}
  if(!confirm(to+" 에게 메일을 보낼까요?\n보낸 뒤에는 취소할 수 없어요."))return;
  const b=$("msend");b.disabled=true;msg.className="note";msg.textContent="보내는 중…";
  let ok=false,m="";
  try{const {data,error}=await db.functions.invoke("send-mail",{body:{to,subject:sj,body:bd}});
    if(error){try{m=(await error.context.json()).error}catch(_){m=error.message}}else if(data&&data.ok)ok=true;else m=(data&&data.error)||"알 수 없는 오류"}catch(x){m=String(x.message||x)}
  b.disabled=false;
  if(ok){msg.textContent="보냈어요 ✓";$("msj").value="";$("mbd").value="";$("mto").value="";loadOut();setTimeout(()=>{if(msg.textContent==="보냈어요 ✓")msg.textContent=""},4000)}
  else{msg.className="note err";msg.textContent="보내지 못했어요: "+m}};
db.auth.onAuthStateChange(()=>{setTimeout(who,0)});who();
})();
