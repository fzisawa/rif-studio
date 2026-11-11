(()=>{
const $=i=>document.getElementById(i),DAYS=14;
let PIN=null,rows=[],edit=null,tm=null;const OPEN=new Set();
const dt=s=>s?new Date(s).toLocaleDateString("ko-KR"):"";
const expired=r=>!r.used_at&&Date.now()-new Date(r.issued_at).getTime()>DAYS*86400000;
const lock=()=>{PIN=null;rows=[];edit=null;OPEN.clear();clearTimeout(tm);$("hr-body").hidden=true;$("hmod").hidden=true;$("hrq").value="";$("hrcnt").textContent="";$("hrlock").textContent="🔒 대표 잠금 해제"};
const tab=n=>{$("p3").hidden=n!==3;$("t3").setAttribute("aria-pressed",n===3);
  if(n===3){$("p1").hidden=true;$("p2").hidden=true;$("t1").setAttribute("aria-pressed",false);$("t2").setAttribute("aria-pressed",false);$("mn").classList.add("wide")}};
$("t3").onclick=()=>tab(3);
$("t1").addEventListener("click",()=>tab(0));$("t2").addEventListener("click",()=>tab(0));
const err=e=>/bad pin/.test(e.message)?"비밀번호가 맞지 않아요":/only unused/.test(e.message)?"이미 가입한 사번은 삭제할 수 없어요 (퇴사 처리를 쓰세요)":/8 digits|emp_no invalid/.test(e.message)?"사번은 공백 없이 1~20자여야 해요":/already used/.test(e.message)?"이미 있는 사번이에요":/bad division|bad team/.test(e.message)?"부서/팀 값이 올바르지 않아요":/bad email/.test(e.message)?"이메일 형식이 올바르지 않아요":e.message;
async function load(){
  const {data,error}=await db.rpc("hr_list",{p_pin:PIN});
  if(error){alert("불러오지 못했어요: "+err(error));lock();return}
  rows=data||[];draw()}
async function sendMail(r,fromIssue){
  const {data,error}=await db.functions.invoke("send-onboarding",{body:{id:r.id}});
  let m="";if(error){try{m=(await error.context.json()).error}catch(_){m=error.message}}else if(!(data&&data.ok))m=(data&&data.error)||"알 수 없는 오류";
  return m}
const kv=(k,v,c)=>el("div",{className:c||""},[el("b",{textContent:k}),el("span",{textContent:v||"-"})]);
const td=(t,c)=>el("td",{className:c||"",textContent:t||"",title:t||""});
function draw(){
  const tb=$("hrtb"),q=($("hrq").value||"").trim().toLowerCase();tb.replaceChildren();
  const view=rows.filter(r=>!q||[r.emp_no,r.name,r.nickname,r.email,r.user_email,r.invite_email,r.division,r.team,r.position,r.rank,r.discord,r.twitter,r.memo].join(" ").toLowerCase().includes(q));
  $("hrcnt").textContent="총 "+rows.length+"명 · 가입 완료 "+rows.filter(r=>r.used_at&&r.status==="active").length+"명"+(q?" · 검색 결과 "+view.length+"명":"");
  view.forEach(r=>{
    const st=r.status==="left"?["퇴사","x"]:r.used_at?["가입 완료","on"]:expired(r)?["기간 만료","x"]:["가입 대기","wt"];
    const pend=!r.used_at&&r.invite_email;
    const b1=el("button",{className:"btn small",textContent:"수정"});
    b1.onclick=e=>{e.stopPropagation();edit=r;$("hft").textContent="정보 수정 · "+r.emp_no;$("hno").value=r.emp_no;$("hn").value=r.name;$("hnk").value=r.nickname;$("he").value=r.email;$("hph").value=fmtPhone(r.phone);$("hp").value=r.position;$("hrk").value=r.rank||"";setDT(r.division||"",r.team||"");$("hdc").value=r.discord||"";$("htw").value=r.twitter||"";$("hm").value=r.memo;$("hmod").hidden=false;$("hn").focus()};
    /* 아래 버튼들은 줄을 눌렀을 때 펼쳐지는 곳에 들어가요 */
    const acts=[];
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
    const b3=el("button",{className:"btn small danger",textContent:"삭제"});const isCeo=(r.user_email||"").toLowerCase()==="takanashi@rif-studio.com";b3.disabled=isCeo;if(isCeo)b3.title="대표님 계정은 지울 수 없어요";
    b3.onclick=async()=>{
      if(!r.used_at){if(!confirm(r.emp_no+" 을 삭제할까요?"))return;const {error}=await db.rpc("hr_delete",{p_pin:PIN,p_id:r.id});if(error)return alert(err(error));load();return}
      if(!confirm((r.name||r.user_email)+" ("+r.user_email+") 계정을 완전히 삭제할까요?\n\n· 로그인 계정, 메일 권한, 프로필 사진, 인사정보가 모두 지워져요\n· 되돌릴 수 없어요\n· 이미 보낸 메일 기록과 올린 공지·자료는 남아요"))return;
      b3.disabled=true;const {data,error}=await db.functions.invoke("admin-account",{body:{action:"delete",pin:PIN,email:r.user_email}});
      let m="";if(error){try{m=(await error.context.json()).error}catch(_){m=error.message}}else if(!(data&&data.ok))m=(data&&data.error)||"알 수 없는 오류";
      b3.disabled=false;if(m)return alert("지우지 못했어요: "+m);load()};acts.push(b3);
    const idTxt=pend?"초대: "+r.invite_email:(r.email||"").replace(/@rif-studio\.com$/i,"");
    const tr=el("tr",{className:"r"+(r.status==="left"?" lft":"")},[td(r.emp_no,"en"),td(r.name+(r.nickname?" ("+r.nickname+")":"")),td(idTxt,pend?"sm hm":"hm"),td(fmtPhone(r.phone),"hm"),td([r.position,r.rank].filter(Boolean).join(" / "),"hm"),td([r.division,r.team].filter(Boolean).join(" · "),"hm"),
      el("td",{},[el("span",{className:"hs "+st[1],textContent:st[0]})]),td(dt(r.issued_at),"dt hm sm"),el("td",{className:"ac"},[b1])]);
    const info=el("div",{className:"dg"},[kv("아이디",idTxt,"mo"),kv("전화",fmtPhone(r.phone),"mo"),kv("직책 · 직위",[r.position,r.rank].filter(Boolean).join(" / "),"mo"),kv("부서 · 팀",[r.division,r.team].filter(Boolean).join(" · "),"mo"),kv("발급일",dt(r.issued_at),"mo"),kv("Discord",r.discord),kv("X",r.twitter),kv("메모",r.memo),...(pend?[kv("초대 이메일",r.invite_email)]:[]),...(r.onboard_sent_at&&!r.used_at?[kv("축하 메일 발송",dt(r.onboard_sent_at))]:[])]);
    const dtl=el("tr",{className:"d",hidden:!OPEN.has(r.id)},[el("td",{colSpan:9},[info,el("div",{className:"dact"},acts)])]);
    tr.onclick=()=>{dtl.hidden=!dtl.hidden;if(dtl.hidden)OPEN.delete(r.id);else OPEN.add(r.id)};
    tb.append(tr,dtl)});
  if(!view.length)tb.append(el("tr",{},[el("td",{colSpan:9,textContent:rows.length?"검색 결과가 없어요.":"아직 발급된 사번이 없어요."})]))}
$("hrq").oninput=draw;
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
  const {error}=await db.rpc("hr_save2",{p_pin:PIN,p_id:edit.id,p_emp_no:$("hno").value.trim(),p_name:$("hn").value,p_nick:$("hnk").value,p_email:$("he").value,p_phone:$("hph").value,p_position:$("hp").value,p_rank:$("hrk").value,p_division:$("hdv").value,p_team:$("htm").value,p_discord:$("hdc").value,p_twitter:$("htw").value,p_memo:$("hm").value});
  if(error)return alert("저장하지 못했어요: "+err(error));
  edit=null;$("hmod").hidden=true;load()};
const TD={"경영지원팀":"경영부","보컬팀":"프로덕션부","사운드제작팀":"프로덕션부","일러스트팀":"프로덕션부","매니지먼트팀":"프로덕션부"};
/* 부서를 고르면 그 부서의 팀만 팀 목록에 나와요 */
function fillTeams(keep){const d=$("hdv").value,cur=keep===undefined?$("htm").value:keep,sel=$("htm");
  sel.replaceChildren(el("option",{value:"",textContent:"없음"}),...Object.keys(TD).filter(t=>TD[t]===d).map(t=>el("option",{value:t,textContent:t})));
  sel.value=Object.keys(TD).some(t=>t===cur&&TD[t]===d)?cur:""}
function setDT(d,t){$("hdv").value=d;fillTeams(t)}
$("hdv").addEventListener("change",()=>fillTeams());
$("htm").addEventListener("mousedown",()=>fillTeams());$("htm").addEventListener("focus",()=>fillTeams());
$("htm").onchange=()=>{const t=$("htm").value;if(t)$("hdv").value=TD[t]};
fillTeams();
const closeEdit=()=>{edit=null;$("hmod").hidden=true};$("hcancel").onclick=closeEdit;$("hmx").onclick=closeEdit;$("hmod").onclick=e=>{if(e.target===$("hmod"))closeEdit()};
const pm=$("hpm");
$("hrlock").onclick=()=>{if(PIN){lock();return}$("hpi").value="";$("hpe").textContent="";pm.hidden=false;$("hpi").focus()};
$("hpc").onclick=()=>{pm.hidden=true};$("hpx").onclick=()=>{pm.hidden=true};pm.onclick=e=>{if(e.target===pm)pm.hidden=true};
document.addEventListener("keydown",e=>{if(e.key!=="Escape")return;if(!$("hmod").hidden)closeEdit();else if(!pm.hidden)pm.hidden=true});
$("hpo").onclick=async()=>{const p=$("hpi").value;if(!p)return;
  const {data,error}=await db.rpc("check_ceo_pin",{p_pin:p});
  if(error&&/permission denied|JWT|401/i.test(error.message||"")){$("hpe").textContent="로그인이 풀렸어요. 로그아웃 후 다시 로그인해 주세요";try{await db.auth.signOut()}catch(_){}setTimeout(()=>location.reload(),1500);return}
  if(error||!data){$("hpe").textContent="비밀번호가 맞지 않아요";return}
  PIN=p;pm.hidden=true;$("hr-body").hidden=false;$("hrlock").textContent="🔓 잠금 (열림)";clearTimeout(tm);tm=setTimeout(lock,10*60*1000);load()};
$("hpi").onkeydown=e=>{if(e.key==="Enter")$("hpo").click()};
$("out").addEventListener("click",lock);
/* 로그인 직후(스크립트가 다 불러와지기 전/후 어느 쪽이든) 인사정보 화면을 반드시 보여줘요 */
try{const ap=$("app"),go=()=>{if(!ap.hidden)tab(3)};new MutationObserver(go).observe(ap,{attributes:true,attributeFilter:["hidden"]});go()}catch(_){}
})();

bindPhone($("hph"));
