(()=>{
const $=i=>document.getElementById(i),DAYS=14;
let PIN=null,rows=[],edit=null,tm=null;
const dt=s=>s?new Date(s).toLocaleDateString("ko-KR"):"";
const expired=r=>!r.used_at&&Date.now()-new Date(r.issued_at).getTime()>DAYS*86400000;
const lock=()=>{PIN=null;rows=[];clearTimeout(tm);$("hr-body").hidden=true;$("hrlock").textContent="🔒 대표 잠금 해제"};
const tab=n=>{$("p3").hidden=n!==3;$("t3").setAttribute("aria-pressed",n===3);
  if(n===3){$("p1").hidden=true;$("p2").hidden=true;$("t1").setAttribute("aria-pressed",false);$("t2").setAttribute("aria-pressed",false);$("mn").classList.add("wide")}};
$("t3").onclick=()=>tab(3);
$("t1").addEventListener("click",()=>tab(0));$("t2").addEventListener("click",()=>tab(0));
const err=e=>/bad pin/.test(e.message)?"비밀번호가 맞지 않아요":/only unused/.test(e.message)?"이미 가입한 사번은 삭제할 수 없어요 (퇴사 처리를 쓰세요)":/8 digits/.test(e.message)?"사번은 숫자 8자리여야 해요":/already used/.test(e.message)?"이미 있는 사번이에요":/bad email/.test(e.message)?"이메일 형식이 올바르지 않아요":e.message;
async function load(){
  const {data,error}=await db.rpc("hr_list",{p_pin:PIN});
  if(error){alert("불러오지 못했어요: "+err(error));lock();return}
  rows=data||[];draw()}
async function sendMail(r,fromIssue){
  const {data,error}=await db.functions.invoke("send-onboarding",{body:{id:r.id}});
  let m="";if(error){try{m=(await error.context.json()).error}catch(_){m=error.message}}else if(!(data&&data.ok))m=(data&&data.error)||"알 수 없는 오류";
  return m}
function draw(){
  const tb=$("hrtb");tb.replaceChildren();
  $("hrcnt").textContent="총 "+rows.length+"명 · 가입 완료 "+rows.filter(r=>r.used_at&&r.status==="active").length+"명";
  rows.forEach(r=>{
    const st=r.status==="left"?["퇴사","x"]:r.used_at?["가입 완료","on"]:expired(r)?["기간 만료","x"]:["가입 대기","wt"];
    const acts=[];
    const b1=el("button",{className:"btn small",textContent:"수정"});
    b1.onclick=()=>{edit=r;$("hft").textContent="정보 수정 · "+r.emp_no;$("hno").value=r.emp_no;$("hn").value=r.name;$("hnk").value=r.nickname;$("he").value=r.email;$("hph").value=r.phone;$("hp").value=r.position;$("hd").value=r.dept;$("hm").value=r.memo;$("hform").hidden=false;$("hn").focus();$("hform").scrollIntoView({behavior:"smooth",block:"center"})};
    acts.push(b1);
    if(!r.used_at&&r.status==="active"&&r.invite_email){const b=el("button",{className:"btn small",textContent:r.onboard_sent_at?"메일 재발송":"축하 메일 보내기"});
      b.onclick=async()=>{if(!confirm(r.invite_email+" 에게 입사 축하 메일(한/일/영, 사번 "+r.emp_no+" 포함)을 보낼까요?"))return;b.disabled=true;const m=await sendMail(r);b.disabled=false;if(m)alert("메일을 보내지 못했어요: "+m);else{alert("보냈어요.");load()}};acts.push(b)}
    if(expired(r)){const b=el("button",{className:"btn small",textContent:"기간 연장"});b.onclick=async()=>{const {error}=await db.rpc("hr_renew",{p_pin:PIN,p_id:r.id});if(error)return alert(err(error));load()};acts.push(b)}
    if(r.used_at&&r.user_email&&r.status==="active"){const bp=el("button",{className:"btn small",textContent:"비밀번호 재설정"});
      bp.onclick=async()=>{const pw=prompt(r.user_email+" 의 새 비밀번호를 입력하세요 (8자 이상).\n입력한 비밀번호는 직원에게 직접 알려 주세요.");if(!pw)return;
        if(pw.length<8)return alert("8자 이상으로 입력해 주세요.");
        const {data,error}=await db.functions.invoke("admin-account",{body:{action:"setpw",pin:PIN,email:r.user_email,password:pw}});
        let m="";if(error){try{m=(await error.context.json()).error}catch(_){m=error.message}}else if(!(data&&data.ok))m=(data&&data.error)||"알 수 없는 오류";
        alert(m?"바꾸지 못했어요: "+m:"비밀번호를 바꿨어요. 직원에게 새 비밀번호를 전달해 주세요.")};acts.push(bp)}
    const b2=el("button",{className:"btn small",textContent:r.status==="left"?"복직":"퇴사 처리"});
    b2.onclick=async()=>{const to=r.status==="left"?"active":"left";if(to==="left"&&!confirm((r.name||r.emp_no)+" 님을 퇴사 처리할까요?\n메일 사용 권한이 바로 사라져요."))return;
      const {error}=await db.rpc("hr_set_status",{p_pin:PIN,p_id:r.id,p_status:to});if(error)return alert(err(error));load()};acts.push(b2);
    const b3=el("button",{className:"btn small",textContent:"삭제"});b3.disabled=!!r.used_at;
    b3.onclick=async()=>{if(!confirm(r.emp_no+" 을 삭제할까요?"))return;const {error}=await db.rpc("hr_delete",{p_pin:PIN,p_id:r.id});if(error)return alert(err(error));load()};acts.push(b3);
    const mailTd=el("td",{textContent:r.email||""});if(!r.used_at&&r.invite_email){mailTd.textContent="초대: "+r.invite_email;mailTd.className="sm"}
    tb.append(el("tr",{className:r.status==="left"?"lft":""},[el("td",{className:"en",textContent:r.emp_no}),el("td",{textContent:r.name}),el("td",{textContent:r.nickname}),mailTd,el("td",{textContent:r.phone}),el("td",{textContent:r.position}),el("td",{textContent:r.dept}),
      el("td",{},[el("span",{className:"hs "+st[1],textContent:st[0]}),...(r.onboard_sent_at&&!r.used_at?[el("div",{className:"sm",textContent:"축하 메일 발송 "+dt(r.onboard_sent_at)})]:[])]),el("td",{className:"sm",textContent:dt(r.issued_at)}),el("td",{textContent:r.memo}),el("td",{className:"ac"},acts)]))});
  if(!rows.length)tb.append(el("tr",{},[el("td",{colSpan:11,textContent:"아직 발급된 사번이 없어요."})]))}
$("cshow").onchange=()=>{$("cpw").type=$("cshow").checked?"text":"password"};
$("cform").onsubmit=async e=>{e.preventDefault();const m=$("cmsg");
  const id=$("cid").value.trim(),nm=$("cn").value.trim(),pw=$("cpw").value;
  if(!id||!nm||!pw){m.className="note err";m.textContent="아이디·이름·비밀번호를 모두 써 주세요.";return}
  if(!confirm(id.replace(/@rif-studio\.com$/i,"")+"@rif-studio.com 계정을 만들까요?"))return;
  const b=$("cgo");b.disabled=true;m.className="note";m.textContent="만드는 중…";
  const {data,error}=await db.functions.invoke("admin-account",{body:{action:"create",pin:PIN,loginId:id,name:nm,nickname:$("cnk").value,phone:$("cph").value,password:pw}});
  b.disabled=false;let msg2="";if(error){try{msg2=(await error.context.json()).error}catch(_){msg2=error.message}}else if(!(data&&data.ok))msg2=(data&&data.error)||"알 수 없는 오류";
  if(msg2){m.className="note err";m.textContent=msg2;return}
  m.textContent=data.email+" 계정을 만들었어요 ✓ 아이디와 비밀번호를 직원에게 전달해 주세요.";["cid","cn","cnk","cph","cpw"].forEach(x=>$(x).value="");$("cpw").type="password";$("cshow").checked=false;load()};
$("iform").onsubmit=async e=>{e.preventDefault();
  const em=$("iem").value.trim(),send=$("isend").checked&&em;
  if(!em&&$("isend").checked&&!confirm("이메일이 없어서 축하 메일은 보내지 않아요. 사번만 발급할까요?"))return;
  if(send&&!confirm(em+" 에게 입사 축하 메일(한국어/일본어/영어)을 보내고 사번을 발급할까요?"))return;
  const b=$("iissue");b.disabled=true;
  const {data,error}=await db.rpc("hr_issue",{p_pin:PIN,p_invite:em});
  if(error){b.disabled=false;return alert("발급하지 못했어요: "+err(error))}
  const row=Array.isArray(data)?data[0]:data;let note="";
  if(send){const m=await sendMail({id:row.id});note=m?"  ⚠ 메일은 보내지 못했어요: "+m+" (표에서 '축하 메일 보내기'로 다시 시도)":"  ✓ 축하 메일을 보냈어요."}
  b.disabled=false;$("iem").value="";
  const box=$("issued");box.hidden=false;box.replaceChildren(el("b",{textContent:"사번: "}),el("span",{className:"big",textContent:row.emp_no}),el("span",{className:"note",textContent:note||"  — 직원에게 전달해 주세요."}));
  load()};
$("hform").onsubmit=async e=>{e.preventDefault();if(!edit)return;
  const {error}=await db.rpc("hr_save",{p_pin:PIN,p_id:edit.id,p_emp_no:$("hno").value.trim(),p_name:$("hn").value,p_nick:$("hnk").value,p_email:$("he").value,p_phone:$("hph").value,p_position:$("hp").value,p_dept:$("hd").value,p_memo:$("hm").value});
  if(error)return alert("저장하지 못했어요: "+err(error));
  edit=null;$("hform").hidden=true;load()};
$("hcancel").onclick=()=>{edit=null;$("hform").hidden=true};
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
