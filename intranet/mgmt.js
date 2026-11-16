/* 업무 탭 · 경영지원팀 전용: 지원서 / support@ 문의 게시판 (대표 포함) */
(()=>{
const $=i=>document.getElementById(i);
const N={vocal:"보컬",composition:"작곡·편곡",directing:"디렉팅",mixing:"믹싱",mastering:"마스터링",illustration:"일러스트",design:"디자인·굿즈",writer:"작가",streamer:"스트리머",video:"영상",management:"매니지먼트",sales:"영업·운영",etc:"기타"},
  R={korea:"한국",japan:"일본",english:"영미권",other:"기타"};
const flds=r=>{const f=(r.fields||"").split(",").filter(Boolean);return f.map(x=>x==="etc"&&r.field_other?"기타("+r.field_other+")":(N[x]||x)).join(", ")||"-"};
const pad=n=>String(n).padStart(2,"0"),dt=s=>{const d=new Date(s);return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+" "+pad(d.getHours())+":"+pad(d.getMinutes())};
const url=v=>/^https?:\/\//.test(v||"")?v:null;
const errMsg=e=>{const m=String((e&&e.message)||e||"");return /applicant is locked/.test(m)?"대표가 채용/거절을 결정한 지원서라 수정할 수 없어요. 대표가 결정을 풀어야 해요.":/boss only/.test(m)?"대표만 할 수 있어요.":/mgmt only/.test(m)?"경영지원팀만 할 수 있어요.":m};
let mgmt=false,boss=false,started=false,rows=[],msgs=[],reps={},openJ=null,openQ=null,qfilter="all";

const css=document.createElement("style");
css.textContent=`
.msub .bd{margin-left:6px}.msub button[aria-pressed="true"] .bd{background:#fff;color:var(--ac)}
.jdm{margin:10px 0 4px}
.msj{font-weight:700;font-size:13.5px;margin:2px 0 6px}
.mchan{display:inline-block;padding:1px 9px;border-radius:99px;font-size:11.5px;font-weight:700;border:1px solid var(--ln2);color:var(--mut);white-space:nowrap}.mchan.j{border-color:#7c5cd6;color:#7c5cd6}
.mbar select{padding:7px 10px;border-radius:10px}
.mbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 12px}.mbar b{font-size:14px}.mbar input{min-width:240px}
.mtw{overflow:auto;max-height:calc(100vh - 250px);border:1px solid var(--ln);border-radius:12px;background:var(--bg)}
.mt thead th{position:sticky;top:0;z-index:3}.mt thead tr.gh+tr th{top:30px}
.mt thead tr.gh th{height:30px;box-sizing:border-box;padding:0 10px;text-align:center;font-weight:700;color:var(--fg);border-bottom:1px dashed var(--ln2);letter-spacing:0}.mt thead tr.gh th.gt{color:var(--ok)}.mt thead tr.gh th.gb{color:#7c5cd6;border-left:2px dashed var(--ln2);border-right:2px dashed var(--ln2)}
table.mt.mtj{width:max-content;min-width:0}.mt td.fd{width:220px;min-width:220px;max-width:220px}
.mt th.mk.bs,.mt td.mk.bs{width:64px;min-width:64px}
.mt th.mk,.mt td.mk{width:46px;min-width:46px;padding-left:2px;padding-right:2px;text-align:center;max-width:none}
.mdec{display:flex;align-items:center;gap:6px;justify-content:center;flex-wrap:wrap}.msent{font-size:11px;color:#5b8f6e;white-space:nowrap}.mt .bs{background:color-mix(in srgb,#7c5cd6 6%,transparent)}.mt .bl{border-left:2px dashed var(--ln2)}.mt .br{border-right:2px dashed var(--ln2)}.mt th.b1{color:#2f80ed}.mt th.b2{color:#7c5cd6}.mt th.b3{color:var(--bad)}.mt .b1{--c:#2f80ed}.mt .b2{--c:#7c5cd6}.mt .b3{--c:var(--bad)}
.mt td.mk input.cb{-webkit-appearance:none;appearance:none;width:18px;height:18px;margin:0;border:2px dashed var(--c);border-radius:4px;background:transparent;vertical-align:middle;cursor:pointer}
.mt td.mk input.cb:checked{border-style:solid;background:var(--c) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3 8.5l3.2 3.2L13 5' fill='none' stroke='%23fff' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/12px no-repeat}
.mt td.mk input.cb:disabled,.mt td.mk input:disabled{cursor:not-allowed;opacity:.5}
.mt tr.dup td{background:color-mix(in srgb,var(--bad) 20%,transparent)}.mt tr.dup:hover td{background:color-mix(in srgb,var(--bad) 28%,transparent)}.mt tr.rej td{opacity:.6}
.mt input.mm{width:100%;min-width:180px;padding:5px 10px;border-radius:8px;font-size:13px}.mt input.mm[readonly]{background:var(--hv);cursor:not-allowed}.mt input.mm.ok{outline:2px solid var(--ok);outline-offset:-2px}
.mt td.rd{font-size:13px}
.mt tr.d td b.mlb{color:var(--ac);font-size:12px;letter-spacing:.08em}
.mbadge{color:#fff;background:#8c8a96}.mbadge.new,.mbadge.nw{background:var(--ac)}.mbadge.rep{background:#7c5cd6}.mbadge.done{background:var(--ok)}.mbadge.chk{background:#8c8a96}.mbadge.nw{letter-spacing:.06em}
.mdupb{display:inline-block;margin-left:6px;padding:1px 8px;border-radius:99px;background:var(--bad);color:#fff;font-size:11px;font-weight:700}
.mrep{border-left:3px solid var(--ac);background:var(--soft);border-radius:0 10px 10px 0;padding:10px 14px;margin:0 0 10px}.mrep .h{font-size:12px;color:var(--mut);margin-bottom:4px}.mrep .t{white-space:pre-wrap}
.mbody{white-space:pre-wrap;word-break:break-word;line-height:1.7;font-size:14px;padding:14px 16px;border:1px solid var(--ln2);border-radius:10px;background:var(--hv);color:var(--fg);max-height:520px;overflow:auto}
.mfr{display:block;width:100%;aspect-ratio:auto;min-height:120px;border:1px solid var(--ln2);border-radius:10px;background:#f6f1e7}.mfr.dark{filter:invert(1) hue-rotate(180deg)}
.mtl{display:flex;flex-direction:column;gap:10px;margin:6px 0 16px}.mmsg{border:1px solid var(--ln2);border-radius:10px;padding:10px 14px;background:var(--bg)}
.mmsg .h{font-size:12px;color:var(--mut);margin-bottom:8px}.mmsg.in{border-left:3px solid #8c8a96}.mmsg.out{border-left:3px solid var(--ac);background:var(--soft)}.mmsg .t{white-space:pre-wrap;line-height:1.7}
.mwho{display:inline-block;padding:1px 10px;border-radius:99px;font-size:12px;font-weight:700;color:var(--fg);background:var(--hv)}.mwho.out{background:var(--ac);color:#fff}
.mrd{margin-left:10px;color:var(--mut)}.mrd.on{color:var(--ok);font-weight:700}
.mfrm textarea{width:100%;min-height:110px}
.mfrm .acts{display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap}
.mbtn{display:inline-flex;align-items:center;justify-content:center;padding:5px 14px;border:1px solid var(--ln2);border-radius:99px;background:none;color:var(--fg);font:inherit;font-size:13px;cursor:pointer;text-decoration:none;white-space:nowrap}.mbtn:hover{border-color:var(--ac);color:var(--ac)}
.mbtn.p{background:var(--ac);border-color:var(--ac);color:#fff;font-weight:700}.mbtn.p:hover{color:#fff;filter:brightness(1.08)}.mbtn:disabled{opacity:.5;cursor:default}
.mbtn.mq{margin-top:8px;padding:3px 12px;font-size:12px}
.mnote{font-size:13px;color:var(--mut)}.mnote.err{color:var(--bad)}
`;
document.head.appendChild(css);

const cell=(v,cls)=>el("td",{className:cls||"",textContent:v||"-"});
function link(v,cls){const td=el("td",{className:cls||""});const u=url(v);if(u){const a=el("a",{href:u,target:"_blank",rel:"noopener noreferrer",textContent:v});a.onclick=e=>e.stopPropagation();td.append(a)}else td.textContent=v||"-";return td}

/* ---------- 지원서 ---------- */
const TYPE2={mail_thanks:"thanks",mail_interview:"interview",mail_reject:"reject",mail_hire:"hire"};
async function loadJ(){const {data,error}=await db.rpc("jr_list");
  if(error){$("mjc").textContent="불러오지 못했어요";return}
  rows=(data||[]).map((r,i)=>({...r,no:i+1})).reverse();drawJ()}
async function rpcSet(name,args,node,revert){const {error}=await db.rpc(name,args);
  if(error){alert("저장하지 못했어요: "+errMsg(error));if(revert)revert();return false}
  if(node){node.classList.add("ok");setTimeout(()=>node.classList.remove("ok"),900)}return true}
const isLk=r=>boss?!!(r.ceo_hire||r.ceo_reject):!!r.locked;
/* 지원 분야 → 유닛 (Join Us 폼과 같은 묶음) */
const UNIT={vocal:["vocal"],sound:["composition","directing","mixing","mastering"],art:["illustration","design"],content:["writer","streamer","video"]},UALL=[].concat(...Object.values(UNIT));
const inUnit=(r,u)=>{const f=(r.fields||"").split(",").map(x=>x.trim()).filter(Boolean);return u==="etc"?(!f.length||f.some(x=>!UALL.includes(x))):f.some(x=>UNIT[u].includes(x))};
function drawJ(){
  const q=$("mjq").value.trim().toLowerCase(),tb=$("mjb");tb.replaceChildren();
  const cnt={};rows.forEach(r=>{const k=(r.email||"").trim().toLowerCase();cnt[k]=(cnt[k]||0)+1});
  const fu=($("mju")||{}).value||"",fs=($("mjs")||{}).value||"";
  const view=rows.filter(r=>{if(fu&&!inUnit(r,fu))return false;
    if(fs==="nothanks"&&r.mail_thanks)return false;if(fs==="interview"&&!r.mail_interview)return false;
    if(fs==="open"&&(r.ceo_hire||r.ceo_reject))return false;if(fs==="hire"&&!r.ceo_hire)return false;if(fs==="reject"&&!r.ceo_reject)return false;
    return !q||[r.nickname,r.name,r.email,flds(r),R[r.region],boss?r.memo:"",r.team_memo].join(" ").toLowerCase().includes(q)});
  $("mjc").textContent="지원자 "+view.length+(view.length!==rows.length?" / "+rows.length:"")+"명";
  view.forEach(r=>{
    const lk=isLk(r);
    const dup=!!r.reapply; /* 같은 이메일로 예전에 지원한 적이 있으면(서버 판단, 비공개 지원서 포함) 빨간 음영 */
    const nick=cell(r.nickname||r.name);if(dup)nick.append(el("span",{className:"mdupb",textContent:"재지원"}));
    const mkMail=(k,t,cls)=>{
      const bo=k==="mail_reject"||k==="mail_hire",no=bo&&!boss;const c=el("input",{type:"checkbox",checked:!!r[k],disabled:lk||no,title:no?"거절·채용 메일은 대표만 처리해요":lk?"대표가 결정한 지원서라 수정할 수 없어요":t+" 메일 보냄 표시 (✉로 보내면 자동 체크)"});
      c.onclick=e=>e.stopPropagation();
      c.onchange=async()=>{const v=c.checked;c.disabled=true;const ok=await rpcSet("jr_set_check",{p_id:r.id,p_field:k,p_val:v},null,()=>{c.checked=!v});if(ok){r[k]=v;sb.hidden=!canSend();sd.hidden=!v}c.disabled=lk||no};
      // ✉ 보내기: support@ 이름으로 지원자 출신 언어에 맞춰 발송 → 누른 사람의 보낸 편지함에 기록, 성공하면 자동 체크
      const canSend=()=>!r[k]&&!no&&(!lk||bo);
      const sd=el("span",{className:"msent",textContent:"발송됨",title:t+" 메일을 보냈어요",hidden:!r[k]});
      const sb=el("button",{type:"button",className:"msend",textContent:"✉",hidden:!canSend(),title:t+" 메일 보내기 (support@)"});
      sb.onclick=async e=>{e.stopPropagation();
        const lang={korea:"한국어",japan:"일본어",english:"영어",other:"영어"}[r.region]||"한국어·일본어·영어 한 통";
        if(!confirm((r.nickname||r.name)+" 님("+r.email+")에게 '"+t+"' 메일을 보낼까요?\n\n· 보내는 주소: support@rif-studio.com\n· 언어: "+lang+"\n· 내 보낸 편지함에 기록되고, 상대가 열면 '읽음'으로 표시돼요"))return;
        sb.disabled=true;sb.textContent="…";
        const {data,error}=await db.functions.invoke("send-applicant-mail",{body:{type:TYPE2[k],id:r.id}});
        let msg=data&&data.error;if(error&&!msg){try{msg=(await error.context.json()).error}catch(_){msg="보내지 못했어요"}}
        if(msg){alert(msg);sb.disabled=false;sb.textContent="✉";return}
        r[k]=true;c.checked=true;sb.hidden=true;sd.hidden=false;if(data&&data.warn)alert(data.warn)};
      return el("td",{className:"mk"+(cls?" "+cls:"")},[c,sb,sd])};
    const MC=[["mail_thanks","감사"],["mail_interview","면접"]].map(([k,t])=>mkMail(k,t));
    /* 대표 채용 / 대표 거절 = 결정 체크 + 그 결정의 메일(✉)을 한 칸에 합침 */
    const CK=[["ceo_hire","mail_hire","채용"],["ceo_reject","mail_reject","거절"]].map(([k,mk,t],i)=>{
      const c=el("input",{className:"cb b"+(i+2),type:"checkbox",checked:!!r[k],disabled:!boss||lk,title:lk?"결정된 지원서는 잠겨 있어요 (🔒 대표 잠금 해제)":"대표 "+t+" · 체크하면 이 지원서가 잠겨요"});c.onclick=e=>e.stopPropagation();
      c.onchange=async()=>{const v=c.checked;c.disabled=true;const ok=await rpcSet("jr_set_ceo_flag",{p_id:r.id,p_field:k,p_val:v},null,()=>{c.checked=!v});if(ok){r[k]=v;r.locked=!!(r.ceo_hire||r.ceo_reject);drawJ()}else c.disabled=false};
      const done=el("span",{className:"msent",textContent:"✉ 발송됨",title:"지원자에게 "+t+" 메일을 보냈어요",hidden:!r[mk]});
      const sb=el("button",{type:"button",className:"msend",textContent:"✉ "+t+" 메일",hidden:!!r[mk],title:"지원자에게 "+t+" 메일 보내기 (support@)"});
      sb.onclick=async e=>{e.stopPropagation();
        const lang={korea:"한국어",japan:"일본어",english:"영어",other:"영어"}[r.region]||"한국어·일본어·영어 한 통";
        if(!confirm((r.nickname||r.name)+" 님("+r.email+")에게 '"+t+"' 메일을 보낼까요?\n\n· 보내는 주소: support@rif-studio.com\n· 언어: "+lang+"\n· 내 보낸 편지함에 기록되고, 상대가 열면 '읽음'으로 표시돼요"))return;
        sb.disabled=true;sb.textContent="보내는 중…";
        const {data,error}=await db.functions.invoke("send-applicant-mail",{body:{type:TYPE2[mk],id:r.id}});
        let msg=data&&data.error;if(error&&!msg){try{msg=(await error.context.json()).error}catch(_){msg="보내지 못했어요"}}
        if(msg){alert(msg);sb.disabled=false;sb.textContent="✉ "+t+" 메일";return}
        r[mk]=true;sb.hidden=true;done.hidden=false;if(data&&data.warn)alert(data.warn)};
      return el("td",{className:"mk bs b"+(i+2)+(i===0?" bl":"")},[el("div",{className:"mdec"},[c,sb,done])])});
    const bm=el("input",{className:"mm",value:r.memo||"",maxLength:500,placeholder:"대표 메모",readOnly:lk});
    bm.title=lk?"결정된 지원서라 수정할 수 없어요":"대표만 쓸 수 있는 메모";bm.onclick=e=>e.stopPropagation();
    bm.onchange=()=>rpcSet("jr_set_boss_memo",{p_id:r.id,p_memo:bm.value.trim()},bm).then(ok=>{if(ok)r.memo=bm.value.trim()||null});
    const tm=el("input",{className:"mm",value:r.team_memo||"",maxLength:500,placeholder:"경영지원팀 메모",readOnly:lk});
    tm.onclick=e=>e.stopPropagation();if(lk)tm.title="대표가 결정한 지원서라 수정할 수 없어요";
    tm.onchange=()=>rpcSet("jr_set_team_memo",{p_id:r.id,p_memo:tm.value.trim()},tm).then(ok=>{if(ok)r.team_memo=tm.value.trim()||null});
    const tr=el("tr",{className:"r"+(dup?" dup":"")+(lk?" rej":"")},[cell(String(r.no),"no"),cell(dt(r.created_at),"dt"),nick,cell(r.nickname?r.name:""),cell(R[r.region]||"-"),cell(flds(r),"fd"),...MC,...(boss?[...CK,el("td",{className:"bs bm br"},[bm])]:[]),el("td",{},[tm])]);
    tr.onclick=()=>{openJ=r.id;openJD(r,lk);db.rpc("jr_seen",{p_id:r.id}).then(()=>{},()=>{});tb.querySelectorAll("tr.on").forEach(x=>x.classList.remove("on"));tr.classList.add("on")};
    if(openJ===r.id)tr.classList.add("on");
    tb.append(tr)});
  if(openJ&&!view.some(r=>r.id===openJ))closeJD()}
/* 지원서 상세: 오른쪽 패널에 전체 내용 (잘림 없이) */
const lnk=v=>{v=String(v||"").trim();if(!v)return null;const u=/^https?:\/\//i.test(v)?v:/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(v)?"https://"+v:null;return u?el("a",{href:u,target:"_blank",rel:"noopener noreferrer",textContent:v}):el("span",{textContent:v})};
function closeJD(){const p=$("mjd");if(p)p.remove();openJ=null;document.querySelectorAll("#mjb tr.on").forEach(x=>x.classList.remove("on"))}
function openJD(r,lk){const old=$("mjd");if(old)old.remove();
  const sec=(t,v,pre)=>el("section",{className:"jds"},[el("h3",{textContent:t}),typeof v==="string"||v==null?el(pre?"pre":"p",{textContent:v||"-"}):v]);
  const links=el("div",{className:"jdl"},[["YouTube",r.youtube],["X (Twitter)",r.twitter],["Discord",r.discord]].map(([k,v])=>el("div",{},[el("b",{textContent:k}),lnk(v)||el("span",{className:"note",textContent:"-"})])));
  const x=el("button",{type:"button",className:"mx",textContent:"×",ariaLabel:"닫기"});x.onclick=closeJD;
  const head=el("div",{className:"jdh"},[el("div",{},[el("h2",{textContent:r.nickname||r.name||"-"}),el("p",{className:"note",textContent:[r.nickname?r.name:"",r.email,"#"+r.no+" · "+dt(r.created_at)].filter(Boolean).join("  ·  ")})]),x]);
  const tags=el("div",{className:"jdt"},[el("span",{className:"chip",textContent:"출신 "+(R[r.region]||"-")}),...(flds(r)||"-").split(/,\s*/).filter(Boolean).map(f=>el("span",{className:"chip on",textContent:f})),...(r.reapply?[el("span",{className:"mdupb",textContent:"재지원"})]:[]),...(lk?[el("span",{className:"chip",textContent:"🔒 대표 결정됨"})]:[])]);
  /* 지원서 ↔ 지원자 메일: 이 지원자와 주고받은 메일 대화로 바로 이동 */
  const mb=el("button",{className:"mbtn",type:"button",textContent:"✉ 이 지원자와 주고받은 메일 보기"});
  mb.onclick=async()=>{const k=jkey(r.email);closeJD();if(showSub)showSub("a");openQ=k;await loadQ();const th=threads.find(x=>x.key===k);
    if(!th){openQ=null;alert("이 지원자와 주고받은 메일이 아직 없어요.");return}
    openQ=k;drawQ();markRead(th);const d=[...document.querySelectorAll("#mqb tr.d")].find(x=>!x.hidden);if(d&&d.previousSibling)d.previousSibling.scrollIntoView({block:"center"})};
  const body=el("div",{className:"jdb"},[tags,links,el("div",{className:"jdm"},[mb]),sec("경력",r.career,true),sec("자기소개",r.intro,true),sec("지원동기",r.motive,true)]);
  if(boss&&r.memo)body.append(sec("대표 메모",r.memo,true));if(r.team_memo)body.append(sec("경영지원팀 메모",r.team_memo,true));
  if(boss&&!lk){const del=el("button",{className:"mbtn",type:"button",textContent:"이 지원서 삭제"});
    del.onclick=async()=>{if(!confirm((r.nickname||r.name)+" 지원서를 삭제할까요? 되돌릴 수 없어요."))return;const ok=await rpcSet("jr_delete",{p_id:r.id});if(ok){rows=rows.filter(z=>z.id!==r.id);closeJD();drawJ()}};body.append(del)}
  const pnl=el("aside",{id:"mjd",className:"jdp",role:"dialog",ariaLabel:"지원서 상세"},[head,body]);
  document.body.append(pnl);x.focus({preventScroll:true})}
document.addEventListener("click",e=>{if($("mjd")&&e.target.closest&&e.target.closest("#tabs,#msub"))closeJD()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("mjd")&&!document.querySelector(".mod:not([hidden])"))closeJD()});

/* ---------- support@ 문의 게시판 (같은 사람·같은 제목은 한 대화로 묶어요) ---------- */
const normSub=s=>{let t=String(s||"").trim();for(let i=0;i<8;i++){const n=t.replace(/^\s*((re|fw|fwd|답장|회신|답신|전달)\s*(\[\d+\])?\s*[:：]\s*)+/i,"");if(n===t)break;t=n}return t.trim().toLowerCase()};
const tkey=m=>(m.from_addr||"").trim().toLowerCase()+"|"+normSub(m.subject);
const jkey=e=>"j|"+String(e||"").trim().toLowerCase(),NOTICE=/^\s*\[Join Us\]/i;
let who={},threads=[];
/* 채널: 지원자 메일(join) / 고객 문의(inq). 나누는 기준은 서버(mail_join_ids)가 정해요:
   지원서 접수 알림, 지원자 주소에서 온 메일, 지원자 안내 메일([RIF STUDIO] …)과 그 답장 → 지원자 메일 */
let qchan="inq",joinIn=new Set(),joinOut=new Set(),joinOk=false,showSub=null;
const QT={inq:{n:"고객 문의",note:"support@rif-studio.com 으로 온 일반 문의를 대화별로 묶어 보여줘요. 지원자와 주고받은 메일은 '지원자 메일'에 따로 모여 있어요. 줄을 눌러 담당을 정하고 답장할 수 있어요."},
  join:{n:"지원자 메일",note:"지원자와 주고받은 메일만 모았어요. 지원서 접수 알림, 감사·면접·결과 메일과 그 답장이 여기 있어요. 줄을 눌러 담당을 정하고 답장할 수 있어요."}};
const setJoin=e=>{if(e&&e.data&&!e.error){joinIn=new Set(e.data.inbox||[]);joinOut=new Set(e.data.outbox||[]);joinOk=true}};
const label=e=>{const p=who[(e||"").toLowerCase()];return p?[p.name||p.nickname,[p.pos,p.rnk].filter(Boolean).join(" ")].filter(Boolean).join(" · "):""};
const cutQ=s=>{s=String(s||"").replace(/\r\n/g,"\n");const i=s.search(/\n[^\n]*(wrote:|작성:)\s*(\n|$)|\n>/);return i>0?s.slice(0,i).trim():s.trim()};
async function loadQ(){
  const [a,b,c,d,e]=await Promise.all([
    db.from("inbox_messages").select("id,from_addr,from_name,to_addrs,subject,received_at,assignee_email,done,preview,attachments,first_read_by,first_read_at").is("deleted_at",null).order("received_at",{ascending:false}).limit(500),
    db.from("mail_outbox").select("id,inbox_id,author_name,author_email,to_email,subject,body,created_at").not("inbox_id","is",null).is("deleted_at",null).order("created_at",{ascending:true}),
    db.rpc("staff_directory"),
    db.from("mail_outbox").select("id,inbox_id,author_name,author_email,to_email,subject,body,created_at").is("inbox_id",null).ilike("sender","support@rif-studio.com").is("deleted_at",null).order("created_at",{ascending:true}).limit(300),
    db.rpc("mail_join_ids")]);
  if(a.error){$("mqc").textContent="불러오지 못했어요";return}
  setJoin(e);
  who={};(c.data||[]).forEach(p=>{who[(p.email||"").toLowerCase()]=p});
  msgs=(a.data||[]).filter(x=>!x.to_addrs||/support@/i.test(x.to_addrs));reps={};(b.data||[]).forEach(x=>{(reps[x.inbox_id]=reps[x.inbox_id]||[]).push(x)});
  const map=new Map();
  /* 지원자 메일은 제목이 달라도 지원자(메일 주소)별로 한 대화로 묶어요. 고객 문의는 예전처럼 보낸 사람+제목 기준 */
  [...msgs].sort((x,y)=>new Date(x.received_at)-new Date(y.received_at)).forEach(m=>{const j=joinIn.has(m.id),k=j?jkey(m.from_addr):tkey(m);let t=map.get(k);
    if(!t){t={key:k,subject:m.subject,from:m.from_addr,fromName:m.from_name,ins:[],outs:[],join:j};map.set(k,t)}
    if(!t.fromName&&m.from_name)t.fromName=m.from_name;
    t.ins.push(m);(reps[m.id]||[]).forEach(r=>t.outs.push(r))});
  /* 고객 문의 메일에서 새로 보낸 메일: 받는 사람·제목이 같으면 그 사람의 답장과 한 대화로 이어져요 */
  (d.data||[]).forEach(r=>{const to=String(r.to_email||"").split(",")[0].trim().toLowerCase(),j=joinOut.has(r.id),k=j?jkey(to):to+"|"+normSub(r.subject);let t=map.get(k);
    if(!t){t={key:k,subject:r.subject,from:to,fromName:"",ins:[],outs:[],started:true,join:j};map.set(k,t)}t.outs.push(r)});
  threads=[...map.values()].map(t=>{
    t.ev=[...t.ins.map(m=>({k:"in",t:new Date(m.received_at),m})),...t.outs.map(r=>({k:"out",t:new Date(r.created_at),r}))].sort((x,y)=>x.t-y.t);
    t.last=t.ev[t.ev.length-1];t.done=!!t.ins.length&&t.ins.every(m=>m.done);t.asg=(t.ins[t.ins.length-1]||{}).assignee_email||"";t.join=!!t.join||t.ins.some(m=>joinIn.has(m.id))||t.outs.some(r=>joinOut.has(r.id));
    t.lastSub=t.last.k==="in"?t.last.m.subject:t.last.r.subject;return t}).sort((x,y)=>y.last.t-x.last.t);
  subBadges();drawQ()}
const tstatus=t=>{
  if(t.done)return["done","완료"];
  if(!t.ins.length)return["rep","보냄 "+t.outs.length];
  if(t.last.k==="out")return["rep","답장함 "+t.outs.length];
  if(!t.ins.some(m=>!m.first_read_at))return["chk","확인함"];
  return t.ins.length>1||t.outs.length?["nw","NEW"]:["new","새 메일"]};
const isNew=t=>["new","nw"].includes(tstatus(t)[0]);
function subBadges(){[["a","join"],["q","inq"]].forEach(([k,ch])=>{const b=document.querySelector('#msub button[data-k="'+k+'"] .bd');if(!b)return;
  const n=threads.filter(t=>((ch==="join")===!!t.join)&&isNew(t)).length;b.hidden=!n;b.textContent=n})}
const who2=e=>label(e)||e||"";
const rdOf=t=>{const m=t.ins[t.ins.length-1];return m&&m.first_read_at?who2(m.first_read_by)+" · "+dt(m.first_read_at).slice(5):"-"};
const rdText=m=>m.first_read_at?"👁 "+who2(m.first_read_by)+" 님이 먼저 확인 · "+dt(m.first_read_at):"👁 아직 아무도 확인하지 않았어요";
function paint(t){const [k,s]=tstatus(t);if(t.ui){t.ui.bd.className="mbadge "+k;t.ui.bd.textContent=s;t.ui.rd.textContent=rdOf(t)}
  (t.ins||[]).forEach(m=>{const e=t.rds&&t.rds[m.id];if(e){e.textContent=rdText(m);e.className="mrd"+(m.first_read_at?" on":"")}});subBadges()}
async function markRead(t){
  /* 여기서 열어 본 메일은 메일 탭에서도 '읽음'이 되게 (메일 탭 숫자 배지가 같이 줄어요) */
  try{const u=(await db.auth.getSession()).data.session,me=u&&(u.user.email||"").toLowerCase();
    if(me&&t.ins.length){await db.from("inbox_reads").upsert(t.ins.map(m=>({msg_id:m.id,email:me})),{onConflict:"msg_id,email",ignoreDuplicates:true});if(window.RIFMAIL&&RIFMAIL.refresh)RIFMAIL.refresh(true)}}catch(_){}
  const ids=t.ins.filter(m=>!m.first_read_at).map(m=>m.id);if(!ids.length)return;
  const {data,error}=await db.rpc("inbox_mark_read",{p_ids:ids});if(error){console.error(error);return}
  (data||[]).forEach(r=>{const m=t.ins.find(x=>x.id===r.id);if(m){m.first_read_by=r.first_read_by;m.first_read_at=r.first_read_at}});paint(t)}
function drawQ(){
  const q=$("mqq").value.trim().toLowerCase(),tb=$("mqb");tb.replaceChildren();
  const chan=threads.filter(t=>(qchan==="join")===!!t.join);
  let view=chan.filter(t=>!q||[t.subject,t.from,t.fromName,...t.ins.map(m=>m.preview),...t.outs.map(r=>(r.body||"")+" "+(r.author_name||""))].join(" ").toLowerCase().includes(q));
  if(qfilter==="new")view=view.filter(t=>["new","nw"].includes(tstatus(t)[0]));else if(qfilter==="chk")view=view.filter(t=>tstatus(t)[0]==="chk");else if(qfilter==="rep")view=view.filter(t=>tstatus(t)[0]==="rep");else if(qfilter==="done")view=view.filter(t=>t.done);
  $("mqc").textContent=QT[qchan].n+" "+view.length+"건";
  const total=chan.length;
  if(!view.length)tb.append(el("tr",{},[el("td",{colSpan:8,className:"mnote",textContent:qchan==="join"&&!joinOk?"지원자 메일 구분 정보를 불러오지 못했어요. 새로고침을 눌러 주세요.":chan.length?"조건에 맞는 메일이 없어요.":qchan==="join"?"지원자와 주고받은 메일이 아직 없어요.":"고객 문의 메일이 아직 없어요."})]));
  view.forEach(t=>{
    const [k,s]=tstatus(t),lo=t.outs[t.outs.length-1];
    const bd=el("span",{className:"mbadge "+k,textContent:s});const tr=el("tr",{className:"r"},[cell(String(total-chan.indexOf(t)),"no"),el("td",{},[bd]),cell((t.join?t.lastSub:t.subject)||"(제목 없음)"),cell((t.fromName?t.fromName+" ":"")+"<"+t.from+">"),cell(t.asg?who2(t.asg).split(" · ")[0]:"미지정","as"),(()=>{const c=cell(rdOf(t),"rd");t.ui={bd:null,rd:c};return c})(),cell(lo?(label(lo.author_email)||lo.author_name||lo.author_email):"-"),cell(dt(t.last.t),"dt")]);
    t.ui.bd=bd;const dtl=el("tr",{className:"d",hidden:openQ!==t.key},[el("td",{colSpan:8},[])]);
    const fill=()=>{if(dtl.dataset.on)return;dtl.dataset.on="1";buildQ(t,dtl.firstChild)};
    if(openQ===t.key)fill();
    tr.onclick=()=>{dtl.hidden=!dtl.hidden;openQ=dtl.hidden?null:t.key;if(!dtl.hidden){fill();markRead(t)}};
    tb.append(tr,dtl)})}
function showBody(m,box){
  db.from("inbox_messages").select("body_text,body_html").eq("id",m.id).single().then(({data,error})=>{
    box.replaceChildren();if(error||!data){box.textContent="본문을 불러오지 못했어요";return}
    const fullHtml=data.body_html||"",txt=String(data.body_text||"").replace(/\r\n/g,"\n").trim();
    let clean=fullHtml,hadQ=false;
    if(fullHtml){try{const d=new DOMParser().parseFromString(fullHtml,"text/html");
      const qs=d.querySelectorAll(".gmail_quote,.gmail_extra,blockquote[type=cite],.yahoo_quoted,#divRplyFwdMsg,#appendonsend,.moz-cite-prefix");
      if(qs.length){hadQ=true;qs.forEach(n=>n.remove());clean=d.body.innerHTML}}catch(_){}}
    const toText=h=>h.replace(/<br\s*\/?>/gi,"\n").replace(/<\/(p|div|li)>/gi,"\n").replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&amp;/g,"&").replace(/\n{3,}/g,"\n\n").trim();
    const txtCut=cutQ(txt),canToggle=hadQ||(!fullHtml&&txtCut!==txt);
    const body=el("div");box.append(body);let showFull=false;
    const tg=el("button",{className:"mbtn mq",type:"button",textContent:"이전 내용 보기"});
    const draw=()=>{body.replaceChildren();const h=showFull?fullHtml:clean;
      if(h&&/<(table|img|style|a\s)/i.test(h)){
        const f=document.createElement("iframe");f.setAttribute("sandbox","allow-same-origin");
        const dm=window.matchMedia?matchMedia("(prefers-color-scheme: dark)"):{matches:true};f.className="mfr"+(dm.matches?" dark":"");
        f.srcdoc='<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src https: data: cid:; style-src \'unsafe-inline\'"><style>html,body{background:#f6f1e7}img,video{filter:invert(1) hue-rotate(180deg)}</style><body style="font:14px/1.6 sans-serif;margin:12px;color:#222">'+h;
        f.onload=()=>{try{f.style.height=Math.min(640,Math.max(120,f.contentDocument.body.scrollHeight+28))+"px"}catch(_){}};
        const cb=el("button",{className:"mbtn",type:"button",textContent:dm.matches?"원본 색으로 보기":"다크로 보기"});cb.style.marginBottom="8px";
        cb.onclick=()=>{const d=f.classList.toggle("dark");cb.textContent=d?"원본 색으로 보기":"다크로 보기"};
        body.append(cb,f)}
      else{const t=h?toText(h):(showFull?txt:txtCut);body.append(el("div",{className:"mbody",textContent:t||txt||"(내용 없음)"}))}};
    draw();
    if(canToggle){tg.onclick=()=>{showFull=!showFull;tg.textContent=showFull?"이전 내용 접기":"이전 내용 보기";draw()};box.append(tg)}
    if((m.attachments||[]).length)box.append(el("div",{className:"mnote",style:"display:flex;flex-wrap:wrap;gap:8px"},m.attachments.map((x,i)=>{const b=el("button",{type:"button",className:"mbtn",textContent:"📎 "+x.filename+(x.size?" ("+(x.size>=1048576?(x.size/1048576).toFixed(1)+" MB":Math.max(1,Math.round(x.size/1024))+" KB")+")":"")});
      b.onclick=async()=>{b.disabled=true;const {data:d,error}=await db.functions.invoke("mail-file",{body:{inbox_id:m.id,index:i}});b.disabled=false;if(error||!d||!d.url)return alert("파일을 가져오지 못했어요"+(d&&d.error?": "+d.error:""));window.open(d.url,"_blank","noopener")};return b})))})}
function buildQ(t,box){
  box.replaceChildren();
  box.append(el("p",{className:"mnote",textContent:"대화 "+t.ev.length+"건 · 받은 메일 "+t.ins.length+"통 · 보낸 메일 "+t.outs.length+"건 · "+(t.join?"이 지원자와 주고받은 메일(접수 알림 · 안내 메일 · 답장)을 모두 한 대화로 묶었어요":"같은 사람이 같은 제목(Re: 제외)으로 보낸 메일은 한 대화로 이어져요")}));
  const sj=v=>t.join?[el("div",{className:"msj",textContent:v||"(제목 없음)"})]:[];
  if(t.join){const ab=el("button",{className:"mbtn",type:"button",textContent:"📄 이 지원자의 지원서 보기"});
    ab.onclick=async e=>{e.stopPropagation();if(!rows.length)await loadJ();const em=String(t.from||"").trim().toLowerCase(),ap=rows.find(z=>(z.email||"").trim().toLowerCase()===em);
      if(!ap){alert("지원서를 찾을 수 없어요. 삭제됐거나, 대표 결정으로 잠긴 지원서일 수 있어요.");return}openJ=ap.id;openJD(ap,isLk(ap))};
    box.append(el("div",{className:"jdm"},[ab]))}
  const tl=el("div",{className:"mtl"});box.append(tl);
  t.ev.forEach((e,i)=>{
    const ind="margin-left:"+Math.min(i,5)*18+"px";
    if(e.k==="in"){const m=e.m,body=el("div",{className:"mbd"},[el("span",{className:"mnote",textContent:"본문 불러오는 중…"})]);
      tl.append(el("div",{className:"mmsg in",style:ind},[el("div",{className:"h"},[el("span",{className:"mwho in",textContent:"📩 "+(m.from_name||m.from_addr)}),el("span",{textContent:" <"+m.from_addr+"> → "+(m.to_addrs||"support@rif-studio.com")+" · "+dt(m.received_at)}),(()=>{const r=el("span",{className:"mrd"+(m.first_read_at?" on":""),textContent:rdText(m)});(t.rds=t.rds||{})[m.id]=r;return r})()]),...sj(m.subject),body]));
      showBody(m,body)}
    else{const r=e.r;
      tl.append(el("div",{className:"mmsg out",style:ind},[el("div",{className:"h"},[el("span",{className:"mwho out",textContent:"✉ "+(label(r.author_email)||r.author_name||r.author_email)}),el("span",{textContent:" 님이 보냄 → "+r.to_email+" · "+dt(r.created_at)})]),...sj(r.subject),el("div",{className:"t",textContent:r.body})]))}});
  const li=t.ins[t.ins.length-1]||null,to0=li?li.from_addr:t.from;
  /* 답장 제목: 지원자 대화에서는 접수 알림([Join Us] …)이 아닌 가장 최근 메일 제목을 이어 써요 */
  let sub0=li?li.subject:(t.outs[0]||{}).subject;
  if(t.join){const real=[...t.ev].reverse().map(e=>e.k==="in"?e.m.subject:e.r.subject).find(x=>x&&!NOTICE.test(x));sub0=real||"[RIF STUDIO] 지원 관련 안내"}
  const subOut=(t.join&&sub0==="[RIF STUDIO] 지원 관련 안내")||/^re:/i.test(sub0||"")?sub0:"Re: "+(sub0||"");
  /* 담당자: 이 대화를 맡은 사원 (모든 받은 메일에 같이 적용) */
  if(li){const as=el("select",{className:"mqas",title:"담당자"},[el("option",{value:"",textContent:"담당자 미지정"}),...Object.values(who).filter(p=>p.email).map(p=>el("option",{value:p.email.toLowerCase(),textContent:"담당 "+(p.name||p.nickname||p.email),selected:(t.asg||"").toLowerCase()===p.email.toLowerCase()}))]);
    as.onchange=async()=>{const v=as.value||null;const {error}=await db.from("inbox_messages").update({assignee_email:v}).in("id",t.ins.map(m=>m.id));if(error){alert("담당자를 바꾸지 못했어요");as.value=t.asg||"";return}t.ins.forEach(m=>m.assignee_email=v);t.asg=v||"";openQ=t.key;drawQ()};
    box.prepend(el("div",{className:"mqah"},[el("b",{textContent:"담당"}),as,el("span",{className:"mnote",textContent:"답장은 support@ 이름으로 나가고, 보낸 사원의 메일 탭 › 보낸 편지함에도 기록돼요."})]))}
  const ta=el("textarea",{placeholder:"답장 내용 (support@rif-studio.com 이름으로 나가요 · 제목: "+subOut+")",maxLength:20000});
  const send=el("button",{className:"mbtn p",type:"button",textContent:"답장 보내기"}),
    dn=el("button",{className:"mbtn",type:"button",textContent:t.done?"완료 취소":"✓ 완료 처리"}),note=el("span",{className:"mnote"});
  send.onclick=async()=>{const b=ta.value.trim();if(!b){note.className="mnote err";note.textContent="답장 내용을 써 주세요.";return}
    if(!confirm(to0+" 에게 답장을 보낼까요?\n보낸 뒤에는 취소할 수 없어요."))return;
    send.disabled=true;note.className="mnote";note.textContent="보내는 중…";let ok=false,em="";
    try{const {data,error}=await db.functions.invoke("send-mail",{body:{to:to0,subject:subOut,body:b,as:"support",...(li?{inbox_id:li.id}:{})}});
      if(error){try{em=(await error.context.json()).error}catch(_){em=error.message}}else if(data&&data.ok)ok=true;else em=(data&&data.error)||"알 수 없는 오류"}catch(x){em=String(x.message||x)}
    send.disabled=false;if(!ok){note.className="mnote err";note.textContent="보내지 못했어요: "+em;return}
    openQ=t.key;await loadQ()};
  dn.onclick=async()=>{const v=!t.done;const {error}=await db.from("inbox_messages").update({done:v}).in("id",t.ins.map(m=>m.id));if(error)return alert("바꾸지 못했어요");t.ins.forEach(m=>m.done=v);t.done=v;openQ=t.key;drawQ()};
  box.append(el("div",{className:"mfrm"},[ta,el("div",{className:"acts"},li?[send,dn,note]:[send,note])]))}
/* ---------- support@ 보낸 메일 ---------- */
let sent=[],openS=null;
const APPSUB=/^\s*((re|fw|fwd|답장|회신|답신|전달)\s*(\[\d+\])?\s*[:：]\s*)*(\[RIF STUDIO\]|【RIF STUDIO】)/i;
const skind=r=>r.inbox_id?"답장":/^\s*(\[RIF STUDIO\]|【RIF STUDIO】)/.test(r.subject||"")?"안내 메일":"새 메일";
const schan=r=>(joinOk?joinOut.has(r.id):APPSUB.test(r.subject||""))?"join":"inq";
async function loadS(){$("msc").textContent="불러오는 중…";
  const [a,c,e]=await Promise.all([db.from("mail_outbox").select("id,inbox_id,author_name,author_email,to_email,cc_email,subject,body,created_at,opened_at,open_count").ilike("sender","support@rif-studio.com").is("deleted_at",null).order("created_at",{ascending:false}).limit(500),
    Object.keys(who).length?Promise.resolve({data:null}):db.rpc("staff_directory"),db.rpc("mail_join_ids")]);
  if(a.error){$("msc").textContent="불러오지 못했어요";return}
  if(c.data){who={};c.data.forEach(p=>{who[(p.email||"").toLowerCase()]=p})}
  setJoin(e);sent=a.data||[];drawS()}
function drawS(){const q=$("msq").value.trim().toLowerCase(),f=$("mss").value,ch=$("msh").value,tb=$("msb");tb.replaceChildren();
  const v=sent.filter(r=>{if(ch!=="all"&&schan(r)!==ch)return false;if(f==="unread"&&r.opened_at)return false;if(f==="read"&&!r.opened_at)return false;
    return !q||[r.to_email,r.subject,r.body,r.author_name,label(r.author_email)].join(" ").toLowerCase().includes(q)});
  $("msc").textContent="보낸 메일 "+v.length+"통 · 안 읽음 "+v.filter(r=>!r.opened_at).length;
  v.forEach(r=>{const rd=r.opened_at?el("span",{className:"mbadge rep",textContent:"읽음"+(r.open_count>1?" "+r.open_count+"회":""),title:"처음 읽은 시각 "+dt(r.opened_at)}):el("span",{className:"mbadge new",textContent:"안 읽음"});
    const jc=schan(r)==="join";
    const tr=el("tr",{className:"r"+(openS===r.id?" on":"")},[cell(dt(r.created_at),"dt"),el("td",{className:"ch"},[el("span",{className:"mchan"+(jc?" j":""),textContent:jc?"지원자":"고객 문의"})]),cell(skind(r),"kd"),cell(r.to_email,"to"),cell(r.subject,"sj"),cell(label(r.author_email)||r.author_name||r.author_email,"as"),el("td",{className:"rd"},[rd])]);
    const dtl=el("tr",{className:"d",hidden:openS!==r.id},[el("td",{colSpan:7},[])]);
    const fill=()=>{if(dtl.dataset.on)return;dtl.dataset.on="1";buildS(r,dtl.firstChild)};if(openS===r.id)fill();
    tr.onclick=()=>{dtl.hidden=!dtl.hidden;openS=dtl.hidden?null:r.id;if(!dtl.hidden)fill()};tb.append(tr,dtl)});
  if(!v.length)tb.append(el("tr",{},[el("td",{colSpan:7,className:"mnote",textContent:"보낸 메일이 없어요."})]))}
function buildS(r,box){
  box.append(el("p",{className:"mnote",textContent:"보낸 사원: "+(label(r.author_email)||r.author_name||r.author_email)+" · 받는 사람: "+r.to_email+(r.cc_email?" · 참조: "+r.cc_email:"")+" · "+(r.opened_at?"처음 읽음 "+dt(r.opened_at)+(r.open_count>1?" (총 "+r.open_count+"회)":""):"아직 안 읽음")}),
    el("div",{className:"mmsg out"},[el("div",{className:"h"},[el("span",{className:"mwho out",textContent:"✉ "+(r.subject||"")})]),el("div",{className:"t",textContent:r.body||""})]));
  const to=String(r.to_email||"").split(",")[0].trim(),sub=/^re:/i.test(r.subject||"")?r.subject:"Re: "+(r.subject||"");
  const ta=el("textarea",{placeholder:to+" 에게 이어서 보낼 내용 (support@ 이름으로, 제목: "+sub+")",maxLength:20000}),send=el("button",{className:"mbtn p",type:"button",textContent:"이어서 보내기"}),note=el("span",{className:"mnote"});
  send.onclick=async()=>{const b=ta.value.trim();if(!b){note.className="mnote err";note.textContent="내용을 써 주세요.";return}
    if(!confirm(to+" 에게 support@ 이름으로 보낼까요?\n보낸 뒤에는 취소할 수 없어요."))return;
    send.disabled=true;note.className="mnote";note.textContent="보내는 중…";let ok=false,em="";
    try{const {data,error}=await db.functions.invoke("send-mail",{body:{to,subject:sub,body:b,as:"support",...(r.inbox_id?{inbox_id:r.inbox_id}:{})}});
      if(error){try{em=(await error.context.json()).error}catch(_){em=error.message}}else if(data&&data.ok)ok=true;else em=(data&&data.error)||"알 수 없는 오류"}catch(x){em=String(x.message||x)}
    send.disabled=false;if(!ok){note.className="mnote err";note.textContent="보내지 못했어요: "+em;return}
    openS=null;await loadS()};
  box.append(el("div",{className:"mfrm"},[ta,el("div",{className:"acts"},[send,note])]))}
/* 고객 문의 메일에서 support@ 이름으로 새 메일 보내기 */
function composeQ(){const old=$("mqnew");if(old)old.remove();
  const to=el("input",{type:"email",placeholder:"받는 사람 이메일",maxLength:200,required:true}),sj=el("input",{placeholder:"제목",maxLength:200,required:true}),bd=el("textarea",{placeholder:"내용",rows:10,maxLength:20000,required:true}),msg=el("p",{className:"mnote"});
  const x=el("button",{type:"button",className:"mx",textContent:"×",ariaLabel:"닫기"}),go=el("button",{type:"submit",className:"mbtn p",textContent:"support@ 로 보내기"});
  const f=el("form",{className:"mbox wd"},[x,el("h2",{textContent:"새 메일 (support@rif-studio.com)"}),el("p",{className:"mnote",textContent:"RIF STUDIO <support@rif-studio.com> 이름으로 나가요. 보낸 메일은 여기 고객 문의 메일과 내 보낸 편지함에 남고, 상대가 답장하면 같은 대화로 이어져요."}),to,sj,bd,el("div",{className:"acts"},[go]),msg]);
  const m=el("div",{className:"mod",id:"mqnew"},[f]);const close=()=>m.remove();x.onclick=close;m.onclick=e=>{if(e.target===m)close()};
  f.onsubmit=async e=>{e.preventDefault();const a=to.value.trim(),t=sj.value.trim(),b=bd.value.trim();if(!a||!t||!b)return;
    if(!confirm(a+" 에게 support@ 이름으로 보낼까요?\n보낸 뒤에는 취소할 수 없어요."))return;
    go.disabled=true;msg.className="mnote";msg.textContent="보내는 중…";let ok=false,em="";
    try{const {data,error}=await db.functions.invoke("send-mail",{body:{to:a,subject:t,body:b,as:"support"}});
      if(error){try{em=(await error.context.json()).error}catch(_){em=error.message}}else if(data&&data.ok)ok=true;else em=(data&&data.error)||"알 수 없는 오류"}catch(x2){em=String(x2.message||x2)}
    go.disabled=false;if(!ok){msg.className="mnote err";msg.textContent="보내지 못했어요: "+em;return}
    close();const k=a.toLowerCase()+"|"+normSub(t);openQ=k;await loadQ();
    const th=threads.find(x=>x.key===k)||threads.find(x=>x.key===jkey(a));if(th){openQ=th.key;if(showSub){const ch=th.join?"join":"inq";if(ch!==qchan)showSub(ch==="join"?"a":"q")}openQ=th.key;drawQ()}};
  document.body.append(m);to.focus()}

/* ---------- 사이트 문의 게시판 (공개 /board/ 에 올라온 글) ---------- */
let inq=[],openB=null;
async function loadB(){const {data,error}=await db.from("inquiries").select("id,name,email,title,body,secret,hidden,reply,replied_by,replied_at,created_at").order("id",{ascending:false}).limit(300);if(error)return alert("문의 글을 불러오지 못했어요");inq=data||[];drawB()}
function drawB(){const tb=$("mbb");if(!tb)return;const k=($("mbq").value||"").trim().toLowerCase();tb.replaceChildren();
  $("mbc").textContent="문의 "+inq.length+"건 · 미답변 "+inq.filter(x=>!x.reply&&!x.hidden).length+"건";
  inq.filter(r=>!k||[r.name,r.email,r.title,r.body].join(" ").toLowerCase().includes(k)).forEach(r=>{
    const st=r.hidden?"숨김":r.reply?"답변 완료":"미답변";
    const tr=el("tr",{className:"r"},[el("td",{className:"no",textContent:r.id}),el("td",{className:"dt",textContent:dt(r.created_at)}),el("td",{textContent:r.name}),el("td",{textContent:r.email}),el("td",{textContent:(r.secret?"🔒 ":"")+r.title}),el("td",{textContent:st,style:"white-space:nowrap;font-weight:700;color:"+(r.hidden?"var(--mut)":r.reply?"var(--ok)":"var(--ac)")})]);
    tr.onclick=()=>{openB=openB===r.id?null:r.id;drawB()};tb.append(tr);
    if(openB!==r.id)return;
    const ta=el("textarea",{value:r.reply||"",rows:5,maxLength:3000,placeholder:"답변을 쓰면 비밀글이 아닌 글은 게시판에 공개돼요. 비밀글은 공개되지 않으니 아래 '메일로 답장'을 이용해 주세요.",style:"width:100%;box-sizing:border-box;padding:10px;border:1px solid #7775;border-radius:6px;font:inherit;background:var(--bg);color:var(--fg)"});
    const msg=el("span",{className:"mnote"});
    const sv=el("button",{className:"mbtn",type:"button",textContent:"답변 저장"});
    sv.onclick=async()=>{const t=ta.value.trim(),u=(await db.auth.getSession()).data.session;const {error}=await db.from("inquiries").update({reply:t||null,replied_by:t?u.user.email:null,replied_at:t?new Date().toISOString():null}).eq("id",r.id);if(error){msg.textContent="저장하지 못했어요";return}r.reply=t||null;r.replied_at=t?new Date().toISOString():null;msg.textContent="저장했어요";drawB()};
    const hd=el("button",{className:"mbtn",type:"button",textContent:r.hidden?"다시 보이기":"게시판에서 숨기기"});
    hd.onclick=async()=>{const {error}=await db.from("inquiries").update({hidden:!r.hidden}).eq("id",r.id);if(error)return alert("바꾸지 못했어요");r.hidden=!r.hidden;drawB()};
    const dl=el("button",{className:"mbtn",type:"button",textContent:"삭제"});
    dl.onclick=async()=>{if(!confirm("이 문의 글을 삭제할까요?\n되돌릴 수 없어요."))return;const {error}=await db.from("inquiries").delete().eq("id",r.id);if(error)return alert("삭제하지 못했어요");inq=inq.filter(x=>x.id!==r.id);openB=null;drawB()};
    const ml=el("a",{className:"mbtn",textContent:"✉ 메일로 답장",href:"mailto:"+encodeURIComponent(r.email).replace(/%40/g,"@")+"?subject="+encodeURIComponent("Re: "+r.title),style:"text-decoration:none;display:inline-block"});
    tb.append(el("tr",{},[el("td",{colSpan:6,style:"background:#7771;padding:14px 18px"},[el("div",{textContent:r.body,style:"white-space:pre-wrap;line-height:1.7;margin-bottom:12px"}),ta,el("div",{style:"display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px"},[sv,ml,hd,dl,msg])])]))})}
/* ---------- 탭 틀 ---------- */
function build(){
  const pt=$("pt");if(!pt||$("msub"))return;
  const w=el("div",{id:"ptw"});[...pt.childNodes].forEach(n=>w.append(n));pt.append(w);
  const bar=el("div",{className:"msub",id:"msub"});
  const defs=[["w","할 일"],["j","지원서"],["a","지원자 메일"],["q","고객 문의 메일"],["s","보낸 메일"]];
  const pj=el("div",{id:"pj",hidden:true},[
    el("div",{className:"mbar"},[el("b",{id:"mjc"}),
      el("select",{id:"mju",title:"분야"},[["","전체 분야"],["vocal","Vocal · 보컬"],["sound","Sound · 작곡·믹싱"],["art","Art · 일러스트·디자인"],["content","Content · 작가·영상"],["etc","기타"]].map(([v,t])=>el("option",{value:v,textContent:t}))),
      el("select",{id:"mjs",title:"상태"},[["","전체 상태"],["nothanks","감사 메일 전"],["interview","면접 안내함"],...(boss?[["open","검토 중"],["hire","대표 채용"],["reject","대표 거절"]]:[])].map(([v,t])=>el("option",{value:v,textContent:t}))),
      el("input",{id:"mjq",placeholder:"검색 (이름·이메일·분야·메모)"}),el("button",{className:"mbtn",type:"button",id:"mjlk",textContent:"🔒 대표 잠금 해제",hidden:!boss}),el("span",{className:"mnote",textContent:"줄을 누르면 오른쪽에 지원서 전체가 열려요 · ✉ 버튼을 누르면 메일이 나가고 자동으로 체크돼요"})]),
    el("div",{className:"mtw"},[el("table",{className:"mt mtj"},[el("thead",{},[
      el("tr",{className:"gh"},[["기본 정보",6,""],["경영지원팀 체크",2,"gt"],["대표 전용 · 대표만 보고 수정",3,"gb"],["경영지원팀 메모",1,""]].filter(x=>boss||x[2]!=="gb").map(([t,n,c])=>el("th",{textContent:t,colSpan:n,className:c}))),
      el("tr",{},[["No.",""],["접수일시",""],["닉네임",""],["성명",""],["출신",""],["분야",""],["감사","mk"],["면접","mk"],["대표 채용 · 채용 메일","mk bs b2 bl",1],["대표 거절 · 거절 메일","mk bs b3",1],["대표 메모 🔒","bs bm br",1],["경영지원팀 메모",""]].filter(x=>boss||!x[2]).map(([t,c])=>el("th",{textContent:t,className:c})))]),el("tbody",{id:"mjb"})])])]);
  const sel=el("select",{id:"mqs"},[["all","전체"],["new","읽지 않음"],["chk","확인함"],["rep","답장함"],["done","완료"]].map(([v,t])=>el("option",{value:v,textContent:t})));
  const pq=el("div",{id:"pq",hidden:true},[
    el("div",{className:"mbar"},[el("b",{id:"mqc"}),sel,el("input",{id:"mqq",placeholder:"검색 (제목·보낸 사람·내용)"}),el("button",{className:"mbtn",type:"button",id:"mqr",textContent:"새로고침"}),el("button",{className:"mbtn p",type:"button",id:"mqn",textContent:"✉ 새 메일"}),el("span",{className:"mnote",id:"mqnote",textContent:QT.inq.note})]),
    el("div",{className:"mtw"},[el("table",{className:"mt"},[el("thead",{},[el("tr",{},["No.","상태","제목","상대","담당","먼저 확인","답장한 사원","최근 활동"].map(t=>el("th",{textContent:t})))]),el("tbody",{id:"mqb"})])])]);
  const pbq=el("div",{id:"pbq",hidden:true},[
    el("div",{className:"mbar"},[el("b",{id:"mbc"}),el("input",{id:"mbq",placeholder:"검색 (이름·이메일·제목·내용)"}),el("button",{className:"mbtn",type:"button",id:"mbr",textContent:"새로고침"}),el("span",{className:"mnote",textContent:"사이트의 공개 문의 게시판(rif-studio.com/board/)에 올라온 글이에요. 이메일은 운영진만 볼 수 있어요."})]),
    el("div",{className:"mtw"},[el("table",{className:"mt"},[el("thead",{},[el("tr",{},["No.","작성일시","이름","이메일","제목","상태"].map(t=>el("th",{textContent:t})))]),el("tbody",{id:"mbb"})])])]);
  const ps=el("div",{id:"pjs",hidden:true},[
    el("div",{className:"mbar"},[el("b",{id:"msc"}),el("select",{id:"msh",title:"채널"},[["all","전체 채널"],["join","지원자"],["inq","고객 문의"]].map(([v,t])=>el("option",{value:v,textContent:t}))),el("select",{id:"mss",title:"읽음"},[["all","읽음 전체"],["unread","안 읽음"],["read","읽음"]].map(([v,t])=>el("option",{value:v,textContent:t}))),el("input",{id:"msq",placeholder:"검색 (받는 사람·제목·보낸 사원·내용)"}),el("button",{className:"mbtn",type:"button",id:"msr",textContent:"새로고침"}),el("span",{className:"mnote",textContent:"support@rif-studio.com 이름으로 나간 모든 메일이에요. 채널(지원자 / 고객 문의)로 나눠 볼 수 있고, 줄을 누르면 내용을 보고 같은 사람에게 바로 이어서 보낼 수 있어요. 상대가 답장하면 지원자는 '지원자 메일', 그 밖에는 '고객 문의 메일'로 들어와요."})]),
    el("div",{className:"mtw"},[el("table",{className:"mt"},[el("thead",{},[el("tr",{},["보낸 시각","채널","종류","받는 사람","제목","보낸 사원","읽음"].map(t=>el("th",{textContent:t})))]),el("tbody",{id:"msb"})])])]);
  /* 지원자 메일(a)과 고객 문의 메일(q)은 같은 화면을 쓰고, 채널만 바꿔 보여줘요 */
  const panes={w:w,j:pj,a:pq,q:pq,s:ps};
  const show=k=>{[...bar.children].forEach(x=>x.setAttribute("aria-pressed",x.dataset.k===k?"true":"false"));
    const tgt=panes[k];[w,pj,pq,ps].forEach(p=>{p.hidden=p!==tgt});
    if(k==="j")loadJ();
    if(k==="a"||k==="q"){qchan=k==="a"?"join":"inq";$("mqnote").textContent=QT[qchan].note;openQ=null;drawQ();loadQ()}
    if(k==="s")loadS()};
  showSub=show;
  defs.forEach(([k,t],i)=>{const b=el("button",{type:"button"},[t]);b.dataset.k=k;if(k==="a"||k==="q")b.append(el("span",{className:"bd",hidden:true}));
    b.setAttribute("aria-pressed",i===0?"true":"false");b.onclick=()=>show(k);bar.append(b)});
  pt.prepend(bar);pt.append(pj,pq,ps);
  const host=$("pbd");
  if(host){pbq.hidden=false;host.append(pbq);const tb=document.querySelector('#tabs button[data-t="q"]');if(tb){tb.hidden=false;tb.addEventListener("click",loadB)}loadB()}
  $("mjq").oninput=drawJ;$("mju").onchange=drawJ;$("mjs").onchange=drawJ;if(boss)$("mjlk").onclick=openUnlock;$("mqq").oninput=drawQ;$("mqs").onchange=()=>{qfilter=$("mqs").value;drawQ()};$("mqr").onclick=loadQ;$("mqn").onclick=composeQ;$("msq").oninput=drawS;$("mss").onchange=drawS;$("msh").onchange=drawS;$("msr").onclick=loadS;$("mbq").oninput=drawB;$("mbr").onclick=loadB;
  loadQ(); /* 소메뉴의 새 메일 숫자를 먼저 채워 둬요 */
}

/* 대표 잠금 해제 — 대표 채용·거절로 잠긴 지원서를 대표 비밀번호로 풀어요 (대표에게만 보여요) */
function openUnlock(){
  const mod=el("div",{className:"mod"}),box=el("div",{className:"mbox wd"}),close=()=>{mod.remove();document.removeEventListener("keydown",esc)};
  const esc=e=>{if(e.key==="Escape")close()};document.addEventListener("keydown",esc);
  mod.onclick=e=>{if(e.target===mod)close()};
  const x=el("button",{type:"button",className:"mx",textContent:"×","aria-label":"닫기"});x.onclick=close;
  const body=el("div");box.append(x,body);mod.append(box);document.body.append(mod);
  const pin=el("input",{type:"password",inputMode:"numeric",autocomplete:"off",maxLength:20,className:"pin",style:"width:100%;text-align:center;letter-spacing:.3em;padding:11px 14px"});
  const err=el("p",{className:"note err",style:"min-height:1.4em"}),ok=el("button",{type:"button",className:"btn",textContent:"확인"});
  body.append(el("h2",{textContent:"대표 확인"}),el("p",{className:"note",textContent:"잠긴 지원서를 풀려면 대표 비밀번호를 입력해 주세요."}),pin,err,el("div",{className:"jbar"},[ok]));
  pin.focus();
  const list=async p=>{
    const {data,error}=await db.rpc("jr_locked_list",{p_pin:p});
    if(error){err.textContent=/bad pin/.test(error.message)?"비밀번호가 맞지 않아요":/admin only/.test(error.message)?"대표 계정으로 로그인해 주세요":"불러오지 못했어요";return false}
    body.replaceChildren(el("h2",{textContent:"잠긴 지원서"}),el("p",{className:"note",textContent:"풀면 경영지원팀에 다시 보이고 수정할 수 있어요."}));
    if(!(data||[]).length)body.append(el("p",{className:"note",textContent:"잠긴 지원서가 없어요."}));
    (data||[]).forEach(r=>{const b=el("button",{type:"button",className:"btn small",textContent:"잠금 풀기"});
      b.onclick=async()=>{const nm=r.nickname||r.name||r.email;if(!confirm(nm+" 지원서의 채용/거절 결정을 풀까요?"))return;
        b.disabled=true;const {error}=await db.rpc("jr_unlock",{p_id:r.id,p_pin:p});if(error){b.disabled=false;alert("풀지 못했어요");return}
        await list(p);loadJ()};
      body.append(el("div",{style:"display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--line)"},[el("span",{textContent:(r.nickname||r.name||"")+" · "+(r.email||"")+" · "+(r.decision==="hire"?"대표 채용":"대표 거절")}),b]))});
    return true};
  const go=async()=>{if(!pin.value)return;err.textContent="";ok.disabled=true;await list(pin.value);ok.disabled=false};
  ok.onclick=go;pin.onkeydown=e=>{if(e.key==="Enter")go()}}
async function start(){
  if(started)return;
  const {data:s}=await db.auth.getSession();if(!s.session)return;
  started=true;
  const [m,b]=await Promise.all([db.rpc("is_mgmt"),db.rpc("is_boss")]);
  mgmt=!!m.data;boss=!!b.data;{const l=$("admlink");if(l)l.hidden=!boss}if(!mgmt)return;build()}
function teardown(){{const l=$("admlink");if(l)l.hidden=true}started=false;mgmt=boss=false;{const tb=document.querySelector('#tabs button[data-t="q"]');if(tb)tb.hidden=true}rows=[];msgs=[];reps={};threads=[];sent=[];qchan="inq";showSub=null;joinOk=false;joinIn=new Set();joinOut=new Set();openJ=openQ=openS=null;const pt=$("pt"),w=$("ptw");if(w&&pt){[...w.childNodes].forEach(n=>pt.insertBefore(n,w));w.remove()}["msub","pj","pq","pbq","pjs","mjd","mqnew"].forEach(i=>{const e=$(i);if(e)e.remove()})}
try{const ap=$("app");new MutationObserver(()=>{if(ap.hidden)teardown();else start()}).observe(ap,{attributes:true,attributeFilter:["hidden"]});if(!ap.hidden)start()}catch(_){}
})();
