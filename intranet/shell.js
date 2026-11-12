/* 인트라넷 앱 화면(폰) — 하단 탭 · 상단 바 · 더보기 · 뒤로가기. PC 화면에는 영향을 주지 않아요.
   이 파일이 없어도 인트라넷은 예전 모양 그대로 동작해요. */
(()=>{try{
const $=i=>document.getElementById(i),H=document.documentElement,mq=matchMedia("(max-width:760px)");
const tabs=$("tabs"),app=$("app"),box=$("box");if(!tabs||!app||!box)return;
const mk=(t,p,c)=>{const e=Object.assign(document.createElement(t),p||{});(c||[]).forEach(x=>e.append(x));return e};
const NAME={b:"게시판",t:"업무",i:"메일",c:"채팅",q:"문의 게시판",e:"사원 정보",s:"내 프로필"};
H.classList.add("ash");
const sa=matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;if(sa)H.classList.add("ash-sa");
/* 상단 바 */
const ttl=mk("b",{className:"ash-ttl",textContent:"게시판"}),av=mk("button",{type:"button",className:"ash-av",ariaLabel:"더보기"});
const bar=mk("div",{className:"ash-bar"},[mk("span",{className:"ash-logo"}),ttl,av]);box.prepend(bar);
/* 더보기 버튼 (하단 탭 5번째) */
const more=mk("button",{type:"button",className:"ash-more",textContent:"더보기"});more.setAttribute("aria-pressed","false");tabs.append(more);
const cur=()=>{const b=tabs.querySelector('button[data-t][aria-pressed="true"]');return b?b.dataset.t:"b"};
const sync=()=>{const t=cur();H.dataset.tab=t;ttl.textContent=NAME[t]||"";more.setAttribute("aria-pressed",String("qes".includes(t)));
  const pa=$("pfav");if(pa){av.style.backgroundImage=pa.style.backgroundImage;av.textContent=pa.style.backgroundImage?"":pa.textContent}};
const inSync=()=>{H.classList.toggle("ash-in",!app.hidden&&!box.hidden);sync()};
new MutationObserver(inSync).observe(app,{attributes:true,attributeFilter:["hidden"]});
new MutationObserver(inSync).observe(box,{attributes:true,attributeFilter:["hidden"]});
{const pa=$("pfav");if(pa)new MutationObserver(sync).observe(pa,{attributes:true,childList:true,characterData:true,subtree:true})}
/* 더보기 시트 */
let sheet=null;
const closeSheet=()=>{if(sheet){sheet.remove();sheet=null}};
function openSheet(){closeSheet();
  const row=(ic,t,fn,cls)=>{const b=mk("button",{type:"button",className:"ash-row "+(cls||"")},[mk("span",{className:"ash-ic",textContent:ic}),mk("span",{textContent:t})]);b.onclick=()=>{closeSheet();fn()};return b};
  const go=t=>()=>{const b=tabs.querySelector('button[data-t="'+t+'"]');if(b)b.click();scrollTo(0,0)};
  const who=($("who")||{}).textContent||"",items=[];
  const qb=tabs.querySelector('button[data-t="q"]');if(qb&&!qb.hidden)items.push(row("📮","문의 게시판",go("q")));
  items.push(row("👥","사원 정보",go("e")),row("🙂","내 프로필",go("s")));
  const adm=$("admlink");if(adm&&!adm.hidden)items.push(row("⚙️","관리자 페이지",()=>{location.href=adm.href}));
  if(!sa)items.push(row("📱","앱으로 설치하기",()=>{const d=document.querySelector("details.inst");if(!d)return;const pm=$("pm"),pb=$("pmb");if(pm&&pb){pb.replaceChildren(mk("h2",{textContent:"앱으로 설치하기"}),d.querySelector(".instb").cloneNode(true));pm.hidden=false}}));
  items.push(row("🌐","RIF STUDIO 사이트",()=>{location.href="../"}),row("↩","로그아웃",()=>{const o=$("out");if(o&&confirm("로그아웃할까요?"))o.click()},"out"));
  const pa=mk("span",{className:"ash-av big"});pa.style.backgroundImage=av.style.backgroundImage;pa.textContent=av.textContent;
  sheet=mk("div",{className:"ash-sheet"},[mk("div",{className:"ash-sbox"},[mk("div",{className:"ash-grip"}),mk("div",{className:"ash-me"},[pa,mk("div",{},[mk("b",{textContent:"RIF 인트라넷"}),mk("span",{textContent:who})])]),...items])]);
  sheet.onclick=e=>{if(e.target===sheet)closeSheet()};document.body.append(sheet)}
more.onclick=e=>{e.stopPropagation();openSheet()};av.onclick=openSheet;
/* 채팅: 목록 → 대화방 */
const chat=document.querySelector("#pc .chat"),ch2=$("ch2");
if(chat&&ch2){const bk=mk("button",{type:"button",className:"ash-cbk",textContent:"‹",ariaLabel:"대화 목록"}),hd=mk("div",{className:"ash-chd"});ch2.before(hd);hd.append(bk,ch2);
  bk.onclick=()=>{H.dataset.chat="list"};
  $("cp").addEventListener("click",e=>{const b=e.target.closest(".cpi");if(b&&!b.classList.contains("cnew"))H.dataset.chat="room"})}
H.dataset.chat="list";
tabs.addEventListener("click",e=>{const b=e.target.closest("button[data-t]");if(!b)return;if(b.dataset.t==="c")H.dataset.chat=e.isTrusted?"list":"room";setTimeout(sync,0);if(e.isTrusted&&mq.matches)scrollTo(0,0)});
/* 글자 입력 중에는 하단 탭을 숨겨요 (키보드 위에 떠서 자리를 차지하지 않게) */
const typing=e=>e&&(e.tagName==="TEXTAREA"||e.isContentEditable||(e.tagName==="INPUT"&&!/^(checkbox|radio|file|button|submit|date)$/.test(e.type)));
document.addEventListener("focusin",e=>{if(typing(e.target))H.classList.add("ash-kb")});
document.addEventListener("focusout",()=>setTimeout(()=>{if(!typing(document.activeElement))H.classList.remove("ash-kb")},120));
/* 뒤로가기(안드로이드 버튼·스와이프): 열린 것부터 닫고, 첫 탭에서만 앱이 닫혀요 */
const top=()=>{const lb=document.querySelector(".lb");if(lb)return()=>lb.click();
  if(sheet)return closeSheet;
  const m=[...document.querySelectorAll(".mod:not([hidden])")].pop();if(m)return()=>{const x=m.querySelector(".mx");if(x)x.click();else if(m.id==="wm"||m.id==="pm")m.hidden=true;else m.remove()};
  if(!H.classList.contains("ash-in"))return null;const t=cur();
  if(t==="i"){const b=document.querySelector("#om .orp .bk");if(b)return()=>b.click()}
  if(t==="c"&&H.dataset.chat==="room")return()=>{H.dataset.chat="list"};
  if(t!=="b")return()=>{const b=tabs.querySelector('button[data-t="b"]');if(b)b.click()};
  return null};
let trap=false,skip=false;
const arm=()=>{if(!mq.matches&&!sa)return;const need=!!top();if(need&&!trap){history.pushState({ash:1},"");trap=true}else if(!need&&trap){trap=false;skip=true;history.back()}};
addEventListener("popstate",()=>{if(skip){skip=false;return}trap=false;const f=top();if(f){try{f()}catch(_){}}setTimeout(arm,60)});
document.addEventListener("click",()=>setTimeout(arm,80),true);
inSync();
}catch(e){console.error("shell",e)}})();
