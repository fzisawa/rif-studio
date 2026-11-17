/* 어드민 › 스토어: 주문 관리 · 상품 등록/수정 · 스토어 설정 (대표님만, 서버 정책도 대표님만 허용) */
(()=>{const $=i=>document.getElementById(i);if(!$("p4"))return;
const won=n=>"₩"+Number(n||0).toLocaleString("ko-KR"),ST={new:["접수 · 입금 확인 중","wt"],paid:["입금 확인","on"],shipped:["발송함","on"],done:["완료","x"],cancel:["취소","x"]};
const PS={draft:"숨김",sale:"판매 중",soldout:"품절"},BM={order:"사이트 주문",link:"외부 스토어",inquiry:"문의하기"};
let prods=[],orders=[],set={},edit=null,imgs=[];const OPEN=new Set();
const td=(t,c)=>el("td",{className:c||"",textContent:t==null?"":String(t),title:t==null?"":String(t)});
async function load(){
  const [a,b,c]=await Promise.all([db.from("store_products").select("*").order("sort").order("created_at",{ascending:false}),db.from("store_orders").select("*").order("created_at",{ascending:false}).limit(500),db.from("store_settings").select("*").eq("id",1).maybeSingle()]);
  prods=a.data||[];orders=b.data||[];set=(c&&c.data)||{};drawP();drawO();fillS()}
/* 요약 */
function stat(){const n=orders.filter(o=>o.status==="new").length,p=orders.filter(o=>o.status==="paid").length,sum=orders.filter(o=>o.status!=="cancel").reduce((a,o)=>a+o.total,0);
  $("sst").replaceChildren(...[[set.open?"주문 받는 중":"주문 꺼짐 (준비 중)",set.open?"on":"x"],["입금 확인 중 "+n+"건",n?"wt":"x"],["발송 대기 "+p+"건",p?"wt":"x"],["판매 중 상품 "+prods.filter(x=>x.status==="sale").length+"개","x"],["누적 주문 금액 "+won(sum),"x"]].map(([t,c])=>el("span",{className:"hs "+c,textContent:t})))}
/* 주문 */
function drawO(){const f=$("sof").value,tb=$("sotb");tb.replaceChildren();stat();
  const v=orders.filter(o=>!f||o.status===f);
  v.forEach(o=>{const sel=el("select",{className:"ost"},Object.entries(ST).map(([k,[t]])=>el("option",{value:k,textContent:t})));sel.value=o.status;sel.onclick=e=>e.stopPropagation();
    sel.onchange=async()=>{const {error}=await db.from("store_orders").update({status:sel.value,updated_at:new Date().toISOString()}).eq("id",o.id);if(error){sel.value=o.status;return alert("바꾸지 못했어요: "+error.message)}o.status=sel.value;stat()};
    const it=(o.items||[]).map(i=>i.name+(Object.keys(i.opts||{}).length?"("+Object.values(i.opts).join("/")+")":"")+" ×"+i.qty).join(", ");
    const tr=el("tr",{className:"r"},[td(o.no,"en"),td(o.name),td(it,"hm wd"),td(won(o.total)),el("td",{className:"ac"},[sel]),td(new Date(o.created_at).toLocaleString("ko-KR",{dateStyle:"short",timeStyle:"short"}),"hm sm")]);
    const memo=el("textarea",{rows:2,maxLength:1000,value:o.admin_memo||"",placeholder:"관리 메모 (손님에게 안 보여요) · 송장번호 등"}),ms=el("button",{type:"button",className:"btn small",textContent:"메모 저장"});
    ms.onclick=async()=>{const {error}=await db.from("store_orders").update({admin_memo:memo.value}).eq("id",o.id);if(error)return alert(error.message);o.admin_memo=memo.value;ms.textContent="저장했어요 ✓";setTimeout(()=>ms.textContent="메모 저장",1500)};
    const kv=(k,v)=>el("div",{},[el("b",{textContent:k}),el("span",{textContent:v||"-"})]);
    const d=el("tr",{className:"d",hidden:!OPEN.has(o.id)},[el("td",{colSpan:6},[el("div",{className:"dg"},[kv("이메일",o.email),kv("전화",o.phone),kv("우편번호",o.zip),kv("주소",o.addr),kv("요청 사항",o.memo),kv("상품 금액",won(o.subtotal)),kv("배송비",won(o.ship)),kv("결제 금액",won(o.total))]),
      el("ul",{className:"oit"},(o.items||[]).map(i=>el("li",{textContent:i.name+(Object.keys(i.opts||{}).length?" · "+Object.entries(i.opts).map(([k,v])=>k+": "+v).join(", "):"")+" × "+i.qty+" = "+won(i.unit*i.qty)}))),el("div",{className:"dact"},[memo,ms])])]);
    tr.onclick=()=>{d.hidden=!d.hidden;d.hidden?OPEN.delete(o.id):OPEN.add(o.id)};tb.append(tr,d)});
  if(!v.length)tb.append(el("tr",{},[el("td",{colSpan:6,textContent:orders.length?"이 상태의 주문이 없어요.":"아직 주문이 없어요."})]))}
$("sof").onchange=drawO;
$("socsv").onclick=()=>{if(!orders.length)return alert("내보낼 주문이 없어요.");const H=["주문번호","주문일","상태","이름","이메일","전화","우편번호","주소","상품","상품 금액","배송비","결제 금액","요청 사항","관리 메모"];
  const cell=v=>{let s=String(v==null?"":v);if(/^[=+\-@\t\r]/.test(s))s="'"+s;return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
  const L=orders.map(o=>[o.no,new Date(o.created_at).toLocaleString("ko-KR"),ST[o.status][0],o.name,o.email,o.phone,o.zip,o.addr,(o.items||[]).map(i=>i.name+(Object.keys(i.opts||{}).length?"("+Object.values(i.opts).join("/")+")":"")+"×"+i.qty).join(" / "),o.subtotal,o.ship,o.total,o.memo,o.admin_memo]);
  const a=el("a",{href:URL.createObjectURL(new Blob(["﻿"+[H,...L].map(l=>l.map(cell).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"})),download:"RIF_스토어_주문.csv"});document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)};
/* 상품 목록 */
function drawP(){const tb=$("sptb");tb.replaceChildren();
  prods.forEach(p=>{const img=(p.images||[])[0],b=el("button",{type:"button",className:"btn small",textContent:"수정"});b.onclick=e=>{e.stopPropagation();openP(p)};
    const pr=p.sale_price!=null&&p.sale_price<p.price?won(p.sale_price)+" (정가 "+won(p.price)+")":won(p.price);
    const tr=el("tr",{className:"r"},[el("td",{},[img?el("img",{className:"pth",src:img,alt:""}):el("span",{className:"pth"})]),td(p.name),td(p.kind==="plan"?"Plan":"Goods","hm"),td(pr),td(p.stock==null?"무제한":p.stock+"개","hm"),
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
const FIDS=["pk","pst","pn","pnj","pne","pp","psp","pstk","pmq","psu","psuj","psue","pd","pdj","pde","pbm","pbu","pso"];
const snap=()=>JSON.stringify([...FIDS.map(i=>$(i).value),readOpts(false).map(({_c,...o})=>o),imgs]);let snap0="";
const dirty=()=>!$("pmod").hidden&&snap()!==snap0;
window.addEventListener("beforeunload",e=>{if(dirty()){e.preventDefault();e.returnValue=""}});
function drawImgs(){$("pim").replaceChildren(...imgs.map((u,i)=>{const mv=(d)=>{const j=i+d;if(j<0||j>=imgs.length)return;[imgs[i],imgs[j]]=[imgs[j],imgs[i]];drawImgs()};
  const l=el("button",{type:"button",textContent:"←",disabled:i===0}),r=el("button",{type:"button",textContent:"→",disabled:i===imgs.length-1}),x=el("button",{type:"button",textContent:"×"});
  l.onclick=()=>mv(-1);r.onclick=()=>mv(1);x.onclick=()=>{imgs.splice(i,1);drawImgs()};
  return el("div",{className:"pimg"},[el("img",{src:u,alt:""}),el("div",{},[l,r,x])])}))}
function openP(p){edit=p||null;$("pmt").textContent=p?"상품 수정":"새 상품";const g=(i,v)=>$(i).value=v==null?"":v;
  g("pk",p?p.kind:"goods");g("pst",p?p.status:"draft");g("pn",p&&p.name);g("pnj",p&&p.name_ja);g("pne",p&&p.name_en);g("pp",p?p.price:"");g("psp",p&&p.sale_price);g("pstk",p&&p.stock);g("pmq",p?p.max_qty:10);
  g("psu",p&&p.summary);g("psuj",p&&p.summary_ja);g("psue",p&&p.summary_en);drawOpts(p?p.options:[]);g("pd",p&&p.detail);g("pdj",p&&p.detail_ja);g("pde",p&&p.detail_en);g("pbm",p?p.buy_mode:"order");g("pbu",p&&p.buy_url);g("pso",p?p.sort:0);
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
  const row={kind:v("pk"),status:v("pst"),name:v("pn"),name_ja:v("pnj")||null,name_en:v("pne")||null,price:num("pp")||0,sale_price:num("psp"),stock:num("pstk"),max_qty:num("pmq")||10,
    summary:v("psu")||null,summary_ja:v("psuj")||null,summary_en:v("psue")||null,options,detail:$("pd").value.trim()||null,detail_ja:$("pdj").value.trim()||null,detail_en:$("pde").value.trim()||null,images:imgs,buy_mode:v("pbm"),buy_url:v("pbu")||null,sort:num("pso")||0,updated_at:new Date().toISOString()};
  if(row.sale_price!=null&&row.sale_price>=row.price){$("pmsg").textContent="할인가는 정가보다 낮아야 해요 (할인이 없으면 비워 두세요).";return}
  if(row.buy_mode==="link"&&!/^https:\/\//.test(row.buy_url||"")){$("pmsg").textContent="외부 스토어 주소를 https:// 로 시작하게 적어 주세요.";return}
  if(row.status==="sale"&&!imgs.length&&!confirm("사진 없이 판매를 시작할까요?"))return;
  $("psave").disabled=true;const {error}=edit?await db.from("store_products").update(row).eq("id",edit.id):await db.from("store_products").insert(row);$("psave").disabled=false;
  if(error){$("pmsg").textContent="저장하지 못했어요: "+error.message;return}shutP();load()};
$("pdel").onclick=async()=>{if(!edit)return;if(!confirm("'"+edit.name+"' 상품을 삭제할까요? 되돌릴 수 없어요.\n(이미 들어온 주문 기록은 그대로 남아요. 잠깐 내리려면 '숨김'을 쓰세요)"))return;
  const {error}=await db.from("store_products").delete().eq("id",edit.id);if(error)return alert("삭제하지 못했어요: "+error.message);shutP();load()};
/* 설정 */
const BZ=["name","ceo","reg","mail_order","addr","contact"];
function fillS(){$("sopen").checked=!!set.open;$("sship").value=set.ship_fee??3000;$("sfree").value=set.free_over??"";$("spay").value=set.pay_guide||"";$("spol").value=set.policy||"";BZ.forEach(k=>$("sb_"+k).value=(set.biz||{})[k]||"")}
$("ssf").onsubmit=async e=>{e.preventDefault();const m=$("ssmsg");
  if($("sopen").checked&&!set.open&&!confirm("주문 받기를 켤까요?\n\n· 손님이 이 사이트에서 바로 주문을 넣을 수 있게 돼요\n· 사업자등록 · 통신판매업 신고와 입금 안내 문구를 먼저 준비해 주세요"))return;
  const biz={};BZ.forEach(k=>{const x=$("sb_"+k).value.trim();if(x)biz[k]=x});
  const row={open:$("sopen").checked,ship_fee:Math.max(0,Math.round(Number($("sship").value)||0)),free_over:$("sfree").value===""?null:Math.max(0,Math.round(Number($("sfree").value))),pay_guide:$("spay").value.trim()||null,policy:$("spol").value.trim()||null,biz,updated_at:new Date().toISOString()};
  $("ssave").disabled=true;const {error}=await db.from("store_settings").update(row).eq("id",1);$("ssave").disabled=false;
  if(error){m.className="note err";m.textContent="저장하지 못했어요: "+error.message;return}m.className="note";m.textContent="저장했어요 ✓";set={...set,...row};stat()};
const ap=$("app");const go=()=>{if(!ap.hidden)load()};new MutationObserver(go).observe(ap,{attributes:true,attributeFilter:["hidden"]});go();
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("pmod").hidden)closeP()})})();
