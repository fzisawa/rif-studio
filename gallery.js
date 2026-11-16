(async()=>{
  const g=document.getElementById("grid"),page=g.dataset.page,sec=g.closest(".gal"),main=document.querySelector("main"),
        tracks=page==="rif"?document.querySelector(".tracks"):null,admin=await canEdit(page);
  const slug=s=>s.toLowerCase().replace(/[^a-z0-9가-힣]+/g,"-").replace(/^-|-$/g,""),hash=()=>decodeURIComponent(location.hash.slice(1)).toLowerCase();
  let list=[],meta={},active=null,top=hash()==="portfolio"?"Portfolio":"Tracks";
  const bar=el("div",{className:"tabs"}),topBar=el("div",{className:"tabs top"});
  g.before(bar);if(tracks)tracks.before(topBar);
  const allTabs=()=>{const hide=meta.hide||[],base=(CATS[page]||[]).filter(n=>!hide.includes(n)),mt=(meta.tabs||[]).filter(n=>!base.includes(n)),ex=[...new Set(list.map(i=>i.section).filter(Boolean))].filter(n=>!base.includes(n)&&!mt.includes(n));const all=[...base,...mt,...ex];/* 방문자에게는 빈 탭을 숨겨요 (주인은 그대로 보여서 채울 수 있어요) */return admin?all:all.filter(n=>list.some(i=>i.section===n))};
  const form=addForm(()=>page,s=>{if(s)active=s;if(tracks)top=s||"Portfolio";form.hidden=true;load()},[],()=>active,allTabs);form.hidden=true;g.after(form);
  /* 올린 음원은 RIF 페이지의 Tracks 와 같은 디자인으로 (사진·영상 아래 한 줄씩) */
  const tl=el("ol"),tw=el("div",{className:"tracks up",hidden:true},[tl]);g.after(tw);
  const fmt=x=>Math.floor(x/60)+":"+String(Math.floor(x%60)).padStart(2,"0");
  const trow=it=>{const du=el("span",{className:"du",textContent:"–:––"}),li=el("li",{},[el("button",{className:"pl",type:"button",textContent:"▶",ariaLabel:"재생"}),el("div",{className:"ti"},[el("b",{textContent:it.caption||"Untitled"}),el("i",{className:"bar"},[el("u")])]),du]);
    li.dataset.src=it.url;
    const m=new Audio();m.preload="metadata";m.onloadedmetadata=()=>{if(isFinite(m.duration)){li.dataset.dur=fmt(m.duration);if(!li.classList.contains("on"))du.textContent=li.dataset.dur}m.removeAttribute("src");m.load()};m.src=it.url;
    if(admin){const x=el("button",{className:"tdel2",type:"button",textContent:"×",ariaLabel:"삭제",title:"이 음원 삭제"});x.onclick=async()=>{if(confirm("'"+(it.caption||"Untitled")+"' 음원을 삭제할까요?")){try{await delItem(it)}catch(e){alert("삭제하지 못했어요: "+e.message)}load()}};li.append(x);li.classList.add("ed")}
    return li};
  const fill=its=>{const au=its.filter(i=>i.kind==="audio"),vs=its.filter(i=>i.kind!=="audio");
    vs.forEach(i=>g.append(card(i)));tl.replaceChildren(...au.map(trow));tw.hidden=!au.length;if(!au.length)document.dispatchEvent(new Event("rif:pause"));
    if(vs.length&&vs.every(i=>i.kind==="image"))g.classList.add("imgs");else if(vs.length)g.classList.add("vids");
    g.hidden=!vs.length&&!!au.length&&!admin};
  const card=it=>{const c=el("figure",{className:"item"},[media(it)]);
    if(it.caption)c.append(el("figcaption",{textContent:it.caption,title:it.caption}));
    if(admin){const x=el("button",{className:"del",textContent:"×",ariaLabel:"삭제"});x.onclick=async()=>{if(confirm("삭제할까요?")){try{await delItem(it)}catch(e){alert("삭제하지 못했어요: "+e.message)}load()}};c.append(x)}
    return c};
  /* 주인에게는 탭마다 × (탭 삭제). 탭 안의 작품은 지우지 않고 기본 칸(Portfolio · More)으로 옮겨요 */
  /* 기본 칸(RIF: Portfolio, 다른 채널: More)도 지울 수 있어요. 지운 탭은 같은 이름으로 '탭 추가'하면 다시 나와요 */
  const FIXEDT=["Tracks"],HOME=tracks?"Portfolio":"More",hidden=n=>(meta.hide||[]).includes(n),noSec=i=>!i.section;
  async function delTab(n,done){const isHome=n===HOME,mine=isHome?list.filter(noSec):list.filter(i=>i.section===n),k=mine.length;
    const others=allTabs().filter(x=>x!==n);let to=null;
    if(k){if(!isHome&&!hidden(HOME))to="";
      else{if(!others.length)return alert("'"+n+"' 탭에 "+k+"개가 있어요. 옮길 다른 탭을 먼저 만들어 주세요.");
        const t=(prompt("'"+n+"' 탭에 있는 "+k+"개를 어느 탭으로 옮길까요?\n("+others.join(", ")+")",others[0])||"").trim();if(!t)return;
        if(!others.includes(t))return alert("'"+t+"' 탭이 없어요. 위 목록에 있는 이름을 그대로 적어 주세요.");to=t}}
    if(!confirm("'"+n+"' 탭을 지울까요?"+(k?"\n\n이 탭에 있는 "+k+"개는 지워지지 않고 '"+(to||HOME)+"' 탭으로 옮겨져요.":"")))return;
    try{if(k){const v=to||null;
        const q=isHome?[db.from("items").update({section:v}).eq("page",page).is("section",null),db.from("items").update({section:v}).eq("page",page).eq("section","")]:[db.from("items").update({section:v}).eq("page",page).eq("section",n)];
        for(const r of await Promise.all(q))if(r.error)throw r.error}
      const hide=isHome||(CATS[page]||[]).includes(n)?[...new Set([...(meta.hide||[]),n])]:(meta.hide||[]);
      await saveMeta({tabs:(meta.tabs||[]).filter(x=>x!==n),hide});done();load()}catch(e){alert("지우지 못했어요: "+(e.message||e))}}
  /* 탭 추가: 지웠던 기본 탭 이름이면 다시 보이게 */
  async function addTab(n){const hide=(meta.hide||[]).filter(x=>x!==n);
    if(n===HOME||(CATS[page]||[]).includes(n)){if(!hidden(n))throw new Error("이미 있는 탭이에요");return saveMeta({hide})}
    return saveMeta({tabs:[...(meta.tabs||[]),n],hide})}
  const tabBtn=(n,cur,pick,done)=>{const b=el("button",{className:"tab"+(n===cur?" on":""),type:"button",textContent:n});b.onclick=()=>pick(n);
    if(admin&&!FIXEDT.includes(n)){const x=el("span",{className:"tx",role:"button",tabIndex:0,textContent:"×",title:"'"+n+"' 탭 삭제",ariaLabel:"'"+n+"' 탭 삭제"});
      const f=e=>{e.stopPropagation();e.preventDefault();delTab(n,done)};x.onclick=f;x.onkeydown=e=>{if(e.key==="Enter"||e.key===" ")f(e)};b.append(x);b.classList.add("hx")}
    return b};
  const tabs=(box,names,cur,pick)=>box.replaceChildren(...names.map(n=>tabBtn(n,cur,pick,()=>{if(active===n)active=null})));
  const go=n=>history.replaceState(null,"","#"+slug(n));
  /* 소개 문구(캐치프레이즈) · 경력 · 탭은 page_meta 에 저장돼요. 저장한 적이 없으면 원래 페이지 내용 그대로 */
  const lead=document.querySelector(".hero .lead"),cvSec=document.querySelector("section.sect");
  const lines=t=>String(t||"").split("\n").flatMap((x,i)=>i?[el("br"),document.createTextNode(x)]:[document.createTextNode(x)]);
  /* 번역: page_meta.i18n = {ja:{lead, career:[{text,tag}]}, en:{…}} — 없는 칸은 한국어 그대로 */
  const lng=()=>{try{const v=localStorage.getItem("rif-lang");if(v==="ja"||v==="en")return v}catch(_){}return "ko"};
  const lead0=lead?[...lead.childNodes].map(n=>n.cloneNode(true)):[],koText=()=>lead0.map(n=>n.nodeName==="BR"?"\n":n.textContent).join("").trim();
  function applyMeta(){
    const L=lng(),tr=L!=="ko"&&meta.i18n&&meta.i18n[L]||{};
    if(lead){if(tr.lead){lead.removeAttribute("data-i18n");lead.replaceChildren(...lines(tr.lead))}
      else if(meta.lead){lead.removeAttribute("data-i18n");lead.replaceChildren(...lines(meta.lead))}
      else if(!lead.hasAttribute("data-i18n"))lead.replaceChildren(...lead0.map(n=>n.cloneNode(true)))}
    if(Array.isArray(meta.career)){let s=cvSec;
      if(!s){s=el("section",{className:"sect"},[el("h2",{textContent:"Career"}),el("ul",{className:"cv"})]);document.querySelector(".hero").after(s)}
      const ul=s.querySelector("ul.cv");const tc=Array.isArray(tr.career)?tr.career:[];
      ul.replaceChildren(...meta.career.map((c,i)=>[c,tc[i]||{}]).filter(([c])=>c&&(c.role||c.text)).map(([c,t])=>el("li",{},[el("b",{textContent:t.role||c.role||""}),el("span",{textContent:t.text||c.text||""}),...((t.tag||c.tag)?[el("em",{textContent:t.tag||c.tag})]:[])])));
      s.hidden=!meta.career.length}}
  async function saveMeta(patch){const row={page,...meta,...patch,updated_at:new Date().toISOString()};delete row.created_at;
    const {error}=await db.from("page_meta").upsert(row,{onConflict:"page"});if(error)throw error;meta=row}
  function editor(){
    const curCv=Array.isArray(meta.career)?meta.career:[...((cvSec&&cvSec.querySelectorAll("ul.cv li"))||[])].map(li=>{const b=li.querySelector("b"),em=li.querySelector("em");const t=[...li.childNodes].filter(n=>n!==b&&n!==em).map(n=>n.textContent).join("").trim();return {role:b?b.textContent.trim():"",text:t,tag:em?em.textContent.trim():""}});
    const ld=el("textarea",{rows:3,maxLength:400,value:meta.lead||koText(),placeholder:"한두 줄로 나를 소개하는 문구 (줄바꿈 가능)"});
    const rows=el("div",{className:"pe-rows"});
    const addRow=c=>{const r=el("div",{className:"pe-row"},[el("input",{className:"r1",maxLength:40,placeholder:"구분 (예: 2024, Sound Engineer)",value:c.role||""}),el("input",{className:"r2",maxLength:200,placeholder:"내용",value:c.text||""}),el("input",{className:"r3",maxLength:20,placeholder:"뱃지 (선택, 예: 최우수상)",value:c.tag||""}),(()=>{const x=el("button",{type:"button",className:"btn small ghost",textContent:"삭제"});x.onclick=()=>r.remove();return x})()]);rows.append(r)};
    curCv.forEach(addRow);if(!curCv.length)addRow({});
    const add=el("button",{type:"button",className:"btn small ghost",textContent:"＋ 경력 추가"});add.onclick=()=>{addRow({});rows.lastChild.querySelector("input").focus()};
    const msg=el("p",{className:"note"}),sv=el("button",{type:"button",className:"btn",textContent:"저장"}),cc=el("button",{type:"button",className:"btn ghost",textContent:"닫기"});
    const box=el("div",{className:"pe",id:"pe"},[el("h2",{textContent:"내 채널 편집"}),el("p",{className:"note",textContent:"캐치프레이즈와 경력은 저장하면 바로 이 페이지에 나와요. 제목·배치 같은 페이지 틀은 사이트 통일을 위해 바꿀 수 없어요. (일본어·영어 번역이 있는 줄을 고치면 그 줄은 번역이 지워지고 한국어로 나와요. 새 번역은 대표님께 요청해 주세요)"}),el("label",{textContent:"캐치프레이즈"},[ld]),rows,add,el("div",{className:"pe-acts"},[cc,sv]),msg]);
    cc.onclick=()=>box.remove();
    sv.onclick=async()=>{sv.disabled=true;msg.textContent="저장 중…";
      const career=[...rows.children].map(r=>({role:r.querySelector(".r1").value.trim(),text:r.querySelector(".r2").value.trim(),tag:r.querySelector(".r3").value.trim()})).filter(c=>c.role||c.text);
      const nl=ld.value.trim()||null,old=Array.isArray(meta.career)?meta.career:[],i18n=JSON.parse(JSON.stringify(meta.i18n||{}));
      ["ja","en"].forEach(L=>{const t=i18n[L];if(!t)return;if(nl!==(meta.lead||null)&&!(meta.lead==null&&nl===koText()))delete t.lead;
        const oc=Array.isArray(t.career)?t.career:[];t.career=career.map(c=>{const j=old.findIndex(o=>o&&o.text===c.text&&o.role===c.role);return j>=0&&oc[j]?oc[j]:{}})});
      try{await saveMeta({lead:nl,career,i18n});applyMeta();msg.textContent="저장했어요."}catch(e){msg.textContent="저장하지 못했어요: "+e.message}sv.disabled=false};
    return box}
  if(admin){const eb=el("button",{type:"button",className:"btn small pe-open",textContent:"✎ 캐치프레이즈 · 경력 편집"});
    eb.onclick=()=>{const o=document.getElementById("pe");if(o){o.remove();return}document.querySelector(".hero").after(editor())};document.querySelector(".hero").append(eb)}
  function render(){if(tracks)return renderT();
    const names=allTabs(),sectioned=names.length>0;let its=list;
    g.replaceChildren();g.className="grid";bar.replaceChildren();
    if(sectioned){
      if(list.some(noSec)&&!hidden("More"))names.push("More");
      if(!names.includes(active))active=names.find(n=>slug(n)===hash())||names.find(n=>list.some(i=>(i.section||"More")===n))||names[0];
      tabs(bar,names,active,n=>{active=n;go(n);render()});
      its=list.filter(i=>(i.section||"More")===active).sort((a,b)=>a.created_at<b.created_at?-1:1)}
    if(admin){
      const nt=el("button",{type:"button",className:"tab tadd",textContent:"＋ 탭 추가"});
      nt.onclick=async()=>{const n=(prompt("새 탭 이름 (예: Cover, Illustration)")||"").trim().slice(0,30);if(!n)return;if(allTabs().includes(n)||(n==="More"&&!hidden("More")))return alert("이미 있는 탭이에요");
        try{await addTab(n);active=n;go(n);render()}catch(e){alert("탭을 만들지 못했어요: "+e.message)}};
      bar.append(nt);
      const b=el("button",{className:"plus",textContent:"+",ariaLabel:"추가"});b.onclick=()=>{form.hidden=!form.hidden;if(!form.hidden)form.fill()};g.append(b)}
    if(!form.hidden)form.fill();
    if(!its.length&&!admin)g.append(el("p",{className:"empty",textContent:"Coming soon"}));
    fill(its);
    if(tracks){
      tabs(topBar,["Tracks","Portfolio"],top,n=>{top=n;go(n);render()});
      tracks.hidden=top!=="Tracks";sec.hidden=top!=="Portfolio";main.classList.add("tabbed");
      if(top!=="Tracks")document.dispatchEvent(new Event("rif:pause"))}
    else sec.hidden=!sectioned&&!admin&&!list.length}
  /* Tracks 옆 한 줄: Tracks(고정) + 포트폴리오 탭들 + (주인) 탭 추가·삭제 */
  function renderT(){const names=allTabs();if((list.some(noSec)||!names.length)&&!hidden("Portfolio"))names.unshift("Portfolio");
    if(top!=="Tracks"&&!names.includes(top))top=names.find(n=>slug(n)===hash())||names[0]||"Tracks";
    const all=["Tracks",...names];topBar.replaceChildren(...all.map(n=>tabBtn(n,top,x=>{top=x;go(x);render()},()=>{if(top===n){top="Portfolio";go("Portfolio")}})));
    bar.replaceChildren();g.replaceChildren();g.className="grid";
    if(admin){const nt=el("button",{type:"button",className:"tab tadd",textContent:"＋ 탭 추가"});
      nt.onclick=async()=>{const n=(prompt("새 탭 이름 (예: Cover, Live)")||"").trim().slice(0,30);if(!n)return;if(n==="Tracks"||n==="More"||(n==="Portfolio"&&!hidden("Portfolio"))||allTabs().includes(n))return alert("이미 있는 탭이에요");
        try{await addTab(n);top=n;go(n);render()}catch(e){alert("탭을 만들지 못했어요: "+e.message)}};topBar.append(nt);
}
    tracks.hidden=top!=="Tracks";sec.hidden=top==="Tracks";main.classList.add("tabbed");
    if(top==="Tracks")return;document.dispatchEvent(new Event("rif:pause"));active=top==="Portfolio"?"":top;
    const its=list.filter(i=>(i.section||"")===active).sort((a,b)=>a.created_at<b.created_at?-1:1);
    if(admin){const b=el("button",{className:"plus",textContent:"+",ariaLabel:"추가"});b.onclick=()=>{form.hidden=!form.hidden;if(!form.hidden)form.fill()};g.append(b)}
    if(!form.hidden)form.fill();
    if(!its.length&&!admin)g.append(el("p",{className:"empty",textContent:"Coming soon"}));
    fill(its)}
  async function load(){const [a,m]=await Promise.all([db.from("items").select("*").eq("page",page).order("created_at",{ascending:false}),db.from("page_meta").select("*").eq("page",page).maybeSingle()]);
    list=(a.data||[]).map(i=>page==="woljae"&&OLDCATS.includes(i.section)?{...i,section:""}:i);meta=(m&&m.data)||{};applyMeta();render()}
  document.addEventListener("rif:lang",()=>applyMeta());
  load()})();
