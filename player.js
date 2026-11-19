/* 트랙 플레이어 — 모든 채널 공통 (RIF 페이지의 Tracks 디자인).
   나중에 그려지는 목록(올린 음원)도 되도록 클릭을 문서 전체에서 받아요. 한 번에 한 곡만 재생돼요. */
(()=>{if(window.RIFP)return;window.RIFP=1;
  const a=new Audio();a.preload="none";let cur=null;
  const fmt=s=>Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0"),Q=(r,s)=>r.querySelector(s);
  const icon=(r,p)=>{const b=Q(r,".pl");b.textContent=p?"❚❚":"▶";b.setAttribute("aria-label",window.T?(p?window.T("a.pause","일시정지"):window.T("a.play","재생")):(p?"일시정지":"재생"))};
  const reset=r=>{r.classList.remove("on");icon(r,false);Q(r,".bar u").style.width="0";if(r.dataset.dur)Q(r,".du").textContent=r.dataset.dur};
  function play(r){
    if(cur===r){a.paused?a.play().catch(()=>{}):a.pause();return}
    if(cur)reset(cur);cur=r;if(!r.dataset.dur)r.dataset.dur=Q(r,".du").textContent;
    a.src=r.dataset.src;r.classList.add("on");a.play().catch(()=>{})}
  document.addEventListener("click",e=>{
    const p=e.target.closest(".tracks li .pl");if(p){play(p.closest("li"));return}
    const b=e.target.closest(".tracks li .bar");if(!b)return;const r=b.closest("li");if(cur!==r||!a.duration)return;
    const x=b.getBoundingClientRect();a.currentTime=a.duration*Math.min(1,Math.max(0,(e.clientX-x.left)/x.width))});
  a.onplay=()=>{if(cur)icon(cur,true)};
  a.onpause=()=>{if(cur&&!a.ended)icon(cur,false)};
  a.ontimeupdate=()=>{if(!cur)return;if(!cur.isConnected){a.pause();cur=null;return}
    if(a.duration){Q(cur,".bar u").style.width=(a.currentTime/a.duration*100)+"%";Q(cur,".du").textContent=fmt(a.currentTime)}};
  a.onended=()=>{const r=cur;reset(r);cur=null;let n=r.nextElementSibling;while(n&&!n.dataset.src)n=n.nextElementSibling;if(n)play(n)};
  document.addEventListener("rif:pause",()=>a.pause());
})();
