(()=>{if(matchMedia("(hover:hover)").matches)return;document.querySelectorAll(".ng>button").forEach(b=>{b.addEventListener("click",e=>{e.stopPropagation();const g=b.parentNode,o=g.classList.contains("open");document.querySelectorAll(".ng.open").forEach(x=>{x.classList.remove("open");x.firstChild.setAttribute("aria-expanded","false")});if(!o){g.classList.add("open");b.setAttribute("aria-expanded","true")}})});
document.addEventListener("click",()=>document.querySelectorAll(".ng.open").forEach(x=>{x.classList.remove("open");x.firstChild.setAttribute("aria-expanded","false")}));
document.addEventListener("keydown",e=>{if(e.key==="Escape")document.querySelectorAll(".ng.open").forEach(x=>x.classList.remove("open"))})})();
/* Members 메뉴: 한 줄에 "분야 → 사람들" 로 묶고, 사람이 없는 분야는 숨겨요 */
function rows(){document.querySelectorAll("header .nm.nmg").forEach(m=>{if(m.dataset.rows)return;m.dataset.rows="1";
  [...m.querySelectorAll(":scope>p.nh")].forEach(h=>{const r=document.createElement("div"),ps=document.createElement("div");r.className="nrow";r.dataset.g=h.dataset.g;ps.className="nps";
    let x=h.nextElementSibling;while(x&&x.tagName==="A"){const n=x.nextElementSibling;ps.append(x);x=n}m.insertBefore(r,h);r.append(h,ps)})})}
function empt(){rows();document.querySelectorAll("header .nrow").forEach(r=>r.classList.toggle("emp",!r.querySelector(".nps a")));roster()}
/* 홈 'Members' 명단: 위쪽 Members 메뉴를 그대로 옮겨 그려요 (채널 추가 · 퇴사 처리도 같이 반영) */
function roster(){const box=document.getElementById("roster");if(!box)return;const out=[];
  document.querySelectorAll("header .nrow").forEach(r=>{const as=[...r.querySelectorAll(".nps a")];if(!as.length)return;
    const g=document.createElement("div"),h=document.createElement("h3");g.className="rg";h.textContent=(r.querySelector(".nh")||{}).textContent||"";g.append(h);
    as.forEach(a=>{const x=document.createElement("a");x.href=a.getAttribute("href");x.textContent=a.textContent;g.append(x)});out.push(g)});
  box.replaceChildren(...out);const sec=document.getElementById("rosec");if(sec)sec.hidden=!out.length}
document.addEventListener("rif:lang",()=>setTimeout(roster,0));
empt();
/* 관리자 페이지 '채널 관리'에서 추가한 채널을 메뉴에 붙여요 (실패해도 메뉴는 그대로) */
(async()=>{try{if(!document.querySelector("header .ng"))return;
  const U="https://noqtyhmgdfzziymfclnx.supabase.co",K=(window.RIF&&RIF.KEY)||"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vcXR5aG1nZGZ6eml5bWZjbG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4OTg1MzMsImV4cCI6MjEwOTQ3NDUzM30.fMmKix0TBw_LLaXrPVapMpKj6DciSVVUKX1XvBFtfaM";
  const r=await fetch(U+"/rest/v1/channels?select=slug,name,grp,sort&visible=eq.true&order=sort,created_at",{headers:{apikey:K,Authorization:"Bearer "+K}});if(!r.ok)return;
  const cur=location.pathname.split("/")[1]||"";
  rows();(await r.json()).forEach(c=>{const ps=document.querySelector('header .nrow[data-g="'+c.grp+'"] .nps');if(!ps)return;
    const a=document.createElement("a");a.href="/"+encodeURIComponent(c.slug)+"/";a.textContent=c.name;if(cur===c.slug){a.className="on";ps.closest(".ng").classList.add("on")}ps.append(a)})}catch(_){}
  finally{empt()}})();
