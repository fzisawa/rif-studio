/* 인트라넷 › 작업·단가
   - 패키지 단가표: 대표가 게시하면 버전 기록이 남아요. 작업자는 자기 몫(지급액)을 확인해요.
   - 작업 배정서: 구두로 정한 작업을 대표가 배정서로 올리면, 작업자가 내용을 확인하고 이름을 넣어 "동의"해요.
     동의하면 그 시각·이름·내용 지문(sha256)이 서버에 남고, 이후에는 내용을 바꿀 수 없어요 (서버 트리거로 막아요).
   - 모든 저장·동의는 서버 함수(pkg_save · wo_offer · wo_accept · wo_decline · wo_set)로만 해요. */
window.RIFWORK=(()=>{
const $=id=>document.getElementById(id);
const won=n=>n==null||n===""?"-":Number(n).toLocaleString("ko-KR")+"원";
const wh=a=>{const t=Math.floor(a*0.03);return t+Math.floor(t*0.1)};
const ST={offered:["동의 대기","wt"],accepted:["동의함 · 계약 성립","on"],declined:["거절","x"],cancelled:["취소","x"],done:["완료","x"]};
const dt=s=>s?new Date(s).toLocaleString("ko-KR",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}):"";
let pk=null,orders=[],dir=[],view="o",edit=false,started=false;
const me=()=>((window.RIFAPP&&RIFAPP.me)||"").toLowerCase();
const css=`#pk .wkbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 14px}
#pk .wkbar .sp{flex:1}#pk .seg button{padding:7px 14px;border:1px solid var(--ln2);background:var(--bg);color:var(--fg);border-radius:99px;font:inherit;font-size:14px;cursor:pointer}
#pk .seg button[aria-pressed=true]{background:var(--ac);border-color:var(--ac);color:#fff}
#pk .wkhint{font-size:13px;color:var(--mut);margin:0 0 14px;line-height:1.6;padding:10px 14px;border:1px dashed var(--ln2);border-radius:12px}
#pk .stb{display:inline-block;padding:2px 10px;border-radius:99px;font-size:12px;font-weight:700;background:var(--hv)}
#pk .stb.wt{background:#e8a33a2e;color:#b8741a}#pk .stb.on{background:#2fa36b22;color:#1f7a4f}#pk .stb.x{color:var(--mut)}
#pk .pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
#pk .pcard{border:1px solid var(--ln);border-radius:16px;padding:16px 18px;background:var(--bg)}
#pk .pcard h3{margin:0;font-size:17px}#pk .pcard .pd{color:var(--mut);font-size:13px;margin:2px 0 10px}
#pk .pcard table{width:100%;border-collapse:collapse;font-size:13px}#pk .pcard td{padding:6px 4px;border-top:1px solid var(--ln);vertical-align:top}
#pk .pcard td.a{text-align:right;white-space:nowrap}#pk .pcard tr.mine td{background:color-mix(in srgb,var(--ac) 12%,transparent);font-weight:700}
#pk .pcard .pf{display:flex;justify-content:space-between;font-size:13px;margin-top:8px;padding-top:8px;border-top:2px solid var(--ln2)}
#pk .pcard .pf b.ok{color:#1f7a4f}#pk .pcard .pf b.no{color:#c0392b}
#pk .ped input{width:100%;box-sizing:border-box;padding:5px 8px;font-size:13px;border:1px solid var(--ln2);border-radius:8px;background:var(--bg);color:var(--fg)}
#pk .ped td{padding:3px 2px}#pk .ped .num{text-align:right}
.wodoc{font-size:14px;line-height:1.7}.wodoc h2{margin:0 0 2px}.wodoc .sub{color:var(--mut);font-size:13px;margin:0 0 14px}
.wodoc dl{display:grid;grid-template-columns:auto 1fr;gap:6px 16px;margin:0 0 14px}.wodoc dt{color:var(--mut)}.wodoc dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}
.wodoc .terms{white-space:pre-wrap;font-size:12.5px;background:var(--hv);border-radius:12px;padding:12px 14px;max-height:220px;overflow:auto;margin:0 0 14px}
.wodoc .sign{border:2px solid var(--ac);border-radius:14px;padding:14px;display:grid;gap:10px}
.wodoc .sign label{display:flex;gap:8px;align-items:flex-start;font-size:13.5px}
.wodoc .rec{border:1px solid #2fa36b77;background:#2fa36b14;border-radius:14px;padding:12px 14px;font-size:13px}
.wodoc .acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.wof{display:grid;gap:10px}.wof label{display:grid;gap:4px;font-size:13px;color:var(--mut)}.wof .row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.wof .calc{font-size:13px;color:var(--mut)}`;
function shell(){
  if($("pk").dataset.ok)return;$("pk").dataset.ok=1;
  document.head.append(el("style",{textContent:css}));
  const seg=el("div",{className:"seg"},[["o","📝 작업 배정서"],["p","📦 패키지 단가표"]].map(([k,t])=>{const b=el("button",{type:"button",textContent:t});b.dataset.k=k;b.onclick=()=>{view=k;edit=false;draw()};return b}));
  $("pk").append(el("div",{className:"wkbar"},[seg,el("span",{className:"sp"}),el("button",{type:"button",className:"btn",id:"wknew",textContent:"＋ 작업 배정",hidden:true}),el("button",{type:"button",className:"btn",id:"wkedit",textContent:"✎ 단가표 편집",hidden:true})]),
    el("p",{className:"wkhint",id:"wkhint"}),el("div",{id:"wkbody"}));
  $("wknew").onclick=offerForm;$("wkedit").onclick=()=>{edit=!edit;draw()};
}
async function load(){
  shell();
  const [a,b]=await Promise.all([db.rpc("pkg_view"),db.rpc("wo_list")]);
  if(a.error||b.error){$("wkbody").replaceChildren(el("p",{className:"note err",textContent:"불러오지 못했어요: "+((a.error||b.error).message)}));return}
  pk=a.data||{boss:false,plans:[]};orders=b.data||[];badge();draw();
}
function badge(){const n=orders.filter(o=>o.status==="offered"&&o.assignee_email.toLowerCase()===me()).length,bd=$("kb");if(bd){bd.hidden=!n;bd.textContent=n}}
function draw(){
  const boss=pk&&pk.boss;
  document.querySelectorAll("#pk .seg button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===view)));
  $("wknew").hidden=!(boss&&view==="o");$("wkedit").hidden=!(boss&&view==="p");$("wkedit").textContent=edit?"✕ 편집 취소":"✎ 단가표 편집";
  $("wkhint").textContent=view==="o"
    ?(boss?"구두로 정한 작업을 '＋ 작업 배정'으로 올리면 작업자에게 배정서가 가요. 작업자가 내용을 확인하고 이름을 넣어 동의하면 그때 계약이 성립하고, 이후에는 내용을 바꿀 수 없어요. 조건을 바꾸려면 새 배정서를 보내 주세요."
          :"대표와 이야기한 작업이 배정서로 올라와요. 내용(금액 · 마감 · 수정 횟수 · 공통 조건)을 확인하고 이름을 넣어 동의하면 서명한 계약서와 같은 효력이 생겨요. 다르면 동의하지 말고 '거절'하거나 대표에게 말해 주세요.")
    :"현재 게시된 패키지 단가표예요"+(pk&&pk.ver?" (게시 v"+pk.ver+" · "+dt(pk.published_at)+")":"")+". 게시할 때마다 버전 기록이 남아요. 실제 작업 조건은 작업 배정서에 동의할 때 확정돼요."+(boss?"":" 내 몫은 굵게 표시돼요.");
  view==="o"?drawOrders():drawPlans();
}
/* ---------- 작업 배정서 ---------- */
function drawOrders(){
  const boss=pk.boss,b=$("wkbody");
  if(!orders.length){b.replaceChildren(el("p",{className:"note",textContent:boss?"아직 보낸 작업 배정서가 없어요.":"아직 받은 작업 배정서가 없어요."}));return}
  const tb=el("tbody");
  orders.forEach(o=>{const [t,c]=ST[o.status]||[o.status,""];
    const tr=el("tr",{className:"r"},[el("td",{className:"dt",textContent:o.no}),el("td",{className:"wd",textContent:o.title}),...(boss?[el("td",{textContent:(o.snapshot&&o.snapshot.assignee)||o.assignee_email})]:[]),
      el("td",{textContent:won(o.amount)}),el("td",{textContent:o.due||"-"}),el("td",{},[el("span",{className:"stb "+c,textContent:t})]),el("td",{className:"dt",textContent:dt(o.accepted_at||o.created_at)})]);
    tr.onclick=()=>openDoc(o);tb.append(tr)});
  b.replaceChildren(el("div",{className:"mtw"},[el("table",{className:"mt"},[el("thead",{},[el("tr",{},["번호","작업",...(boss?["작업자"]:[]),"금액 (세전)","마감","상태","최근"].map(t=>el("th",{textContent:t})))]),tb])]));
}
function modal(){const mod=el("div",{className:"mod",role:"dialog"}),box=el("div",{className:"mbox wd",style:"max-width:640px;width:100%;max-height:92vh;overflow:auto"});
  const close=()=>{mod.remove();document.removeEventListener("keydown",esc)},esc=e=>{if(e.key==="Escape")close()};document.addEventListener("keydown",esc);
  const x=el("button",{type:"button",className:"mx",textContent:"×",ariaLabel:"닫기"});x.onclick=close;mod.onclick=e=>{if(e.target===mod)close()};
  box.append(x);mod.append(box);document.body.append(mod);return {box,close}}
function docBody(o){const s=o.snapshot||{};
  return [el("h2",{textContent:"작업 배정서"}),el("p",{className:"sub",textContent:s.no+" · "+s.company}),
    el("dl",{},[["작업",s.title],["작업 내용 · 범위",s.scope||"-"],["작업자",s.assignee+" ("+s.assignee_email+")"],["금액 (세전)",won(s.amount)],["원천징수 3.3%",won(s.withholding)+" → 실지급 "+won(s.net)],["마감",s.due||"협의"],["기본 수정",(s.revisions??2)+"회"],["지급",s.pay_rule],...(s.plan_code?[["패키지",s.plan_code+(s.pkg_ver?" (단가표 v"+s.pkg_ver+")":"")]]:[]),...(s.memo?[["특약 · 메모",s.memo]]:[]),["발행",dt(s.issued_at)]]
      .flatMap(([k,v])=>[el("dt",{textContent:k}),el("dd",{textContent:v})])),
    el("div",{className:"terms",textContent:s.terms||""})]}
function openDoc(o){
  const {box,close}=modal(),boss=pk.boss,mine=o.assignee_email.toLowerCase()===me();
  const d=el("div",{className:"wodoc"},docBody(o));box.append(d);
  if(o.status==="accepted"||o.status==="done")d.append(el("div",{className:"rec"},[el("b",{textContent:"✓ 동의 기록 (계약 성립)"}),el("div",{textContent:"동의한 사람: "+o.accept_name+" · "+o.assignee_email}),el("div",{textContent:"동의 시각: "+dt(o.accepted_at)}),el("div",{textContent:"내용 지문(sha256): "+(o.sha||"").slice(0,16)+"…"}),...(o.done_at?[el("div",{textContent:"완료 처리: "+dt(o.done_at)})]:[])]));
  if(o.status==="declined")d.append(el("p",{className:"note",textContent:"거절함"+(o.decline_reason?" — "+o.decline_reason:"")}));
  const acts=el("div",{className:"acts"});
  if(mine&&o.status==="offered"){
    const ck=el("input",{type:"checkbox"}),nm=el("input",{placeholder:"본인 이름 (실명)",maxLength:60,autocomplete:"off"}),ok=el("button",{type:"button",className:"btn",textContent:"동의하고 서명하기",disabled:true});
    const upd=()=>{ok.disabled=!(ck.checked&&nm.value.trim().length>=2)};ck.onchange=upd;nm.oninput=upd;
    ok.onclick=async()=>{if(!confirm("이 배정서 내용에 동의할까요?\n동의하면 계약이 성립하고, 내용을 바꿀 수 없어요."))return;ok.disabled=true;
      const {error}=await db.rpc("wo_accept",{p_id:o.id,p_name:nm.value.trim(),p_ua:navigator.userAgent});
      if(error){ok.disabled=false;return alert("동의하지 못했어요: "+error.message)}close();toast("동의했어요 · 계약이 성립했어요 ✓");load()};
    const no=el("button",{type:"button",className:"btn",style:"background:transparent;color:var(--fg);border:1px solid var(--ln2)",textContent:"거절"});
    no.onclick=async()=>{const r=prompt("거절 이유를 적어 주세요 (선택)");if(r===null)return;const {error}=await db.rpc("wo_decline",{p_id:o.id,p_reason:r});if(error)return alert(error.message);close();load()};
    d.append(el("div",{className:"sign"},[el("label",{},[ck,el("span",{textContent:"위 작업 내용과 공통 조건을 모두 읽었고, 이 배정서에 동의합니다. 로그인한 상태에서 이름을 입력하고 동의하는 것을 전자서명으로 인정합니다."})]),nm,el("div",{className:"acts",style:"margin:0"},[ok,no])]));
  }
  if(boss&&o.status==="offered"){const c=el("button",{type:"button",className:"mbtn",textContent:"배정 취소"});c.onclick=async()=>{if(!confirm("이 배정서를 취소할까요? (동의 전이라 취소할 수 있어요)"))return;const {error}=await db.rpc("wo_set",{p_id:o.id,p_status:"cancelled"});if(error)return alert(error.message);close();load()};acts.append(c)}
  if(boss&&o.status==="accepted"){const c=el("button",{type:"button",className:"mbtn p",textContent:"✓ 납품 완료 처리"});c.onclick=async()=>{if(!confirm("납품을 승인하고 완료로 바꿀까요? 정산 대상이 돼요."))return;const {error}=await db.rpc("wo_set",{p_id:o.id,p_status:"done"});if(error)return alert(error.message);close();load()};acts.append(c)}
  const pr=el("button",{type:"button",className:"mbtn",textContent:"🖨 인쇄 · PDF 저장"});pr.onclick=()=>printDoc(o);acts.append(pr);d.append(acts);
}
function printDoc(o){const w=open("","_blank");if(!w)return alert("팝업이 막혀 있어요.");const s=o.snapshot||{},e=t=>String(t??"").replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
  const rows=[["작업",s.title],["작업 내용 · 범위",s.scope||"-"],["작업자",s.assignee+" ("+s.assignee_email+")"],["금액 (세전)",won(s.amount)],["원천징수 3.3%",won(s.withholding)+" → 실지급 "+won(s.net)],["마감",s.due||"협의"],["기본 수정",(s.revisions??2)+"회"],["지급",s.pay_rule],...(s.memo?[["특약 · 메모",s.memo]]:[]),["발행",dt(s.issued_at)]];
  const rec=o.accepted_at?`<div class="rec"><b>동의 기록 (전자서명)</b><br>동의한 사람: ${e(o.accept_name)} (${e(o.assignee_email)})<br>동의 시각: ${e(dt(o.accepted_at))}<br>내용 지문(sha256): ${e(o.sha)}</div>`:`<div class="rec">상태: ${e((ST[o.status]||[o.status])[0])}</div>`;
  w.document.write(`<!doctype html><meta charset="utf-8"><title>${e(s.no)} 작업 배정서</title><style>body{font-family:'Noto Sans KR',sans-serif;margin:18mm;font-size:10.5pt;line-height:1.6;color:#111}h1{text-align:center;letter-spacing:4px;font-size:18pt;margin:0}.sub{text-align:center;color:#555;margin:2px 0 14px}table{width:100%;border-collapse:collapse}td{border:1px solid #555;padding:6px 10px;vertical-align:top;white-space:pre-wrap}td.l{width:26%;background:#f2f2f2;font-weight:700}.terms{white-space:pre-wrap;font-size:9pt;border:1px solid #999;padding:10px;margin:12px 0}.rec{border:2px solid #333;padding:10px;font-size:9.5pt;word-break:break-all}</style>
  <h1>작업 배정서</h1><p class="sub">${e(s.no)} · ${e(s.company)}</p><table>${rows.map(([k,v])=>`<tr><td class="l">${e(k)}</td><td>${e(v)}</td></tr>`).join("")}</table><div class="terms">${e(s.terms)}</div>${rec}<script>onload=()=>print()<\/script>`);w.document.close()}
async function offerForm(){
  if(!dir.length){const {data}=await db.rpc("staff_directory");dir=(data||[]).filter(r=>r.email);}
  const {box,close}=modal(),f=el("div",{className:"wof"});box.append(el("h2",{textContent:"＋ 작업 배정"}),el("p",{className:"note",textContent:"구두로 정한 내용을 그대로 적어 주세요. 보내면 작업자에게 배정서가 가고, 작업자가 동의하면 계약이 성립해요."}),f);
  const plans=(pk.plans||[]).filter(p=>p.active);
  const ln=el("select",{},[el("option",{value:"",textContent:"직접 입력 (패키지 아님)"}),...plans.flatMap(p=>p.lines.map((l,i)=>el("option",{value:p.code+"|"+i,textContent:p.name+" · "+l.field+" · "+l.who+" · "+won(l.amount)})))]);
  const who=el("select",{},[el("option",{value:"",textContent:"작업자 선택"}),...dir.map(r=>el("option",{value:r.email.toLowerCase(),textContent:(r.nickname||r.name)+" · "+(r.team||"")+" ("+r.email+")"}))]);
  const ti=el("input",{maxLength:120,placeholder:"예: ○○님 커버곡 믹싱 (STANDARD 패키지)"}),sc=el("textarea",{rows:4,maxLength:2000,placeholder:"작업 내용 · 범위 · 납품 형식 (예: inst 멀티트랙 믹스·마스터, WAV 48k/24bit)"});
  const am=el("input",{type:"number",min:0,step:1000,placeholder:"세전 금액 (원)"}),du=el("input",{type:"date"}),rv=el("input",{type:"number",min:0,max:20,value:2}),mm=el("textarea",{rows:2,maxLength:1000,placeholder:"특약 · 메모 (선택, 예: 저작권 양도 포함 / 크레딧 표기)"});
  const calc=el("div",{className:"calc"});const upc=()=>{const a=Math.round(Number(am.value)||0);calc.textContent=a?"3.3% 원천징수 "+won(wh(a))+" → 실지급 "+won(a-wh(a)):""};am.oninput=upc;
  ln.onchange=()=>{if(!ln.value)return;const [c,i]=ln.value.split("|"),p=plans.find(x=>x.code===c),l=p.lines[+i];ti.value=p.name+" 패키지 · "+l.field+" — "+l.item;am.value=l.amount;if(l.assignee_email)who.value=l.assignee_email;upc()};
  const go=el("button",{type:"button",className:"btn",textContent:"배정서 보내기"});
  go.onclick=async()=>{const a=Math.round(Number(am.value)||0);if(!who.value)return alert("작업자를 골라 주세요.");if(!ti.value.trim())return alert("작업 이름을 적어 주세요.");if(a<=0)return alert("금액을 넣어 주세요.");
    if(!confirm(who.selectedOptions[0].textContent+"\n"+ti.value+"\n"+won(a)+" (세전)\n\n이 내용으로 배정서를 보낼까요?"))return;go.disabled=true;
    const {error}=await db.rpc("wo_offer",{p_title:ti.value.trim(),p_scope:sc.value,p_assignee:who.value,p_amount:a,p_due:du.value||null,p_revisions:Math.round(Number(rv.value)||0),p_plan_code:ln.value?ln.value.split("|")[0]:null,p_memo:mm.value});
    go.disabled=false;if(error)return alert("보내지 못했어요: "+error.message);close();toast("배정서를 보냈어요 ✓");load()};
  f.append(el("label",{},["패키지 항목에서 불러오기",ln]),el("label",{},["작업자",who]),el("label",{},["작업 이름",ti]),el("label",{},["작업 내용 · 범위",sc]),
    el("div",{className:"row2"},[el("label",{},["금액 (세전, 원)",am]),el("label",{},["마감일",du])]),el("label",{},["기본 수정 횟수",rv]),el("label",{},["특약 · 메모",mm]),calc,go);
}
/* ---------- 패키지 단가표 ---------- */
function drawPlans(){
  const b=$("wkbody"),boss=pk.boss,m=me();
  if(edit&&boss)return drawEditor();
  const plans=pk.plans||[];if(!plans.length){b.replaceChildren(el("p",{className:"note",textContent:"아직 게시된 단가표가 없어요."}));return}
  b.replaceChildren(el("div",{className:"pgrid"},plans.map(p=>{const cost=p.lines.reduce((s,l)=>s+(l.amount||0),0);
    const rows=p.lines.map(l=>el("tr",{className:l.assignee_email&&l.assignee_email.toLowerCase()===m?"mine":""},[el("td",{textContent:l.field}),el("td",{textContent:l.who}),el("td",{textContent:l.item}),el("td",{className:"a",textContent:won(l.amount)})]));
    const foot=boss?[el("div",{className:"pf"},[el("span",{textContent:"판매가 "+won(p.price)+" · 원가 "+won(cost)}),el("b",{className:(p.price-cost)>=p.price*0.13?"ok":"no",textContent:"몫 "+won(p.price-cost)+(p.price?" ("+((p.price-cost)/p.price*100).toFixed(1)+"%)":"")})])]:[];
    return el("div",{className:"pcard",style:p.active?"":"opacity:.55"},[el("h3",{textContent:p.name+(p.active?"":" (숨김)")}),el("p",{className:"pd",textContent:p.descr}),el("table",{},[el("tbody",{},rows)]),...foot])})));
}
function drawEditor(){
  const b=$("wkbody"),data=JSON.parse(JSON.stringify(pk.plans||[]));
  const wrap=el("div");
  const render=()=>{wrap.replaceChildren(...data.map((p,pi)=>{
    const inp=(o,k,ph,num)=>{const i=el("input",{value:o[k]??"",placeholder:ph,className:num?"num":""});if(num)i.type="number";i.oninput=()=>{o[k]=num?Math.round(Number(i.value)||0):i.value};return i};
    const rows=p.lines.map((l,li)=>{const x=el("button",{type:"button",className:"mbtn",textContent:"✕"});x.onclick=()=>{p.lines.splice(li,1);render()};
      return el("tr",{},[el("td",{style:"width:70px"},[inp(l,"field","분야")]),el("td",{style:"width:90px"},[inp(l,"who","담당")]),el("td",{},[inp(l,"assignee_email","담당 메일 (선택)")]),el("td",{},[inp(l,"item","항목")]),el("td",{style:"width:110px"},[inp(l,"amount","금액",1)]),el("td",{},[x])])});
    const add=el("button",{type:"button",className:"mbtn",textContent:"＋ 항목"});add.onclick=()=>{p.lines.push({field:"",who:"",assignee_email:"",item:"",amount:0});render()};
    const act=el("input",{type:"checkbox",checked:p.active!==false});act.onchange=()=>{p.active=act.checked};
    const del=el("button",{type:"button",className:"mbtn",textContent:"플랜 삭제"});del.onclick=()=>{if(confirm(p.name+" 플랜을 지울까요? (게시해야 반영돼요)")){data.splice(pi,1);render()}};
    return el("div",{className:"pcard ped",style:"margin-bottom:14px"},[el("div",{className:"row2",style:"display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px"},[inp(p,"code","코드 (예: LITE)"),inp(p,"name","이름"),inp(p,"price","판매가",1)]),
      el("div",{style:"margin:6px 0"},[inp(p,"descr","설명")]),el("table",{},[el("tbody",{},rows)]),el("div",{className:"wkbar",style:"margin:8px 0 0"},[add,el("label",{style:"display:flex;gap:6px;align-items:center;font-size:13px"},[act,"게시"]),el("span",{className:"sp"}),del])])}))};
  render();
  const addp=el("button",{type:"button",className:"mbtn",textContent:"＋ 플랜 추가"});addp.onclick=()=>{data.push({code:"",name:"",descr:"",price:0,active:true,lines:[]});render()};
  const note=el("input",{placeholder:"이번 변경 메모 (예: 우듭 단가 반영)",style:"flex:1 1 240px"}),save=el("button",{type:"button",className:"btn",textContent:"새 버전으로 게시"});
  save.onclick=async()=>{if(data.some(p=>!String(p.code).trim()||!String(p.name).trim()))return alert("플랜마다 코드와 이름을 넣어 주세요.");
    if(!confirm("이 단가표를 새 버전으로 게시할까요?\n이미 동의한 작업 배정서에는 영향이 없어요."))return;save.disabled=true;
    const {data:v,error}=await db.rpc("pkg_save",{p_plans:data,p_note:note.value});save.disabled=false;if(error)return alert("게시하지 못했어요: "+error.message);edit=false;toast("단가표 v"+v+" 게시 ✓");load()};
  b.replaceChildren(wrap,el("div",{className:"wkbar"},[addp,note,save]));
}
const toast=t=>{try{window.RIFAPP&&RIFAPP.toast(t)}catch(_){}};
function start(){if(started)return;started=true;
  const tb=document.querySelector('#tabs button[data-t="k"]');if(tb)tb.addEventListener("click",load);
  /* 로그인되면 받은 배정서 숫자(배지)를 먼저 채워요 */
  const t=setInterval(async()=>{if(!me())return;clearInterval(t);const {data}=await db.rpc("wo_list");if(data){orders=data;badge()}},1500)}
start();
return {load};
})();
