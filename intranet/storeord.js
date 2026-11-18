/* 인트라넷 › 업무 › 스토어 주문 (대표 · 경영지원부)
   - 주문이 어디서 들어왔는지(한국 · 일본 · 해외, 접속 IP 기준)와 결제 수단(계좌 · PayPal · 카드 PG …)을 한눈에 봐요.
   - 결제 기록은 store_payments 한 표에 쌓아서, 나중에 카드 PG가 들어와도 같은 화면에서 봐요.
   - 상태 바꾸기 · 입금 확인은 서버 함수(store_set_status · store_add_payment)로만 해요. */
window.RIFSTORE=(()=>{
const $=id=>document.getElementById(id);
let orders=[],pays={},open=null,started=false;
const won=n=>"₩"+Number(n||0).toLocaleString("ko-KR");
const ST={new:["접수 · 발송 준비","wt"],shipped:["발송함 · 입금 대기","wt"],paid:["결제 완료","on"],done:["완료","x"],cancel:["취소","x"]};
/* 결제 수단: 지금은 계좌 · PayPal, 카드 PG를 붙이면 card / easy(간편결제)로 같은 표에 들어와요 */
const PM={bank:"🏦 계좌 입금",paypal:"🅿 PayPal",card:"💳 카드",easy:"📱 간편결제",other:"기타"};
const REG=cc=>!cc?["❔","확인 불가","x"]:cc==="KR"?["🇰🇷","한국","kr"]:cc==="JP"?["🇯🇵","일본","jp"]:["🌐","해외 · "+cc,"ov"];
const regKey=cc=>!cc?"unknown":cc==="KR"?"kr":cc==="JP"?"jp":"ov";
const css=`.sod .sumr{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}.sod .sumr span{padding:6px 12px;border:1px solid var(--ln);border-radius:99px;font-size:13px;background:var(--bg)}.sod .sumr b{margin-left:4px}
.sod .rg{white-space:nowrap}.sod .pmb{display:inline-block;padding:2px 8px;border-radius:99px;font-size:12px;background:var(--hv);white-space:nowrap}.sod .pmb.no{color:var(--mut)}
.sod tr.r{cursor:pointer}.sod tr.d td{background:var(--hv);white-space:normal}.sod .sdg{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;padding:6px 2px}
.sod .sdg h4{margin:0 0 6px;font-size:13px;color:var(--mut)}.sod .sdg dl{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;margin:0;font-size:13px}.sod .sdg dt{color:var(--mut)}.sod .sdg dd{margin:0;overflow-wrap:anywhere}
.sod .pyl{margin:0;padding:0;list-style:none;font-size:13px}.sod .pyl li{padding:6px 0;border-bottom:1px dashed var(--ln)}.sod .pyf{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px}.sod .pyf input,.sod .pyf select{min-width:0;width:auto;flex:1 1 110px}
.sod select.ost{font-size:12px;padding:4px 6px}.sod td.en,.sod td.sm{white-space:nowrap}.sod .pyf input,.sod .pyf select{padding:6px 10px;font-size:13px}`;
function pane(){
  if(!$("sodcss"))document.head.append(el("style",{id:"sodcss",textContent:css}));
  const sel=(id,opts,title)=>el("select",{id,title},opts.map(([v,t])=>el("option",{value:v,textContent:t})));
  return el("div",{id:"pso",className:"sod",hidden:true},[
    el("div",{className:"mbar"},[el("b",{id:"soc"}),
      sel("sos",[["","전체 상태"],...Object.entries(ST).map(([k,[t]])=>[k,t])],"상태"),
      sel("sor",[["","전체 지역"],["kr","🇰🇷 한국"],["jp","🇯🇵 일본"],["ov","🌐 해외"],["unknown","❔ 확인 불가"]],"지역"),
      sel("sop",[["","전체 결제"],["none","미결제"],...Object.entries(PM)],"결제 수단"),
      el("input",{id:"soq",placeholder:"검색 (주문번호·이름·이메일·상품)"}),el("button",{className:"mbtn",type:"button",id:"sorf",textContent:"새로고침"}),
      el("span",{className:"mnote",textContent:"지역은 주문할 때 접속한 IP 기준이에요. 줄을 누르면 연락처 · 배송지 · 결제 기록이 열려요."})]),
    el("div",{className:"sumr",id:"sosum"}),
    el("div",{className:"mtw"},[el("table",{className:"mt"},[el("thead",{},[el("tr",{},["주문번호","주문일시","주문자","지역","상품","금액","결제","상태"].map(t=>el("th",{textContent:t})))]),el("tbody",{id:"sob"})])])])}
async function load(){
  if(!started){started=true;["sos","sor","sop"].forEach(i=>$(i).onchange=draw);$("soq").oninput=draw;$("sorf").onclick=load}
  $("soc").textContent="불러오는 중…";
  const [a,b]=await Promise.all([db.from("store_orders").select("id,no,name,email,phone,zip,addr,memo,items,subtotal,ship,total,status,country,lang,pay_method,pp_amount,paid_at,admin_memo,created_at").order("created_at",{ascending:false}).limit(500),
    db.from("store_payments").select("id,order_id,method,provider,status,amount,currency,krw_amount,ref,memo,created_by,created_at").order("created_at")]);
  if(a.error){$("soc").textContent="주문을 불러오지 못했어요 (권한: 대표 · 경영지원부)";return}
  orders=a.data||[];pays={};(b.data||[]).forEach(p=>(pays[p.order_id]=pays[p.order_id]||[]).push(p));draw()}
const itemsTx=o=>(o.items||[]).map(i=>i.name+(Object.keys(i.opts||{}).length?"("+Object.values(i.opts).join("/")+")":"")+" ×"+i.qty).join(", ");
const payOf=o=>{const P=(pays[o.id]||[]).filter(p=>p.status!=="failed");return P.length?P[P.length-1]:null};
function draw(){
  const fs=$("sos").value,fr=$("sor").value,fp=$("sop").value,q=$("soq").value.trim().toLowerCase(),tb=$("sob");
  const V=orders.filter(o=>(!fs||o.status===fs)&&(!fr||regKey(o.country)===fr)&&(!fp||(fp==="none"?!payOf(o):(payOf(o)||{}).method===fp))&&
    (!q||[o.no,o.name,o.email,itemsTx(o)].join(" ").toLowerCase().includes(q)));
  $("soc").textContent="주문 "+V.length+"건"+(V.length!==orders.length?" / 전체 "+orders.length+"건":"");
  /* 요약: 지역별 주문 수 · 결제 수단별 받은 금액(원화 환산) */
  const live=orders.filter(o=>o.status!=="cancel"),cnt=k=>live.filter(o=>regKey(o.country)===k).length;
  const byM={};orders.forEach(o=>(pays[o.id]||[]).filter(p=>p.status==="paid").forEach(p=>{byM[p.method]=(byM[p.method]||0)+(p.krw_amount||0)}));
  $("sosum").replaceChildren(...[["발송 준비",live.filter(o=>o.status==="new").length+"건"],["입금 대기",live.filter(o=>o.status==="shipped").length+"건"],
    ["🇰🇷 한국",cnt("kr")+"건"],["🇯🇵 일본",cnt("jp")+"건"],["🌐 해외",cnt("ov")+"건"],
    ...Object.entries(byM).map(([m,v])=>[(PM[m]||m)+" 받은 금액",won(v)])].map(([k,v])=>el("span",{},[document.createTextNode(k),el("b",{textContent:v})])));
  tb.replaceChildren();
  if(!V.length){tb.append(el("tr",{},[el("td",{colSpan:8,className:"note",textContent:orders.length?"조건에 맞는 주문이 없어요.":"아직 주문이 없어요."})]));return}
  V.forEach(o=>{const [fl,rn]=REG(o.country),p=payOf(o);
    const st=el("select",{className:"ost",title:"상태 바꾸기"},Object.entries(ST).map(([k,[t]])=>el("option",{value:k,textContent:t})));st.value=o.status;st.onclick=e=>e.stopPropagation();
    st.onchange=async()=>{const prev=o.status;const {error}=await db.rpc("store_set_status",{p_id:o.id,p_status:st.value});if(error){st.value=prev;return alert("바꾸지 못했어요: "+error.message)}o.status=st.value;draw()};
    const tr=el("tr",{className:"r"+(open===o.id?" on":"")},[el("td",{className:"en",textContent:o.no}),el("td",{className:"sm",textContent:new Date(o.created_at).toLocaleString("ko-KR",{dateStyle:"short",timeStyle:"short"})}),
      el("td",{textContent:o.name}),el("td",{className:"rg",textContent:fl+" "+rn}),el("td",{className:"wd",textContent:itemsTx(o),title:itemsTx(o)}),el("td",{textContent:won(o.total)}),
      el("td",{},[p?el("span",{className:"pmb",textContent:(PM[p.method]||p.method)+(p.currency!=="KRW"?" · "+p.currency+" "+Number(p.amount).toFixed(2):""),title:p.ref||""}):el("span",{className:"pmb no",textContent:"미결제"})]),el("td",{},[st])]);
    tr.onclick=()=>{open=open===o.id?null:o.id;draw()};tb.append(tr);
    if(open===o.id)tb.append(detail(o))})}
function detail(o){
  const dl=rows=>el("dl",{},rows.filter(r=>r[1]).flatMap(([k,v])=>[el("dt",{textContent:k}),el("dd",{textContent:v})]));
  const [fl,rn]=REG(o.country);
  const P=pays[o.id]||[];
  const list=el("ul",{className:"pyl"},P.length?P.map(p=>el("li",{textContent:[new Date(p.created_at).toLocaleString("ko-KR",{dateStyle:"short",timeStyle:"short"}),PM[p.method]||p.method,p.provider,(p.currency==="KRW"?won(p.amount):p.currency+" "+Number(p.amount).toFixed(2)+(p.krw_amount?" (≈"+won(p.krw_amount)+")":"")),p.status==="paid"?"":p.status,p.ref?"참조 "+p.ref:"",p.memo||"",p.created_by&&p.created_by!=="paypal"?"기록 "+p.created_by.split("@")[0]:""].filter(Boolean).join(" · ")})):[el("li",{className:"note",textContent:"아직 결제 기록이 없어요."})]);
  /* 계좌 입금 확인 (카드 PG가 붙으면 PG 결제는 서버가 자동으로 기록해요) */
  const m=el("select",{},[["bank","🏦 계좌 입금"],["card","💳 카드 (수기)"],["other","기타"]].map(([v,t])=>el("option",{value:v,textContent:t})));
  const amt=el("input",{type:"number",min:0,step:1,value:o.total,title:"받은 금액 (원)"}),ref=el("input",{placeholder:"입금자명 · 거래번호"}),memo=el("input",{placeholder:"메모 (선택)"});
  const ok=el("button",{type:"button",className:"mbtn p",textContent:"✓ 결제 확인 기록"});
  ok.onclick=async e=>{e.stopPropagation();const a=Math.round(Number(amt.value)||0);if(a<=0)return alert("받은 금액을 넣어 주세요.");
    if(!confirm(o.no+" 주문에 "+won(a)+" "+(PM[m.value]||m.value)+" 결제를 기록할까요?\n상태가 '결제 완료'로 바뀌어요."))return;ok.disabled=true;
    const {error}=await db.rpc("store_add_payment",{p_id:o.id,p_method:m.value,p_amount:a,p_currency:"KRW",p_ref:ref.value,p_memo:memo.value,p_provider:null});ok.disabled=false;
    if(error)return alert("기록하지 못했어요: "+error.message);try{window.RIFAPP&&RIFAPP.toast("결제를 기록했어요 ✓")}catch(_){}load()};
  const form=el("div",{className:"pyf"},[m,amt,ref,memo,ok]);[m,amt,ref,memo].forEach(x=>x.onclick=e=>e.stopPropagation());
  const box=el("div",{className:"sdg"},[
    el("div",{},[el("h4",{textContent:"주문자 · 배송"}),dl([["이름",o.name],["이메일",o.email],["전화",o.phone],["우편번호",o.zip],["주소",o.addr],["요청 사항",o.memo]])]),
    el("div",{},[el("h4",{textContent:"주문 정보"}),dl([["지역",fl+" "+rn+(o.country?" ("+o.country+")":"")],["화면 언어",{ko:"한국어",ja:"日本語",en:"English"}[o.lang]||""],["상품 금액",won(o.subtotal)],["배송비",o.ship?won(o.ship):"없음"],["합계",won(o.total)],["관리 메모",o.admin_memo]])]),
    el("div",{},[el("h4",{textContent:"결제 기록"}),list,...(["new","shipped"].includes(o.status)?[form]:[])])]);
  box.onclick=e=>e.stopPropagation();
  return el("tr",{className:"d"},[el("td",{colSpan:8},[box])])}
return {pane,load};
})();