/* 퇴사 처리된 사원의 페이지는 메뉴에서 빼고, 그 페이지로 들어오면 홈으로 보내요 (대표가 다시 '재직'으로 바꾸면 돌아와요) */
(async()=>{try{
  const U="https://noqtyhmgdfzziymfclnx.supabase.co",K=(window.RIF&&RIF.KEY)||"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vcXR5aG1nZGZ6eml5bWZjbG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4OTg1MzMsImV4cCI6MjEwOTQ3NDUzM30.fMmKix0TBw_LLaXrPVapMpKj6DciSVVUKX1XvBFtfaM";
  const r=await fetch(U+"/rest/v1/rpc/hidden_pages",{method:"POST",headers:{apikey:K,Authorization:"Bearer "+K,"Content-Type":"application/json"},body:"{}"});if(!r.ok)return;
  const hid=new Set((await r.json()).map(x=>typeof x==="string"?x:x.hidden_pages).filter(Boolean));if(!hid.size)return;
  const seg=p=>{try{return new URL(p,location.href).pathname.split("/")[1]||""}catch(_){return""}};
  document.querySelectorAll("header .nm a[href]").forEach(a=>{if(hid.has(seg(a.getAttribute("href"))))a.remove()});empt();
  const cur=location.pathname.split("/")[1]||"";
  if(hid.has(cur)&&!document.getElementById("anone")&&!/^\/(admin|intranet|mail)/.test(location.pathname))location.replace("/")}catch(_){}})();

/* 공개 페이지 꼬리말: 워드마크 · 사이트 메뉴 · 사업자 정보 (site.css 를 쓰는 페이지에서만) */
(()=>{const f=document.querySelector("body>footer");if(!f||f.dataset.v2||!document.querySelector('link[href*="site.css"]'))return;f.dataset.v2="1";
  const E=(t,c,x)=>{const n=document.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;return n};
  const biz=f.querySelector(".biz"),adm=f.querySelector(".adm");
  const l=E("div"),w=E("a","fw","RIF STUDIO");w.href="/";l.append(w,E("p","fc","Pangyo / Tokyo / New York"));
  const n=E("nav","fn");n.setAttribute("aria-label","Footer");
  [["About","/about/"],["News","/news/"],["Store","/store/"],["Board","/board/"],["Contact","/contact/"],["Join Us","/join/"]].forEach(([t,h])=>{const a=E("a","",t);a.href=h;n.append(a)});
  const b=E("div","fb"),c=E("span");if(biz)c.append(biz);const r=E("span","","\u00a9 RIF STUDIO ");if(adm)r.append(adm);b.append(c,r);
  f.replaceChildren(l,n,b)})();
/* 홈 소식 목록: 최근 글 5개 */
(async()=>{const ul=document.getElementById("hnews");if(!ul)return;try{
  const U="https://noqtyhmgdfzziymfclnx.supabase.co",K=(window.RIF&&RIF.KEY)||"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vcXR5aG1nZGZ6eml5bWZjbG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4OTg1MzMsImV4cCI6MjEwOTQ3NDUzM30.fMmKix0TBw_LLaXrPVapMpKj6DciSVVUKX1XvBFtfaM";
  const r=await fetch(U+"/rest/v1/news_posts?select=id,title,title_ja,title_en,created_at,pinned&published=eq.true&order=pinned.desc,created_at.desc&limit=5",{headers:{apikey:K,Authorization:"Bearer "+K}});if(!r.ok)return;
  const ps=await r.json();if(!ps.length)return;
  const draw=()=>{const L=document.documentElement.lang||"ko";ul.replaceChildren(...ps.map(p=>{const li=document.createElement("li"),a=document.createElement("a"),t=document.createElement("time"),b=document.createElement("b"),i=document.createElement("i"),d=new Date(p.created_at);
    a.href="/news/?id="+encodeURIComponent(p.id);t.dateTime=p.created_at;t.textContent=d.getFullYear()+"."+String(d.getMonth()+1).padStart(2,"0")+"."+String(d.getDate()).padStart(2,"0");
    b.textContent=(L==="ja"&&p.title_ja)||(L==="en"&&p.title_en)||p.title||"";i.textContent="Read";a.append(t,b,i);li.append(a);return li}))};
  draw();document.addEventListener("rif:lang",()=>setTimeout(draw,0))}catch(_){}})();

/* 휴대폰 메뉴 버튼 (site.css 를 쓰는 공개 페이지에서만) */
(()=>{const h=document.querySelector("body>header"),nv=h&&h.querySelector("nav");if(!h||!nv||h.querySelector(".mb")||!document.querySelector('link[href*="site.css"]'))return;
  const b=document.createElement("button");b.type="button";b.className="mb";b.setAttribute("aria-label","Menu");b.setAttribute("aria-expanded","false");b.append(document.createElement("span"),document.createElement("span"));
  const set=o=>{h.classList.toggle("open",o);document.body.classList.toggle("navopen",o);b.setAttribute("aria-expanded",String(o))};
  b.onclick=()=>set(!h.classList.contains("open"));h.append(b);
  nv.addEventListener("click",e=>{if(e.target.closest("a"))set(false)});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")set(false)});
  matchMedia("(min-width:761px)").addEventListener("change",e=>{if(e.matches)set(false)})})();
