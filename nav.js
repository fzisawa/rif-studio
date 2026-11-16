(()=>{if(matchMedia("(hover:hover)").matches)return;document.querySelectorAll(".ng>button").forEach(b=>{b.addEventListener("click",e=>{e.stopPropagation();const g=b.parentNode,o=g.classList.contains("open");document.querySelectorAll(".ng.open").forEach(x=>{x.classList.remove("open");x.firstChild.setAttribute("aria-expanded","false")});if(!o){g.classList.add("open");b.setAttribute("aria-expanded","true")}})});
document.addEventListener("click",()=>document.querySelectorAll(".ng.open").forEach(x=>{x.classList.remove("open");x.firstChild.setAttribute("aria-expanded","false")}));
document.addEventListener("keydown",e=>{if(e.key==="Escape")document.querySelectorAll(".ng.open").forEach(x=>x.classList.remove("open"))})})();
/* 관리자 페이지 '채널 관리'에서 추가한 채널을 메뉴에 붙여요 (실패해도 메뉴는 그대로) */
(async()=>{try{if(!document.querySelector("header .ng"))return;
  const U="https://noqtyhmgdfzziymfclnx.supabase.co",K=(window.RIF&&RIF.KEY)||"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vcXR5aG1nZGZ6eml5bWZjbG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4OTg1MzMsImV4cCI6MjEwOTQ3NDUzM30.fMmKix0TBw_LLaXrPVapMpKj6DciSVVUKX1XvBFtfaM";
  const r=await fetch(U+"/rest/v1/channels?select=slug,name,grp,sort&visible=eq.true&order=sort,created_at",{headers:{apikey:K,Authorization:"Bearer "+K}});if(!r.ok)return;
  const cur=location.pathname.split("/")[1]||"";
  (await r.json()).forEach(c=>{const b=document.querySelector('header .ng>button[data-i18n="nav.'+c.grp+'"]');if(!b)return;const m=b.parentNode.querySelector(".nm");if(!m)return;
    const a=document.createElement("a");a.href="/"+encodeURIComponent(c.slug)+"/";a.textContent=c.name;if(cur===c.slug)a.className="on";m.append(a)})}catch(_){}})();
