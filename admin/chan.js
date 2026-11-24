/* 포트폴리오 관리: 채널(포트폴리오 페이지) 목록 · 한눈에 보는 현황(공개 상태 · 올린 것 · 최근 수정 · 손볼 곳)
   · 담당자 지정 · 메뉴 순서 · 일본어/영어 번역 고치기 · 채널 추가/수정/숨김/삭제 */
(()=>{const $=i=>document.getElementById(i);if(!$("chtb"))return;
const CEO="takanashi@rif-studio.com",GO=["vocal","sound","art","content"],G={vocal:"Vocal",sound:"Sound",art:"Art",content:"Content",mgmt:"Management"};
/* 처음부터 있던 기본 페이지 (이름·주소는 고정, 담당자만 정해요). RIF 는 대표님 전용 */
const FIXED=[{slug:"rif",name:"RIF",grp:"vocal",ceoOnly:true},{slug:"charmbung",name:"Charmbung",grp:"sound"},{slug:"se1c",name:"SE1C",grp:"sound"},{slug:"woljae",name:"Woljae",grp:"art"},{slug:"gugugong",name:"gugugong",grp:"art"}];
/* 채널 주소로 쓸 수 없는 이름: 사이트에 이미 있는 페이지 · 폴더 */
const RESERVED=["rif","charmbung","se1c","woljae","gugugong","rif-management","about","news","store","privacy","join","contact","board","intranet","admin","mail","artist","joinadmin","img","fonts","audio","supabase","app","api","www","index","404","staff","assets","static"];
const KO=/[가-힣]/,KN={image:"사진",youtube:"영상",audio:"음원"};
let chans=[],own={},cnt={},kinds={},lastIt={},meta={},pm={},hidp=new Set(),leftp=new Set(),shop={},staff=[],edit=null,busy=false,ready=false,flt="";const PG={};      /* 채널 주소에 정식 페이지 파일이 있는지 (true 있음 · false 없음(임시 방식으로 열림) · null 모름) */
const OPEN=new Set(),TR=new Set(),DR={};   /* DR = 채널별로 아직 저장하지 않은 번역 (표를 다시 그려도 지워지지 않게) */
const lc=s=>String(s||"").trim().toLowerCase();
const who=e=>staff.find(s=>lc(s.email)===lc(e));
const label=e=>{const s=who(e);return s?(s.nickname||s.name||e):e};
const sname=s=>(s.nickname||s.name||s.email)+(s.nickname&&s.name?" ("+s.name+")":"")+(s.team?" · "+s.team:"");
const urlOf=c=>"/"+encodeURIComponent(c.slug)+"/";
const ord=g=>(GO.indexOf(g)+1)||99;
const all=()=>[...FIXED.map(f=>({...f,fixed:true,visible:true})),...chans.filter(c=>!FIXED.some(f=>f.slug===c.slug)).map(c=>({...c,fixed:false}))].sort((a,b)=>ord(a.grp)-ord(b.grp)||(a.fixed===b.fixed?0:a.fixed?-1:1)||((a.sort||0)-(b.sort||0)));
let msgT=null;const msg=(t,bad)=>{const m=$("chmsg");m.className="note"+(bad?" err":"");m.textContent=t||"";m.title=t?"누르면 닫혀요":"";m.onclick=()=>{m.textContent=""};clearTimeout(msgT);if(t)msgT=setTimeout(()=>{m.textContent=""},bad?14000:7000)};
const btn=(t,c)=>el("button",{type:"button",className:"btn small"+(c?" "+c:""),textContent:t});
/* ── 현황 계산 ── */
const leftP=c=>leftp.has(c.slug);                                    /* 담당자가 모두 인사정보에서 퇴사 처리돼 사이트에서 내려간 채널 (그냥 숨긴 채널과는 달라요) */
const koLead=c=>(pm[c.slug]&&pm[c.slug].lead)||c.lead||"";            /* 지금 보이는 캐치프레이즈 (담당자가 페이지에서 바꾼 값이 먼저) */
const cvOf=c=>{const m=pm[c.slug];return m&&Array.isArray(m.career)?m.career:[]};
const day=d=>{if(!d)return "";const t=new Date(d);if(isNaN(t))return "";const mid=x=>new Date(x.getFullYear(),x.getMonth(),x.getDate()).getTime(),n=Math.round((mid(new Date())-mid(t))/864e5);return n<=0?"오늘":n===1?"어제":n<=30?n+"일 전":t.toLocaleDateString("ko-KR")};   /* 달력 날짜 기준 */
const lastOf=c=>{const a=lastIt[c.slug]||"",b=(pm[c.slug]&&pm[c.slug].updated_at)||"";return a>b?a:b};
const kindText=s=>{const k=kinds[s]||{},o=Object.keys(KN).filter(x=>k[x]).map(x=>KN[x]+" "+k[x]);return o.length?o.join(" · "):"없음"};
/* 번역이 필요한 칸(한글이 들어간 캐치프레이즈 · 경력) 가운데 일본어 · 영어가 비어 있는 칸 수 */
function tstat(c){const m=pm[c.slug]||{},cv=cvOf(c),lead=koLead(c);let need=0,miss=0,ko=0;
  ["ja","en"].forEach(L=>{const t=(m.i18n||{})[L]||{},tc=Array.isArray(t.career)?t.career:[];
    if(KO.test(lead)){need++;if(!t.lead)miss++;else if(KO.test(t.lead))ko++}
    cv.forEach((r,i)=>["role","text","tag"].forEach(k=>{if(r&&KO.test(r[k]||"")){need++;const v=tc[i]&&tc[i][k];if(!v)miss++;else if(KO.test(v))ko++}}))});
  return {need,miss,ko}}   /* ko = 번역은 있는데 그 안에 한글이 남아 있는 칸 (작품 이름 등) */
/* 손볼 곳: [짧은 이름, 어떻게 하면 되는지] — 퇴사로 내려간 채널은 따지지 않아요 */
function issues(c,os){const out=[];if(leftP(c))return out;const n=cnt[c.slug]||0,t=tstat(c);
  if(!c.ceoOnly&&!os.length)out.push(["담당자 없음","아래 '담당자'에서 지정하면 그 사람이 자기 페이지를 직접 고칠 수 있어요. 지금은 대표님만 고칠 수 있어요."]);
  if(os.some(e=>!who(e)))out.push(["담당자 계정 확인","담당자로 적힌 주소 가운데 인트라넷 계정 명단에 없는 주소가 있어요. 주소가 틀렸거나 아직 계정을 만들지 않았을 수 있어요. 그 주소로는 이 채널을 고칠 수 없어요."]);
  if(!c.ceoOnly&&!n)out.push(["작품 없음","아직 올린 작품이 없어요. '페이지 열기'에서 올리거나 담당자에게 요청해 주세요."]);
  if(!c.fixed&&!koLead(c))out.push(["캐치프레이즈 없음","'채널 정보 수정'에서 캐치프레이즈를 적어 주세요."]);
  if(!c.fixed&&!cvOf(c).length)out.push(["경력 없음","'페이지 열기'로 들어가 '캐치프레이즈 · 경력 편집'에서 경력을 적을 수 있어요."]);
  if(!c.fixed&&c.visible&&PG[c.slug]===false)out.push(["검색 노출 준비 전","지금도 주소를 누르면 페이지가 열리지만 임시 방식이라, 검색에 잡히지 않고 디스코드 · X 에 주소를 붙였을 때 미리보기가 안 뜰 수 있어요. 사이트 파일에 이 채널의 폴더를 한 번 추가하면 해결돼요 (개발 작업이라 요청해 주세요)."]);
  if(t.miss)out.push(["번역 빠짐 "+t.miss,"일본어 · 영어 화면에서 이 칸들이 한국어로 나와요. 아래 '번역 고치기'에서 '빈 칸 자동 번역'을 누르면 채워져요."]);
  return out}
async function load(){
  const [a,o,i,s,m,h,sp]=await Promise.all([db.from("channels").select("*").order("sort").order("created_at"),db.from("page_owners").select("page,email"),db.from("items").select("page,kind,created_at"),db.rpc("staff_directory"),
    db.from("page_meta").select("page,lead,career,i18n,tabs,updated_at"),db.rpc("hidden_pages").then(r=>r,()=>({data:null})),db.from("store_products").select("name,pack").then(r=>r,()=>({data:null}))]);
  if(a.error){msg("채널을 불러오지 못했어요: "+a.error.message,1);return}
  chans=a.data||[];
  await Promise.all(chans.filter(c=>!FIXED.some(f=>f.slug===c.slug)&&!(c.slug in PG)).map(c=>fetch(urlOf(c),{method:"HEAD",cache:"no-store"}).then(r=>{PG[c.slug]=r.status===200?true:r.status===404?false:null},()=>{PG[c.slug]=null})));
  own={};((o&&o.data)||[]).forEach(r=>{(own[r.page]=own[r.page]||[]).push(String(r.email||""))});
  cnt={};kinds={};lastIt={};((i&&i.data)||[]).forEach(r=>{cnt[r.page]=(cnt[r.page]||0)+1;const k=kinds[r.page]=kinds[r.page]||{};k[r.kind]=(k[r.kind]||0)+1;if(r.created_at&&r.created_at>(lastIt[r.page]||""))lastIt[r.page]=r.created_at});
  staff=((s&&s.data)||[]).filter(x=>x&&x.email);meta={};pm={};((m&&m.data)||[]).forEach(r=>{meta[r.page]=r.lead||"";pm[r.page]=r});
  hidp=new Set(((h&&h.data)||[]).map(x=>typeof x==="string"?x:x&&x.hidden_pages).filter(Boolean));
  /* hidden_pages 에는 '숨긴 채널'과 '담당자가 퇴사 처리된 채널'이 섞여 있어서, 어느 쪽인지 하나씩 물어봐요 (못 물어보면: 숨기지 않았는데 내려가 있는 채널만 퇴사로 봐요) */
  const hl=[...hidp],lr=await Promise.all(hl.map(p=>db.rpc("page_left",{p}).then(r=>r,()=>({data:null})))),vis=p=>{const c=chans.find(x=>x.slug===p);return c?c.visible!==false:true};
  leftp=new Set(hl.filter((p,i)=>{const v=lr[i]&&!lr[i].error?lr[i].data:null;return v===true||(v==null&&vis(p))}));
  /* 스토어 상품의 '만드는 사람들'에 나오는 채널 */
  shop={};((sp&&sp.data)||[]).forEach(p=>{const ps=new Set();((p.pack&&p.pack.parts)||[]).forEach(pt=>((pt&&pt.who)||[]).forEach(w=>{if(w&&w.page)ps.add(w.page)}));ps.forEach(g=>{(shop[g]=shop[g]||[]).push(p.name)})});
  ready=true;draw();fillOwnerSel()}
function fillOwnerSel(){const sel=$("cho"),cur=sel.value;sel.replaceChildren(el("option",{value:"",textContent:"나중에 지정 (우선 대표님만 수정)"}),...staff.filter(s=>lc(s.email)!==CEO).map(s=>el("option",{value:lc(s.email),textContent:sname(s)})));sel.value=[...sel.options].some(o=>o.value===cur)?cur:""}
function draw(){const tb=$("chtb");tb.replaceChildren();
  const rows=all().map(c=>{const os=(own[c.slug]||[]).filter(e=>lc(e)!==CEO);return {c,os,is:issues(c,os)}});
  /* 현황 칩: 누르면 그 채널만 골라 보여요 */
  const pass={"":()=>true,on:r=>r.c.visible&&!leftP(r.c),hid:r=>!r.c.visible,left:r=>leftP(r.c),todo:r=>r.is.length>0};
  if(!pass[flt])flt="";
  const chip=(k,t,w)=>{const n=rows.filter(pass[k]).length,b=el("button",{type:"button",className:"chip"+(w&&n?" w":"")+(flt===k?" on":"")},[t+" ",el("b",{textContent:String(n)})]);b.setAttribute("aria-pressed",String(flt===k));b.onclick=()=>{flt=flt===k?"":k;draw()};return {b,n}};
  const cs=[chip("","전체"),chip("on","공개 중"),chip("hid","숨김"),chip("left","담당자 퇴사 처리"),chip("todo","손볼 곳 있음",1)];
  $("chsum").replaceChildren(cs[0].b,cs[1].b,...(cs[2].n||flt==="hid"?[cs[2].b]:[]),...(cs[3].n||flt==="left"?[cs[3].b]:[]),el("span",{className:"sep"}),cs[4].b);
  const show=rows.filter(pass[flt]);
  if(!show.length)tb.append(el("tr",{},[el("td",{colSpan:7,className:"note",textContent:"여기에 해당하는 채널이 없어요."})]));
  show.forEach(({c,os,is})=>{
    const oc=el("td",{className:"wd oc hm"});
    if(c.ceoOnly)oc.append(el("span",{className:"note",textContent:"대표님 전용"}));
    else if(!os.length)oc.append(el("span",{className:"note",textContent:"없음 (대표님만 수정)"}));
    else os.forEach(e=>oc.append(el("span",{className:"ownc"+(who(e)?"":" gone"),textContent:label(e),title:e+(who(e)?"":" · 인트라넷 계정 명단에 없는 주소라 지금은 이 채널을 고칠 수 없어요")})));
    const view=el("a",{href:urlOf(c),target:"_blank",rel:"noopener",className:"btn small",textContent:"페이지 열기"});view.onclick=e=>e.stopPropagation();
    const off=leftP(c)||!c.visible;
    const tr=el("tr",{className:"r"+(off?" hid":"")},[
      el("td",{},[el("b",{textContent:c.name}),...(c.visible?[]:[el("span",{className:"hs x",textContent:"숨김"})]),...(leftP(c)?[el("span",{className:"hs wt",textContent:"담당자 퇴사 처리",title:"담당자가 인사정보에서 퇴사 처리돼 있어 사이트에서 내려가 있어요"})]:[]),el("small",{className:"chsub",textContent:"/"+c.slug+"/"})]),
      el("td",{className:"hm hl",textContent:G[c.grp]||c.grp||""}),el("td",{textContent:kindText(c.slug)}),el("td",{className:"hm hl sm",textContent:day(lastOf(c))||"-"}),
      el("td",{className:"wd ci"},is.length?is.map(x=>el("span",{className:"chi",textContent:x[0]})):[el("span",{className:"note",textContent:leftP(c)?"-":"없음 ✓"})]),oc,el("td",{className:"ac hm"},[view])]);
    const dtl=el("tr",{className:"d",hidden:!OPEN.has(c.slug)},[el("td",{colSpan:7},[detail(c,os,is)])]);
    tr.onclick=()=>{dtl.hidden=!dtl.hidden;if(dtl.hidden)OPEN.delete(c.slug);else OPEN.add(c.slug)};
    tb.append(tr,dtl)})}
function detail(c,os,is){const box=el("div",{className:"chd"}),ol=el("div",{className:"chow"}),m=pm[c.slug]||{},t=tstat(c);
  /* 현황 */
  const kv=(k,...v)=>el("div",{},[el("b",{textContent:k}),el("span",{},v)]);
  const cp=el("button",{type:"button",className:"lnk",textContent:"주소 복사"}),full=location.origin+urlOf(c);
  cp.onclick=async()=>{try{await navigator.clipboard.writeText(full);cp.textContent="복사했어요 ✓"}catch(_){cp.textContent="복사가 막혀 있어요";msg("주소: "+full+"  (길게 눌러 복사해 주세요)")}setTimeout(()=>{cp.textContent="주소 복사"},1800)};
  const st=leftP(c)?(c.visible?"담당자가 인사정보에서 퇴사 처리돼 있어 사이트 메뉴와 페이지에서 내려가 있어요. 인사정보에서 '재직'으로 되돌리거나 담당자를 다른 사람으로 바꾸면 다시 나와요."
      :"숨김 상태예요. 담당자도 인사정보에서 퇴사 처리돼 있어서, '메뉴에 다시 보이기'만 눌러서는 사이트에 나오지 않아요. 인사정보에서 '재직'으로 되돌리거나 담당자를 다른 사람으로 바꾼 뒤에 다시 보이게 해 주세요.")
    :c.visible?"공개 중 · 사이트 메뉴에 보여요":"숨김 · 메뉴에 안 보이고 대표님에게만 보여요";
  const tabs=Array.isArray(m.tabs)&&m.tabs.length?" · 탭: "+m.tabs.join(", "):"";
  const upd=[lastIt[c.slug]?"작품 "+day(lastIt[c.slug]):"",m.updated_at?"소개 · 번역 "+day(m.updated_at):""].filter(Boolean).join(" · ")||"기록 없음";
  const trs=!t.need?(c.fixed&&!pm[c.slug]?"이 페이지 문구와 번역은 사이트 파일에 들어 있어요":"번역할 한글 문구가 없어요"):(t.miss?"빠진 칸 "+t.miss+"개 (전체 "+t.need+"칸)":"모두 번역됨 ✓ ("+t.need+"칸)")+(t.ko?" · 번역 안에 한글이 남은 칸 "+t.ko+"개":"");
  const mg=kv("메뉴",G[c.grp]||c.grp||"-");mg.className="mo";
  box.append(el("div",{className:"dg"},[kv("상태",st),mg,kv("주소",location.host+urlOf(c)+" ",cp),kv("올린 것",kindText(c.slug)+tabs),kv("최근 수정",upd),kv("번역 (일본어 · 영어)",trs),...(c.fixed||PG[c.slug]==null?[]:[kv("검색 · 링크 미리보기",PG[c.slug]?"준비됨 ✓":"준비 전 · 지금은 임시 방식으로 열려요")]),
    ...(shop[c.slug]?[kv("스토어","'"+shop[c.slug].join("', '")+"' 상품의 '만드는 사람들'에 이 채널 작품이 나와요")]:[])]));
  if(is.length)box.append(el("ul",{className:"chtodo"},is.map(x=>el("li",{},[el("strong",{textContent:x[0]}),document.createTextNode(" — "+x[1])]))));
  /* 담당자 */
  box.append(el("b",{textContent:"담당자"}));
  if(c.ceoOnly)ol.append(el("p",{className:"note",textContent:"RIF 채널은 대표님만 올리고 지울 수 있어요. 담당자를 따로 두지 않아요."}));
  else{
    os.forEach(e=>{const s=who(e),x=el("button",{type:"button",textContent:"×",title:"담당자에서 빼기"});x.setAttribute("aria-label",label(e)+" 님을 담당자에서 빼기");
      x.onclick=()=>removeOwner(c,e);
      ol.append(el("span",{className:"ownc big"+(s?"":" gone")},[el("span",{textContent:label(e)+(s&&s.team?" · "+s.team:"")}),el("small",{textContent:s?e:"인트라넷 계정 명단에 없는 주소"}),x]))});
    if(!os.length)ol.append(el("p",{className:"note",textContent:"아직 담당자가 없어요. 지금은 대표님만 이 채널을 고칠 수 있어요."}));
    const sel=el("select",{},[el("option",{value:"",textContent:"＋ 담당자 추가…"}),...staff.filter(s=>lc(s.email)!==CEO&&!os.some(e=>lc(e)===lc(s.email))).map(s=>el("option",{value:lc(s.email),textContent:sname(s)})),el("option",{value:"__m",textContent:"명단에 없으면 이메일 직접 입력…"})]);sel.setAttribute("aria-label",c.name+" 담당자 추가");
    const inp=el("input",{type:"email",placeholder:"아이디@rif-studio.com",hidden:true,maxLength:120,autocomplete:"off"}),add=el("button",{type:"button",className:"btn small p",textContent:"추가",hidden:true});
    sel.onchange=()=>{const man=sel.value==="__m";inp.hidden=add.hidden=!man;if(man)inp.focus();else if(sel.value)addOwner(c,sel.value)};
    add.onclick=()=>{const v=lc(inp.value);if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))return alert("이메일 형식으로 적어 주세요 (예: mina@rif-studio.com)");if(os.some(e=>lc(e)===v))return alert("이미 담당자예요.");addOwner(c,v)};
    inp.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();add.click()}};
    ol.append(el("div",{className:"chadd"},[sel,inp,add]))}
  box.append(ol);
  /* 번역 고치기 (누르면 펼쳐져요) */
  const trb=el("div",{className:"chtr",hidden:!TR.has(c.slug)}),trBtn=btn("번역 고치기");
  if(TR.has(c.slug))trEditor(c,trb);
  trBtn.onclick=()=>{if(TR.has(c.slug)){TR.delete(c.slug);delete DR[c.slug];trb.hidden=true}else{TR.add(c.slug);trEditor(c,trb);trb.hidden=false;trb.scrollIntoView({behavior:"smooth",block:"nearest"})}};
  const acts=el("div",{className:"dact"},[el("a",{href:urlOf(c),target:"_blank",rel:"noopener",className:"btn small mo",textContent:"페이지 열기"})]);
  if(c.fixed){box.append(el("p",{className:"note",textContent:"처음부터 있던 기본 페이지라 이름·주소·메뉴 위치는 고정이에요. 사진·영상·탭·캐치프레이즈·경력은 '페이지 열기'로 들어가서 바로 고칠 수 있어요."}));if(t.need)acts.append(trBtn)}
  else{const ed=btn("채널 정보 수정"),hv=btn(c.visible?"메뉴에서 숨기기":"메뉴에 다시 보이기"),del=btn("채널 삭제","danger");
    /* 메뉴 순서: 같은 메뉴(Vocal · Sound · Art · Content) 안에서 위아래로 */
    const grp=all().filter(x=>!x.fixed&&x.grp===c.grp),gi=grp.findIndex(x=>x.slug===c.slug),up=btn("▲ 메뉴 위로"),dn=btn("▼ 아래로");
    up.disabled=gi<=0;dn.disabled=gi<0||gi>=grp.length-1;up.title=dn.title=(G[c.grp]||"")+" 메뉴 안에서의 순서를 바꿔요";up.onclick=()=>move(c,-1);dn.onclick=()=>move(c,1);
    ed.onclick=()=>fill(c);
    hv.onclick=async()=>{hv.disabled=true;const {error}=await db.from("channels").update({visible:!c.visible}).eq("slug",c.slug);hv.disabled=false;
      if(error)return alert("바꾸지 못했어요: "+error.message);msg(c.name+" 채널을 "+(c.visible?"메뉴에서 숨겼어요. 대표님에게만 보여요.":"메뉴에 다시 보이게 했어요."));await load();chg()};
    del.onclick=async()=>{if(!confirm(c.name+" 채널을 삭제할까요?\n\n· 사이트 메뉴와 페이지가 사라지고, 담당자 지정도 풀려요\n· 올린 포트폴리오 "+(cnt[c.slug]||0)+"개는 지워지지 않고 남아서, 같은 주소로 다시 만들면 돌아와요"+(shop[c.slug]?"\n· 스토어 상품('"+shop[c.slug].join("', '")+"')에는 이 채널 작품이 계속 나와요. 빼려면 상품 구성도 바꿔야 해요":"")))return;
      del.disabled=true;const {error}=await db.from("channels").delete().eq("slug",c.slug);if(error){del.disabled=false;return alert("삭제하지 못했어요: "+error.message)}
      await db.from("page_owners").delete().eq("page",c.slug);OPEN.delete(c.slug);TR.delete(c.slug);delete DR[c.slug];if(edit===c.slug)closeForm();msg(c.name+" 채널을 삭제했어요.");await load();chg()};
    acts.append(ed,trBtn,up,dn,hv,del)}
  box.append(trb,acts);
  return box}
