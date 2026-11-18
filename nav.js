(()=>{if(matchMedia("(hover:hover)").matches)return;document.querySelectorAll(".ng>button").forEach(b=>{b.addEventListener("click",e=>{e.stopPropagation();const g=b.parentNode,o=g.classList.contains("open");document.querySelectorAll(".ng.open").forEach(x=>{x.classList.remove("open");x.firstChild.setAttribute("aria-expanded","false")});if(!o){g.classList.add("open");b.setAttribute("aria-expanded","true")}})});
document.addEventListener("click",()=>document.querySelectorAll(".ng.open").forEach(x=>{x.classList.remove("open");x.firstChild.setAttribute("aria-expanded","false")}));
document.addEventListener("keydown",e=>{if(e.key==="Escape")document.querySelectorAll(".ng.open").forEach(x=>x.classList.remove("open"))})})();
/* Members 메뉴: 한 줄에 "분야 → 사람들" 로 묶고, 사람이 없는 분야는 숨겨요 */
function rows(){document.querySelectorAll("header .nm.nmg").forEach(m=>{if(m.dataset.rows)return;m.dataset.rows="1";
  [...m.querySelectorAll(":scope>p.nh")].forEach(h=>{const r=document.createElement("div"),ps=document.createElement("div");r.className="nrow";r.dataset.g=h.dataset.g;ps.className="nps";
    let x=h.nextElementSibling;while(x&&x.tagName==="A"){const n=x.nextElementSibling;ps.append(x);x=n}m.insertBefore(r,h);r.append(h,ps)})})}
function empt(){rows();document.querySelectorAll("header .nrow").forEach(r=>r.classList.toggle("emp",!r.querySelector(".nps a")))}
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
