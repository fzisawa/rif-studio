(()=>{
const U={"사운드":["vocal","composition","directing","mixing","mastering"],"아트":["illustration","design"],"콘텐츠":["writer","streamer","video"],"매니지먼트":["management","sales"],"기타":["etc"]},
  N={vocal:"보컬",composition:"작곡·편곡",directing:"디렉팅",mixing:"믹싱",mastering:"마스터링",illustration:"일러스트",design:"디자인·굿즈",writer:"작가",streamer:"스트리머",video:"영상",management:"매니지먼트",sales:"영업·운영",etc:"기타"},
  R={korea:"한국",japan:"일본",english:"영미권",other:"기타"};
const flds=r=>{const f=(r.fields||"").split(",").filter(Boolean);return f.map(x=>x==="etc"&&r.field_other?"기타("+r.field_other+")":(N[x]||x)).join(", ")||"-"};
const pad=n=>String(n).padStart(2,"0"),dt=s=>{const d=new Date(s);return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+" "+pad(d.getHours())+":"+pad(d.getMinutes())};
const url=v=>/^https?:\/\//.test(v||"")?v:null;
let rows=[],PIN=null,lockT=null;
function setLock(on){const b=$("ceo");if(on){PIN=null;clearTimeout(lockT);b.textContent="🔒 대표 잠금 해제"}else{b.textContent="🔓 잠금 (대표 모드)";clearTimeout(lockT);lockT=setTimeout(()=>{setLock(true);draw()},600000)}}
function askPin(){return new Promise(res=>{const o=$("pm");$("pi").value="";$("pe").textContent="";o.hidden=false;$("pi").focus();
  const done=v=>{o.hidden=true;document.removeEventListener("keydown",kd);res(v)},kd=e=>{if(e.key==="Escape")done(null);if(e.key==="Enter")go()};document.addEventListener("keydown",kd);
  const go=async()=>{const p=$("pi").value.trim();if(!p)return;const {data,error}=await db.rpc("check_ceo_pin",{p_pin:p});if(error||!data){$("pe").textContent="비밀번호가 맞지 않아요";$("pi").select();return}done(p)};
  $("po").onclick=go;$("pc").onclick=()=>done(null);o.onclick=e=>{if(e.target===o)done(null)}})}
$("ceo").onclick=async()=>{if(PIN){setLock(true);draw();return}const p=await askPin();if(p){PIN=p;setLock(false);draw()}};
function cell(v,cls){return el("td",{className:cls||"",textContent:v||"-"})}
function link(v,cls){const td=el("td",{className:cls||""});const u=url(v);if(u){const a=el("a",{href:u,target:"_blank",rel:"noopener noreferrer",textContent:v});a.onclick=e=>e.stopPropagation();td.append(a)}else td.textContent=v||"-";return td}
const MC=[["mail_thanks","감사"],["mail_interview","면접"],["mail_reject","거절"],["mail_hire","채용"]];
const TYPE={mail_thanks:"thanks",mail_interview:"interview",mail_reject:"reject",mail_hire:"hire"};
function askMail(r,k,t){return new Promise(res=>{
  const who=(r.nickname||r.name||r.email)+" ("+r.email+")";
  $("mt").textContent=t+" 메일을 보낼까요?";
  const lg=r.region==="korea"?"한국어":r.region==="japan"?"일본어":(r.region==="english"||r.region==="other")?"영어":"한국어+일본어+영어";
  $("mp").textContent=who+"님께 "+t+" 메일("+lg+", 출신: "+(R[r.region]||"미입력")+")을 support@rif-studio.com으로 바로 보냅니다. 보내면 되돌릴 수 없어요.";
  const iv=false;$("mf").hidden=!iv;$("md").value="";$("ml").value="";
  $("mw").textContent=((k==="mail_reject"&&r.mail_hire)||(k==="mail_hire"&&r.mail_reject))?"주의: 이미 "+(k==="mail_reject"?"채용":"거절")+" 메일이 나간 지원자예요. 정말 보낼까요?":"";
  const o=$("mm");o.hidden=false;(iv?$("md"):$("mg")).focus();
  const done=v=>{o.hidden=true;document.removeEventListener("keydown",kd);res(v)},kd=e=>{if(e.key==="Escape")done(null)};document.addEventListener("keydown",kd);
  $("mc").onclick=()=>done(null);o.onclick=e=>{if(e.target===o)done(null)};
  $("mg").onclick=()=>{if(iv){const d=$("md").value.trim(),l=$("ml").value.trim();if(!d||!l){alert("일시와 장소(링크)를 입력해 주세요.");return}done({date:d,place:l})}else done({})}})}
async function save(r,patch,node){
  const {error}=await db.from("join_requests").update(patch).eq("id",r.id);
  if(error){alert("저장 실패: "+error.message);return false}
  Object.assign(r,patch);if(node){node.classList.add("ok");setTimeout(()=>node.classList.remove("ok"),900)}return true}
function draw(){
  const q=$("q").value.trim().toLowerCase(),tb=$("tb");tb.replaceChildren();
  const cnt={};rows.forEach(r=>{const k=(r.email||"").trim().toLowerCase();cnt[k]=(cnt[k]||0)+1});
  const view=rows.filter(r=>!q||[r.nickname,r.name,r.email,flds(r),r.discord,r.twitter,R[r.region],r.memo].join(" ").toLowerCase().includes(q));
  const dup=rows.filter(r=>cnt[(r.email||"").trim().toLowerCase()]>1).length;
  $("cnt").textContent="지원자 "+view.length+(q?" / "+rows.length:"")+"명"+(dup?" · 재지원 "+dup+"건":"");
  view.forEach(r=>{
    const n=cnt[(r.email||"").trim().toLowerCase()],isDup=n>1;
    const nick=cell(r.nickname||r.name);if(isDup)nick.append(el("span",{className:"dupb",textContent:"재지원"}));
    const chk=MC.map(([k,t])=>{const c=el("input",{type:"checkbox",checked:!!r[k],disabled:!!r.ceo_reject,title:r.ceo_reject?"채용 거절 처리된 지원자 (대표 비밀번호로 거절을 풀어야 수정 가능)":t+" 체크 (메일은 자동으로 나가지 않아요)"});c.className="mc"+(k==="mail_reject"?" mr":"");c.onclick=e=>e.stopPropagation();
      c.onchange=async()=>{const v=c.checked;c.disabled=true;const ok=await save(r,{[k]:v},td);c.disabled=!!r.ceo_reject;if(!ok){c.checked=!v;r[k]=!v}else c.title=t+(v?" 체크됨 (다시 누르면 해제)":" 체크")};
      const td=el("td",{className:"mk"},[c]);return td});
    const CK=[["ceo_interview","면접 의향","ci"],["ceo_hire","채용 의향","ch"],["ceo_reject","채용 거절","cr"]].map(([k,t,cl])=>{const c=el("input",{type:"checkbox",checked:!!r[k],disabled:!PIN,title:PIN?t:"대표 잠금 해제 후 변경할 수 있어요"});c.onclick=e=>e.stopPropagation();
      c.onchange=async()=>{const v=c.checked;c.disabled=true;const {error}=await db.rpc("set_ceo_intent",{p_id:r.id,p_field:k,p_val:v,p_pin:PIN});c.disabled=!PIN;if(error){c.checked=!v;alert("저장하지 못했어요: "+(/bad pin/.test(error.message)?"비밀번호가 맞지 않아요. 잠금을 풀고 다시 시도해 주세요.":error.message));return}r[k]=v;if(k==="ceo_reject"){draw();return}td.classList.add("ok");setTimeout(()=>td.classList.remove("ok"),900)};
      const td=el("td",{className:"mk ck "+cl},[c]);return td});
    const memo=el("input",{className:"memo",value:r.memo||"",placeholder:"메모",maxLength:500});memo.onclick=e=>e.stopPropagation();
    if(!PIN){memo.readOnly=true;memo.title="대표 잠금을 풀어야 메모를 쓸 수 있어요";memo.placeholder="🔒 대표만 작성"}
    else if(r.ceo_reject){memo.readOnly=true;memo.title="채용 거절 처리됨 — 대표 비밀번호로 거절을 풀면 수정할 수 있어요"}
    memo.onchange=()=>save(r,{memo:memo.value.trim()||null},memo);
    const tr=el("tr",{className:"r"+(isDup?" dup":"")+(r.ceo_reject?" rej":"")},[cell(String(r.no),"no"),cell(dt(r.created_at),"dt"),nick,cell(r.nickname?r.name:""),cell(r.email),cell(R[r.region]||"-"),cell(flds(r),"ch"),cell(r.discord),link(r.youtube,"ln"),link(r.twitter,"ln"),...chk,...CK,el("td",{className:"mm"},[memo])]);
    const dtl=el("tr",{className:"d",hidden:true},[el("td",{colSpan:18},[el("b",{textContent:"경력"}),el("p",{textContent:r.career||"-"}),el("b",{textContent:"자기소개"}),el("p",{textContent:r.intro||"-"}),el("b",{textContent:"지원동기"}),el("p",{textContent:r.motive||"-"})])]);
    const x=el("button",{className:"btn small",textContent:"삭제"});
    if(r.ceo_reject){x.disabled=true;x.title="채용 거절 처리됨 — 대표 비밀번호로 거절을 풀어야 삭제할 수 있어요"}
    x.onclick=async e=>{e.stopPropagation();if(r.ceo_reject)return;if(confirm((r.nickname||r.name)+" 지원서를 삭제할까요? 되돌릴 수 없어요.")){const {error}=await db.from("join_requests").delete().eq("id",r.id);if(error)alert("삭제 실패");load()}};
    dtl.firstChild.append(x);tr.onclick=()=>{dtl.hidden=!dtl.hidden};tb.append(tr,dtl)});
  if(!view.length)tb.append(el("tr",{},[el("td",{colSpan:18,textContent:"아직 지원서가 없어요."})]))}
let loaded=false;
async function load(){
  const {data,error}=await db.from("join_requests").select("*").order("created_at",{ascending:true});
  if(error){$("cnt").textContent="불러오기 실패";return}
  rows=(data||[]).map((r,i)=>({...r,no:i+1})).reverse();loaded=true;draw()}
$("q").oninput=draw;
const tab=n=>{$("p1").hidden=n!==1;$("p2").hidden=n!==2;$("t1").setAttribute("aria-pressed",n===1);$("t2").setAttribute("aria-pressed",n===2);$("mn").classList.toggle("wide",n===2);if(n===2)load()};
$("t1").onclick=()=>tab(1);$("t2").onclick=()=>tab(2);
$("t1").hidden=true;/* 포트폴리오 올리기 탭은 숨김 */$("t2").hidden=true;/* 지원서 보기는 인트라넷 > 업무(경영지원팀)로 이동 */
try{let first=true;const ap=$("app"),go=()=>{if(!ap.hidden&&first){first=false;$("t3").click()}};new MutationObserver(go).observe(ap,{attributes:true,attributeFilter:["hidden"]});go()}catch(_){}
window.__jlist=load;
$("csv").onclick=()=>{const h=["No","접수일시","닉네임","성명","이메일","출신","분야","Discord","YouTube","Twitter","감사메일","면접메일","거절메일","채용메일","면접의향(대표)","채용의향(대표)","채용거절(대표)","메모","재지원","자기소개","지원동기","경력"];
  const q=v=>'"'+String(v==null?"":v).replace(/"/g,'""')+'"';
  const body=[...rows].reverse().map(r=>[r.no,dt(r.created_at),r.nickname||r.name,r.nickname?r.name:"",r.email,R[r.region]||"",flds(r),r.discord,r.youtube,r.twitter,...MC.map(([k])=>r[k]?"O":""),r.ceo_interview?"O":"",r.ceo_hire?"O":"",r.ceo_reject?"O":"",r.memo,(rows.filter(x=>(x.email||"").trim().toLowerCase()===(r.email||"").trim().toLowerCase()).length>1?"Y":""),r.intro,r.motive,r.career].map(q).join(","));
  const b=new Blob(["﻿"+[h.map(q).join(","),...body].join("\r\n")],{type:"text/csv;charset=utf-8"});
  const a=el("a",{href:URL.createObjectURL(b),download:"rif-join-applicants.csv"});a.click()};
})();
