/* 업무 탭 · 경영지원팀 전용: 지원서 / support@ 문의 게시판 (대표 포함) */
(()=>{
const $=i=>document.getElementById(i);
const N={vocal:"보컬",composition:"작곡·편곡",directing:"디렉팅",mixing:"믹싱",mastering:"마스터링",illustration:"일러스트",design:"디자인·굿즈",writer:"작가",streamer:"스트리머",video:"영상",management:"매니지먼트",sales:"영업·운영",etc:"기타"},
  R={korea:"한국",japan:"일본",english:"영미권",other:"기타"};
const flds=r=>{const f=(r.fields||"").split(",").filter(Boolean);return f.map(x=>x==="etc"&&r.field_other?"기타("+r.field_other+")":(N[x]||x)).join(", ")||"-"};
const pad=n=>String(n).padStart(2,"0"),dt=s=>{const d=new Date(s);return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+" "+pad(d.getHours())+":"+pad(d.getMinutes())};
const url=v=>/^https?:\/\//.test(v||"")?v:null;
const errMsg=e=>{const m=String((e&&e.message)||e||"");return /rejected applicant is locked/.test(m)?"채용 거절 처리된 지원자라 수정할 수 없어요. 대표가 거절을 풀어야 해요.":/boss only/.test(m)?"대표만 할 수 있어요.":/mgmt only/.test(m)?"경영지원팀만 할 수 있어요.":m};
let mgmt=false,boss=false,started=false,rows=[],msgs=[],reps={},openJ=null,openQ=null,qfilter="all";

const css=document.createElement("style");
css.textContent=`
.msub{display:flex;gap:6px;margin:0 0 16px;border-bottom:1px solid #7773}.msub button{background:none;border:0;border-bottom:3px solid transparent;padding:10px 16px;font:inherit;font-size:15px;color:var(--fg);cursor:pointer}.msub button[aria-pressed="true"]{border-bottom-color:#d64545;font-weight:700}
.mbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 12px}.mbar b{font-size:14px}.mbar input,.mbar select{padding:8px 10px;border:1px solid #7775;border-radius:4px;font:inherit;background:var(--bg);color:var(--fg)}.mbar input{min-width:240px}
.mtw{overflow-x:auto;border:1px solid #7773;border-radius:6px}
table.mt{border-collapse:collapse;width:100%;font-size:13.5px;line-height:1.5}
.mt th{background:var(--bg);text-align:left;padding:9px 10px;border-bottom:2px solid #7775;white-space:nowrap;font-size:12px;color:var(--mut)}
.mt td{padding:9px 10px;border-bottom:1px solid #7773;vertical-align:top}
.mt tr.r{cursor:pointer}.mt tr.r:hover td{background:#7771}.mt tr.dup td{background:#ff2d2d1a}.mt tr.rej td{opacity:.6}
.mt td.no{color:var(--mut);text-align:right;width:40px}.mt td.dt{white-space:nowrap}.mt td.mk{text-align:center;width:44px}.mt td.mk input{width:17px;height:17px;accent-color:#d64545;cursor:pointer}
.mt td.mk input:disabled{cursor:not-allowed;opacity:.55}
.mt input.mm{width:100%;min-width:150px;padding:6px 8px;border:1px solid #7775;border-radius:4px;font:inherit;font-size:13px;background:var(--bg);color:var(--fg)}.mt input.mm[readonly]{background:#7771;cursor:not-allowed}.mt input.mm.ok{outline:2px solid #3bb273;outline-offset:-2px}
.mt tr.d td{background:#7771;padding:16px 20px;cursor:default}.mt tr.d p{white-space:pre-wrap;margin:0 0 12px}.mt tr.d b.mlb{color:#d64545;font-size:12px;letter-spacing:.08em}
.mbadge{display:inline-block;padding:1px 8px;border-radius:99px;font-size:11px;font-weight:700;color:#fff;background:#999;white-space:nowrap}.mbadge.new{background:#d64545}.mbadge.rep{background:#0f6cbd}.mbadge.done{background:#3bb273}
.mdupb{display:inline-block;margin-left:6px;padding:1px 7px;border-radius:99px;background:#e5332a;color:#fff;font-size:11px;font-weight:700}
.mrep{border-left:3px solid #0f6cbd;background:#0f6cbd12;border-radius:4px;padding:10px 14px;margin:0 0 10px}.mrep .h{font-size:12px;color:var(--mut);margin-bottom:4px}.mrep .t{white-space:pre-wrap}
.mbody{white-space:pre-wrap;word-break:break-word;line-height:1.7;font-size:14px;padding:14px 16px;border:1px solid #7775;border-radius:8px;background:#7771;color:var(--fg);max-height:520px;overflow:auto}
.mfr{width:100%;min-height:120px;border:1px solid #7775;border-radius:8px;background:#fff;display:block}.mfr.dark{filter:invert(1) hue-rotate(180deg)}
.mtl{display:flex;flex-direction:column;gap:10px;margin:6px 0 16px}.mmsg{border:1px solid #7775;border-radius:8px;padding:10px 14px;background:var(--bg)}
.mmsg .h{font-size:12px;color:var(--mut);margin-bottom:8px}.mmsg.in{border-left:3px solid #9a98a3}.mmsg.out{border-left:3px solid #0f6cbd;background:#0f6cbd12}.mmsg .t{white-space:pre-wrap;line-height:1.7}
.mwho{display:inline-block;padding:1px 9px;border-radius:99px;font-size:12px;font-weight:700;color:var(--fg);background:#7772}.mwho.out{background:#0f6cbd;color:#fff}
.mbtn.mq{margin-top:8px;padding:4px 10px;font-size:12px}
.mfrm textarea{width:100%;min-height:110px;padding:10px;border:1px solid #7775;border-radius:6px;font:inherit;background:var(--bg);color:var(--fg);box-sizing:border-box}
.mfrm .acts{display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap}
.mbtn{padding:8px 16px;border:1px solid #7775;border-radius:4px;background:var(--bg);color:var(--fg);font:inherit;cursor:pointer}.mbtn.p{background:#d64545;border-color:#d64545;color:#fff;font-weight:700}.mbtn:disabled{opacity:.5}
.mnote{font-size:12px;color:var(--mut)}.mnote.err{color:#d64545}
`;
document.head.appendChild(css);

const cell=(v,cls)=>el("td",{className:cls||"",textContent:v||"-"});
function link(v,cls){const td=el("td",{className:cls||""});const u=url(v);if(u){const a=el("a",{href:u,target:"_blank",rel:"noopener noreferrer",textContent:v});a.onclick=e=>e.stopPropagation();td.append(a)}else td.textContent=v||"-";return td}

/* ---------- 지원서 ---------- */
async function loadJ(){const {data,error}=await db.from("join_requests").select("*").order("created_at",{ascending:true});
  if(error){$("mjc").textContent="불러오지 못했어요";return}
  rows=(data||[]).map((r,i)=>({...r,no:i+1})).reverse();drawJ()}
async function rpcSet(name,args,node,revert){const {error}=await db.rpc(name,args);
  if(error){alert("저장하지 못했어요: "+errMsg(error));if(revert)revert();return false}
  if(node){node.classList.add("ok");setTimeout(()=>node.classList.remove("ok"),900)}return true}
function drawJ(){
  const q=$("mjq").value.trim().toLowerCase(),tb=$("mjb");tb.replaceChildren();
  const cnt={};rows.forEach(r=>{const k=(r.email||"").trim().toLowerCase();cnt[k]=(cnt[k]||0)+1});
  const view=rows.filter(r=>!q||[r.nickname,r.name,r.email,flds(r),R[r.region],r.memo,r.team_memo].join(" ").toLowerCase().includes(q));
  $("mjc").textContent="지원자 "+view.length+(q?" / "+rows.length:"")+"명";
  view.forEach(r=>{
    const dup=cnt[(r.email||"").trim().toLowerCase()]>1;
    const nick=cell(r.nickname||r.name);if(dup)nick.append(el("span",{className:"mdupb",textContent:"재지원"}));
    const MC=[["mail_thanks","감사"],["mail_interview","면접"],["mail_reject","거절"],["mail_hire","채용"]].map(([k,t])=>{
      const c=el("input",{type:"checkbox",checked:!!r[k],disabled:!!r.ceo_reject,title:r.ceo_reject?"채용 거절 처리된 지원자예요":t+" (표시만 해요. 메일은 자동으로 나가지 않아요)"});
      c.onclick=e=>e.stopPropagation();
      c.onchange=async()=>{const v=c.checked;c.disabled=true;const ok=await rpcSet("jr_set_check",{p_id:r.id,p_field:k,p_val:v},null,()=>{c.checked=!v});if(ok)r[k]=v;c.disabled=!!r.ceo_reject};
      return el("td",{className:"mk"},[c])});
    const CK=[["ceo_interview","면접 의향"],["ceo_hire","채용 의향"],["ceo_reject","채용 거절"]].map(([k,t])=>{
      const c=el("input",{type:"checkbox",checked:!!r[k],disabled:!boss,title:boss?t:"대표만 바꿀 수 있어요"});c.onclick=e=>e.stopPropagation();
      c.onchange=async()=>{const v=c.checked;c.disabled=true;const ok=await rpcSet("jr_set_ceo_flag",{p_id:r.id,p_field:k,p_val:v},null,()=>{c.checked=!v});if(ok){r[k]=v;drawJ()}else c.disabled=!boss};
      return el("td",{className:"mk"},[c])});
    const bm=el("input",{className:"mm",value:r.memo||"",maxLength:500,placeholder:boss?"대표 메모":"🔒 대표만 작성",readOnly:!boss});
    bm.title=boss?"대표만 쓸 수 있는 메모":"대표만 쓸 수 있는 메모 (읽기 전용)";bm.onclick=e=>e.stopPropagation();
    if(boss)bm.onchange=()=>rpcSet("jr_set_boss_memo",{p_id:r.id,p_memo:bm.value.trim()},bm).then(ok=>{if(ok)r.memo=bm.value.trim()||null});
    const tm=el("input",{className:"mm",value:r.team_memo||"",maxLength:500,placeholder:"경영지원팀 메모",readOnly:!!r.ceo_reject});
    tm.onclick=e=>e.stopPropagation();if(r.ceo_reject)tm.title="채용 거절 처리된 지원자예요";
    tm.onchange=()=>rpcSet("jr_set_team_memo",{p_id:r.id,p_memo:tm.value.trim()},tm).then(ok=>{if(ok)r.team_memo=tm.value.trim()||null});
    const tr=el("tr",{className:"r"+(dup?" dup":"")+(r.ceo_reject?" rej":"")},[cell(String(r.no),"no"),cell(dt(r.created_at),"dt"),nick,cell(r.nickname?r.name:""),cell(R[r.region]||"-"),cell(flds(r)),...MC,...CK,el("td",{},[bm]),el("td",{},[tm])]);
    const d=el("div",{},[el("b",{className:"mlb",textContent:"이메일"}),el("p",{textContent:r.email||"-"}),el("b",{className:"mlb",textContent:"YouTube / Twitter"}),el("p",{textContent:[r.youtube,r.twitter].filter(Boolean).join("  ·  ")||"-"}),
      el("b",{className:"mlb",textContent:"경력"}),el("p",{textContent:r.career||"-"}),el("b",{className:"mlb",textContent:"자기소개"}),el("p",{textContent:r.intro||"-"}),el("b",{className:"mlb",textContent:"지원동기"}),el("p",{textContent:r.motive||"-"})]);
    if(boss){const x=el("button",{className:"mbtn",type:"button",textContent:"이 지원서 삭제"});
      x.onclick=async()=>{if(!confirm((r.nickname||r.name)+" 지원서를 삭제할까요? 되돌릴 수 없어요."))return;const ok=await rpcSet("jr_delete",{p_id:r.id});if(ok){rows=rows.filter(z=>z.id!==r.id);drawJ()}};d.append(x)}
    const dtl=el("tr",{className:"d",hidden:openJ!==r.id},[el("td",{colSpan:17},[d])]);
    tr.onclick=()=>{dtl.hidden=!dtl.hidden;openJ=dtl.hidden?null:r.id};
    tb.append(tr,dtl)})}

/* ---------- support@ 문의 게시판 (같은 사람·같은 제목은 한 대화로 묶어요) ---------- */
const normSub=s=>{let t=String(s||"").trim();for(let i=0;i<8;i++){const n=t.replace(/^\s*((re|fw|fwd|답장|회신|답신|전달)\s*(\[\d+\])?\s*[:：]\s*)+/i,"");if(n===t)break;t=n}return t.trim().toLowerCase()};
const tkey=m=>(m.from_addr||"").trim().toLowerCase()+"|"+normSub(m.subject);
let who={},threads=[];
const label=e=>{const p=who[(e||"").toLowerCase()];return p?[p.name||p.nickname,[p.pos,p.rnk].filter(Boolean).join(" ")].filter(Boolean).join(" · "):""};
const cutQ=s=>{s=String(s||"").replace(/\r\n/g,"\n");const i=s.search(/\n[^\n]*(wrote:|작성:)\s*(\n|$)|\n>/);return i>0?s.slice(0,i).trim():s.trim()};
async function loadQ(){
  const [a,b,c]=await Promise.all([
    db.from("inbox_messages").select("id,from_addr,from_name,to_addrs,subject,received_at,assignee_email,done,preview,attachments").order("received_at",{ascending:false}).limit(500),
    db.from("mail_outbox").select("id,inbox_id,author_name,author_email,to_email,subject,body,created_at").not("inbox_id","is",null).order("created_at",{ascending:true}),
    db.rpc("staff_directory")]);
  if(a.error){$("mqc").textContent="불러오지 못했어요";return}
  who={};(c.data||[]).forEach(p=>{who[(p.email||"").toLowerCase()]=p});
  msgs=a.data||[];reps={};(b.data||[]).forEach(x=>{(reps[x.inbox_id]=reps[x.inbox_id]||[]).push(x)});
  const map=new Map();
  [...msgs].sort((x,y)=>new Date(x.received_at)-new Date(y.received_at)).forEach(m=>{const k=tkey(m);let t=map.get(k);
    if(!t){t={key:k,subject:m.subject,from:m.from_addr,fromName:m.from_name,ins:[],outs:[]};map.set(k,t)}
    t.ins.push(m);(reps[m.id]||[]).forEach(r=>t.outs.push(r))});
  threads=[...map.values()].map(t=>{
    t.ev=[...t.ins.map(m=>({k:"in",t:new Date(m.received_at),m})),...t.outs.map(r=>({k:"out",t:new Date(r.created_at),r}))].sort((x,y)=>x.t-y.t);
    t.last=t.ev[t.ev.length-1];t.done=t.ins.every(m=>m.done);return t}).sort((x,y)=>y.last.t-x.last.t);
  drawQ()}
const tstatus=t=>t.done?["done","완료"]:t.last.k==="out"?["rep","답장함 "+t.outs.length]:["new","새 메일"+(t.ins.length>1?" · "+t.ins.length+"통":"")];
function drawQ(){
  const q=$("mqq").value.trim().toLowerCase(),tb=$("mqb");tb.replaceChildren();
  let view=threads.filter(t=>!q||[t.subject,t.from,t.fromName,...t.ins.map(m=>m.preview),...t.outs.map(r=>(r.body||"")+" "+(r.author_name||""))].join(" ").toLowerCase().includes(q));
  if(qfilter==="new")view=view.filter(t=>tstatus(t)[0]==="new");else if(qfilter==="rep")view=view.filter(t=>tstatus(t)[0]==="rep");else if(qfilter==="done")view=view.filter(t=>t.done);
  $("mqc").textContent="문의 "+view.length+"건";
  const total=threads.length;
  view.forEach(t=>{
    const [k,s]=tstatus(t),lo=t.outs[t.outs.length-1];
    const tr=el("tr",{className:"r"},[cell(String(total-threads.indexOf(t)),"no"),el("td",{},[el("span",{className:"mbadge "+k,textContent:s})]),cell(t.subject||"(제목 없음)"),cell((t.fromName?t.fromName+" ":"")+"<"+t.from+">"),cell(lo?(label(lo.author_email)||lo.author_name||lo.author_email):"-"),cell(dt(t.last.t),"dt")]);
    const dtl=el("tr",{className:"d",hidden:openQ!==t.key},[el("td",{colSpan:6},[])]);
    const fill=()=>{if(dtl.dataset.on)return;dtl.dataset.on="1";buildQ(t,dtl.firstChild)};
    if(openQ===t.key)fill();
    tr.onclick=()=>{dtl.hidden=!dtl.hidden;openQ=dtl.hidden?null:t.key;if(!dtl.hidden)fill()};
    tb.append(tr,dtl)})}
function showBody(m,box){
  db.from("inbox_messages").select("body_text,body_html").eq("id",m.id).single().then(({data,error})=>{
    box.replaceChildren();if(error||!data){box.textContent="본문을 불러오지 못했어요";return}
    const html=data.body_html||"",txt=data.body_text||"";
    if(!/<(table|img|style|a\s)/i.test(html)){
      const full=(txt||html.replace(/<br\s*\/?>/gi,"\n").replace(/<\/(p|div|li)>/gi,"\n").replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&amp;/g,"&")).replace(/\r\n/g,"\n").trim();
      const cut=cutQ(full),b=el("div",{className:"mbody",textContent:cut||full||"(내용 없음)"});box.append(b);
      if(cut&&cut!==full){let on=false;const tg=el("button",{className:"mbtn mq",type:"button",textContent:"이전 내용 보기"});tg.onclick=()=>{on=!on;b.textContent=on?full:cut;tg.textContent=on?"이전 내용 접기":"이전 내용 보기"};box.append(tg)}}
    else{
      const f=document.createElement("iframe");f.setAttribute("sandbox","allow-same-origin");
      const dm=window.matchMedia?matchMedia("(prefers-color-scheme: dark)"):{matches:true};f.className="mfr"+(dm.matches?" dark":"");
      f.srcdoc='<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src https: data: cid:; style-src \'unsafe-inline\'"><style>html,body{background:#fff}img,video{filter:invert(1) hue-rotate(180deg)}</style><body style="font:14px/1.6 sans-serif;margin:12px;color:#222">'+html;
      f.onload=()=>{try{f.style.height=Math.min(640,Math.max(120,f.contentDocument.body.scrollHeight+28))+"px"}catch(_){}};
      const tg=el("button",{className:"mbtn",type:"button",textContent:dm.matches?"원본 색으로 보기":"다크로 보기"});tg.style.marginBottom="8px";
      tg.onclick=()=>{const d=f.classList.toggle("dark");tg.textContent=d?"원본 색으로 보기":"다크로 보기"};
      box.append(tg,f)}
    if((m.attachments||[]).length)box.append(el("div",{className:"mnote",textContent:"첨부 "+m.attachments.length+"개: "+m.attachments.map(x=>x.filename).join(", ")+" (파일은 Resend 대시보드에서 확인)"}))})}
function buildQ(t,box){
  box.replaceChildren();
  box.append(el("p",{className:"mnote",textContent:"대화 "+t.ev.length+"건 · 받은 메일 "+t.ins.length+"통 · 보낸 답장 "+t.outs.length+"건 · 같은 사람이 같은 제목(Re: 제외)으로 보낸 메일은 한 대화로 이어져요"}));
  const tl=el("div",{className:"mtl"});box.append(tl);
  t.ev.forEach((e,i)=>{
    const ind="margin-left:"+Math.min(i,5)*18+"px";
    if(e.k==="in"){const m=e.m,body=el("div",{className:"mbd"},[el("span",{className:"mnote",textContent:"본문 불러오는 중…"})]);
      tl.append(el("div",{className:"mmsg in",style:ind},[el("div",{className:"h"},[el("span",{className:"mwho in",textContent:"📩 "+(m.from_name||m.from_addr)}),el("span",{textContent:" <"+m.from_addr+"> → "+(m.to_addrs||"support@rif-studio.com")+" · "+dt(m.received_at)})]),body]));
      showBody(m,body)}
    else{const r=e.r;
      tl.append(el("div",{className:"mmsg out",style:ind},[el("div",{className:"h"},[el("span",{className:"mwho out",textContent:"✉ "+(label(r.author_email)||r.author_name||r.author_email)}),el("span",{textContent:" 님이 보냄 → "+r.to_email+" · "+dt(r.created_at)})]),el("div",{className:"t",textContent:r.body})]))}});
  const li=t.ins[t.ins.length-1];
  const ta=el("textarea",{placeholder:"답장 내용 (support@rif-studio.com 이름으로 나가고, 보낸 사람 이름은 이 기록 옆에 계속 남아요)",maxLength:20000});
  const send=el("button",{className:"mbtn p",type:"button",textContent:"답장 보내기"}),
    dn=el("button",{className:"mbtn",type:"button",textContent:t.done?"완료 취소":"✓ 완료 처리"}),note=el("span",{className:"mnote"});
  send.onclick=async()=>{const b=ta.value.trim();if(!b){note.className="mnote err";note.textContent="답장 내용을 써 주세요.";return}
    if(!confirm(li.from_addr+" 에게 답장을 보낼까요?\n보낸 뒤에는 취소할 수 없어요."))return;
    send.disabled=true;note.className="mnote";note.textContent="보내는 중…";let ok=false,em="";
    try{const {data,error}=await db.functions.invoke("send-mail",{body:{to:li.from_addr,subject:/^re:/i.test(li.subject||"")?li.subject:"Re: "+(li.subject||""),body:b,as:"support",inbox_id:li.id}});
      if(error){try{em=(await error.context.json()).error}catch(_){em=error.message}}else if(data&&data.ok)ok=true;else em=(data&&data.error)||"알 수 없는 오류"}catch(x){em=String(x.message||x)}
    send.disabled=false;if(!ok){note.className="mnote err";note.textContent="보내지 못했어요: "+em;return}
    openQ=t.key;await loadQ()};
  dn.onclick=async()=>{const v=!t.done;const {error}=await db.from("inbox_messages").update({done:v}).in("id",t.ins.map(m=>m.id));if(error)return alert("바꾸지 못했어요");t.ins.forEach(m=>m.done=v);t.done=v;openQ=t.key;drawQ()};
  box.append(el("div",{className:"mfrm"},[ta,el("div",{className:"acts"},[send,dn,note])]))}

/* ---------- 탭 틀 ---------- */
function build(){
  const pt=$("pt");if(!pt||$("msub"))return;
  const w=el("div",{id:"ptw"});[...pt.childNodes].forEach(n=>w.append(n));pt.append(w);
  const bar=el("div",{className:"msub",id:"msub"});
  const defs=[["w","할 일"],["j","지원서"],["q","support@ 문의"]];
  const pj=el("div",{id:"pj",hidden:true},[
    el("div",{className:"mbar"},[el("b",{id:"mjc"}),el("input",{id:"mjq",placeholder:"검색 (이름·이메일·분야·메모)"}),el("span",{className:"mnote",textContent:"클릭하면 상세 내용이 펼쳐져요 · 감사/면접/거절/채용은 표시만 하고 메일은 자동으로 나가지 않아요"})]),
    el("div",{className:"mtw"},[el("table",{className:"mt"},[el("thead",{},[el("tr",{},["No.","접수일시","닉네임","성명","출신","분야","감사","면접","거절","채용","대표 면접","대표 채용","대표 거절","대표 메모 🔒","경영지원팀 메모"].map(t=>el("th",{textContent:t})))]),el("tbody",{id:"mjb"})])])]);
  const sel=el("select",{id:"mqs"},[["all","전체"],["new","새 메일"],["rep","답장함"],["done","완료"]].map(([v,t])=>el("option",{value:v,textContent:t})));
  const pq=el("div",{id:"pq",hidden:true},[
    el("div",{className:"mbar"},[el("b",{id:"mqc"}),sel,el("input",{id:"mqq",placeholder:"검색 (제목·보낸 사람·내용)"}),el("button",{className:"mbtn",type:"button",id:"mqr",textContent:"새로고침"}),el("span",{className:"mnote",textContent:"support@rif-studio.com 으로 온 메일이에요. 답장은 기록으로 계속 남아요."})]),
    el("div",{className:"mtw"},[el("table",{className:"mt"},[el("thead",{},[el("tr",{},["No.","상태","제목","보낸 사람","답장한 사원","최근 활동"].map(t=>el("th",{textContent:t})))]),el("tbody",{id:"mqb"})])])]);
  const panes={w:w,j:pj,q:pq};
  defs.forEach(([k,t],i)=>{const b=el("button",{type:"button",textContent:t});b.setAttribute("aria-pressed",i===0?"true":"false");
    b.onclick=()=>{[...bar.children].forEach(x=>x.setAttribute("aria-pressed",x===b?"true":"false"));Object.entries(panes).forEach(([kk,p])=>p.hidden=kk!==k);if(k==="j")loadJ();if(k==="q")loadQ()};bar.append(b)});
  pt.prepend(bar);pt.append(pj,pq);
  $("mjq").oninput=drawJ;$("mqq").oninput=drawQ;$("mqs").onchange=()=>{qfilter=$("mqs").value;drawQ()};$("mqr").onclick=loadQ;
}
async function start(){
  if(started)return;
  const {data:s}=await db.auth.getSession();if(!s.session)return;
  started=true;
  const [m,b]=await Promise.all([db.rpc("is_mgmt"),db.rpc("is_boss")]);
  mgmt=!!m.data;boss=!!b.data;{const l=$("admlink");if(l)l.hidden=!boss}if(!mgmt)return;build()}
function teardown(){{const l=$("admlink");if(l)l.hidden=true}started=false;mgmt=boss=false;rows=[];msgs=[];reps={};const pt=$("pt"),w=$("ptw");if(w&&pt){[...w.childNodes].forEach(n=>pt.insertBefore(n,w));w.remove()}["msub","pj","pq"].forEach(i=>{const e=$(i);if(e)e.remove()})}
try{const ap=$("app");new MutationObserver(()=>{if(ap.hidden)teardown();else start()}).observe(ap,{attributes:true,attributeFilter:["hidden"]});if(!ap.hidden)start()}catch(_){}
})();
