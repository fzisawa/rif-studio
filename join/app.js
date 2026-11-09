const T=(k,f)=>window.T?window.T(k,f):f;
const $=i=>document.getElementById(i),db=supabase.createClient(RIF.URL,RIF.KEY);
const el=(t,p={},k=[])=>{const e=Object.assign(document.createElement(t),p);k.forEach(c=>e.append(c));return e};
$("f").onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target),d=Object.fromEntries(fd),m=$("m"),fl=fd.getAll("field");
  if(d.website)return;
  if(!fl.length){m.textContent=T("join.nof","분야를 하나 이상 선택해 주세요.");return}
  const fo=fl.includes("etc")?(d.field_other||"").trim()||null:null;$("go").disabled=true;m.textContent=T("join.sending","보내는 중…");
  const {error}=await db.from("join_requests").insert({name:d.name.trim(),email:d.email.trim(),youtube:d.youtube.trim()||null,twitter:d.twitter.trim()||null,intro:d.intro.trim(),fields:fl.join(","),field_other:fo});
  if(error){m.textContent=T("join.fail","전송에 실패했어요. 잠시 후 다시 시도하거나 rif@rif-studio.com으로 보내주세요.");$("go").disabled=false;return}
  if(RIF.MAIL_KEY)try{await fetch("https://api.web3forms.com/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({access_key:RIF.MAIL_KEY,subject:"[Join Us] "+d.name,from_name:"RIF STUDIO Join Us",name:d.name,email:d.email,youtube:d.youtube||"-",twitter:d.twitter||"-",fields:fl.join(", ")+(fo?" ("+fo+")":""),message:d.intro})})}catch(_){}
  e.target.reset();m.textContent=T("join.ok","지원서가 전달됐어요. 확인 후 연락드릴게요!")};
async function list(){
  const {data:s}=await db.auth.getSession();if(!s.session)return;
  const {data}=await db.from("join_requests").select("*").order("created_at",{ascending:false});
  $("admin").hidden=false;const L=$("list");L.replaceChildren();
  (data||[]).forEach(r=>{const c=el("div",{className:"req"},[
    el("b",{textContent:r.name+" · "+r.email}),el("div",{className:"note",textContent:new Date(r.created_at).toLocaleString("ko-KR")}),
    el("div",{textContent:"분야: "+(r.fields||"-")+(r.field_other?" ("+r.field_other+")":"")}),el("div",{textContent:"YouTube: "+(r.youtube||"-")}),el("div",{textContent:"Twitter: "+(r.twitter||"-")}),el("p",{textContent:r.intro})]);
    const x=el("button",{className:"btn small",textContent:"삭제"});
    x.onclick=async()=>{if(confirm("삭제할까요?")){await db.from("join_requests").delete().eq("id",r.id);list()}};c.append(x);L.append(c)});
  if(!(data||[]).length)L.textContent="아직 지원서가 없어요."}
list();

$("f").addEventListener("change",e=>{if(e.target.value==="etc"){const o=$("fo");o.hidden=!e.target.checked;if(!o.hidden)o.focus()}});
