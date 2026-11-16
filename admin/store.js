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
const optTxt=o=>(o||[]).map(x=>x.name+": "+x.values.join(", ")).join("\n");
const parseOpt=s=>s.split("\n").map(l=>l.trim()).filter(Boolean).map(l=>{const i=l.indexOf(":");if(i<1)throw new Error("옵션은 '옵션명: 값, 값' 모양으로 적어 주세요 → "+l);
  const values=[...new Set(l.slice(i+1).split(",").map(v=>v.trim()).filter(Boolean))];if(!values.length)throw new Error("옵션 값이 비어 있어요 → "+l);return {name:l.slice(0,i).trim(),values}});
/* 옵션: 줄마다 [옵션 이름][값들] 로 적어요 (속으로는 '옵션명: 값, 값' 글자로 바꿔 저장) */
function optRow(name,vals){const n=el("input",{maxLength:30,value:name||"",placeholder:"예) 사이즈"}),v=el("input",{maxLength:300,value:vals||"",placeholder:"예) S, M, L (쉼표로)"}),x=el("button",{type:"button",className:"px",textContent:"×",ariaLabel:"이 옵션 빼기"});
  const r=el("div",{className:"porow"},[n,v,x]);x.onclick=()=>r.remove();return r}
const drawOpts=o=>$("popw").replaceChildren(...(o||[]).map(x=>optRow(x.name,x.values.join(", "))));
$("popadd").onclick=()=>{const r=optRow();$("popw").append(r);r.querySelector("input").focus()};
const syncOpts=()=>{$("pop").value=[...$("popw").children].map(r=>{const [n,v]=r.querySelectorAll("input");return n.value.trim()||v.value.trim()?n.value.trim()+": "+v.value.trim():""}).filter(Boolean).join("\n")};
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
const snap=()=>{syncOpts();return JSON.stringify([...FIDS.map(i=>$(i).value),$("pop").value,imgs])};let snap0="";
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
  syncOpts();try{options=parseOpt($("pop").value)}catch(er){$("pmsg").textContent=er.message;return}
  const noTr=!["pnj","pne","psuj","psue","pdj","pde"].some(i=>$(i).value.trim());
  if(noTr||(trFrom&&trFrom!==koNow()&&confirm("한국어 내용이 바뀌었어요. 일본어 · 영어 번역도 새로 할까요?\n(취소를 누르면 지금 번역 그대로 저장해요)"))){$("psave").disabled=true;$("pmsg").textContent="일본어 · 영어로 번역하는 중…";
    try{await trP()}catch(er){if(!confirm((er.message||er)+"\n\n번역 없이 한국어로만 저장할까요? (일본어 · 영어 화면에는 한국어가 보여요)")){$("psave").disabled=false;$("pmsg").textContent="";return}}
    $("psave").disabled=false;$("pmsg").textContent=""}
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
