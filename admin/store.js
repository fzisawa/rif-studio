/* 어드민 › 스토어: 주문 관리 · 상품 등록/수정 · 스토어 설정 (대표님만, 서버 정책도 대표님만 허용) */
(()=>{const $=i=>document.getElementById(i);if(!$("p4"))return;
const won=n=>"₩"+Number(n||0).toLocaleString("ko-KR"),ST={new:["접수 · 발송 준비","wt"],shipped:["발송함 · 입금 대기","wt"],paid:["입금 확인","on"],done:["완료","x"],cancel:["취소","x"]};
const PS={draft:"숨김",sale:"판매 중",soldout:"품절"},BM={order:"사이트 주문",link:"외부 스토어",inquiry:"문의하기"};
let prods=[],orders=[],set={},edit=null,imgs=[],coups=[],fans=[];const OPEN=new Set();
const td=(t,c)=>el("td",{className:c||"",textContent:t==null?"":String(t),title:t==null?"":String(t)});
async function load(){
  const [a,b,c]=await Promise.all([db.from("store_products").select("*").order("sort").order("created_at",{ascending:false}),db.from("store_orders").select("*").order("created_at",{ascending:false}).limit(500),db.from("store_settings").select("*").eq("id",1).maybeSingle()]);
  prods=a.data||[];orders=b.data||[];set=(c&&c.data)||{};const cq=await db.from("store_coupons").select("*").order("created_at",{ascending:false});coups=cq.data||[];const fq=await db.rpc("fan_admin_list");fans=fq.data||[];drawP();drawO();fillS();drawC();drawF()}
/* 요약 */
function stat(){const n=orders.filter(o=>o.status==="new").length,p=orders.filter(o=>o.status==="shipped").length,sum=orders.filter(o=>o.status!=="cancel").reduce((a,o)=>a+o.total,0);
  $("sst").replaceChildren(...[[set.open?"주문 받는 중":"주문 꺼짐 (준비 중)",set.open?"on":"x"],["발송 준비 "+n+"건",n?"wt":"x"],["입금 대기 "+p+"건",p?"wt":"x"],["판매 중 상품 "+prods.filter(x=>x.status==="sale").length+"개","x"],["누적 주문 금액 "+won(sum),"x"]].map(([t,c])=>el("span",{className:"hs "+c,textContent:t})))}
/* 주문 */
function drawO(){const f=$("sof").value,tb=$("sotb");tb.replaceChildren();stat();
  const v=orders.filter(o=>!f||o.status===f);
  v.forEach(o=>{const sel=el("select",{className:"ost"},Object.entries(ST).map(([k,[t]])=>el("option",{value:k,textContent:t})));sel.value=o.status;sel.onclick=e=>e.stopPropagation();
    sel.onchange=async()=>{const {error}=await db.from("store_orders").update({status:sel.value,updated_at:new Date().toISOString()}).eq("id",o.id);if(error){sel.value=o.status;return alert("바꾸지 못했어요: "+error.message)}o.status=sel.value;stat()};
    const it=(o.items||[]).map(i=>i.name+(Object.keys(i.opts||{}).length?"("+Object.values(i.opts).join("/")+")":"")+" ×"+i.qty).join(", ");
    const tr=el("tr",{className:"r"},[td(o.no,"en"),td(o.name),td(it,"hm wd"),el("td",{},[document.createTextNode(won(o.total)),...(o.pay_method==="paypal"?[el("small",{className:"pp",textContent:" · PayPal US$"+o.pp_amount,title:"PayPal 결제 ID "+(o.pp_capture||"")})]:[])]),el("td",{className:"ac"},[sel]),td(new Date(o.created_at).toLocaleString("ko-KR",{dateStyle:"short",timeStyle:"short"}),"hm sm")]);
    const memo=el("textarea",{rows:2,maxLength:1000,value:o.admin_memo||"",placeholder:"관리 메모 (손님에게 안 보여요) · 송장번호 등"}),ms=el("button",{type:"button",className:"btn small",textContent:"메모 저장"});
    ms.onclick=async()=>{const {error}=await db.from("store_orders").update({admin_memo:memo.value}).eq("id",o.id);if(error)return alert(error.message);o.admin_memo=memo.value;ms.textContent="저장했어요 ✓";setTimeout(()=>ms.textContent="메모 저장",1500)};
    const kv=(k,v)=>el("div",{},[el("b",{textContent:k}),el("span",{textContent:v||"-"})]);
    const d=el("tr",{className:"d",hidden:!OPEN.has(o.id)},[el("td",{colSpan:6},[el("div",{className:"dg"},[kv("이메일",o.email),kv("전화",o.phone),kv("우편번호",o.zip),kv("주소",o.addr),kv("요청 사항",o.memo),kv("상품 금액",won(o.subtotal)),...(o.discount?[kv("쿠폰 "+(o.coupon||""),"− "+won(o.discount))]:[]),...(o.points_used?[kv("적립금 사용","− "+won(o.points_used))]:[]),...(o.points_earned?[kv("적립 예정/완료","+ "+won(o.points_earned))]:[]),...(o.user_id?[kv("회원",(fans.find(f=>f.user_id===o.user_id)||{}).nick||"회원")]:[]),kv("배송비",won(o.ship)),kv("결제 금액",won(o.total))]),
      el("ul",{className:"oit"},(o.items||[]).map(i=>el("li",{textContent:i.name+(Object.keys(i.opts||{}).length?" · "+Object.entries(i.opts).map(([k,v])=>k+": "+v).join(", "):"")+" × "+i.qty+" = "+won(i.unit*i.qty)}))),el("div",{className:"dact"},[memo,ms])])]);
    tr.onclick=()=>{d.hidden=!d.hidden;d.hidden?OPEN.delete(o.id):OPEN.add(o.id)};tb.append(tr,d)});
  if(!v.length)tb.append(el("tr",{},[el("td",{colSpan:6,textContent:orders.length?"이 상태의 주문이 없어요.":"아직 주문이 없어요."})]))}
$("sof").onchange=drawO;
$("socsv").onclick=()=>{if(!orders.length)return alert("내보낼 주문이 없어요.");const H=["주문번호","주문일","상태","이름","이메일","전화","우편번호","주소","상품","상품 금액","쿠폰","쿠폰 할인","적립금 사용","배송비","결제 금액","요청 사항","관리 메모"];
  const cell=v=>{let s=String(v==null?"":v);if(/^[=+\-@\t\r]/.test(s))s="'"+s;return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
  const L=orders.map(o=>[o.no,new Date(o.created_at).toLocaleString("ko-KR"),ST[o.status][0],o.name,o.email,o.phone,o.zip,o.addr,(o.items||[]).map(i=>i.name+(Object.keys(i.opts||{}).length?"("+Object.values(i.opts).join("/")+")":"")+"×"+i.qty).join(" / "),o.subtotal,o.coupon||"",o.discount||0,o.points_used||0,o.ship,o.total,o.memo,o.admin_memo]);
  const a=el("a",{href:URL.createObjectURL(new Blob(["﻿"+[H,...L].map(l=>l.map(cell).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"})),download:"RIF_스토어_주문.csv"});document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)};
/* 상품 목록 */
function drawP(){const tb=$("sptb");tb.replaceChildren();
  prods.forEach(p=>{const img=(p.images||[])[0],b=el("button",{type:"button",className:"btn small",textContent:"수정"});b.onclick=e=>{e.stopPropagation();openP(p)};
    const ss=saleState(p),pr=ss.has?(ss.on?won(p.sale_price)+" (정가 "+won(p.price)+")":won(p.price)+" · "+ss.txt+" "+won(p.sale_price))+(ss.on&&ss.txt?" · "+ss.txt:"")+(p.sale_members?" · 회원 전용":""):won(p.price);
    const tr=el("tr",{className:"r"},[el("td",{},[img?el("img",{className:"pth",src:img,alt:""}):el("span",{className:"pth"})]),td(p.name),td(({plan:"플랜",mix:"믹싱",illust:"일러스트",video:"영상",goods:"굿즈"})[p.kind]||p.kind,"hm"),td(pr),td(p.stock==null?"무제한":p.stock+"개","hm"),
      el("td",{},[el("span",{className:"hs "+(p.status==="sale"?"on":p.status==="soldout"?"wt":"x"),textContent:PS[p.status]})]),td(BM[p.buy_mode],"hm"),el("td",{className:"ac"},[b])]);
    tr.onclick=()=>openP(p);tb.append(tr)});
  if(!prods.length)tb.append(el("tr",{},[el("td",{colSpan:8,textContent:"아직 상품이 없어요. '＋ 상품 추가'로 첫 상품을 올려 보세요."})]))}
/* 상품 편집 */
/* 옵션 — 우리 작업(믹싱 · 일러스트 · 영상)에 맞춘 카드형 편집.
   옵션마다 고를 값을 한 줄씩, 값마다 '추가 금액'을 붙일 수 있어요(예: 전신 +30,000원). 금액은 주문 때 서버에서 다시 계산해요.
   자주 쓰는 옵션은 버튼 한 번으로 넣고, 일본어 · 영어 표기도 함께 들어가요. 직접 만든 옵션은 저장할 때 자동 번역돼요. */
const D={/* 한국어 → [일본어, 영어] */
 "트랙(스템) 수":["トラック(ステム)数","Tracks (stems)"],"~8트랙":["〜8トラック","Up to 8"],"~16트랙":["〜16トラック","Up to 16"],"~32트랙":["〜32トラック","Up to 32"],"33트랙 이상":["33トラック以上","33+"],
 "작업 범위":["作業範囲","Scope"],"믹싱":["ミキシング","Mixing"],"마스터링":["マスタリング","Mastering"],"믹싱 + 마스터링":["ミキシング＋マスタリング","Mixing + mastering"],"보컬 튠":["ボーカル補正","Vocal tuning"],
 "곡 길이":["曲の長さ","Song length"],"~3분":["〜3分","Up to 3 min"],"~5분":["〜5分","Up to 5 min"],"5분 이상":["5分以上","Over 5 min"],
 "납품 파일":["納品ファイル","Delivery files"],"WAV":["WAV","WAV"],"WAV + MP3":["WAV＋MP3","WAV + MP3"],"WAV + 스템":["WAV＋ステム","WAV + stems"],
 "구도":["構図","Framing"],"바스트업":["バストアップ","Bust-up"],"반신":["半身","Half body"],"전신":["全身","Full body"],
 "배경":["背景","Background"],"없음":["なし","None"],"단색 · 간단 배경":["単色・簡易背景","Simple"],"풀 배경":["フル背景","Full background"],
 "인원":["人数","Characters"],"1인":["1人","1 character"],"2인":["2人","2 characters"],"3인 이상":["3人以上","3 or more"],
 "사용 범위":["使用範囲","Usage"],"개인 소장":["個人利用","Personal"],"방송 · 스트리밍":["配信・ストリーミング","Streaming"],"상업용":["商用","Commercial"],
 "파일 형식":["ファイル形式","File format"],"PNG":["PNG","PNG"],"PNG + PSD (레이어)":["PNG＋PSD（レイヤー）","PNG + PSD (layers)"],
 "영상 길이":["動画の長さ","Video length"],"~1분":["〜1分","Up to 1 min"],"~4분":["〜4分","Up to 4 min"],"4분 이상":["4分以上","Over 4 min"],
 "영상 종류":["動画の種類","Video type"],"리릭 비디오":["リリックビデオ","Lyric video"],"MV (일러스트 · 모션)":["MV（イラスト・モーション）","MV (illustration · motion)"],"쇼츠 · 숏폼":["ショート動画","Shorts"],
 "해상도":["解像度","Resolution"],"FHD (1080p)":["FHD（1080p）","FHD (1080p)"],"4K":["4K","4K"],
 "자막":["字幕","Subtitles"],"한국어":["韓国語","Korean"],"한국어 + 일본어 · 영어":["韓国語＋日本語・英語","Korean + Japanese · English"],
 "수정 횟수":["修正回数","Revisions"],"1회":["1回","1"],"2회":["2回","2"],"3회":["3回","3"],
 "작업 기간":["納期","Turnaround"],"일반 (2주)":["通常（2週間）","Standard (2 weeks)"],"빠르게 (1주)":["お急ぎ（1週間）","Rush (1 week)"],
 "사이즈":["サイズ","Size"],"S":["S","S"],"M":["M","M"],"L":["L","L"],"XL":["XL","XL"],"색상":["カラー","Color"],"블랙":["ブラック","Black"],"화이트":["ホワイト","White"]};
const PRE={"믹싱 · 마스터링":[["작업 범위",["믹싱","마스터링","믹싱 + 마스터링"]],["트랙(스템) 수",["~8트랙","~16트랙","~32트랙","33트랙 이상"]],["곡 길이",["~3분","~5분","5분 이상"]],["보컬 튠",["없음","보컬 튠"]],["납품 파일",["WAV","WAV + MP3","WAV + 스템"]],["수정 횟수",["1회","2회","3회"]],["작업 기간",["일반 (2주)","빠르게 (1주)"]]],
 "일러스트":[["구도",["바스트업","반신","전신"]],["배경",["없음","단색 · 간단 배경","풀 배경"]],["인원",["1인","2인","3인 이상"]],["사용 범위",["개인 소장","방송 · 스트리밍","상업용"]],["파일 형식",["PNG","PNG + PSD (레이어)"]],["수정 횟수",["1회","2회","3회"]],["작업 기간",["일반 (2주)","빠르게 (1주)"]]],
 "영상":[["영상 종류",["리릭 비디오","MV (일러스트 · 모션)","쇼츠 · 숏폼"]],["영상 길이",["~1분","~4분","4분 이상"]],["해상도",["FHD (1080p)","4K"]],["자막",["없음","한국어","한국어 + 일본어 · 영어"]],["수정 횟수",["1회","2회","3회"]],["작업 기간",["일반 (2주)","빠르게 (1주)"]]],
 "굿즈":[["사이즈",["S","M","L","XL"]],["색상",["블랙","화이트"]]]};
const n2=s=>Math.max(0,Math.round(Number(String(s).replace(/[^\d]/g,""))||0));
const krw=n=>Number(n||0).toLocaleString("ko-KR");
function valRow(v,add){const vi=el("input",{maxLength:60,value:v||"",placeholder:"예) 전신",ariaLabel:"고를 값"}),
  ai=el("input",{inputMode:"numeric",maxLength:9,value:add?krw(add):"",placeholder:"0",ariaLabel:"추가 금액 (원)"}),x=el("button",{type:"button",className:"px",textContent:"×",ariaLabel:"이 값 빼기"});
  ai.oninput=()=>{const n=n2(ai.value);ai.value=ai.value.trim()?krw(n):""};
  const r=el("div",{className:"pvrow"},[vi,el("label",{className:"padd"},[el("span",{textContent:"+"}),ai,el("span",{textContent:"원"})]),x]);
  x.onclick=()=>{const box=r.parentNode;r.remove();if(box&&!box.children.length)box.append(valRow())};return r}
function optCard(o){o=o||{name:"",values:[""]};const ni=el("input",{maxLength:30,value:o.name||"",placeholder:"옵션 이름 · 예) 구도",ariaLabel:"옵션 이름"});
  const vals=el("div",{className:"pvals"},(o.values.length?o.values:[""]).map(v=>valRow(v,(o.add||{})[v])));
  const up=el("button",{type:"button",className:"px",textContent:"↑",ariaLabel:"위로"}),dn=el("button",{type:"button",className:"px",textContent:"↓",ariaLabel:"아래로"}),rm=el("button",{type:"button",className:"px",textContent:"×",ariaLabel:"이 옵션 빼기"});
  const av=el("button",{type:"button",className:"btn small ghost",textContent:"＋ 값 추가"});
  const c=el("div",{className:"pcard"},[el("div",{className:"pchd"},[ni,up,dn,rm]),el("div",{className:"pvhd"},[el("span",{textContent:"고를 값"}),el("span",{textContent:"추가 금액"})]),vals,av]);
  c._tr={ja:o.ja,en:o.en,ko:{name:o.name,values:[...o.values]}};
  av.onclick=()=>{const r=valRow();vals.append(r);r.querySelector("input").focus()};
  up.onclick=()=>{const p=c.previousElementSibling;if(p)c.parentNode.insertBefore(c,p)};dn.onclick=()=>{const n=c.nextElementSibling;if(n)c.parentNode.insertBefore(n,c)};
  rm.onclick=()=>{c.remove();drawPre()};ni.oninput=drawPre;return c}
const cards=()=>[...$("popw").children];
/* 화면 → 저장할 모양. 비어 있는 줄은 버리고, 틀린 곳은 알려 줘요 */
function readOpts(strict){const out=[],seen=new Set();
  for(const c of cards()){const name=c.querySelector(".pchd input").value.trim(),rows=[...c.querySelectorAll(".pvrow")].map(r=>{const [v,a]=r.querySelectorAll("input");return [v.value.trim(),n2(a.value)]}).filter(([v])=>v);
    if(!name&&!rows.length)continue;
    if(strict){if(!name)throw new Error("옵션 이름이 비어 있어요 (고를 값: "+rows.map(r=>r[0]).join(", ")+")");if(!rows.length)throw new Error("'"+name+"' 옵션에 고를 값을 하나 이상 적어 주세요");
      if(seen.has(name))throw new Error("'"+name+"' 옵션이 두 번 있어요");if(new Set(rows.map(r=>r[0])).size<rows.length)throw new Error("'"+name+"' 옵션에 같은 값이 두 번 있어요")}
    seen.add(name);const add={};rows.forEach(([v,a])=>{if(a)add[v]=a});
    out.push({name,values:rows.map(r=>r[0]),...(Object.keys(add).length?{add}:{}),_c:c})}
  return out}
/* 일본어 · 영어 표기: 자주 쓰는 말은 사전에서, 전에 저장한 번역은 그대로, 나머지만 번역기로 */
async function optI18n(list){const need=new Set();
  const old=(c,k,i,lang)=>{const t=c._tr;if(!t||!t[lang])return null;if(i<0)return t.ko.name===k?t[lang].name:null;const j=t.ko.values.indexOf(k);return j>=0&&t[lang].values?t[lang].values[j]:null};
  list.forEach(o=>[o.name,...o.values].forEach((k,i)=>{if(!D[k]&&!old(o._c,k,i-1,"ja"))need.add(k)}));
  let M={};if(need.size){const ks=[...need];try{const {data,error}=await db.functions.invoke("news-translate",{body:{title:"",body:ks.join("\n")}});if(error||!data||data.error)throw 0;
      const ja=data.ja.body.split("\n"),en=data.en.body.split("\n");if(ja.length===ks.length&&en.length===ks.length)ks.forEach((k,i)=>M[k]=[ja[i].trim()||k,en[i].trim()||k])}catch(_){}}
  const tr=(o,k,i,l)=>(D[k]&&D[k][l==="ja"?0:1])||old(o._c,k,i,l)||(M[k]&&M[k][l==="ja"?0:1])||k;
  return list.map(o=>{const r={name:o.name,values:o.values,...(o.add?{add:o.add}:{})};
    ["ja","en"].forEach(l=>{r[l]={name:tr(o,o.name,-1,l),values:o.values.map((v,i)=>tr(o,v,i,l))}});return r})}
/* 자주 쓰는 옵션 버튼 */
let preTab="믹싱 · 마스터링";try{preTab=localStorage.getItem("rif-opt-pre")||preTab}catch(_){}if(!PRE[preTab])preTab="믹싱 · 마스터링";
function drawPre(){const have=new Set(cards().map(c=>c.querySelector(".pchd input").value.trim()));
  const tabs=el("div",{className:"pptabs",role:"tablist"},Object.keys(PRE).map(k=>{const b=el("button",{type:"button",className:"ppt",textContent:k,ariaPressed:String(k===preTab)});
    b.onclick=()=>{preTab=k;try{localStorage.setItem("rif-opt-pre",k)}catch(_){}drawPre()};return b}));
  const chips=el("div",{className:"ppchips"},PRE[preTab].map(([n,vs])=>{const on=have.has(n),b=el("button",{type:"button",className:"ppc",disabled:on,textContent:(on?"✓ ":"＋ ")+n,title:vs.join(" / ")});
    b.onclick=()=>{$("popw").append(optCard({name:n,values:vs,ja:{name:D[n][0],values:vs.map(v=>D[v][0])},en:{name:D[n][1],values:vs.map(v=>D[v][1])}}));drawPre()};return b}));
  $("ppre").replaceChildren(tabs,chips,el("p",{className:"note",textContent:"누르면 아래에 옵션 카드가 생겨요. 값 이름과 추가 금액은 마음대로 고칠 수 있어요."}))}
const drawOpts=o=>{$("popw").replaceChildren(...(o||[]).map(optCard));drawPre()};
$("popadd").onclick=()=>{const c=optCard();$("popw").append(c);c.querySelector("input").focus();drawPre()};
/* 상세 설명 도우미 */
const ins=(ta,txt)=>{const a=ta.selectionStart,b=ta.selectionEnd;ta.setRangeText(txt,a,b,"end");ta.focus()};
$("pdtpl").onclick=()=>{const ta=$("pd"),tpl="■ 구성\n• \n\n■ 크기 · 소재\n• \n\n■ 안내\n• ";if(ta.value.trim()&&!confirm("지금 적힌 설명 끝에 기본 틀을 붙일까요?"))return;
  ta.value=ta.value.trim()?ta.value.replace(/\s+$/,"")+"\n\n"+tpl:tpl;ta.focus();const i=ta.value.indexOf("• ",ta.value.length-tpl.length)+2;ta.setSelectionRange(i,i)};
$("pdbul").onclick=()=>{const ta=$("pd"),a=ta.selectionStart,b=ta.selectionEnd,st=ta.value.lastIndexOf("\n",a-1)+1;
  if(a===b){ins(ta,(a===st?"":"\n")+"• ");return}
  const en=b,seg=ta.value.slice(st,en).split("\n").map(l=>l.startsWith("• ")||!l.trim()?l:"• "+l).join("\n");ta.setRangeText(seg,st,en,"select");ta.focus()};
/* 일본어 · 영어 자동 번역 (News 와 같은 번역기) */
const koNow=()=>[$("pn").value,$("psu").value,$("pd").value].join("\n");let trFrom="";
async function trP(){const nm=$("pn").value.trim();if(!nm)throw new Error("상품 이름을 먼저 적어 주세요");$("ptrgo").disabled=true;$("ptrm").textContent="번역하는 중…";
  try{const call=async body=>{const {data,error}=await db.functions.invoke("news-translate",{body});let m=data&&data.error;if(error&&!m){try{m=(await error.context.json()).error}catch(_){m="번역하지 못했어요"}}if(m)throw new Error(m);return data};
    const a=await call({title:nm,body:$("psu").value.trim()}),d=$("pd").value.trim()?await call({title:"",body:$("pd").value.trim()}):null;
    $("pnj").value=a.ja.title;$("pne").value=a.en.title;const hs=!!$("psu").value.trim();$("psuj").value=hs?a.ja.body||"":"";$("psue").value=hs?a.en.body||"":"";$("pdj").value=d?d.ja.body:"";$("pde").value=d?d.en.body:"";
    trFrom=koNow();$("ptr").open=true;$("ptrm").textContent="번역했어요. 확인하고 고칠 수 있어요."}
  finally{$("ptrgo").disabled=false}}
$("ptrgo").onclick=()=>trP().catch(e=>{$("ptrm").textContent=e.message||String(e)});
/* 쓰다가 닫힐 때 내용 지키기 */
const FIDS=["pk","pst","pn","pnj","pne","pp","psp","psf","pse","psl","pslc","psm","pstk","pmq","psu","psuj","psue","pd","pdj","pde","pbm","pbu","pso"];
const snap=()=>JSON.stringify([...FIDS.map(i=>$(i).type==="checkbox"?$(i).checked:$(i).value),readOpts(false).map(({_c,...o})=>o),imgs]);let snap0="";
const dirty=()=>!$("pmod").hidden&&snap()!==snap0;
window.addEventListener("beforeunload",e=>{if(dirty()){e.preventDefault();e.returnValue=""}});
function drawImgs(){$("pim").replaceChildren(...imgs.map((u,i)=>{const mv=(d)=>{const j=i+d;if(j<0||j>=imgs.length)return;[imgs[i],imgs[j]]=[imgs[j],imgs[i]];drawImgs()};
  const l=el("button",{type:"button",textContent:"←",disabled:i===0}),r=el("button",{type:"button",textContent:"→",disabled:i===imgs.length-1}),x=el("button",{type:"button",textContent:"×"});
  l.onclick=()=>mv(-1);r.onclick=()=>mv(1);x.onclick=()=>{imgs.splice(i,1);drawImgs()};
  return el("div",{className:"pimg"},[el("img",{src:u,alt:""}),el("div",{},[l,r,x])])}))}
/* 세일: 문구 프리셋(한·일·영), 기간, 할인율 계산 */
const SL={launch:{ko:"런칭 특가",ja:"ローンチ特価",en:"Launch sale"},time:{ko:"기간 한정 세일",ja:"期間限定セール",en:"Limited-time sale"},open:{ko:"오픈 기념",ja:"オープン記念",en:"Grand opening sale"},season:{ko:"시즌 세일",ja:"シーズンセール",en:"Seasonal sale"},bf:{ko:"블랙프라이데이",ja:"ブラックフライデー",en:"Black Friday"},year:{ko:"연말 세일",ja:"年末セール",en:"Year-end sale"}};
const toLocal=iso=>{if(!iso)return"";const d=new Date(iso);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16)},fromLocal=v=>v?new Date(v).toISOString():null;
const dShort=iso=>new Date(iso).toLocaleString("ko-KR",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"});
function saleState(p){const has=p.sale_price!=null&&p.sale_price<p.price,now=Date.now(),f=p.sale_from&&Date.parse(p.sale_from),u=p.sale_until&&Date.parse(p.sale_until);
  if(!has)return {has:false,on:false,txt:""};if(f&&now<f)return {has,on:false,txt:"세일 예정 ("+dShort(p.sale_from)+"부터)"};if(u&&now>=u)return {has,on:false,txt:"세일 끝남"};
  return {has,on:true,txt:u?dShort(p.sale_until)+"까지":""}}
const saleLabel=()=>{const k=$("psl").value;if(!k)return null;if(k==="custom"){const c=$("pslc").value.trim();return c?{ko:c,ja:c,en:c}:null}return SL[k]};
function salePrev(){const p=Math.round(Number($("pp").value)||0),s=$("psp").value===""?null:Math.round(Number($("psp").value));$("pslw").hidden=$("psl").value!=="custom";
  if(s==null||!p){$("psv").textContent=p?"세일 없음 · 손님에게 "+won(p)+"으로 보여요.":"";return}
  if(s>=p){$("psv").textContent="할인가가 정가보다 낮아야 해요.";return}
  const st=saleState({price:p,sale_price:s,sale_from:fromLocal($("psf").value),sale_until:fromLocal($("pse").value)});
  $("psv").textContent="할인가 "+won(s)+" ("+Math.round((1-s/p)*100)+"% · "+won(p-s)+" 할인) · "+(st.on?"지금 세일 중"+(st.txt?" · "+st.txt:""):st.txt+" · 지금은 정가 "+won(p)+"으로 보여요")}
const setRate=r=>{const p=Math.round(Number($("pp").value)||0);if(!p)return alert("정가를 먼저 적어 주세요.");$("psp").value=Math.round(p*(1-r/100)/100)*100;salePrev()};
$("psq").querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>setRate(Number(b.dataset.r)));
$("psr").oninput=()=>{const r=Number($("psr").value);if(r>0&&r<100){$("psa").value="";setRate(r)}};
$("psa").oninput=()=>{const p=Math.round(Number($("pp").value)||0),a=Math.round(Number($("psa").value)||0);if(p&&a>0&&a<p){$("psr").value="";$("psp").value=p-a;salePrev()}};
$("psx").onclick=()=>{["psp","psf","pse","psr","psa","pslc"].forEach(i=>$(i).value="");$("psl").value="";$("psm").checked=false;salePrev()};
["pp","psp","psf","pse","psl","pslc"].forEach(i=>$(i).addEventListener("input",salePrev));
function openP(p){edit=p||null;$("pmt").textContent=p?"상품 수정":"새 상품";const g=(i,v)=>$(i).value=v==null?"":v;
  g("pk",p?p.kind:"goods");g("pst",p?p.status:"draft");g("pn",p&&p.name);g("pnj",p&&p.name_ja);g("pne",p&&p.name_en);g("pp",p?p.price:"");g("psp",p&&p.sale_price);g("pstk",p&&p.stock);g("pmq",p?p.max_qty:10);
  g("psu",p&&p.summary);g("psuj",p&&p.summary_ja);g("psue",p&&p.summary_en);$("psm").checked=!!(p&&p.sale_members);g("psf",toLocal(p&&p.sale_from));g("pse",toLocal(p&&p.sale_until));g("psr","");g("psa","");{const lb=p&&p.sale_label&&p.sale_label.ko,k=lb?Object.keys(SL).find(k=>SL[k].ko===lb):"";g("psl",lb?(k||"custom"):"");g("pslc",lb&&!k?lb:"")}salePrev();drawOpts(p?p.options:[]);g("pd",p&&p.detail);g("pdj",p&&p.detail_ja);g("pde",p&&p.detail_en);g("pbm",p?p.buy_mode:"order");g("pbu",p&&p.buy_url);g("pso",p?p.sort:0);
  imgs=p?[...(p.images||[])]:[];drawImgs();$("pdel").hidden=!p;$("pmsg").textContent="";bmw();$("pmod").hidden=false;$("ptr").open=!!(p&&(p.name_ja||p.name_en));trFrom=p&&(p.name_ja||p.name_en)?koNow():"";$("ptrm").textContent="한국어를 다 쓴 뒤 눌러도 되고, 그냥 저장해도 자동으로 채워져요.";snap0=snap();$("pn").focus()}
const bmw=()=>{$("pbuw").hidden=$("pbm").value!=="link"};$("pbm").onchange=bmw;
/* 바깥(어두운 곳)을 눌러도 닫히지 않아요. × · 취소 · Esc 로만 닫고, 쓰던 내용이 있으면 한 번 물어봐요 */
const shutP=()=>{$("pmod").hidden=true;edit=null};
const closeP=()=>{if(dirty()&&!confirm("쓰던 내용이 저장되지 않았어요. 닫을까요?"))return;shutP()};$("pmx").onclick=closeP;$("pcancel").onclick=closeP;
$("spnew").onclick=()=>openP(null);
/* 사진: 긴 변 1600px JPEG 로 줄여서 올려요 (저장 공간 절약) */
const shrink=f=>new Promise((res,rej)=>{const u=URL.createObjectURL(f),im=new Image();im.onload=()=>{const k=Math.min(1,1600/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);
  const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(b=>b?res(b):rej(new Error("변환 실패")),"image/jpeg",.86)};im.onerror=()=>rej(new Error("이미지를 읽지 못했어요"));im.src=u});
$("pfile").onchange=async e=>{const fs=[...e.target.files];e.target.value="";if(!fs.length)return;$("pmsg").textContent="사진 올리는 중… ("+fs.length+"장)";
  for(const f of fs){if(f.size>20*1024*1024){alert(f.name+" 은(는) 20MB 가 넘어서 건너뛰었어요.");continue}
    try{const b=await shrink(f),path="store/"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+".jpg";
      const {error}=await db.storage.from("portfolio").upload(path,b,{contentType:"image/jpeg"});if(error)throw error;imgs.push(db.storage.from("portfolio").getPublicUrl(path).data.publicUrl);drawImgs()}
    catch(er){alert("사진을 올리지 못했어요: "+(er.message||er))}}
  $("pmsg").textContent=""};
$("pform").onsubmit=async e=>{e.preventDefault();const v=i=>$(i).value.trim(),num=i=>v(i)===""?null:Math.round(Number(v(i)));let options;
  try{options=readOpts(true)}catch(er){$("pmsg").textContent=er.message;return}
  const noTr=!["pnj","pne","psuj","psue","pdj","pde"].some(i=>$(i).value.trim());
  if(noTr||(trFrom&&trFrom!==koNow()&&confirm("한국어 내용이 바뀌었어요. 일본어 · 영어 번역도 새로 할까요?\n(취소를 누르면 지금 번역 그대로 저장해요)"))){$("psave").disabled=true;$("pmsg").textContent="일본어 · 영어로 번역하는 중…";
    try{await trP()}catch(er){if(!confirm((er.message||er)+"\n\n번역 없이 한국어로만 저장할까요? (일본어 · 영어 화면에는 한국어가 보여요)")){$("psave").disabled=false;$("pmsg").textContent="";return}}
    $("psave").disabled=false;$("pmsg").textContent=""}
  if(options.length){$("psave").disabled=true;$("pmsg").textContent="옵션 일본어 · 영어 표기 준비 중…";options=await optI18n(options);$("psave").disabled=false;$("pmsg").textContent=""}
  const row={kind:v("pk"),status:v("pst"),name:v("pn"),name_ja:v("pnj")||null,name_en:v("pne")||null,price:num("pp")||0,sale_price:num("psp"),sale_from:fromLocal($("psf").value),sale_until:fromLocal($("pse").value),sale_label:saleLabel(),sale_members:$("psm").checked,stock:num("pstk"),max_qty:num("pmq")||10,
    summary:v("psu")||null,summary_ja:v("psuj")||null,summary_en:v("psue")||null,options,detail:$("pd").value.trim()||null,detail_ja:$("pdj").value.trim()||null,detail_en:$("pde").value.trim()||null,images:imgs,buy_mode:v("pbm"),buy_url:v("pbu")||null,sort:num("pso")||0,updated_at:new Date().toISOString()};
  if(row.sale_price!=null&&row.sale_price>=row.price){$("pmsg").textContent="할인가는 정가보다 낮아야 해요 (할인이 없으면 비워 두세요).";return}
  if(row.sale_from&&row.sale_until&&row.sale_until<=row.sale_from){$("pmsg").textContent="세일 종료가 시작보다 뒤여야 해요.";return}
  if(row.sale_price==null){row.sale_from=row.sale_until=row.sale_label=null;row.sale_members=false}
  if(row.buy_mode==="link"&&!/^https:\/\//.test(row.buy_url||"")){$("pmsg").textContent="외부 스토어 주소를 https:// 로 시작하게 적어 주세요.";return}
  if(row.status==="sale"&&!imgs.length&&!confirm("사진 없이 판매를 시작할까요?"))return;
  $("psave").disabled=true;const {error}=edit?await db.from("store_products").update(row).eq("id",edit.id):await db.from("store_products").insert(row);$("psave").disabled=false;
  if(error){$("pmsg").textContent="저장하지 못했어요: "+error.message;return}shutP();load()};
$("pdel").onclick=async()=>{if(!edit)return;if(!confirm("'"+edit.name+"' 상품을 삭제할까요? 되돌릴 수 없어요.\n(이미 들어온 주문 기록은 그대로 남아요. 잠깐 내리려면 '숨김'을 쓰세요)"))return;
  const {error}=await db.from("store_products").delete().eq("id",edit.id);if(error)return alert("삭제하지 못했어요: "+error.message);shutP();load()};
/* 쿠폰 */
function drawC(){const tb=$("cptb");tb.replaceChildren();const now=Date.now();
  coups.forEach(c=>{const pn=c.product_id?((prods.find(p=>p.id===c.product_id)||{}).name||"삭제된 상품"):"전체 상품";
    const st=!c.active?["꺼짐","x"]:c.starts_at&&now<Date.parse(c.starts_at)?["예정","wt"]:c.ends_at&&now>=Date.parse(c.ends_at)?["기간 끝","x"]:c.max_uses!=null&&c.used>=c.max_uses?["소진","x"]:["사용 가능","on"];
    const tg=el("button",{type:"button",className:"btn small ghost",textContent:c.active?"끄기":"켜기"}),dl=el("button",{type:"button",className:"btn small danger",textContent:"삭제"}),cp=el("button",{type:"button",className:"btn small ghost",textContent:"복사"});
    tg.onclick=async()=>{const {error}=await db.from("store_coupons").update({active:!c.active}).eq("code",c.code);if(error)return alert(error.message);c.active=!c.active;drawC()};
    dl.onclick=async()=>{if(!confirm("쿠폰 "+c.code+" 을(를) 삭제할까요?\n(이미 이 쿠폰을 쓴 주문의 할인은 그대로예요)"))return;const {error}=await db.from("store_coupons").delete().eq("code",c.code);if(error)return alert(error.message);coups=coups.filter(x=>x!==c);drawC()};
    cp.onclick=()=>navigator.clipboard.writeText(c.code).then(()=>{cp.textContent="복사됨 ✓";setTimeout(()=>cp.textContent="복사",1200)});
    tb.append(el("tr",{},[td(c.code,"en"),td(c.kind==="pct"?c.value+"%":won(c.value)),td(pn+(c.members_only?" · 회원 전용":"")+(c.min_total?" · "+won(c.min_total)+" 이상":"")+(c.memo?" · "+c.memo:""),"hm wd"),td((c.starts_at?dShort(c.starts_at):"바로")+" ~ "+(c.ends_at?dShort(c.ends_at):"계속"),"hm sm"),td(c.used+(c.max_uses!=null?" / "+c.max_uses:"")+"회"),el("td",{},[el("span",{className:"hs "+st[1],textContent:st[0]})]),el("td",{className:"ac"},[cp,tg,dl])]))});
  if(!coups.length)tb.append(el("tr",{},[el("td",{colSpan:7,textContent:"아직 쿠폰이 없어요."})]))}
const rnd=()=>"RIF-"+Array.from(crypto.getRandomValues(new Uint8Array(6)),b=>"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b%32]).join("");
$("cpnew").onclick=()=>{$("cpf").reset();$("cpp").replaceChildren(el("option",{value:"",textContent:"전체 상품"}),...prods.map(p=>el("option",{value:p.id,textContent:p.name})));$("cpc").value=rnd();$("cpmsg").textContent="";$("cpf").hidden=false;$("cpc").focus()};
$("cprnd").onclick=()=>{$("cpc").value=rnd()};$("cpcancel").onclick=()=>{$("cpf").hidden=true};
$("cpf").onsubmit=async e=>{e.preventDefault();const m=$("cpmsg"),code=$("cpc").value.trim().toUpperCase(),kind=$("cpk").value,value=Math.round(Number($("cpv").value)||0);
  if(!/^[A-Z0-9_-]{3,24}$/.test(code)){m.textContent="코드는 영문 대문자 · 숫자 · - _ 로 3~24자예요.";return}
  if(value<1||(kind==="pct"&&value>100)){m.textContent=kind==="pct"?"할인율은 1~100 사이로 적어 주세요.":"할인 금액을 적어 주세요.";return}
  const row={code,kind,value,min_total:Math.max(0,Math.round(Number($("cpm").value)||0)),product_id:$("cpp").value||null,starts_at:fromLocal($("cps").value),ends_at:fromLocal($("cpe").value),max_uses:$("cpx").value===""?null:Math.max(1,Math.round(Number($("cpx").value))),members_only:$("cpmo").checked,memo:$("cpmm").value.trim()};
  if(row.starts_at&&row.ends_at&&row.ends_at<=row.starts_at){m.textContent="종료가 시작보다 뒤여야 해요.";return}
  $("cpsave").disabled=true;const {data,error}=await db.from("store_coupons").insert(row).select().single();$("cpsave").disabled=false;
  if(error){m.textContent=/duplicate/.test(error.message)?"이미 있는 코드예요. 다른 코드를 써 주세요.":"저장하지 못했어요: "+error.message;return}
  coups.unshift(data);$("cpf").hidden=true;drawC()};
/* 회원 */
function drawF(){const tb=$("fntb");tb.replaceChildren();const real=fans.filter(f=>!f.staff);
  $("fnsum").textContent="팬 회원 "+real.length+"명 · 적립금 합계 "+won(real.reduce((a,f)=>a+f.points,0))+" · 적립금은 입금 확인 때 자동으로 쌓이고, 여기서 직접 주거나 뺄 수도 있어요.";
  fans.forEach(f=>{const b=el("button",{type:"button",className:"btn small ghost",textContent:"적립금 ±"});
    b.onclick=async()=>{const v=prompt((f.nick||f.email)+" 님 적립금 (지금 "+won(f.points)+")\n줄 금액은 숫자만, 뺄 금액은 앞에 - 를 붙여 주세요. 예) 3000 또는 -1000");if(v==null)return;const d=Math.round(Number(String(v).replace(/[,\s₩원]/g,"")));if(!d)return alert("금액을 숫자로 적어 주세요.");
      const why=prompt("사유 (회원의 적립금 내역에 보여요)",d>0?"이벤트 적립":"적립금 조정");if(why==null)return;const {data,error}=await db.rpc("fan_admin_point",{p_user:f.user_id,p_delta:d,p_reason:why});
      if(error)return alert(/not enough/.test(error.message)?"보유 적립금보다 많이 뺄 수 없어요.":"바꾸지 못했어요: "+error.message);f.points=data;drawF()};
    tb.append(el("tr",{},[td((f.nick||"-")+(f.name?" · "+f.name:"")+(f.discord?" · @"+f.discord.replace(/^@/,""):"")+(f.staff?" (직원)":"")),td(f.email,"en"),td(new Date(f.created_at).toLocaleDateString("ko-KR"),"hm sm"),td(f.orders+"건","hm"),td(won(f.spent),"hm"),td(won(f.points)),td(f.marketing?"동의":"-","hm"),el("td",{className:"ac"},[b])]))});
  if(!fans.length)tb.append(el("tr",{},[el("td",{colSpan:8,textContent:"아직 가입한 회원이 없어요."})]))}
$("fncsv").onclick=()=>{if(!fans.length)return alert("내보낼 회원이 없어요.");const cell=v=>{let s=String(v==null?"":v);if(/^[=+\-@\t\r]/.test(s))s="'"+s;return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
  const rows=[["닉네임","이름","이메일","휴대폰","디스코드","우편번호","주소","가입일","주문 수","결제 금액","적립금","소식 수신 동의"],...fans.filter(f=>!f.staff).map(f=>[f.nick,f.name,f.email,f.phone,f.discord,f.zip,f.addr,new Date(f.created_at).toLocaleDateString("ko-KR"),f.orders,f.spent,f.points,f.marketing?"동의":""])];
  const a=el("a",{href:URL.createObjectURL(new Blob(["\ufeff"+rows.map(l=>l.map(cell).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"})),download:"RIF_스토어_회원.csv"});document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)};
/* 설정 */
const BZ=["name","ceo","reg","mail_order","addr","contact"];
function fillS(){$("sopen").checked=!!set.open;$("sship").value=set.ship_fee??3000;$("sfree").value=set.free_over??"";$("sppon").checked=set.pp_on!==false;$("sprate").value=set.pp_rate??1450;$("sprt").value=set.point_rate??1;$("spmin").value=set.point_min??1000;$("spbon").value=set.signup_bonus??0;$("spay").value=set.pay_guide||"";$("spol").value=set.policy||"";BZ.forEach(k=>$("sb_"+k).value=(set.biz||{})[k]||"")}
$("ssf").onsubmit=async e=>{e.preventDefault();const m=$("ssmsg");
  if($("sopen").checked&&!set.open&&!confirm("주문 받기를 켤까요?\n\n· 손님이 이 사이트에서 바로 주문을 넣을 수 있게 돼요\n· 사업자등록 · 통신판매업 신고와 입금 안내 문구를 먼저 준비해 주세요"))return;
  const biz={};BZ.forEach(k=>{const x=$("sb_"+k).value.trim();if(x)biz[k]=x});
  const row={open:$("sopen").checked,ship_fee:Math.max(0,Math.round(Number($("sship").value)||0)),free_over:$("sfree").value===""?null:Math.max(0,Math.round(Number($("sfree").value))),pp_on:$("sppon").checked,pp_rate:Math.min(5000,Math.max(500,Number($("sprate").value)||1450)),point_rate:Math.min(50,Math.max(0,Number($("sprt").value)||0)),point_min:Math.max(0,Math.round(Number($("spmin").value)||0)),signup_bonus:Math.max(0,Math.round(Number($("spbon").value)||0)),pay_guide:$("spay").value.trim()||null,policy:$("spol").value.trim()||null,biz,updated_at:new Date().toISOString()};
  $("ssave").disabled=true;const {error}=await db.from("store_settings").update(row).eq("id",1);$("ssave").disabled=false;
  if(error){m.className="note err";m.textContent="저장하지 못했어요: "+error.message;return}m.className="note";m.textContent="저장했어요 ✓";set={...set,...row};stat()};
const ap=$("app");const go=()=>{if(!ap.hidden)load()};new MutationObserver(go).observe(ap,{attributes:true,attributeFilter:["hidden"]});go();
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("pmod").hidden)closeP()})})();
