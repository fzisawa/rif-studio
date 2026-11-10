(()=>{
const $=i=>document.getElementById(i);
let PIN=null,rows=[],edit=null,tm=null;
const dt=s=>s?new Date(s).toLocaleDateString("ko-KR"):"";
const lock=()=>{PIN=null;rows=[];clearTimeout(tm);$("hr-body").hidden=true;$("hrlock").textContent="🔒 대표 잠금 해제"};
const tab=n=>{$("p3").hidden=n!==3;$("t3").setAttribute("aria-pressed",n===3);
  if(n===3){$("p1").hidden=true;$("p2").hidden=true;$("t1").setAttribute("aria-pressed",false);$("t2").setAttribute("aria-pressed",false);$("mn").classList.add("wide")}};
$("t3").onclick=()=>tab(3);
$("t1").addEventListener("click",()=>tab(0));$("t2").addEventListener("click",()=>tab(0));
const err=e=>/bad pin/.test(e.message)?"비밀번호가 맞지 않아요":/only unused/.test(e.message)?"이미 가입한 사번은 삭제할 수 없어요 (퇴사 처리를 쓰세요)":e.message;
async function load(){
  const {data,error}=await db.rpc("hr_list",{p_pin:PIN});
  if(error){alert("불러오지 못했어요: "+err(error));lock();return}
  rows=data||[];draw()}
function reset(){edit=null;["hn","hp","he","hph","hj","hk","hm"].forEach(i=>$(i).value="");$("he").disabled=false;$("hsave").textContent="사번 발급";$("hcancel").hidden=true}
function draw(){
  const tb=$("hrtb");tb.replaceChildren();
  $("hrcnt").textContent="총 "+rows.length+"명 · 재직 "+rows.filter(r=>r.status==="active").length+"명";
  rows.forEach(r=>{
    const st=r.status==="left"?"퇴사":r.used_at?"가입 완료":"가입 대기";
    const b1=el("button",{className:"btn small",textContent:"수정"}),b2=el("button",{className:"btn small",textContent:r.status==="left"?"복직":"퇴사 처리"}),b3=el("button",{className:"btn small",textContent:"삭제"});
    b1.onclick=()=>{edit=r;$("hn").value=r.name;$("hp").value=r.position;$("he").value=r.email;$("he").disabled=!!r.used_at;$("hph").value=r.phone;$("hj").value=r.joined||"";$("hk").value=r.kind;$("hm").value=r.memo;$("hsave").textContent="저장";$("hcancel").hidden=false;$("hn").focus();scrollTo({top:$("hform").offsetTop-90,behavior:"smooth"})};
    b2.onclick=async()=>{const to=r.status==="left"?"active":"left";if(to==="left"&&!confirm(r.name+" 님을 퇴사 처리할까요?\n메일 사용 권한이 바로 사라져요."))return;
      const {error}=await db.rpc("hr_set_status",{p_pin:PIN,p_id:r.id,p_status:to});if(error)return alert(err(error));load()};
    b3.disabled=!!r.used_at;
    b3.onclick=async()=>{if(!confirm(r.emp_no+" ("+r.name+") 을 삭제할까요?"))return;const {error}=await db.rpc("hr_delete",{p_pin:PIN,p_id:r.id});if(error)return alert(err(error));load()};
    tb.append(el("tr",{className:r.status==="left"?"lft":""},[el("td",{className:"en",textContent:r.emp_no}),el("td",{textContent:r.name}),el("td",{textContent:r.position}),el("td",{textContent:r.email}),el("td",{textContent:r.phone}),el("td",{textContent:dt(r.joined)}),el("td",{textContent:r.kind}),el("td",{},[el("span",{className:"hs "+(r.status==="left"?"x":r.used_at?"on":"wt"),textContent:st})]),el("td",{textContent:r.memo}),el("td",{className:"ac"},[b1,b2,b3])]))});
  if(!rows.length)tb.append(el("tr",{},[el("td",{colSpan:10,textContent:"아직 등록된 직원이 없어요."})]))}
$("hform").onsubmit=async e=>{e.preventDefault();
  const name=$("hn").value.trim(),email=$("he").value.trim();
  if(!name||!email)return alert("이름과 이메일은 꼭 써 주세요.");
  const {data,error}=await db.rpc("hr_save",{p_pin:PIN,p_id:edit?edit.id:null,p_name:name,p_position:$("hp").value.trim(),p_email:email,p_phone:$("hph").value.trim(),p_joined:$("hj").value||null,p_kind:$("hk").value.trim(),p_memo:$("hm").value.trim()});
  if(error)return alert("저장하지 못했어요: "+err(error));
  const wasNew=!edit;reset();await load();
  if(wasNew){$("issued").hidden=false;$("issued").innerHTML="";$("issued").append(el("b",{textContent:name+" 님 사번: "}),el("span",{className:"big",textContent:data}),el("span",{className:"note",textContent:"  — 직원에게 전달해 주세요. 가입은 mail 페이지의 '사번으로 가입'에서 합니다."}))}};
$("hcancel").onclick=reset;
const pm=$("hpm");
$("hrlock").onclick=()=>{if(PIN){lock();return}$("hpi").value="";$("hpe").textContent="";pm.hidden=false;$("hpi").focus()};
$("hpc").onclick=()=>{pm.hidden=true};
$("hpo").onclick=async()=>{const p=$("hpi").value;if(!p)return;
  const {data,error}=await db.rpc("check_ceo_pin",{p_pin:p});
  if(error||!data){$("hpe").textContent="비밀번호가 맞지 않아요";return}
  PIN=p;pm.hidden=true;$("hr-body").hidden=false;$("hrlock").textContent="🔓 잠금 (열림)";clearTimeout(tm);tm=setTimeout(lock,10*60*1000);load()};
$("hpi").onkeydown=e=>{if(e.key==="Enter")$("hpo").click()};
$("out").addEventListener("click",lock);
})();