/* ── 번역 고치기: 한글이 들어간 캐치프레이즈 · 경력 줄마다 일본어 · 영어를 보고 고쳐요 ── */
function trEditor(c,host){const m=pm[c.slug]||{},cv=cvOf(c),lead=koLead(c),i18n=m.i18n||{},F=[],KL={role:"구분",text:"내용",tag:"표시"};
  const grid=el("div",{className:"trg"},[el("b",{textContent:"항목"}),el("b",{textContent:"한국어 (원문)"}),el("b",{textContent:"日本語"}),el("b",{textContent:"English"})]);
  const D=DR[c.slug]=DR[c.slug]||{};
  const add=(lab,ko,ja,en,multi,i,k)=>{const mk=(v,lang,ph)=>{const key=i+"|"+k+"|"+lang,x=multi?el("textarea",{rows:3,maxLength:600}):el("input",{maxLength:300});x.value=key in D?D[key]:(v||"");x.lang=lang;x.placeholder=ph;x.dataset.k=key;x.setAttribute("aria-label",lab+" "+ph);
      const mk2=()=>x.classList.toggle("trko",KO.test(x.value));x.addEventListener("input",()=>{D[key]=x.value;x.classList.remove("trnew");mk2()});mk2();return x};
    const a=mk(ja,"ja","日本語"),b=mk(en,"en","English");F.push({i,k,ko,a,b});grid.append(el("span",{className:"trl",textContent:lab}),el("p",{className:"trk",textContent:ko}),a,b)};
  const tc=L=>{const t=i18n[L]||{};return Array.isArray(t.career)?t.career:[]};
  if(KO.test(lead))add("캐치프레이즈",lead,(i18n.ja||{}).lead,(i18n.en||{}).lead,true,-1,"lead");
  cv.forEach((r,i)=>["role","text","tag"].forEach(k=>{if(r&&KO.test(r[k]||""))add("경력 "+(i+1)+" · "+KL[k],r[k],(tc("ja")[i]||{})[k],(tc("en")[i]||{})[k],false,i,k)}));
  if(!F.length){host.replaceChildren(el("p",{className:"note",textContent:"번역할 한글 문구(캐치프레이즈 · 경력)가 없어요."}));return}
  const note=el("span",{className:"note"}),auto=btn("빈 칸 자동 번역"),save=btn("번역 저장","p"),cx=btn("닫기");
  auto.onclick=async()=>{const jobs=F.filter(f=>!f.a.value.trim()||!f.b.value.trim()).slice(0,40);note.className="note";if(!jobs.length){note.textContent="빈 칸이 없어요.";return}
    auto.disabled=true;note.textContent="번역하는 중…";
    try{const {data,error}=await db.functions.invoke("news-translate",{body:{lines:jobs.map(f=>f.ko)}});if(error||!data||!data.ok)throw new Error("fail");
      let n=0;jobs.forEach((f,x)=>{[[f.a,(data.ja||[])[x]],[f.b,(data.en||[])[x]]].forEach(([inp,v])=>{if(!inp.value.trim()&&v){inp.value=v;D[inp.dataset.k]=v;inp.classList.add("trnew");inp.classList.toggle("trko",KO.test(v));n++}})});
      note.textContent=n?n+"칸을 채웠어요. 어색한 곳을 고친 뒤 '번역 저장'을 눌러 주세요.":"번역 결과가 비어 있어요. 직접 적어 주세요."}
    catch(_){note.className="note err";note.textContent="자동 번역에 실패했어요. 잠시 뒤 다시 하거나 직접 적어 주세요."}auto.disabled=false};
  save.onclick=async()=>{save.disabled=true;note.className="note";note.textContent="저장 중…";
    const nx=JSON.parse(JSON.stringify(i18n));
    ["ja","en"].forEach(L=>{const t=nx[L]=nx[L]||{},oc=Array.isArray(t.career)?t.career:[];t.career=cv.map((_,i)=>Object.assign({},oc[i]||{}));
      F.forEach(f=>{const v=(L==="ja"?f.a:f.b).value.trim();if(f.i<0){if(v)t.lead=v;else delete t.lead}else if(v)t.career[f.i][f.k]=v;else delete t.career[f.i][f.k]})});
    const row={i18n:nx,updated_at:new Date().toISOString()};
    const r=pm[c.slug]?await db.from("page_meta").update(row).eq("page",c.slug):await db.from("page_meta").upsert({page:c.slug,...row},{onConflict:"page"});
    save.disabled=false;if(r.error){note.className="note err";note.textContent="저장하지 못했어요: "+r.error.message;return}
    TR.delete(c.slug);delete DR[c.slug];OPEN.add(c.slug);msg(c.name+" 채널의 번역을 저장했어요. 일본어 · 영어 화면에 바로 보여요.");load()};
  cx.onclick=()=>{TR.delete(c.slug);delete DR[c.slug];host.hidden=true};
  host.replaceChildren(el("p",{className:"note",textContent:"사이트를 일본어 · 영어로 볼 때 나오는 문구예요. 비워 두면 그 칸은 한국어 그대로 나와요. 작품 이름 · 사람 이름 같은 고유명사는 공식 표기가 있으면 그걸로 적어 주세요. 번역 칸에 한글이 남아 있으면 왼쪽에 노란 줄로 표시해요 (일부러 한글로 둔 이름이면 그대로 두셔도 돼요)."}),grid,el("div",{className:"dact"},[auto,save,cx,note]))}
