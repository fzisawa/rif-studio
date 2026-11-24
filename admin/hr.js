(()=>{
const $=i=>document.getElementById(i),DAYS=14,SOON=30,CEO="takanashi@rif-studio.com",KINDS=["정규직","프리랜서","계약직","인턴","연습생"],KC={"정규직":"reg","프리랜서":"fre","계약직":"con","인턴":"int","연습생":"tra"};
let PIN=null,rows=[],view=[],owners={},edit=null,tm=null,filt="all";const OPEN=new Set();
const dt=s=>s?new Date(s).toLocaleDateString("ko-KR"):"";
/* 날짜만 있는 값(2026-11-16)은 시간대에 흔들리지 않게 글자 그대로 읽어요 */
const DRE=/^(\d{4})-(\d{2})-(\d{2})/,ymd=s=>DRE.test(String(s||""))?String(s).slice(0,10):"",day=s=>{const m=DRE.exec(String(s||""));return m?m[1]+". "+(+m[2])+". "+(+m[3])+".":""};
const dleft=s=>{const m=DRE.exec(String(s||""));if(!m)return null;const n=new Date();return Math.round((new Date(+m[1],+m[2]-1,+m[3])-new Date(n.getFullYear(),n.getMonth(),n.getDate()))/86400000)};
const dday=d=>d<0?"만료 "+(-d)+"일 지남":d===0?"오늘 만료":"D-"+d;
const expired=r=>!r.used_at&&Date.now()-new Date(r.issued_at).getTime()>DAYS*86400000;
const live=r=>r.status!=="left",soon=r=>live(r)&&!!ymd(r.contract_end)&&dleft(r.contract_end)<=SOON;
const lock=()=>{PIN=null;rows=[];view=[];owners={};edit=null;filt="all";OPEN.clear();clearTimeout(tm);$("hr-body").hidden=true;$("hmod").hidden=true;$("hrq").value="";$("hrcnt").textContent="";$("hsum").replaceChildren();$("hrtb").replaceChildren();$("hrlock").textContent="🔒 대표 잠금 해제"};
const err=e=>{const m=String((e&&e.message)||e||"");return /bad pin/.test(m)?"비밀번호가 맞지 않아요":/only unused/.test(m)?"이미 가입한 사번은 삭제할 수 없어요 (퇴사 처리를 쓰세요)":/8 digits|emp_no invalid/.test(m)?"사번은 공백 없이 1~20자여야 해요":/already used/.test(m)?"이미 있는 사번이에요":/bad division|bad team/.test(m)?"본부/부 값이 올바르지 않아요":/bad email/.test(m)?"이메일 형식이 올바르지 않아요":/bad kind/.test(m)?"계약 형태 값이 올바르지 않아요":/bad contract dates/.test(m)?"계약 만료일이 입사일보다 빨라요":/ceo account/.test(m)?"대표님 계정은 퇴사 처리할 수 없어요":/admin only/.test(m)?"대표 계정으로 로그인해 주세요":m};
const fnErr=async(data,error)=>{if(error){try{return (await error.context.json()).error}catch(_){return error.message}}return data&&data.ok?"":(data&&data.error)||"알 수 없는 오류"};
async function load(){
  const [a,o]=await Promise.all([db.rpc("hr_list",{p_pin:PIN}),db.from("page_owners").select("page,email")]);
  if(a.error){alert("불러오지 못했어요: "+err(a.error));lock();return}
  rows=a.data||[];owners={};((o&&o.data)||[]).forEach(x=>{(owners[x.page]=owners[x.page]||[]).push(String(x.email||"").toLowerCase())});draw()}
async function sendMail(r){const {data,error}=await db.functions.invoke("send-onboarding",{body:{id:r.id}});return fnErr(data,error)}
const kv=(k,v,c)=>el("div",{className:c||""},[el("b",{textContent:k}),el("span",{textContent:v||"-"})]);
const td=(t,c)=>el("td",{className:c||"",textContent:t||"",title:t||""});
/* 이 사람이 쓸 수 있는 권한 (직책·팀·채널 담당에서 정해져요) */
const chOf=r=>{const em=(r.user_email||"").toLowerCase();return em?Object.keys(owners).filter(p=>owners[p].includes(em)):[]};
const rights=r=>{const em=(r.user_email||"").toLowerCase();if(!em||!r.used_at)return"";if(!live(r))return"없음 (퇴사)";
  if(em===CEO||r.position==="대표이사")return"대표 (전체)";const a=[];if((r.team==="경영지원부"||r.team==="경영지원팀"))a.push("업무 탭 (지원서 · 문의 메일)");
  const ch=chOf(r);if(ch.length)a.push("포트폴리오 수정: "+ch.join(", "));return a.join(" · ")||"기본 (게시판 · 메일 · 채팅)"};
/* 현황 칩 = 골라 보기 */
const FILTERS=[["all","전체",()=>true,1],["정규직","정규직",r=>live(r)&&r.kind==="정규직",1],["프리랜서","프리랜서",r=>live(r)&&r.kind==="프리랜서",1],["계약직","계약직",r=>live(r)&&r.kind==="계약직",1],["인턴","인턴",r=>live(r)&&r.kind==="인턴",1],["연습생","연습생",r=>live(r)&&r.kind==="연습생",1],["none","미지정",r=>live(r)&&!KINDS.includes(r.kind),1],["pend","가입 대기",r=>live(r)&&!r.used_at,0],["soon","계약 만료 임박",soon,0,1],["left","퇴사",r=>!live(r),0]];
function chips(){const box=$("hsum");box.replaceChildren();
  FILTERS.forEach(([k,t,f,always,warn],i)=>{const n=rows.filter(f).length;if(!always&&!n&&filt!==k)return;
    if(i===5||(i>5&&!box.querySelector(".sep")))box.append(el("span",{className:"sep"}));
    const b=el("button",{type:"button",className:"chip"+(filt===k?" on":"")+(warn?" w":""),title:warn?"계약 만료일이 "+SOON+"일 안으로 남았거나 지난 직원":t+"만 골라 보기"},[t,el("b",{textContent:String(n)})]);
    b.setAttribute("aria-pressed",String(filt===k));b.onclick=()=>{filt=filt===k?"all":k;draw()};box.append(b)})}
function openEdit(r){edit=r;$("hft").textContent="정보 수정 · "+r.emp_no;$("hno").value=r.emp_no;$("hn").value=r.name||"";$("hnk").value=r.nickname||"";$("he").value=r.email||"";$("hph").value=fmtPhone(r.phone);$("hp").value=r.position||"";$("hrk").value=r.rank||"";setDT(r.division||"",r.team||"");
  $("hkd").value=KINDS.includes(r.kind)?r.kind:"";$("hjd").value=ymd(r.joined);$("hce").value=ymd(r.contract_end);$("hlfw").hidden=live(r);$("hlf").value=ymd(r.left_at);
  $("hdc").value=r.discord||"";$("htw").value=r.twitter||"";$("hm").value=r.memo||"";$("hmod").hidden=false;$("hn").focus()}
function draw(){
  const tb=$("hrtb"),q=($("hrq").value||"").trim().toLowerCase();tb.replaceChildren();chips();
  const ff=(FILTERS.find(x=>x[0]===filt)||FILTERS[0])[2];
  view=rows.filter(r=>ff(r)&&(!q||[r.emp_no,r.name,r.nickname,r.email,r.user_email,r.invite_email,r.division,r.team,r.position,r.rank,r.kind||"미지정",r.discord,r.twitter,r.memo].join(" ").toLowerCase().includes(q)));
  $("hrcnt").textContent="총 "+rows.length+"명 · 가입 완료 "+rows.filter(r=>r.used_at&&r.status==="active").length+"명"+(q||filt!=="all"?" · 지금 보이는 목록 "+view.length+"명":"");
  view.forEach(r=>{
    const st=r.status==="left"?["퇴사","x"]:r.used_at?["가입 완료","on"]:expired(r)?["기간 만료","x"]:["가입 대기","wt"];
    const pend=!r.used_at&&r.invite_email;
    const b1=el("button",{className:"btn small",textContent:"수정"});
    b1.onclick=e=>{e.stopPropagation();openEdit(r)};
    /* 계약 형태: 표에서 바로 바꿔요 */
    const ks=el("select",{className:"kd "+(KC[r.kind]||"none"),title:"계약 형태 (여기서 바로 바꿀 수 있어요)"},[el("option",{value:"",textContent:"미지정"}),...KINDS.map(k=>el("option",{value:k,textContent:k}))]);
    if(r.kind&&!KINDS.includes(r.kind))ks.append(el("option",{value:r.kind,textContent:r.kind}));
    ks.value=r.kind||"";ks.setAttribute("aria-label",(r.name||r.emp_no)+" 계약 형태");ks.onclick=e=>e.stopPropagation();
    ks.onchange=async()=>{const v=ks.value;ks.disabled=true;const {error}=await db.rpc("hr_set_kind",{p_pin:PIN,p_id:r.id,p_kind:v});ks.disabled=false;
      if(error){ks.value=r.kind||"";alert("바꾸지 못했어요: "+err(error));return}r.kind=v;draw()};
    const dl=live(r)&&ymd(r.contract_end)?dleft(r.contract_end):null,kc=el("td",{className:"kc"},[ks]);
    if(dl!==null)kc.append(el("span",{className:"dd"+(dl<0?" over":dl<=SOON?" soon":""),textContent:dday(dl),title:"계약 만료일 "+day(r.contract_end)}));
    /* 아래 버튼들은 줄을 눌렀을 때 펼쳐지는 곳에 들어가요 */
    const acts=[];
    {const be=el("button",{className:"btn small mo",textContent:"정보 수정"});be.onclick=()=>openEdit(r);acts.push(be)}
    if(!r.used_at&&r.status==="active"&&r.invite_email){const b=el("button",{className:"btn small",textContent:r.onboard_sent_at?"사번 안내 메일 다시 보내기":"사번 안내 메일 보내기"});
      b.onclick=async()=>{if(!confirm(r.invite_email+" 에게 사번 안내 메일(한/일/영, 사번 "+r.emp_no+" 포함)을 보낼까요?"))return;b.disabled=true;const m=await sendMail(r);b.disabled=false;if(m)alert("메일을 보내지 못했어요: "+m);else{alert("보냈어요.");load()}};acts.push(b)}
    if(expired(r)){const b=el("button",{className:"btn small",textContent:"기간 연장"});b.onclick=async()=>{const {error}=await db.rpc("hr_renew",{p_pin:PIN,p_id:r.id});if(error)return alert(err(error));load()};acts.push(b)}
    const isCeo=(r.user_email||"").toLowerCase()===CEO;
    if(r.used_at&&r.user_email&&r.status==="active"&&!isCeo){const bp=el("button",{className:"btn small",textContent:"비밀번호 재설정"});
      bp.onclick=async()=>{const pw=prompt(r.user_email+" 의 새 비밀번호를 입력하세요 (8자 이상).\n입력한 비밀번호는 직원에게 직접 알려 주세요.");if(!pw)return;
        if(pw.length<8)return alert("8자 이상으로 입력해 주세요.");
        const {data,error}=await db.functions.invoke("admin-account",{body:{action:"setpw",pin:PIN,email:r.user_email,password:pw}});
        const m=await fnErr(data,error);
        alert(m?"바꾸지 못했어요: "+m:"비밀번호를 바꿨어요. 직원에게 새 비밀번호를 전달해 주세요.")};acts.push(bp)}
    const b2=el("button",{className:"btn small",textContent:r.status==="left"?"복직":"퇴사 처리"});if(isCeo&&live(r)){b2.disabled=true;b2.title="대표님 계정은 퇴사 처리할 수 없어요"}
    b2.onclick=async()=>{const to=r.status==="left"?"active":"left";if(to==="left"&&!confirm((r.name||r.emp_no)+" 님을 퇴사 처리할까요?\n\n· 인트라넷·메일 사용 권한이 바로 사라져요\n· 포트폴리오 채널 담당이었다면 수정 권한도 같이 꺼져요\n· 오늘 날짜가 퇴사일로 남아요 (수정에서 바꿀 수 있어요)"))return;
      const {error}=await db.rpc("hr_set_status",{p_pin:PIN,p_id:r.id,p_status:to});if(error)return alert(err(error));load()};acts.push(b2);
    const b3=el("button",{className:"btn small danger",textContent:"삭제"});b3.disabled=isCeo;if(isCeo)b3.title="대표님 계정은 지울 수 없어요";
    b3.onclick=async()=>{
      if(!r.used_at){if(!confirm("사번 "+r.emp_no+" 을 삭제할까요?\n아직 가입하지 않은 사번이라 이 번호로는 더 이상 가입할 수 없게 돼요."))return;const {error}=await db.rpc("hr_delete",{p_pin:PIN,p_id:r.id});if(error)return alert(err(error));load();return}
      if(!confirm((r.name||r.user_email)+" ("+r.user_email+") 계정을 완전히 삭제할까요?\n\n· 로그인 계정, 메일 권한, 프로필 사진, 인사정보가 모두 지워져요\n· 되돌릴 수 없어요\n· 이미 보낸 메일 기록과 올린 공지·자료는 남아요"))return;
      b3.disabled=true;const {data,error}=await db.functions.invoke("admin-account",{body:{action:"delete",pin:PIN,email:r.user_email}});
      const m=await fnErr(data,error);
      b3.disabled=false;if(m)return alert("지우지 못했어요: "+m);load()};acts.push(b3);
    const idTxt=pend?"초대: "+r.invite_email:(r.email||"").replace(/@rif-studio\.com$/i,"");
    const tr=el("tr",{className:"r"+(r.status==="left"?" lft":"")},[td(r.emp_no,"en hm"),td((r.name||"")+(r.nickname?" ("+r.nickname+")":"")||"(이름 미입력)","pn"+(r.name||r.nickname?"":" sm")),kc,td(idTxt,pend?"sm hm":"hm"),td(fmtPhone(r.phone),"hm"),td([r.position,r.rank].filter(Boolean).join(" / "),"hm"),td([r.division,r.team].filter(Boolean).join(" · "),"hm"),
      el("td",{},[el("span",{className:"hs "+st[1],textContent:st[0]})]),td(r.used_at?day(r.joined):"발급 "+dt(r.issued_at),"dt hm sm"),el("td",{className:"ac hm"},[b1])]);
    const rt=rights(r);
    const info=el("div",{className:"dg"},[kv("사번",r.emp_no,"mo"),kv("아이디",idTxt,"mo"),kv("전화",fmtPhone(r.phone),"mo"),kv("직책 · 직위",[r.position,r.rank].filter(Boolean).join(" / "),"mo"),kv("본부 · 부",[r.division,r.team].filter(Boolean).join(" · "),"mo"),kv(r.used_at?"입사일":"사번 발급일",r.used_at?day(r.joined):dt(r.issued_at),"mo"),
      ...(ymd(r.contract_end)?[kv("계약 만료일",day(r.contract_end)+(dl!==null?" ("+dday(dl)+")":""))]:[]),...(live(r)?[]:[kv("퇴사일",day(r.left_at))]),
      kv("Discord",r.discord),kv("X",r.twitter),kv("메모",r.memo),...(rt?[kv("권한",rt)]:[]),...(pend?[kv("초대 이메일",r.invite_email)]:[]),...(r.onboard_sent_at&&!r.used_at?[kv("사번 안내 메일 발송",dt(r.onboard_sent_at))]:[])]);
    const dtl=el("tr",{className:"d",hidden:!OPEN.has(r.id)},[el("td",{colSpan:10},[info,el("div",{className:"dact"},acts)])]);
    tr.onclick=()=>{dtl.hidden=!dtl.hidden;if(dtl.hidden)OPEN.delete(r.id);else OPEN.add(r.id)};
    tb.append(tr,dtl)});
  if(!view.length)tb.append(el("tr",{},[el("td",{colSpan:10,textContent:rows.length?"조건에 맞는 직원이 없어요.":"아직 등록된 직원이 없어요."})]))}
$("hrq").oninput=draw;
/* 명단 내보내기: 지금 보이는 목록을 엑셀에서 열리는 CSV로 (대표 잠금이 풀려 있을 때만) */
$("hrcsv").onclick=()=>{if(!PIN)return;if(!view.length)return alert("내보낼 직원이 없어요.");
  const H=["사번","이름","닉네임","아이디","전화","계약 형태","입사일","계약 만료일","직책","직위","본부","부","상태","퇴사일","Discord","X","포트폴리오 담당","메모"];
  const stt=r=>!live(r)?"퇴사":r.used_at?"재직":expired(r)?"가입 기간 만료":"가입 대기";
  const L=view.map(r=>[r.emp_no,r.name,r.nickname,r.used_at?r.email:(r.invite_email?"초대: "+r.invite_email:""),fmtPhone(r.phone),r.kind||"미지정",ymd(r.joined),ymd(r.contract_end),r.position,r.rank,r.division,r.team,stt(r),ymd(r.left_at),r.discord,r.twitter,chOf(r).join(" / "),r.memo]);
  /* 수식으로 읽힐 수 있는 값(=,+,-,@ 로 시작)은 앞에 ' 를 붙여 글자로만 열리게 해요 */
  const cell=v=>{let s=String(v==null?"":v);if(/^[=+\-@\t\r]/.test(s))s="'"+s;return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
  const n=new Date(),fn="RIF_직원명단_"+n.getFullYear()+String(n.getMonth()+1).padStart(2,"0")+String(n.getDate()).padStart(2,"0")+".csv";
  const a=el("a",{href:URL.createObjectURL(new Blob(["﻿"+[H,...L].map(l=>l.map(cell).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"})),download:fn});
  document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)};
$("cshow").onchange=()=>{$("cpw").type=$("cshow").checked?"text":"password"};
$("cform").onsubmit=async e=>{e.preventDefault();const m=$("cmsg");
  const id=$("cid").value.trim(),nm=$("cn").value.trim(),pw=$("cpw").value,kind=$("ckd").value;
  if(!id||!nm||!pw){m.className="note err";m.textContent="아이디·이름·비밀번호를 모두 써 주세요.";return}
  if(!confirm(id.replace(/@rif-studio\.com$/i,"")+"@rif-studio.com 계정을 만들까요?"))return;
  const b=$("cgo");b.disabled=true;m.className="note";m.textContent="만드는 중…";
  const {data,error}=await db.functions.invoke("admin-account",{body:{action:"create",pin:PIN,loginId:id,name:nm,nickname:$("cnk").value,phone:$("cph").value,password:pw}});
  b.disabled=false;const msg2=await fnErr(data,error);
  if(msg2){m.className="note err";m.textContent=msg2;return}
  m.textContent=data.email+" 계정을 만들었어요 ✓ 아이디와 비밀번호를 직원에게 전달해 주세요.";["cid","cn","cnk","cph","cpw"].forEach(x=>$(x).value="");$("cpw").type="password";$("cshow").checked=false;$("ckd").value="";
  await load();
  /* 고른 계약 형태를 방금 만든 직원에게 넣어요 */
  if(kind){const row=rows.find(r=>(r.user_email||"").toLowerCase()===String(data.email||"").toLowerCase());
    if(row){const r2=await db.rpc("hr_set_kind",{p_pin:PIN,p_id:row.id,p_kind:kind});if(r2.error)m.textContent+=" (계약 형태는 저장하지 못했어요. 표에서 다시 골라 주세요)";else{row.kind=kind;draw()}}}};
$("hform").onsubmit=async e=>{e.preventDefault();if(!edit)return;
  const {error}=await db.rpc("hr_save3",{p_pin:PIN,p_id:edit.id,p_emp_no:$("hno").value.trim(),p_name:$("hn").value,p_nick:$("hnk").value,p_email:$("he").value,p_phone:$("hph").value,p_position:$("hp").value,p_rank:$("hrk").value,p_division:$("hdv").value,p_team:$("htm").value,p_discord:$("hdc").value,p_twitter:$("htw").value,p_memo:$("hm").value,
    p_kind:$("hkd").value,p_joined:$("hjd").value||null,p_contract_end:$("hce").value||null,p_left_at:$("hlf").value||null});
  if(error)return alert("저장하지 못했어요: "+err(error));
  edit=null;$("hmod").hidden=true;load()};
let TD={"경영지원부":"경영본부","울림공방":"프로덕션본부","소리공방":"프로덕션본부","붓끝공방":"프로덕션본부","장면공방":"프로덕션본부","꿈틀공방":"프로덕션본부","이야기공방":"프로덕션본부"},DV=["경영본부","프로덕션본부"];
/* 본부 · 부 (org_units) — 관리자 페이지에서 편집. 영어 이름은 메일 서명 직함에 자동으로 쓰여요 */
function fillDivs(){const sel=$("hdv"),cur=sel.value;sel.replaceChildren(el("option",{value:"",textContent:"미배정"}),...DV.map(d=>el("option",{value:d,textContent:d})));if(cur&&!DV.includes(cur))sel.append(el("option",{value:cur,textContent:cur}));sel.value=cur}
async function loadOrgU(){const {data,error}=await db.from("org_units").select("division,team,sort,name_en").order("sort");if(error||!data||!data.length)return null;
  const o=[];data.forEach(r=>{let d=o.find(x=>x.division===r.division);if(!d){d={division:r.division,en:"",teams:[]};o.push(d)}if(r.team)d.teams.push({name:r.team,en:r.name_en||""});else d.en=r.name_en||""});
  DV=o.map(d=>d.division);TD={};o.forEach(d=>d.teams.forEach(t=>TD[t.name]=d.division));fillDivs();return o}
/* 본부는 탭으로, 부는 줄로(한국어 · 영어). 바꾼 뒤 '본부 · 부 저장'을 눌러야 반영돼요 */
let OU=[],OS=0,O0="";
const odirty=()=>JSON.stringify(OU)!==O0;
const omsg=()=>{$("orgmsg").textContent=odirty()?"저장하지 않은 변경이 있어요.":"";$("orgmsg").className="note"+(odirty()?" warn":"")};
function drawOrg(){OS=Math.min(OS,Math.max(0,OU.length-1));
  $("otabs").replaceChildren(...OU.map((d,i)=>{const b=el("button",{type:"button",role:"tab",className:"otab",ariaSelected:String(i===OS)},[document.createTextNode(d.division||"이름 없는 본부"),el("b",{textContent:String(d.teams.length)})]);b.onclick=()=>{OS=i;drawOrg()};return b}),
    (()=>{const b=el("button",{type:"button",className:"otab add",textContent:"＋ 본부 추가"});b.onclick=()=>{OU.push({division:"",en:"",teams:[]});OS=OU.length-1;drawOrg();omsg();$("orgl").querySelector(".odn").focus()};return b})());
  const d=OU[OS];if(!d){$("orgl").replaceChildren(el("p",{className:"note",textContent:"본부가 없어요. '＋ 본부 추가'를 눌러 만들어 주세요."}));return}
  const nm=el("input",{className:"odn",maxLength:40,placeholder:"본부 이름 · 예) 프로덕션본부",value:d.division}),ne=el("input",{className:"oen",maxLength:80,placeholder:"영어 · 예) Production Division",value:d.en||""});
  nm.oninput=()=>{d.division=nm.value;const t=$("otabs").children[OS];if(t)t.firstChild.textContent=nm.value||"이름 없는 본부";omsg()};ne.oninput=()=>{d.en=ne.value;omsg()};
  const del=el("button",{type:"button",className:"btn small ghost",textContent:"본부 삭제"});
  del.onclick=()=>{if(!confirm((d.division||"이 본부")+" 을(를) 지울까요? (저장을 눌러야 반영돼요)"))return;OU.splice(OS,1);OS=Math.max(0,OS-1);drawOrg();omsg()};
  const rows=el("div",{className:"orows"},d.teams.map((t,i)=>{const x=el("button",{type:"button",className:"ox",ariaLabel:t.name+" 빼기",textContent:"×"}),
      l=el("button",{type:"button",className:"om",ariaLabel:"위로",textContent:"↑",disabled:i===0}),
      ki=el("input",{maxLength:40,value:t.name,ariaLabel:"부 이름"}),ei=el("input",{maxLength:80,value:t.en||"",placeholder:"영어 · 예) Echo Lab",ariaLabel:"영어 이름"});
    ki.oninput=()=>{t.name=ki.value;omsg()};ei.oninput=()=>{t.en=ei.value;omsg()};
    x.onclick=()=>{d.teams.splice(i,1);drawOrg();omsg()};l.onclick=()=>{d.teams.splice(i-1,0,d.teams.splice(i,1)[0]);drawOrg();omsg()};
    return el("div",{className:"orow2"},[l,ki,ei,x])}));
  if(!d.teams.length)rows.append(el("span",{className:"note",textContent:"아직 부가 없어요."}));
  const ti=el("input",{className:"oti",maxLength:40,placeholder:"새 부 이름 · 예) 울림공방"}),te=el("input",{className:"oti",maxLength:80,placeholder:"영어 · 예) Echo Lab"}),ta=el("button",{type:"button",className:"btn small",textContent:"＋ 부 추가"});
  const add=()=>{const v=ti.value.trim();if(!v)return ti.focus();if(d.teams.some(t=>t.name===v)){alert("'"+v+"' 부가 이미 있어요");return}d.teams.push({name:v,en:te.value.trim()});drawOrg();omsg();$("orgl").querySelector(".oadd .oti").focus()};
  ta.onclick=add;[ti,te].forEach(x=>x.onkeydown=e=>{if(e.key==="Enter"&&!e.isComposing){e.preventDefault();add()}});
  $("orgl").replaceChildren(el("div",{className:"ohd"},[el("label",{},[el("span",{textContent:"본부 이름"}),nm]),el("label",{},[el("span",{textContent:"영어 이름 (서명에 쓰여요)"}),ne]),del]),
    el("div",{className:"otl"},[el("span",{className:"note",textContent:"부 ("+d.teams.length+") · 한국어 / 영어"}),rows]),el("div",{className:"oadd"},[ti,te,ta]))}
async function drawOrgU(){const o=await loadOrgU()||DV.map(d=>({division:d,en:"",teams:Object.keys(TD).filter(t=>TD[t]===d).map(t=>({name:t,en:""}))}));OU=o.map(d=>({division:d.division,en:d.en||"",teams:d.teams.map(t=>({...t}))}));O0=JSON.stringify(OU);drawOrg();omsg()}
$("orgsave").onclick=async()=>{const units=OU.map(u=>({division:u.division.trim(),division_en:(u.en||"").trim(),teams:u.teams.filter(t=>t.name.trim()).map(t=>({name:t.name.trim(),en:(t.en||"").trim()}))})).filter(u=>u.division);
  if(OU.some(u=>!u.division.trim()&&u.teams.length))return alert("이름이 비어 있는 본부가 있어요. 이름을 적거나 본부를 지워 주세요");
  if(!units.length)return alert("본부를 하나 이상 적어 주세요");const names=units.map(u=>u.division);if(new Set(names).size!==names.length)return alert("같은 이름의 본부가 두 개 있어요");
  const b=$("orgsave");b.disabled=true;const {error}=await db.rpc("org_save",{p_pin:PIN,p_units:units});b.disabled=false;
  if(error){$("orgmsg").textContent="저장하지 못했어요: "+err(error);$("orgmsg").className="note err";return}const keep=OU[OS]&&OU[OS].division;await drawOrgU();const i=OU.findIndex(u=>u.division===keep);if(i>=0){OS=i;drawOrg()}
  $("orgmsg").textContent="저장했어요. 인트라넷은 새로고침하면 반영돼요.";$("orgmsg").className="note ok";fillTeams()};
/* 본부를 고르면 그 본부의 부만 목록에 나와요 */
/* 목록에서 지운 본부 · 부에 배정돼 있던 직원은 그 값을 그대로 지킬 수 있게 선택지에 남겨 둬요 */
function fillTeams(keep){const d=$("hdv").value,cur=keep===undefined?$("htm").value:keep,sel=$("htm"),old=edit&&edit.team&&!(edit.team in TD)&&(edit.division||"")===d?edit.team:"";
  sel.replaceChildren(el("option",{value:"",textContent:"없음"}),...Object.keys(TD).filter(t=>TD[t]===d).map(t=>el("option",{value:t,textContent:t})),...(old?[el("option",{value:old,textContent:old+" (목록에 없는 부)"})]:[]));
  sel.value=Object.keys(TD).some(t=>t===cur&&TD[t]===d)||(old&&cur===old)?cur:""}
function setDT(d,t){const sel=$("hdv");sel.replaceChildren(el("option",{value:"",textContent:"미배정"}),...DV.map(x=>el("option",{value:x,textContent:x})));if(d&&!DV.includes(d))sel.append(el("option",{value:d,textContent:d+" (목록에 없는 본부)"}));sel.value=d;fillTeams(t)}
$("hdv").addEventListener("change",()=>fillTeams());
$("htm").addEventListener("mousedown",()=>fillTeams());$("htm").addEventListener("focus",()=>fillTeams());
$("htm").onchange=()=>{const t=$("htm").value;if(t&&TD[t])$("hdv").value=TD[t]};
loadOrgU().then(()=>fillTeams());fillTeams();
const closeEdit=()=>{edit=null;$("hmod").hidden=true};$("hcancel").onclick=closeEdit;$("hmx").onclick=closeEdit;
const pm=$("hpm");
$("hrlock").onclick=()=>{if(PIN){lock();return}$("hpi").value="";$("hpe").textContent="";pm.hidden=false;$("hpi").focus()};
$("hpc").onclick=()=>{pm.hidden=true};$("hpx").onclick=()=>{pm.hidden=true};pm.onclick=e=>{if(e.target===pm)pm.hidden=true};
document.addEventListener("keydown",e=>{if(e.key!=="Escape")return;if(!$("hmod").hidden)closeEdit();else if(!pm.hidden)pm.hidden=true});
$("hpo").onclick=async()=>{const p=$("hpi").value;if(!p)return;
  const {data,error}=await db.rpc("check_ceo_pin",{p_pin:p});
  if(error&&/permission denied|JWT|401/i.test(error.message||"")){$("hpe").textContent="로그인이 풀렸어요. 로그아웃 후 다시 로그인해 주세요";try{await db.auth.signOut({scope:"local"})}catch(_){}setTimeout(()=>location.reload(),1500);return}
  if(error||!data){$("hpe").textContent="비밀번호가 맞지 않아요";return}
  PIN=p;$("hpi").value="";pm.hidden=true;$("hr-body").hidden=false;$("hrlock").textContent="🔓 잠금 (열림)";clearTimeout(tm);tm=setTimeout(lock,10*60*1000);load();drawOrgU()};
$("hpi").onkeydown=e=>{if(e.key==="Enter")$("hpo").click()};
$("out").addEventListener("click",lock);
/* 로그아웃되면(다른 탭에서 로그아웃 포함) 바로 잠가요 */
try{const ap=$("app");new MutationObserver(()=>{if(ap.hidden&&PIN)lock()}).observe(ap,{attributes:true,attributeFilter:["hidden"]})}catch(_){}
})();

bindPhone($("hph"));

/* 사번 직접 발급 (지원서 · 채용 메일 없이). 메일 체크 시 한/일/영 사번 안내 메일도 보내요 */
$("hiform").onsubmit=async e=>{e.preventDefault();if(!PIN)return;const em=$("hiem").value.trim(),send=$("himail").checked,b=$("hibtn"),out=$("hiout");
  if(send&&!em)return alert("안내 메일을 보내려면 이메일을 입력해 주세요.");
  if(!confirm((em?em+" 에게 ":"")+"사번을 발급할까요?"+(send?"\n사번 안내 메일(한/일/영)도 함께 보내요.":"")))return;
  b.disabled=true;const {data,error}=await db.rpc("hr_issue",{p_pin:PIN,p_invite:em});
  if(error){b.disabled=false;return alert("발급하지 못했어요: "+err(error))}
  const row=(data||[])[0]||{};let note="";
  if(send&&row.id){const m=await sendMail({id:row.id});note=m?"  · 안내 메일을 보내지 못했어요: "+m:"  · 안내 메일을 보냈어요."}
  b.disabled=false;$("hiem").value="";$("himail").checked=false;out.hidden=false;out.textContent="발급한 사번: "+row.emp_no+note;load()};