/* 캐치프레이즈를 어드민에서 바꾸면 일본어 · 영어 번역도 새로 맞춰요 (자동 번역이 안 되면 옛 번역을 지워서 한국어로 보이게) */
async function syncLeadTr(slug,lead){try{const nx=JSON.parse(JSON.stringify((pm[slug]&&pm[slug].i18n)||{}));let tj=null;
    if(lead&&KO.test(lead)){try{const {data}=await db.functions.invoke("news-translate",{body:{lines:[lead]}});if(data&&data.ok)tj=data}catch(_){}}
    ["ja","en"].forEach(L=>{nx[L]=nx[L]||{};const v=tj&&(tj[L]||[])[0];if(v)nx[L].lead=v;else delete nx[L].lead});
    const row={i18n:nx,updated_at:new Date().toISOString()};
    const r=pm[slug]?await db.from("page_meta").update(row).eq("page",slug):await db.from("page_meta").upsert({page:slug,...row},{onConflict:"page"});
    return !r.error&&(!!tj||!KO.test(lead||""))}catch(_){return false}}
/* 메뉴 순서 바꾸기: 같은 메뉴 안에서 이웃과 자리를 바꾸고, 전체 순서 번호를 다시 매겨요 */
async function move(c,dir){if(busy)return;const list=all().filter(x=>!x.fixed),grp=list.filter(x=>x.grp===c.grp),i=grp.findIndex(x=>x.slug===c.slug),j=i+dir;if(i<0||j<0||j>=grp.length)return;
  const a=list.indexOf(grp[i]),b=list.indexOf(grp[j]);[list[a],list[b]]=[list[b],list[a]];
  const ups=list.map((x,n)=>({slug:x.slug,sort:n})).filter(u=>(chans.find(k=>k.slug===u.slug)||{}).sort!==u.sort);
  busy=true;const rs=await Promise.all(ups.map(u=>db.from("channels").update({sort:u.sort}).eq("slug",u.slug)));busy=false;
  const bad=rs.find(r=>r&&r.error);if(bad)alert("순서를 바꾸지 못했어요: "+bad.error.message);else msg(c.name+" 채널을 "+(G[c.grp]||"")+" 메뉴에서 "+(dir<0?"위로":"아래로")+" 옮겼어요. 사이트 메뉴에 바로 반영돼요.");
  OPEN.add(c.slug);await load();chg()}
const chg=()=>document.dispatchEvent(new Event("rif-channels"));
async function addOwner(c,e){if(busy)return;busy=true;const {error}=await db.from("page_owners").insert({page:c.slug,email:e});busy=false;
  if(error&&!/duplicate|unique/i.test(error.message||""))return alert("담당자로 넣지 못했어요: "+error.message);
  OPEN.add(c.slug);msg(label(e)+" 님을 "+c.name+" 담당자로 지정했어요. 이제 그 계정으로 로그인하면 자기 페이지에서 바로 고칠 수 있어요.");load()}
async function removeOwner(c,e){if(!confirm(label(e)+" 님을 "+c.name+" 담당자에서 뺄까요?\n빼면 이 채널을 더 이상 고칠 수 없어요. (올린 포트폴리오는 그대로 남아요)"))return;
  const {error}=await db.from("page_owners").delete().eq("page",c.slug).eq("email",e);if(error)return alert("빼지 못했어요: "+error.message);
  OPEN.add(c.slug);msg(label(e)+" 님을 "+c.name+" 담당자에서 뺐어요.");load()}
/* 새 채널 추가 · 채널 정보 수정 */
function closeForm(){edit=null;$("chf").hidden=true;$("chm").textContent=""}
function fill(c){edit=c?c.slug:null;$("chf").hidden=false;$("cht").textContent=c?c.name+" 채널 정보 수정":"새 채널 추가";$("chs").value=c?c.slug:"";$("chs").readOnly=!!c;$("chn").value=c?c.name:"";$("chg").value=c&&G[c.grp]?c.grp:"art";$("cht2").value=c?(c.tag||""):"";$("chow").hidden=!!c;$("cho").value="";$("chv").value=c&&!c.visible?"0":"1";$("chld").value=c?(meta[c.slug]||c.lead||""):"";$("chm").className="note";$("chm").textContent="";
  $("chf").scrollIntoView({behavior:"smooth",block:"center"});(c?$("chn"):$("chs")).focus({preventScroll:true})}
$("chnew").onclick=()=>{if(!$("chf").hidden&&!edit)return closeForm();fill(null)};
$("chc").onclick=closeForm;
$("chf").onsubmit=async e=>{e.preventDefault();const slug=lc($("chs").value),name=$("chn").value.trim(),owner=$("cho").value,lead=$("chld").value.trim();
  const bad=t=>{$("chm").className="note err";$("chm").textContent=t};
  if(!/^[a-z0-9][a-z0-9-]{1,30}$/.test(slug))return bad("주소 이름은 영문 소문자·숫자·- 로 2~31자예요");
  if(!edit&&(RESERVED.includes(slug)||chans.some(c=>c.slug===slug)))return bad("이미 쓰고 있는 주소예요. 다른 이름을 골라 주세요");
  if(!name)return bad("표시 이름을 적어 주세요");
  const row={name,grp:$("chg").value,tag:$("cht2").value.trim()||null,lead:lead||null,visible:$("chv").value==="1"};
  const oldLead=edit?(meta[edit]||(chans.find(c=>c.slug===edit)||{}).lead||""):"";
  const b=$("chsave");b.disabled=true;$("chm").className="note";$("chm").textContent="저장 중…";
  let error=null,warn="";
  if(edit){({error}=await db.from("channels").update(row).eq("slug",edit));
    /* 담당자가 자기 페이지에서 바꾼 캐치프레이즈가 있으면(페이지는 그 값을 먼저 보여 줘요) 그쪽도 같이 바꿔요 */
    if(!error&&meta[edit]&&meta[edit]!==lead){const r=await db.from("page_meta").update({lead:lead||null}).eq("page",edit);if(r.error)warn=" (캐치프레이즈는 페이지에서 직접 바꿔 주세요)"}}
  else{({error}=await db.from("channels").insert({slug,...row,sort:chans.reduce((n,c)=>Math.max(n,(c.sort||0)+1),0)}));
    if(!error&&owner){const r=await db.from("page_owners").insert({page:slug,email:owner});if(r.error&&!/duplicate|unique/i.test(r.error.message||""))warn=" (담당자는 저장하지 못했어요. 표에서 다시 지정해 주세요)"}}
  if(!error&&lead!==oldLead){$("chm").textContent="캐치프레이즈를 일본어 · 영어로 번역하는 중…";if(!(await syncLeadTr(slug,lead))&&lead)warn+=" (캐치프레이즈 번역은 자동으로 못 했어요. 표에서 줄을 눌러 '번역 고치기'로 채워 주세요)"}
  b.disabled=false;if(error)return bad("저장하지 못했어요: "+(/duplicate|unique/i.test(error.message||"")?"이미 있는 주소예요":error.message));
  const was=edit;closeForm();OPEN.add(slug);msg((was?name+" 채널 정보를 고쳤어요.":name+" 채널을 만들었어요. 사이트 메뉴에는 1분 안에 보여요.")+warn);await load();chg()};
document.addEventListener("rif-items",()=>{if(ready)load()});
const ap=$("app");const go=()=>{if(!ap.hidden)load();else{ready=false;$("chtb").replaceChildren();closeForm()}};new MutationObserver(go).observe(ap,{attributes:true,attributeFilter:["hidden"]});go()})();
